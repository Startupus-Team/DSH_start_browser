/**
 * Test lab: deterministic fixtures for every browser tool plus in-page self-tests.
 * Served by the host at `/startapus-browser/lab`; the standalone script
 * `scripts/lab-server.mjs` serves the same pages without restarting DSH.
 *
 * @module startapus-browser/lab
 */

/** Main lab page. */
export const LAB_HTML = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Startapus Lab — проверки браузера</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 -apple-system, system-ui, sans-serif; margin:0; padding:24px; background:#0f1115; color:#e7e9ee; }
  h1 { font-size:20px; margin:0 0 4px; } h2 { font-size:12px; letter-spacing:.08em; text-transform:uppercase; opacity:.6; margin:22px 0 8px; }
  section { background:#171a21; border:1px solid #262b35; border-radius:10px; padding:14px; margin:10px 0; }
  button, input, select, textarea { font:inherit; color:inherit; background:#0f1115; border:1px solid #333a46; border-radius:8px; padding:7px 10px; }
  button { cursor:pointer; } button:hover { border-color:#5b8cff; }
  .hoverable { display:inline-block; padding:10px 14px; border:1px dashed #4a5260; border-radius:8px; }
  .hoverable:hover, .hoverable[data-hover="yes"] { background:#24324d; }
  #styled-card { display:flex; gap:8px; padding:12px; font-size:18px; font-weight:600; color:rgb(1,2,3); background-color:rgb(250,250,252); border:2px solid rgb(9,9,9); border-radius:12px; }
  #results { width:100%; border-collapse:collapse; font-size:12px; }
  #results td { padding:3px 8px; border-bottom:1px solid #262b35; }
  .pass { color:#5ddc8a; } .fail { color:#ff6b6b; } .muted { opacity:.6; }
  .spacer { height:900px; }
</style></head><body>
  <h1>Startapus Lab</h1>
  <div class="muted">Фикстуры для всех инструментов. Кнопка «Запустить автотесты» заполнит таблицу PASS/FAIL.</div>

  <section><h2>Кнопки, ввод, форма</h2>
    <button id="btn-click" type="button">Кликни меня</button>
    <span class="muted">кликов: <b id="click-count">0</b></span>
    <span id="hover-target" class="hoverable" tabindex="0">Наведи курсор</span>
    <form id="demo-form" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <input id="name-input" name="name" placeholder="Имя" aria-label="Имя">
      <textarea id="notes" name="notes" placeholder="Заметки" aria-label="Заметки"></textarea>
      <select id="choice" name="choice" aria-label="Выбор"><option value="a">Вариант A</option><option value="b">Вариант B</option></select>
      <label><input id="agree" type="checkbox"> Согласен</label>
      <label><input type="radio" id="plan-pro" name="plan" value="pro"> Pro</label>
      <button id="btn-submit" type="submit">Отправить</button>
    </form>
    <div id="form-result" role="status" class="muted">форма не отправлена</div>
    <button id="btn-disabled" type="button" disabled>Недоступная кнопка</button>
  </section>

  <section><h2>Ожидание и скролл</h2>
    <button id="btn-late" type="button">Показать элемент через 400 мс</button>
    <div id="late-container"></div>
    <button id="btn-scroll" type="button">Прокрутить вниз</button>
    <span class="muted">scrollY: <b id="scroll-y">0</b></span>
    <div class="spacer">глубокий якорь</div>
  </section>

  <section><h2>Сеть</h2>
    <button id="btn-fetch-ok" type="button">GET data</button>
    <button id="btn-fetch-missing" type="button">GET missing (404)</button>
    <span id="net-result" class="muted">—</span>
  </section>

  <section><h2>Консоль</h2><button id="btn-console" type="button">info/warn/error</button></section>

  <section><h2>Стили, a11y, навигация</h2>
    <div id="styled-card"><span>Стилизованная карточка</span></div>
    <img id="a11y-img" alt="Логотип лаборатории" width="1" height="1" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
    <a id="go-other" href="lab/other">Другая страница лаборатории</a>
  </section>

  <section><h2>Автотесты страницы</h2>
    <button id="btn-run" type="button">Запустить автотесты</button>
    <span id="run-summary" class="muted">—</span>
    <table id="results"><tbody></tbody></table>
  </section>

<script>
(function () {
  var results = [];
  function add(name, ok, detail) { results.push({ name: name, ok: !!ok, detail: detail || '' }); }
  function setValue(el, value) {
    var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, value); else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function labUrl(suffix) { var base = location.pathname; if (base.charAt(base.length - 1) !== '/') base += '/'; return base + suffix; }

  document.getElementById('btn-click').addEventListener('click', function () {
    var el = document.getElementById('click-count'); el.textContent = String(Number(el.textContent) + 1);
  });
  var hover = document.getElementById('hover-target');
  hover.addEventListener('mouseover', function () { hover.setAttribute('data-hover', 'yes'); });
  document.getElementById('demo-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var f = event.currentTarget;
    document.getElementById('form-result').textContent = 'отправлено: name=' + f.name.value + ', notes=' + f.notes.value +
      ', choice=' + f.choice.value + ', agree=' + (f.agree.checked ? 'да' : 'нет') + ', plan=' + (f.plan && f.plan.value ? f.plan.value : '—');
  });
  document.getElementById('btn-late').addEventListener('click', function () {
    setTimeout(function () {
      var box = document.createElement('div'); box.id = 'late-box'; box.textContent = 'появился';
      document.getElementById('late-container').appendChild(box);
    }, 400);
  });
  window.addEventListener('scroll', function () { document.getElementById('scroll-y').textContent = String(Math.round(window.scrollY)); });
  document.getElementById('btn-scroll').addEventListener('click', function () { window.scrollTo(0, 700); });
  document.getElementById('btn-fetch-ok').addEventListener('click', function () {
    fetch(labUrl('data')).then(function (r) { document.getElementById('net-result').textContent = 'data: ' + r.status; });
  });
  document.getElementById('btn-fetch-missing').addEventListener('click', function () {
    fetch(labUrl('missing')).then(function (r) { document.getElementById('net-result').textContent = 'missing: ' + r.status; });
  });
  document.getElementById('btn-console').addEventListener('click', function () {
    console.info('lab: info'); console.warn('lab: warn'); console.error('lab: error');
  });

  async function run() {
    results = [];
    var before = Number(document.getElementById('click-count').textContent);
    document.getElementById('btn-click').click();
    add('click', Number(document.getElementById('click-count').textContent) === before + 1);
    setValue(document.getElementById('name-input'), 'Агент');
    add('type input', document.getElementById('name-input').value === 'Агент');
    setValue(document.getElementById('notes'), 'проверка');
    add('type textarea', document.getElementById('notes').value === 'проверка');
    document.getElementById('choice').value = 'b';
    document.getElementById('choice').dispatchEvent(new Event('change', { bubbles: true }));
    add('select', document.getElementById('choice').value === 'b');
    document.getElementById('agree').checked = true;
    document.getElementById('agree').dispatchEvent(new Event('change', { bubbles: true }));
    add('checkbox', document.getElementById('agree').checked === true);
    document.getElementById('plan-pro').checked = true;
    add('radio', document.getElementById('plan-pro').checked === true);
    document.getElementById('btn-submit').click();
    var formText = document.getElementById('form-result').textContent || '';
    add('form submit', formText.indexOf('name=Агент') >= 0, formText);
    hover.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    add('hover', hover.getAttribute('data-hover') === 'yes');
    document.getElementById('btn-late').click();
    await wait(600);
    add('wait late element', document.getElementById('late-box') !== null);
    window.scrollTo(0, 700);
    await wait(80);
    add('scroll', window.scrollY > 50);
    window.scrollTo(0, 0);
    document.getElementById('btn-fetch-missing').click();
    await wait(400);
    add('fetch status', (document.getElementById('net-result').textContent || '').indexOf('missing: 404') >= 0);
    document.getElementById('btn-console').click();
    add('console', true, 'info/warn/error записаны');
    add('title', document.title.indexOf('Startapus Lab') === 0);
    add('a11y', document.getElementById('a11y-img').getAttribute('alt') === 'Логотип лаборатории');
    add('navigation link', (document.getElementById('go-other').getAttribute('href') || '').indexOf('other') >= 0);
    var pass = results.filter(function (r) { return r.ok; }).length;
    var body = document.getElementById('results').querySelector('tbody');
    body.innerHTML = '';
    results.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="' + (r.ok ? 'pass' : 'fail') + '">' + (r.ok ? 'PASS' : 'FAIL') + '</td><td>' +
        r.name + '</td><td class="muted">' + String(r.detail).replace(/</g, '&lt;') + '</td>';
      body.appendChild(tr);
    });
    document.getElementById('run-summary').textContent = pass + ' / ' + results.length + ' прошло, ' + (results.length - pass) + ' упало';
    window.__labSummary = { passed: pass, failed: results.length - pass, total: results.length, results: results };
    return window.__labSummary;
  }
  document.getElementById('btn-run').addEventListener('click', function () { void run(); });
  window.__labRun = run;
})();
</script></body></html>`

/** Second page for navigation/history checks. */
export const LAB_OTHER_HTML = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Startapus Lab — другая страница</title>
<style>body{font:14px/1.6 system-ui,sans-serif;padding:24px;background:#0f1115;color:#e7e9ee}</style></head>
<body><h1>Другая страница лаборатории</h1><p>Для проверки навигации и истории.</p>
<p><a id="go-back" href="../lab">Вернуться в лабораторию</a></p></body></html>`

/** Network fixture. */
export const LAB_DATA = '{"ok":true,"items":[1,2,3],"note":"lab"}'
