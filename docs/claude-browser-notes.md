# Как устроен браузер в Claude (по разбору installed app) и что это значит для нас

Источник: `/Applications/Claude.app/Contents/Resources/app.asar` (Claude Desktop), статический разбор строк и фрагментов кода. Ничего не запускалось — это чтение реализации.

## 1. Архитектура: host-owned view + CDP

Ключевые находки в бандле:

```js
new WebContentsView({ webContents: guest, webPreferences: … })
window.contentView.addChildView(view)
view.setBounds({ x: 0, y: 0, width, height })
```

```js
async sendNow(method, params) {
  return this.webContents.debugger.sendCommand(method, params)
}
```

```js
async setViewport(width, height, mobile, scale) {
  await this.sendCommand('Emulation.setDeviceMetricsOverride', {
    width, height,
    deviceScaleFactor: mobile ? 2 : 0,
    mobile,
    scale,
  })
  await this.setMobileOverrides(mobile)
}
```

```js
const nodes = (await this.sendCommand('Accessibility.getFullAXTree')).nodes
```

```js
await this.sendCommand('Page.captureScreenshot', {
  format: 'jpeg', quality,
  clip: { x, y, width, height, scale },
})
```

**Вывод:** страница живёт в `WebContentsView`, которым владеет main-процесс, а все инструменты работают по **CDP** через `webContents.debugger`. Рендерер панели — это отдельный UI, который лишь отображает view и передаёт команды.

## 2. Полный набор инструментов (из списка имён в бандле)

`navigate`, `read_page`, `read_page_content`, `click`, `type`, `form_input`, `computer`,
`find`, `get_page_text`, `javascript_tool`, `execute_javascript`, `read_console_messages`,
`read_network_requests`, `resize_window`, `tabs_create_mcp`, `tabs_context_mcp`,
`tabs_close_mcp`, `list_connected_browsers`, `select_browser`, `switch_browser`,
`browser_batch`, `submit_credentials`, `file_upload`, `upload_image`, `gif_creator`,
`shortcuts_execute`, `shortcuts_list`, `domain_transition`, `plan_approval`, `remote_mcp`.

Наблюдения по семантике:

- **`read_page`** — YAML-дерево доступности из `Accessibility.getFullAXTree`, каждому интерактивному узлу выдаётся `uid`; лимит 50 000 символов, можно сузить через `ref_id`/`depth`. Скриншот для проверки текста и структуры они прямо не рекомендуют.
- **`preview_inspect` / inspect-семейство** — по CSS-селектору возвращает `text`, `className`, `tagName`, `id`, **computed styles** и **bounding box**; в описании сказано «точнее скриншота» для цветов, шрифтов, отступов.
- **`resize_window`** — пресеты `mobile 375×812`, `tablet 768×1024`, `desktop` (сброс) + произвольные `width`/`height`; размер применяется к вкладке и сохраняется при перезагрузках, пока не сбросят.
- **Скриншот** — JPEG с `clip` и масштабом, считается от **эмулированного** viewport, а не от размера панели.
- **`javascript_tool` / `execute_javascript`** — разрешены, но в описании явно «только для отладки и инспекции; не реализуй через это правки UI».

## 3. Сравнение с нашим плагином

| Возможность | Claude | startapus-browser (сейчас) |
|---|---|---|
| Владение страницей | `WebContentsView` в main, guest adoptable | `<webview>` в рендерере с lease от ядра |
| Канал к странице | CDP `webContents.debugger` | `executeJavaScript` из панели + HTTP long-poll команд |
| a11y-дерево | `Accessibility.getFullAXTree` (полное) | DOM-подмножество: роль, имя, предки, фрагмент ≤50 узлов |
| Эмуляция устройства | `Emulation.setDeviceMetricsOverride` (ширина, высота, dpr, mobile) | только ширина через `setZoomFactor`, dpr читается |
| Скриншот | `Page.captureScreenshot` с `clip` от эмулированного viewport | `capturePage().toDataURL()` — кроп элемента или экран |
| Console/network | CDP-домены | ring-буфер 30 записей из `console-message` |
| Действия | `computer`, `click`, `type`, `form_input` по uid | `ui_act` click/type/scroll по селектору |
| Несколько вкладок | `tabs_create/context/close` | `multiple: true` (вкладки DSH, не внутренние) |
| Пакетность | `browser_batch` | `task_batch` (задачи), не команды |

## 4. Почему у нас CDP недоступен

Ядро DSH attaches guest через `will-attach-webview` и **не отдаёт плагину** ни `webContents` гостя, ни владение view: у host-плагина нет `electron.app`/`webContents`, а в рендерере доступен только сам элемент `<webview>` с ограниченным API. Поэтому `debugger.sendCommand` и, следовательно, `setDeviceMetricsOverride` / `getFullAXTree` / `Page.captureScreenshot` нам недоступны.

Это ровно тот же барьер, что зафиксирован в ТЗ §15 и в вопросе 6 §14.

## 5. Что можно забрать без изменений ядра

1. **Clip-скриншот по прямоугольнику** — уже сделано (`ui_screenshot { selector }` считает rect в странице и кропит).
2. **Эмуляция ширины через zoom** — сделано (`ui_viewport { width }`), но без dpr/mobile/height.
3. **Пресеты размеров** — можно добавить как sugar поверх `ui_viewport { width }`: `mobile 390`, `tablet 768`, `desktop 1280`.
4. **Дерево доступности из DOM** — сейчас отдаём роль/имя/предки/фрагмент; можно расширить до «плоского YAML-подобного списка» с `ref_N`, как у Claude, и интерактивными флагами.
5. **Правило приоритета источников** — уже принято: inspect (computed+box) > a11y > скриншот; в ТЗ это §7.
6. **`browser_batch`-аналог** — пакет команд в одном вызове (например, `ui_act` списком), чтобы не тратить ходы.

## 6. Что нужно просить у ядра, чтобы догнать Claude

- экспорт `webContents` гостя плагину (или host-owned `WebContentsView` с adoptable guest);
- тогда становятся доступны: `Emulation.setDeviceMetricsOverride` (полная адаптивность), `Accessibility.getFullAXTree` (полное дерево), `Page.captureScreenshot` с clip/scale от эмулированного viewport, `CSS.forcePseudoState` (состояния hover/focus), `Overlay.setInspectMode` (подсветка без своего оверлея).

До этого наши ограничения честно записаны в ТЗ §15, и продукт закрывает цикл ревью без CDP.
