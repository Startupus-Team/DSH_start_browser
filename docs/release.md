# Регламент релиза startapus-browser

## Обязательный гейт (локально и в CI)

```bash
npm run gate        # сборка + SCRIPT/RULES/ENGINE/IMPORTS/TOOLS + host selftest
npm run gate:live   # плюс сверка с запущенным DSH (FRESH, transport, живой selftest)
```

`gate` падает при любой красной проверке; `gate:live` дополнительно падает, если
процесс собран из других исходников (`STALE`), клиент прислал чужой отпечаток (`revMatch:false`)
или живой selftest не прошёл. CI: `.github/workflows/gate.yml`.

## Порядок

1. `npm run gate` — зелёный.
2. Живая проверка на запущенном DSH: `npm run gate:live`; вкладка Startapus открыта,
   в `/health` есть `panels ≥ 1` и `sessionsCount ≥ 1`.
3. Прогон сценария фазы 0 (`docs/plan.md`): `ui_read_page` → `ui_act{ref}` → `ui_screenshot{selector}`
   → `task_create → triaged → ui_verify` → `verified`.
4. Обновить `CHANGELOG.md` (по фичам) и `startapus-browser-compliance.md` тем же коммитом.
5. Поднять версию в `package.json`, поставить тег `vX.Y.Z`.
6. `git push --tags` (если есть remote).

## Откат

- Манифест профиля: `~/.dsh/profiles/desktop/cordis.patch.yml` — рядом лежат бэкапы
  `cordis.patch.yml.bak-<ts>`; отключение штатного браузера снимается удалением блока
  `- id: ui-sidebar-browser / disabled: true`.
- Плагин можно отключить в настройках DSH, не трогая код.
- Задачи ревью хранятся отдельно (`~/.dsh/startapus-tasks.json`), кропы — `~/.dsh/startapus-crops/`.

## Диагностика после релиза

- `~/.dsh/startapus-host.log` — `apply:start`, `tools:registered`, `verify:done/error`,
  `act:done`, `select:done`, `crop:saved`, `shortcut:state`, `load:error`.
- `/health`: `buildRev`/`clientRev`/`revMatch`, `panels`, `sessionsCount`, `urlHost`,
  `panelMounts`, `counters` (`navigations`, `loadErrors`, `recoveries`), `shortcutState`.
- `node scripts/dsh-cookie-doctor.mjs` — накопление `dsh-auth-*` (причина падений DSH 0.2.1-rc.3).
