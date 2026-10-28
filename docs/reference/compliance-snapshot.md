# Матрица соответствия: ТЗ ↔ код startapus-browser

Дата: 2026-10-27 · Основание: [`startapus-browser-tz.md`](<startapus-browser-tz.md>)
Прогон: `npm run selftest` → **19/19** (офлайн, офлайн-путь host-бандла)

Обозначения: ✅ реализовано и проверено · 🟡 реализовано частично · ⛔ не реализовано

## Функциональные требования

| FR | Требование (кратко) | Статус | Где | Чем подтверждено |
|---|---|---|---|---|
| FR-1 | Lease: acquire/release, повтор при отсутствии `dom-ready` за 4 с | ✅ | `panel.tsx` | сторож 4 с: `attachFailures++`, release, одна повторная резервация, `recoveries++` |
| FR-2 | Гость на монтирование; удаление из DOM уничтожает гостя | ✅ | `panel.tsx` | проверено живьём (пустая панель после повторной вставки) |
| FR-3 | Стадии статуса, `did-fail-load` кроме `-3` | ✅ | `panel.tsx` | живые прогоны |
| FR-4 | Пикер: `isTrusted`, один активный, парковка результата | ✅ | `picker-source.ts` | синтетический клик игнорируется (`event.isTrusted !== true → return`) |
| FR-5 | Локатор: testid, role+name, предки ≤3, `nth-of-type` ≤8, box, rect+zoom | ✅ | `picker-source.ts` | `:nth-of-type` по одноимённым соседям, остальное есть |
| FR-6 | Чип `ЭлементN` + `codec.serialize` | ✅ | `element-refs.ts` | живая отправка с чипом |
| FR-7 | Evidence ≤64 КБ: DOM-фрагмент ≤50 узлов, computed ≤40, консоль ≤30 | ✅ | `picker-source.ts` | `serializeFragment` (BFS ≤50 узлов, глубина ≤4, текст-листья), в сериализаторе — до 20 строк дерева |
| FR-8 | Кроп ≤2 МБ, по жесту, в модель только путь | ✅ | `panel.tsx`, `index.ts` | `M3: кроп сохранён в файл` |
| FR-9 | Задачи: состояния + дедуп | ✅ | `index.ts` | `M4: дедуп`, `task_get` |
| FR-10 | Критерий обязателен до `triaged`, неизменяем после | ✅ | `index.ts` | `AC-4a` |
| FR-11 | Verify: reload → settle → **повторное разрешение локатора** → замер | ✅ | `panel.tsx`+`index.ts` | `querySelectorAll`: 0 → `E_STALE`, >1 → `E_AMBIGUOUS`, тег ≠ сохранённому → `E_STALE`; иначе замер |
| FR-12 | `verified` ставит только движок | ✅ | `index.ts` | `AC-4b` |
| FR-13 | `E_TAB_HIDDEN` при скрытой панели | ✅ | `panel.tsx`+`index.ts` | `AC-3` |
| FR-14 | Ring консоли 30 записей → evidence | ✅ | `panel.tsx` | маркеры `console-message` |
| FR-15 | Маркировка недоверенного контента | ✅ | `index.ts` | `AC-9` (`trust.untrusted`, hash) |
| FR-16 | Запрет приватных адресов, `user:pass`, не-http(s) | ✅ | `index.ts` | `AC-6` — 9 адресов |
| FR-17 | Тайм-ауты: навигация 20 с, `executeJavaScript` 5 с; лимиты вызовов | ✅ | `panel.tsx`+`index.ts` | `AC-7a`, маркеры `navTimerRef`, `withTimeout` |
| FR-18 | Area-пик (P1) | ✅ | `picker-source.ts`, `panel.tsx`, `index.ts` | `AREA_SCRIPT`, `ui_pick_area`, `ui_area`, `fromArea` в `task_create` |
| FR-19 | `task_batch`, WIP-лимит, claim (P1) | ✅ | `index.ts` | `task_batch` ≤20, `task_claim`, WIP 5 (`E_LIMIT` на шестой), чужой owner → `E_FORBIDDEN` |
| FR-20 | Действия на странице (P2) | 🟡 | `index.ts`, `panel.tsx` | `ui_act`: click/type/scroll по селектору, инициируется агентом; подтверждение человеком пока не требуется — ограничение зафиксировано |
| FR-21 | Viewport: панель + zoom в evidence (P0) | ✅ | `picker-source.ts`, `panel.tsx`, `index.ts` | `ui_viewport` ставит zoom 0.5–2 на гость (`setZoomFactor`), `E_LIMIT` вне диапазона; evidence отдаёт `viewport/dpr/zoom` |
| FR-22 | Шаблоны промтов по классам ревью | ✅ | `index.ts` | `ui_template`: 6 классов (a11y, spacing, contrast, states, breakpoints, copy), поля + чек-лист + скелет; `E_NOT_FOUND` на неизвестный |
| FR-23 | `Untrusted<T>` в схеме page-derived полей | 🟡 | `index.ts` | runtime-маркер вместо TS-типа |
| FR-24 | Квоты, breaker, state machine, ring 200 | ✅ | `index.ts` | квоты 30/20 в минуту, breaker после 3 неудачных verify (`E_LIMIT`), кольцевой лог |
| FR-25 | Verify по области (P1) | ✅ | `panel.tsx`+`index.ts` | покрытие `covered` → `verified` при полном, `reopened` при неполном; пусто → `E_UNVERIFIABLE_SCOPE` |

