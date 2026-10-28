# Startapus Browser

Браузер в правой панели DSH: настоящий Electron `<webview>` (не iframe), произвольные
сайты, toolbar и DOM-пикер элемента, который отправляет выбранный элемент агенту в
композер как чип `ЭлементN`.

## Быстрый старт

1. Плагин в профиле `~/.dsh/profiles/desktop/cordis.patch.yml`; штатный браузер ядра отключён
   (`- id: ui-sidebar-browser / disabled: true`) — это освобождает `⌘T`.
2. Запустить DSH, открыть правый сайдбар.
3. **Нажать `⌘T`** (Ctrl+T вне macOS) — вкладку активирует само ядро, панель монтируется
   видимой, движок создаёт гостя и открывает `https://startapus.com`.
4. Дальше агент управляет страницей инструментами; человек при необходимости забирает
   управление кнопкой в панели.

Почему первый раз вкладку открывает человек: у плагина нет API активации вкладки
(см. `docs/kernel-request.md`). Из состояния «ни одной вкладки» агент вкладку создать
может, но ядро её не показывает — поэтому канонический вход именно `⌘T`.

## Горячие клавиши и адресная строка

| Действие | Как |
|---|---|
| Открыть браузер | `⌘T` (`startapus-browser.new` в каталоге ярлыков) |
| Ввод адреса | строка адреса, `Enter`; поддерживаются `example.com`, `http(s)://…` |
| Переключение вкладок | клик по ярлыку в полосе (ядро); агент — `ui_focus_tab { tabId }` |
| Пикер элемента | `⌘⇧P` или кнопка-прицел в панели (`requestPick`) |
| Экспорт задач | `ui_export { crops }` → zip в `~/.dsh/` |
| Управление агентом | баннер «Агент управляет страницей» / «Забрать управление» |

## Диагностика

- `~/.dsh/startapus-host.log` — `apply:start`, `tools:registered`, `verify:done/error`,
  `act:done`, `select:done`, `crop:saved`, `lease:acquire/release`, `guest:lost`,
  `guest:crashed`, `attach:timeout`, `dom:tabs`.
- `/startapus-browser/health` — `buildRev`/`clientRev`/`revMatch`, `panels`, `sessionsCount`,
  `urlHost`, `panelMounts`, `counters {acquires, releases, recoveries, crashes, navigations,
  loadErrors, attachFailures}`, `lastLoadError`, `lastNavAttempt`, `shortcutState`.
- `npm run live` — сверка живого процесса (FRESH, transport, selftest, утечка lease,
  шторм восстановлений, ресинхрон сборок).
- `npm run soak` (или `npm run soak:short`) — наблюдение за инвариантами жизни вкладки.
- `scripts/dsh-cookie-doctor.mjs` — накопление `dsh-auth-*` cookie (причина падений DSH).

## Что умеет

Стартовая страница по умолчанию — `https://startapus.com`.

- вкладка **Startapus Browser** в правом сайдбаре (`sidebar.right.pane.tab`);
- произвольные `http(s)`-адреса в `<webview>` (без ограничений `X-Frame-Options`/CSP,
  которые накладывает iframe);
- toolbar на иконках `react-icons`: назад, вперёд, обновить, **копировать адрес**,
  **открыть в браузере по умолчанию**, выбор элемента;
- кнопка **⌖** — пикер: подсветка элемента под курсором, селектор в подсказке,
  `Esc` — отмена;
- автоматическая вставка чипа `ЭлементN` в композер активной сессии и
  модель-ориентированная сериализация при отправке;
- строка статуса: `резервация → dom-ready → загрузка → загружено`, ошибки и
  падения guest-а видны без DevTools.

## Как это устроено

1. **Guest с резервацией.** Главное окно DSH создаётся с `webviewTag: true`, но ядро
   подключает только «зарезервированный» `<webview>`. Панель берёт резервацию из
   прелоада:

   ```ts
   const { lease, partition } = await window.dshDesktop.browser.acquire('startapus-browser')
   const el = document.createElement('webview')
   el.setAttribute('name', lease)
   el.setAttribute('partition', partition)
   el.setAttribute('allowpopups', '')
   el.setAttribute('src', `about:blank#${lease}`)
   el.dataset.sidebarBrowserFrame = 'webview'
   ```

   Ядро проверяет `src` (`about:blank#<lease>`), `partition` и одноразовость lease;
   при несовпадении — молча `preventDefault()`. После `dom-ready` панель вызывает
   `loadURL(url)`.

2. **Пикер без preload.** Перед attach ядро стирает `preferences` гостя, поэтому
   собственный preload невозможен. Пикер внедряется через
   `webview.executeJavaScript(PICKER_SCRIPT)`; результат паркуется в
   `window.__startapusPick`, а панель опрашивает его простым значением (объект
   ошибки через IPC не клонируется — иначе `An object could not be cloned`).

3. **Чипы и сериализация.** Чип вставляется через
   `conversation.input.for(binding.ctx).insertReference(...)`. При отправке ядро
   ищет владельца чипа по имени источника и вызывает его `codec.serialize`,
   поэтому источник регистрируется как `@`-триггер:

   ```ts
   ctx.inject(['inputTriggers'], (inner) => {
     ctx.effect(() => inner.inputTriggers.registerSource(elementSource()))
   })
   ```

   Без этой регистрации отправка падает с
   `slash: no serializer for reference source "startapus-element"`.

