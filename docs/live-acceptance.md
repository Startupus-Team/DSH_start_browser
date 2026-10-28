# Живая приёмка startapus-browser

Чек-лист для проверки на работающем DSH. Все шаги — команды, которые можно выполнить
подряд; каждый даёт однозначный ответ «прошло / не прошло».

## 0. Подготовка

```bash
cd /Users/dmitriy/Documents/deepseek-harness/default-workspace/startapus-browser
npm run build          # собрать host + client
npm run selftest       # офлайн: 35 проверок + 9 проверок синтаксиса скриптов
```

Перезапустить DSH (`Cmd+Q` → открыть) — host-плагин грузится только при старте.
Открыть вкладку **Startapus** в правой панели (клик по вкладке).

## 1. Свежесть сборки

```bash
npm run live
```

Ожидаемо:

```
FRESH  сборка совпадает с исходниками (rev)
transport: true · stage: ready · url: …
selftest: 19/19
LIVE OK
```

Если `STALE rev: процесс <old>, исходники <new>` — в приложении старая сборка, нужен рестарт.
Если `transport: false` — вкладка Startapus не открыта.

## 2. Состояние панели (агент → страница)

Инструмент `ui_status` должен вернуть JSON с `transport:true`, `stage:ready`, `url`,
`counters.acquires ≥ 1`.

## 3. Живой цикл AC-1

1. `ui_select('textarea#text')` — поставить выбор элемента по селектору.
2. Через 3–5 с: `ui_evidence` → должен вернуть портрет (`role=combobox`, `a11y.name`,
   `computed`, `rect`, `env`) и `trust.untrusted: true` с хешем.
3. `task_create { problem, method: 'computed', property: 'font-size', expected: '16px' }`.
4. `task_update { id, state: 'triaged' }`.
5. `ui_verify { id }` → в `~/.dsh/startapus-host.log` появится
   `verify:done {"pass":true,"reason":"font-size: 16px в допуске 0"}`.
6. `task_get { id }` → `state: verified`, `attempts: 1`.

Провал, если `verify:error` содержит `Script failed to execute` (битый внедряемый скрипт —
запустить `npm run check-scripts`) или `E_STALE`/`E_AMBIGUOUS` (локатор перестал быть
однозначным — это корректный отказ, нужен пере-пик).

## 4. Снимок (M3)

1. `ui_screenshot {}` — весь видимый экран.
2. `ui_screenshot { selector: 'textarea#text' }` — элемент.

Ожидаемо: файл появляется в `~/.dsh/startapus-crops/`, в логе `crop:saved`, а `ui_status`
не содержит `captureError`.

Известная причина отказа, уже исправленная: `toJPEG()` строит `Buffer`, недоступный в
песочнице рендерера (`Buffer is not available for the current Context`). Если ошибка
вернулась — проверить, что в сборке используется `toDataURL()`.

## 5. AC-2: сохранение страницы

1. `ui_open { url: 'https://example.com/' }` — увести страницу с `ya.ru`.
2. Переключиться на другую вкладку правой панели и вернуться на **Startapus**.
3. `ui_status` → `url` должен остаться `https://example.com/`, а `counters.acquires`
   увеличиться (панель перемонтировалась, страница восстановлена из `sessionState`).

Если `url` вернулся к `https://ya.ru/` — сработал `START_URL` вместо памяти страницы.

## 6. Управление агентом

1. `ui_act { op: 'type', selector: 'textarea#text', value: 'кофемашина' }` →
   в логе `act:done {"op":"type","status":"OK"}`.
2. `ui_act { op: 'scroll', value: '300' }` → `act:done`.
3. `ui_select { selector: 'div' }` → `ui_status.lastSelect` покажет
   `status: "AMBIGUOUS"` и число совпадений.

## 7. Гейты и безопасность

| Проверка | Ожидание |
|---|---|
| `task_update → triaged` без критерия | `E_NO_ACCEPTANCE` |
| `task_update → verified` | `E_FORBIDDEN` |
| `ui_open private адрес` (`http://127.0.0.1:…`) | `E_NAV_BLOCKED` |
| `ui_open 'ftp://…'` | `E_UNSAFE_URL` |
| панель скрыта + `ui_verify` | `E_TAB_HIDDEN` |
| 4-й `ui_verify` после 3 неудач | `E_LIMIT: breaker` |

## 8. UI панели

- в полосе вкладок у **Startapus** виден логотип (окно браузера с улыбкой) и имя;
- кнопки на иконках `react-icons`: назад, вперёд, обновить, **копировать адрес**,
  **открыть в браузере по умолчанию**, выбор элемента;
- «копировать адрес» пишет в буфер и сообщает в строке статуса;
- «открыть в браузере по умолчанию» открывает системный браузер (оконный обработчик
  Electron передаёт http(s) наружу), панель при этом не навигируется.

## 9. Где смотреть диагностику

| Источник | Что содержит |
|---|---|
| `~/.dsh/startapus-host.log` | `apply:start`, `tools:registered`, `store:loaded`, `verify:done/error`, `act:done`, `select:done`, `crop:saved/error`, `panic` |
| `GET /startapus-browser/health` | `capabilities`, `buildRev`, `transport`, `stage`, `url`, `tasks`, `counters` |
| `GET /startapus-browser/selftest` | гейты и компаратор на живом процессе (не меняет состояние: снимок/восстановление стора) |
| `npm run live` | всё перечисленное выше одной командой |
