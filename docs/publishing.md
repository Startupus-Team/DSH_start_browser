# Публикация в маркете плагинов DSH

## Главное: центрального стора у DSH нет

В установленном DSH (0.2.1-rc.3) есть **маркет плагинов как механизм**, но «официального» каталога
нет. Дословно из README бандла экспериментальных маркетов:

> There is no official market; Discover lists only the index sources the user adds.

То есть «издать плагин» = сделать два артефакта и дать людям ссылку на индекс:

1. **npm-пакет** (или git-репозиторий с зафиксированным коммитом) — сам бандл;
2. **JSON-индекс формата 1** — один файл, где перечислены плагины и версии; пользователь
   добавляет ссылку на него в **Plugins → Discover** и ставит плагин оттуда.

Discover появляется, только если включён экспериментальный бандл: **Plugins → More →
Experimental plugins → «Custom plugin markets»**. После включения появляются вкладки
**Installed / Discover**, а у агента — инструмент `plugin_market` (read-only).

## Требования к пакету-бандлу

`package.json` нашего плагина уже соответствует:

```json
{
  "name": "startapus-browser",
  "version": "0.24.0",
  "type": "module",
  "main": "lib/index.js",
  "icon": "./icon.svg",
  "files": ["lib", "cordis.patch.yml", "icon.svg"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web", "immediately": true }
  }
}
```

Обязательное для установки из маркета: `dsh.bundle.patch` — YAML-overlay, который вставляет
строку плагина. **`name:` в патче должен совпадать с именем npm-пакета** (загрузчик ищет
пакет по этому имени). Если публиковать под scope (`@user/startapus-browser`), поправь `name:`
в `cordis.patch.yml` — скрипт `npm run market` это проверяет и падает с подсказкой.

## Публикация Startapus Browser — где что лежит

| Что | Адрес |
|---|---|
| Репозиторий | https://github.com/Startupus-Team/DSH_start_browser |
| Индекс маркета (его добавляют в Discover) | https://raw.githubusercontent.com/Startupus-Team/DSH_start_browser/master/market-index.json |
| Иконка индекса | https://raw.githubusercontent.com/Startupus-Team/DSH_start_browser/master/icon.svg |
| Версия в индексе | 0.25.0, `source.type = git`, закреплённый коммит |

### Как установить (для пользователя DSH)

1. **Plugins → More → Experimental plugins → «Custom plugin markets»** — включить.
2. **Problem → Discover → Add source** — вставить
   `https://raw.githubusercontent.com/Startupus-Team/DSH_start_browser/master/market-index.json`.
3. Выбрать **Startapus Browser** → **Install** (DSH поставит бандл из git-коммита).
4. Перезапустить DSH; открыть правый сайдбар и нажать **`⌘T`**.

### Как выпустить новую версию

```bash
npm version 0.26.0 --no-git-tag-version
npm run gate
node scripts/market-pack.mjs --git-source    # пересобирает индекс на текущий HEAD
git add -A && git commit -m "release: 0.26.0"
git tag v0.26.0 && git push origin master --tags
```

Индекс попадёт в тот же raw-URL автоматически (файл `market-index.json` в корне).

## Шаги выпуска (общий случай, npm)

```bash
# 0) поднять версию и дописать CHANGELOG
npm version 0.25.0 --no-git-tag-version    # или вручную

# 1) собрать пакет + индекс и проверить их
npm run market
#   PASS  … tarball содержит package/lib/index.js и т.д.
#   PASS  точная SemVer / publishTimestamp / source / engines.dsh
#   MARKET OK
#   dist/startapus-browser-0.25.0.tgz
#   dist/market-index.json

# 2) опубликовать в npm (нужен аккаунт; scoped — с --access public)
npm publish --access public

# 3) выложить dist/market-index.json на любой HTTPS-адрес
#    (GitHub Pages, raw gist, свой сервер). Ограничений на домен нет —
#    ссылку пользователь добавляет сам.
```

Для каждого релиза: опубликовать версию → **добавить новую запись в `versions`** индекса
(старые оставить) → обновить `publishTimestamp` (Unix-секунды) → перевыложить индекс.
`npm run market` генерирует индекс с одной текущей версией; для накопления версий допиши
предыдущие записи вручную или веди индекс как файл в репозитории.

## Вариант без npm (git)

```json
"source": {
  "type": "git",
  "url": "https://github.com/<owner>/<repo>",
  "commit": "<40 hex>",
  "path": "packages/startapus-browser"
}
```

`commit` — полный lowercase sha, `path` — каталог пакета внутри репозитория.
Установка идёт через pnpm из `git+https` с закреплённым коммитом.

## Формат индекса (format 1) — что проверять

Валидатор ядра — пакет `@deepseek-ai/dsh-plugin-market-index`; правила, которые он требует:

| Поле | Требование |
|---|---|
| `format` | ровно `1` |
| `title` | строка или объект с обязательным `en` (языки — lowercase id) |
| `metadata.categories` / `.labels` / `.sortKeys` | объявление; ссылки плагинов только на объявленные id |
| `plugins[].name` | валидное имя npm-пакета, без дублей |
| `plugins[].icon` | относительный URL от индекса (или inline `data:` ≤32 КиБ, или https) |
| `plugins[].versions[]` | непустой массив; каждая `version` — **точная SemVer**, без дублей |
| `versions[].publishTimestamp` | целые Unix-секунды, `0 ≤ ts < 10^11` |
| `versions[].source` | `{type:"npm"}` (опц. `registry`) или `{type:"git",url,commit,path?}` |
| `versions[].engines.dsh` | SemVer-диапазон (например `>=0.2.1-rc.3 <0.3.0`) |

`npm run market` валидирует индекс этими же правилами офлайн; в CI можно дополнительно
прогнать официальный валидатор:

```js
import { parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index'
parseMarketIndex(JSON.parse(fs.readFileSync('dist/market-index.json', 'utf8')), 'https://example.com/index.json')
```

## Как это видит пользователь

1. **Plugins → More → Experimental plugins → Custom plugin markets** — включить;
2. **Discover → Add source** — вставить URL индекса;
3. выбрать **Startapus Browser** → Install;
4. DSH поставит `pnpm`-зависимость и включит бандл (патч `cordis.patch.yml`);
5. для работы браузера нужен перезапуск/перезагрузка профиля — как у любого бандла.

## Ограничения и честные риски

- **Подписи и доверия нет**: индекс — обычный JSON; ставится то, что в нём указано. Публикуй
  только то, что готов исполнять на машине пользователя (host-код работает в процессе DSH).
- Установка/снятие плагинов требует `danger-full-access` или подтверждения (политика ядра).
- Маркет — experimental-бандл: его могут выключить, и Discover исчезнет (индекс остаётся).
- Наш браузер открывает произвольные сайты — в описании плагина это стоит указывать явно.

## Чек-лист перед публикацией

- [ ] `npm run gate` зелёный; `npm run market` → `MARKET OK`
- [ ] в `dist/*.tgz` есть `lib/index.js`, `lib/client.js`, `cordis.patch.yml`, `icon.svg`
- [ ] `name` в `package.json` = `name:` в `cordis.patch.yml`
- [ ] `CHANGELOG.md` содержит версию, `engines.dsh` соответствует проверенной версии DSH
- [ ] README объясняет, как включить браузер (⌘T) и что он имеет доступ к сети
- [ ] индекс выложен по HTTPS, `publishTimestamp` обновлён