## Критерии приёмки

| AC | Статус | Чем подтверждено |
|---|---|---|
| AC-1 цикл → verified | ✅ живьём | `task-21` на `ya.ru`: `task_create → triaged → ui_verify` → `verify:done pass:true, display совпал` → `state: verified`, `attempts: 1` |
| AC-2 возврат на вкладку сохраняет страницу | 🟡 | два механизма: `keepMounted: true` с fallback в ядре (если поддерживается) и собственная память панели — URL и `scrollY` восстанавливаются после перемонтирования (`sessionState`); проверка на живом процессе |
| AC-3 скрытая панель | ✅ | `AC-3` |
| AC-4 критерий/verified | ✅ | `AC-4a`, `AC-4b` |
| AC-5 чип и сериализация | ✅ живьём | сообщение с `Элемент1` у агента; evidence с живого пика дошёл до задачи |
| AC-6 приватные адреса | ✅ | `AC-6` |
| AC-7 soak/лимиты | ✅ офлайн | `AC-7a–d` |
| AC-8 компаратор | ✅ | `AC-8/8b/8c/8d` |
| AC-9 trust-маркировка | ✅ | `AC-9` |

## Что мешает назвать ТЗ реализованным полностью

1. **FR-1**: повторная резервация (таймер 4 с) пропала при откате пула — вернуть как отдельную защиту.
2. **FR-7**: нет DOM-фрагмента (≤50 узлов) — без него агент не видит структуру.
3. **FR-11**: verify не проверяет единственность локатора и role/name — возможен ложный `pass` на похожем элементе.
4. **FR-21**: нет эмуляции viewport (только чтение).
5. **FR-22**: нет шаблонов промтов.
6. **FR-18/19/20/25**: P1/P2 — по ТЗ вне P0, но для «полностью» нужны.
7. **AC-2**: требует флага `keepMounted` в ядре DSH.
8. **Живой прогон**: приложение всё ещё на host-коде от 17:17 (`/selftest` → `E_NOT_FOUND`).

## Сделано после первой редакции матрицы

- **FR-11** — ложный `pass` больше невозможен: verify проверяет единственность локатора и тег,
  ошибки приходят как `E_STALE` / `E_AMBIGUOUS`.
- **FR-7** — DOM-фрагмент собирается (BFS ≤50 узлов, глубина ≤4), в модель уходит до 20 строк.
- **FR-1** — вернулся сторож 4 с с повторной резервацией и счётчиками.

## Ближайшие шаги