4. **Одноразовый lease.** Если за 4 с не пришёл `dom-ready`, панель освобождает
   резервацию и берёт новую (одна повторная попытка) вместо вечного пустого экрана.

## Установка

```bash
cd startapus-browser
npm install --no-save --no-package-lock esbuild@0.25.12
node build.mjs
```

В `~/.dsh/profiles/desktop/package.json`:

```json
"dependencies": { "startapus-browser": "link:/abs/path/to/startapus-browser" },
"dsh": { "profile": { "bundles": ["…", "startapus-browser"] } }
```

```bash
cd ~/.dsh/profiles/desktop && pnpm install
# затем перезапустить DSH
```

## Использование

1. Открой вкладку **Startapus** в правой панели, введи адрес.
2. Нажми **⌖**, наведи на элемент, кликни.
3. В поле ввода агента появится чип `Элемент1`, а внизу панели — короткая строка
   `вставлено в композер: Элемент1` (полный портрет уходит агенту, а не в панель).
4. Отправь сообщение: модель получит структурированное описание элемента.

## Диагностика

Строка внизу панели:

| Сообщение | Значение |
|---|---|
| `запрос резервации guest…` | вызывается `browser.acquire` |
| `резервация ok · partition dsh-sidebar-browser-…` | lease выдан |
| `guest подключён, ожидание dom-ready` | элемент вставлен в DOM |
| `dom-ready · навигация…` | гость готов, идёт первая загрузка |
| `загружено · <url>` | страница отрисована |
| `guest не подключился · ядро отклонило attach` | lease не совпал/просрочен |
| `acquire упал: …` | текст ошибки из main-процесса |
| `нет моста window.dshDesktop.browser` | панель вне главного фрейма |
| `элемент выбран · <причина>` | чип не вставлен (нет сессии/композера) |

## Инструменты агента

Host-половина регистрирует семь инструментов (`ctx.tools.register`, каждый с обязательным `output { schema, render }`):

| Инструмент | Назначение |
|---|---|
| `ui_status` | транспорт, стадия гостя, адрес, очередь, число задач |
| `ui_open` | открыть `http(s)`-страницу (без учётных данных в URL) |
| `ui_pick` | запустить выбор элемента человеком |
| `ui_evidence` | evidence последнего пика + консоль |
| `ui_verify` | проверка задачи по критерию приёмки; **только он ставит `verified`** |
| `task_create` / `task_list` / `task_update` | очередь задач, `E_NO_ACCEPTANCE` на `triaged` без критерия, `E_FORBIDDEN` на `verified` |

## Канал host ↔ renderer

- `GET  /startapus-browser/health` — диагностика транспорта;
- `GET  /startapus-browser/selftest` — автотест гейтов и компаратора;
- `POST /startapus-browser/client/poll` — панель забирает команду (`open`/`pick`/`reload`/`verify`);
- `POST /startapus-browser/client/event` — stage, url, evidence, консоль, результат verify.

Панель опрашивает канал каждые 2.5 с, авторизуясь через `window.dsh.getAuthToken()`; без heartbeat 15 с любой `ui_*` отдаёт `E_NO_TRANSPORT`.

## Проверки

```bash
npm run selftest     # офлайн: гейты, компаратор, verify-движок, soak, area — 27 проверок
npm run live         # живой процесс: сверка capabilities, transport, selftest на госте
```

`npm run live` печатает, какая сборка реально запущена: отпечаток `buildRev` из `/health`
сравнивается с хешем исходников, поэтому «устаревшая сборка» видна сразу, без догадок.

Пошаговый чек-лист живой приёмки (AC-1, AC-2, снимок, управление агентом, гейты):
[`docs/live-acceptance.md`](docs/live-acceptance.md).

## Ограничения

- Куки и история живут в partition `startapus-browser`, не общие со штатным
  браузером DSH.
- Страница переживает переключение вкладок: гость живёт в пуле и переподключается к панели.
- Preload недоступен (стирается ядром), поэтому только `executeJavaScript`.
- Скачивания и всплывающие окна ограничены политикой ядра.

## Структура

```
src/index.ts                 host-плагин (регистрация)
src/client/index.tsx         вкладка + регистрация источника элементов
src/client/panel.tsx         <webview>, toolbar, статус, пикер
src/client/picker-source.ts  внедряемый скрипт пикера
src/client/element-refs.ts   чипы, кодек, вставка в композер
build.mjs                    esbuild: host ESM + client CJS в __ModuleLoader__
```

## Проверки и релиз

```bash
npm run gate        # сборка + SCRIPT/RULES/ENGINE/IMPORTS/TOOLS + selftest — обязательный гейт
npm run gate:live   # то же + сверка с запущенным процессом (FRESH, transport, живой selftest)
node scripts/build-rev.mjs   # отпечаток сборки
```

Релиз: версия в `package.json` = тег (`v0.24.0`), `CHANGELOG.md` — по фичам,
матрица `startapus-browser-compliance.md` обновляется тем же коммитом.
