# Claude Desktop: браузер в панели — повторный разбор и что из этого следует

Источник: `/Applications/Claude.app/Contents/Resources/app.asar` (статические строки и схемы
инструментов, ничего не запускалось). Дополняет `docs/claude-browser-notes.md`.

## 1. Архитектура (подтверждено повторно)

- Гость живёт в `WebContentsView`, которым владеет main; панель — отдельный view.
- Инструменты работают по CDP через `webContents.debugger.sendCommand`.
- `Emulation.setDeviceMetricsOverride` (width/height/deviceScaleFactor/mobile/scale) — адаптивность.
- `Accessibility.getFullAXTree` — источник `read_page`.
- `Page.captureScreenshot` с `clip`/`scale` — снимки.
- Табы: `tabs_create` (пустой таб, background по умолчанию), `tabs_select` (вынести вперёд),
  `tabs_close` (закрытие последнего закрывает панель), `tabs_context` (список с tabId).

## 2. Контракты инструментов (дословно из схем)

| Инструмент | Контракт |
|---|---|
| `read_page` | YAML-дерево доступности, интерактивные узлы помечены `[ref_N]`; **предпочтительнее скриншота** для текста и структуры; лимит **50 000 символов**, дальше — пагинация |
| `find` | поиск по строкам дерева (role/name/text), до **20** `ref_N` |
| `form_input` | значение по `ref` для input/textarea/select/checkbox/contenteditable |
| `get_page_text` | видимый текст, **сначала article/main**, затем body |
| `preview_inspect` | CSS-селектор → text, className, tagName, id, **computed styles**, bounding box; «лучший инструмент для цветов/шрифтов/отступов — точнее скриншота» |
| `preview_screenshot` | JPEG с `scale` в [0.1, 1]; «не полагайтесь на него для цветов и размеров» |
| `read_console_messages` | уровни `all/error/warn`, до **200** строк |
| `read_network_requests` | список запросов и **тело по requestId** |
| `resize_window` | тестирование адаптивности |
| `javascript_tool` / `preview_eval` | только отладка и инспекция; **не** использовать для изменения UI |
| `tabs_*` | background-табы продолжают работать; foreground — только когда должен смотреть человек |

## 3. Политика безопасности и подтверждений (важнее инструментов)

- «`<tool>` needs the user's approval for each action. Retry; the user will be asked to approve it» —
  **подтверждение на каждое действие**, а не общий «allow».
- Отказы типизированы: `user_declined`, `page_access_denied`, `needs_request_access`,
  `navigation_denied_or_failed`, `timeout`, `action_failed`.
- Доступ к домену запрашивается отдельно (`request_access` → `needs_request_access`);
  при отказе пользователя навигация не выполняется.
- Буфер обмена — по отдельному гранту (`clipboardRead`).
- Жёсткий лимит вкладок: «Too many browser tabs are open in this session's pane; close one and retry».
- Таймауты сообщаются с инструкцией: «pane still loading after N s … check with get_page_text or
  screenshot before retrying».

## 4. Что это значит для startapus-browser (разрыв)

| Практика Claude | У нас сейчас | Разрыв |
|---|---|---|
| Подтверждение каждого действия (`click`/`type`) | `ui_act` исполняется сразу | **критично**: агент может нажать что угодно |
| Запрос доступа к домену | гейт `confirmOrigin` только для `ui_open` | частично: переходы адресной строкой обходят гейт |
| `read_page` = YAML-дерево с `ref_N`, 50k лимит | плоский список DOM ≤200 узлов, `ref_N` есть | нет пагинации, нет YAML-формы, нет селекторов по `ref_N` в `ui_act` |
| `find` ≤20 | `ui_find` ≤20 | ✅ совпадает |
| `inspect` — главный инструмент стилей | `ui_evidence` (computed+box) | ✅ по смыслу; не хватает параметра «какие свойства» |
| `get_page_text` article-first | ❌ нет | нужен |
| console: уровни + до 200 | `ui_console` уровни, ≤30 | лимит мал, нет пагинации |
| network: список + тело | ❌ нет | нужен (PerformanceObserver, без CDP) |
| снимок с `scale` | PNG без масштаба | нет экономии токенов/времени |
| `tabs_*` c background | `ui_new_tab` открывает сразу видимой | нет «в фоне» |
| лимит вкладок | `MAX_SESSIONS = 6` (LRU) | ✅ есть, но без сообщения пользователю в Claude-стиле |
| типизированные отказы | `E_*` коды | ✅ но без `needs_request_access`-петли |

## 5. Что копировать в первую очередь

1. **Подтверждение действий** (`ui_act` click/type) с типизированным отказом — это про доверие к агенту.
2. **`get_page_text`** article-first — дёшево, закрывает чтение статей/доков.
3. **`ui_read_page` в YAML-форме + пагинация + `ref_N` для `ui_act`** — предсказуемость для модели.
4. **Сеть через PerformanceObserver** (без тел) — быстрый ответ «что упало».
5. **Снимок со `scale`** — экономия и скорость.
6. **`tabs` в фоне** — не дёргать пользователя, пока агент работает.