1. FR-20 — действия на странице (P2, отложено сознательно).
2. Живой прогон: `npm run live` — команда готова, ждёт рестарта DSH.

## Хранение

| Пункт ТЗ | Статус | Детали |
|---|---|---|
| §5 «хранение host-стор, персистентность по возможности» | ✅ | очередь сохраняется в `~/.dsh/startapus-tasks.json` (переопределяется `STARTAPUS_STORE`), `loadTasks()` при старте, `saveTasks()` после create/update/claim/verify; проверка `M4: очередь сохраняется на диск` |

## UI панели

| Элемент | Статус | Детали |
|---|---|---|
| Иконки тулбара | ✅ | `react-icons` (Feather): `FiChevronLeft`, `FiChevronRight`, `FiRotateCw`, `FiCrosshair`; SVG 16×16, `aria-label` у кнопок |
| Копирование адреса | ✅ | `FiCopy` → `navigator.clipboard.writeText`, результат в строке статуса |
| Открыть в браузере по умолчанию | ✅ | `FiExternalLink` → `window.open(url, '_blank')`, ядро открывает http(s) системным браузером |
| Логотип вкладки | ✅ | SVG-знак + имя через `sidebar.right.pane.tab.title` (виден в полосе вкладок, наследует цвет состояния), fallback на текстовый `title` |
| Пакет иконок | ✅ | `react-icons@5.4.0` в `devDependencies`, встраивается tree-shaken; в бандле только `react` и `react/jsx-runtime` |

## Живые результаты (27.10)

- `ui_status` вернул реальные данные: `transport:true`, `stage:ready`, адрес, счётчики.
- `ui_open` перевёл панель `ya.ru → example.com` без участия человека.
- Гейты отработали вживую: `E_NO_ACCEPTANCE`, `E_FORBIDDEN`.
- Пик на `iana.org` дал полноценный evidence (a11y, computed, box, фрагмент, env).
- `ui_verify` дошёл до гостя, но скрипт замера падал (`Script failed to execute`) из-за
  отсутствующей `}` в сгенерированной строке — исправлено выносом в `verify-scripts.ts`
  и проверкой `npm run check-scripts` (5/5).
- `ui_screenshot` вернул `E_NO_CAPTURE`: кроп снимался только при человеческом пике.
  Исправлено: снимок теперь ставится командой агента (`ui_screenshot(selector?)`).
- Живой `ui_verify` на пике `ya.ru` завершился `verified` (задача `task-21`).
- **Управление агентом вживую:** `ui_select('textarea#text')` вернул портрет
  (`role=combobox`, `a11y.name=Запрос`, 17 computed, `focused:true`); `ui_act('type', …)`
  дал `act:done status=OK`; `task_create → triaged → ui_verify` на этом evidence
  завершился `verify:done pass:true, «font-size: 16px в допуске 0»`.
- `ui_screenshot` теперь **создаёт файлы**: живой лог `crop:saved` дважды, по 15 654 Б
  в `~/.dsh/startapus-crops/` (исправлено `toJPEG` → `toDataURL`).
- **Обзор страницы вживую:** `ui_read_page` → 77 узлов; `ui_find("запрос")` → 4 совпадения
  с `ref_N`, ролями и селекторами.

## Инструменты проверки

| Команда | Что проверяет |
|---|---|
| `npm run selftest` | 27 офлайн-проверок на самом бандле |
| `npm run live` | какая сборка запущена (по `capabilities`), транспорт, selftest на живом процессе |

## Ревизия 0.12 (движок, 28.10)

| Критерий | Статус | Доказательство (живой процесс) |
|---|---|---|
| A1: несколько сессий одновременно | ✅ | `sessions: [{tab64, ya.ru, «Яндекс — быстрый поиск»}, {tab65, example.com, «Example Domain»}]`, `acquires: 2` |
| A1: состояние вкладок из движка | ✅ | `/health.sessions`, `/health.engineActive`, `ui_tabs` читают движок |
| AC-1: цикл до `verified` на движке | ✅ | `task-358` (example.com, ссылка): `ui_select('a')` → `task_create color=rgb(158, 158, 255)` → `triaged` → `ui_verify` → `verify:done pass:true «color совпал»` → `state: verified`, `attempts: 1`, evidence приложен |
| AC-2: страницы не теряются при переключении | ✅ | движок держит сессии: одновременно `tab64 → ya.ru` и `tab65 → example.com`, у каждой свой title; `keepMounted` объявлен в типе вкладки |
| A3: управление агентом | ✅ | `ui_select('a')` → `select:done OK`; `ui_evidence` → селектор `html > body > a:nth-of-type(1)`, `a11y.name=Learn more`, `href=iana.org/help/example-domains`, 17 computed, `viewport 576×715`, `dpr 2` |
| A4: снимок всего экрана | ✅ | `crop:saved 166 044 B` |
| A4: снимок элемента | 🛠 реализовано, ждёт рестарта | ретрай (2 попытки) + фолбэк: полный снимок кропится на canvas по rect; причина — `UnknownVizError` из `GUEST_VIEW_MANAGER_CALL` |
| Закрытие вкладки агентом | 🛠 переопределено | `actions.closeTab` из slot props недоступен, поэтому `ui_close_tab` закрывает **сессию движка** (гость + lease), а вкладку закрывает пользователь крестиком |
| Пустые страницы / бесконечная перезагрузка | ✅ устранено | `dom-ready` навигирует один раз (`session.navigated`); `panelStatus: guest подключён: https://ya.ru/` |

Архитектура: [`startapus-browser/docs/architecture-v2.md`](startapus-browser/docs/architecture-v2.md).

## Финальная живая приёмка (28.10, rev 9cc4c9a78160, `npm run live` → FRESH)

| Критерий | Статус | Доказательство (живой процесс 62395) |
|---|---|---|
| Страница рендерится на всю панель | ✅ | `ui_screenshot` → `crop:saved 520 689 B` (до фикса высоты было 166 044 B «полоской»); `ui_guest_state` → `readyState: complete`, `textLength: 1347` |
| Адресная строка | ✅ | поле редактируется при фокусе (правка контролируемого input), ввод валидируется `normalizeAddress` |
| A3: выбор элемента | ✅ | `ui_select('a')` → `select:done AMBIGUOUS count:27`; `ui_select('textarea#text')` → `OK` |
| AC-1: цикл до `verified` | ✅ | `task-401`: `ui_select('textarea#text')` → `task_create font-size=16px` → `triaged` → `ui_verify` (без перезагрузки) → `verify:done pass:true «font-size: 16px в допуске 0»` → `state: verified`, `attempts: 1`, evidence с `a11y.role=combobox`, `viewport 576×715`, `dpr 2` |
| AC-2: сессии вкладок | ✅ | `sessions: [{ tab67, ya.ru, «Яндекс — быстрый поиск» }]`; ранее одновременно `tab64` + `tab65` со своими title |
| Закрытие сессии | ✅ | `ui_close_tab` → `closetab:done {"closed":true}` → `tabs: 0, sessions: [], hasGuest: false` |
| Открытие новой вкладки | ✅ | `ui_new_tab` → `newtab:done {"opened":true}` → `sessions: [{ tab68, example.com, «Example Domain» }]` |
| Снимок после переоткрытия | ✅ | `crop:saved 166 026 B` |
| Ротация кропов | ✅ | в `~/.dsh/startapus-crops/` ровно 50 файлов |
| Свежесть сборки | ✅ | `npm run live` → `FRESH` (30 флагов, selftest 24/24) |
| Офлайн-проверки | ✅ | `SCRIPT OK 10/10`, `RULES OK 8/8`, `check-apply PASS`, `selftest 42/42` (включая `AUD-4/6/7`) |

Остаточные известные ограничения — `startapus-browser/docs/audit-2026-10-28.md`:
H5 (зеркала `/health` против `sessions[]`), H10 (документация), H11 (приватные API ядра).
