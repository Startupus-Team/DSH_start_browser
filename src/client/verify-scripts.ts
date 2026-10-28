/**
 * String builders for the scripts injected into the guest page.
 *
 * These are pure functions (no DOM), so their *output* can be syntax-checked in
 * Node before shipping: a missing brace here surfaces in the guest as
 * "Script failed to execute" and silently breaks verification.
 *
 * @module startapus-browser/client/verify-scripts
 */

/** Measure one acceptance predicate on a re-resolved locator. */
export function measureScript(selector: string, method: string, property: string, expectTag: string): string {
  const sel = JSON.stringify(selector)
  const prop = JSON.stringify(property)
  const m = JSON.stringify(method)
  const tag = JSON.stringify(expectTag)
  return `(() => {
    try {
      var matches = document.querySelectorAll(${sel});
      if (matches.length === 0) return JSON.stringify({ status: 'MISSING' });
      if (matches.length > 1) return JSON.stringify({ status: 'AMBIGUOUS', count: matches.length });
      var el = matches[0];
      var expectTag = ${tag};
      if (expectTag !== '' && el.tagName.toLowerCase() !== expectTag) {
        return JSON.stringify({ status: 'STALE', tag: el.tagName.toLowerCase(), expect: expectTag });
      }
      var method = ${m};
      var cs = window.getComputedStyle(el);
      var value;
      if (method === 'exists') {
        value = '1';
      } else if (method === 'visible') {
        var box = el.getBoundingClientRect();
        value = (cs.display !== 'none' && cs.visibility !== 'hidden' && box.width > 0 && box.height > 0) ? '1' : '0';
      } else if (method === 'text') {
        value = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 300);
      } else if (method === 'box') {
        var rect = el.getBoundingClientRect();
        value = Math.round(rect.width) + 'x' + Math.round(rect.height);
      } else if (method === 'no-hscroll') {
        var scroller = (el === document.documentElement || el === document.body) ? document.documentElement : el;
        value = String(Math.max(0, scroller.scrollWidth - scroller.clientWidth));
      } else if (method === 'in-viewport') {
        var vr = el.getBoundingClientRect();
        value = (vr.width > 0 && vr.height > 0 && vr.left >= -0.5 && vr.top >= -0.5 && vr.right <= window.innerWidth + 0.5 && vr.bottom <= window.innerHeight + 0.5) ? '1' : '0';
      } else if (method === 'contrast') {
        var parseColor = function (text) {
          var legacy = /^rgba?\\(([^)]+)\\)$/.exec(text);
          if (legacy) {
            var p = legacy[1].split(/[ ,\\/]+/).filter(Boolean).map(parseFloat);
            return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !isNaN(p[3]) ? p[3] : 1 };
          }
          var modern = /^color\\(srgb ([^)]+)\\)$/.exec(text);
          if (modern) {
            var q = modern[1].split(/[ \\/]+/).filter(Boolean).map(parseFloat);
            return { r: q[0] * 255, g: q[1] * 255, b: q[2] * 255, a: q.length > 3 && !isNaN(q[3]) ? q[3] : 1 };
          }
          return null;
        };
        var layers = [];
        var unmeasurable = '';
        for (var node = el; node && node.nodeType === 1; node = node.parentElement) {
          var ncs = window.getComputedStyle(node);
          if (ncs.backgroundImage && ncs.backgroundImage !== 'none') { unmeasurable = 'фон с изображением или градиентом'; break; }
          var bg = parseColor(ncs.backgroundColor);
          if (bg === null && ncs.backgroundColor && ncs.backgroundColor !== 'transparent') { unmeasurable = 'цвет фона в неподдерживаемом формате: ' + ncs.backgroundColor; break; }
          if (bg !== null && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
        }
        var fgRaw = parseColor(cs.color);
        if (unmeasurable === '' && fgRaw === null) unmeasurable = 'цвет текста в неподдерживаемом формате: ' + cs.color;
        if (unmeasurable !== '') return JSON.stringify({ status: 'UNMEASURABLE', value: 'E_UNMEASURABLE: ' + unmeasurable });
        var base = { r: 255, g: 255, b: 255 };
        for (var li = layers.length - 1; li >= 0; li -= 1) {
          var layer = layers[li];
          base = { r: layer.r * layer.a + base.r * (1 - layer.a), g: layer.g * layer.a + base.g * (1 - layer.a), b: layer.b * layer.a + base.b * (1 - layer.a) };
        }
        var fg = { r: fgRaw.r * fgRaw.a + base.r * (1 - fgRaw.a), g: fgRaw.g * fgRaw.a + base.g * (1 - fgRaw.a), b: fgRaw.b * fgRaw.a + base.b * (1 - fgRaw.a) };
        var lum = function (c) {
          var f = function (v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
          return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
        };
        var l1 = lum(fg), l2 = lum(base);
        var ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        value = (Math.floor(ratio * 100 + 1e-9) / 100).toFixed(2);
      } else {
        value = cs.getPropertyValue(${prop}) || '';
      }
      return JSON.stringify({ status: 'OK', tag: el.tagName.toLowerCase(), value: value });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/** Count how many covered elements of an area are still present. */
export function coverageScript(covered: Array<{ tag: string; id: string; classes: string }>): string {
  const items = JSON.stringify(covered.map((item) => ({
    tag: item.tag ?? '',
    id: item.id ?? '',
    cls: String(item.classes ?? '').split(/\s+/).filter(Boolean)[0] ?? '',
  })))
  return `(() => {
    try {
      var items = ${items};
      var found = 0;
      for (var index = 0; index < items.length; index += 1) {
        var item = items[index];
        if (item.tag === '') continue;
        var selector = item.tag + (item.id === '' ? '' : '[id="' + item.id + '"]') +
          (item.cls === '' ? '' : '.' + item.cls);
        if (document.querySelector(selector) !== null) found += 1;
      }
      return JSON.stringify({ status: 'OK', found: found, total: items.length });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/**
 * Evidence script: build the same portrait the picker produces, but for a
 * selector chosen by the agent — no human click required.
 */
export function evidenceScript(selector: string): string {
  const sel = JSON.stringify(selector)
  return `(() => {
    try {
      var matches = document.querySelectorAll(${sel});
      if (matches.length === 0) return JSON.stringify({ status: 'MISSING' });
      if (matches.length > 1) return JSON.stringify({ status: 'AMBIGUOUS', count: matches.length });
      var el = matches[0];
      function path(node) {
        var parts = [];
        while (node && node.nodeType === 1 && parts.length < 6) {
          var part = node.tagName.toLowerCase();
          if (node.id) { parts.unshift(part + '#' + node.id); break; }
          // Utility classes contain ':' and '[' — those break querySelector unless
          // escaped, so every segment goes through CSS.escape.
          var rawCls = (node.className || '').toString().trim().split(/\\s+/).filter(Boolean).slice(0, 2);
          var cls = rawCls.map(function (name) { return (window.CSS && CSS.escape) ? CSS.escape(name) : name.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); });
          if (cls.length) part += '.' + cls.join('.');
          var parent = node.parentElement;
          if (parent) {
            var same = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === node.tagName; });
            var index = same.indexOf(node);
            if (index >= 0) part += ':nth-of-type(' + (index + 1) + ')';
          }
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      }
      // Same depth as the human picker: no zero-dropping (0px is a real value),
      // the full box/spacing/typography surface plus ancestors and a fragment.
      var props = ['display','position','visibility','opacity','box-sizing','width','height',
        'margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right',
        'padding-bottom','padding-left','gap','row-gap','column-gap','flex-direction','flex-wrap',
        'justify-content','align-items','font-family','font-size','font-weight','line-height',
        'letter-spacing','color','background-color','background-image','border-top-width',
        'border-right-width','border-bottom-width','border-left-width','border-radius','border-color',
        'border-style','box-shadow','overflow','overflow-x','overflow-y','text-align','text-transform',
        'text-decoration-line','white-space','cursor','pointer-events','user-select','z-index',
        'transform','transition-duration','grid-template-columns'];
      var computed = {};
      var cs = window.getComputedStyle(el);
      for (var index = 0; index < props.length; index += 1) {
        var name = props[index];
        var value = cs.getPropertyValue(name);
        if (value !== '') computed[name] = value;
      }
      var ancestors = [];
      var walker = el.parentElement;
      while (walker && ancestors.length < 3) {
        ancestors.push({ tag: walker.tagName.toLowerCase(), id: walker.id || '', classes: (walker.className || '').toString().trim().slice(0, 120) });
        walker = walker.parentElement;
      }
      var before = window.getComputedStyle(el, '::before');
      var after = window.getComputedStyle(el, '::after');
      var pseudo = { beforeContent: before.content, afterContent: after.content };
      var rect = el.getBoundingClientRect();
      var aria = el.getAttribute('aria-label') || (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 160);
      return JSON.stringify({
        status: 'OK',
        evidence: {
          selector: path(el),
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          classes: (el.className || '').toString().trim().slice(0, 300),
          testid: el.getAttribute('data-testid') || '',
          role: el.getAttribute('role') || '',
          a11y: { role: el.getAttribute('role') || el.tagName.toLowerCase(), name: aria },
          text: (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 300),
          href: el.getAttribute('href') || '',
          rect: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
          box: { clientWidth: el.clientWidth, clientHeight: el.clientHeight, scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight },
          state: { disabled: el.disabled === true, hidden: cs.display === 'none' || cs.visibility === 'hidden', focused: document.activeElement === el },
          computed: computed,
          ancestors: ancestors,
          pseudo: pseudo,
          fragment: (el.outerHTML || '').slice(0, 1200),
          env: {
            url: String(location.href),
            title: String(document.title || ''),
            viewport: { width: window.innerWidth, height: window.innerHeight },
            dpr: window.devicePixelRatio || 1,
            zoom: window.visualViewport ? window.visualViewport.scale : 1,
            scrollX: Math.round(window.scrollX),
            scrollY: Math.round(window.scrollY)
          }
        }
      });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/** Action script: click, type or scroll — initiated by the agent, not the user. */
export function actScript(op: string, selector: string, value: string): string {
  const operation = JSON.stringify(op)
  const sel = JSON.stringify(selector)
  const text = JSON.stringify(value)
  return `(() => {
    try {
      var op = ${operation};
      var sel = ${sel};
      var value = ${text};
      var el = sel === '' ? null : document.querySelector(sel);
      if (sel !== '' && el === null) return JSON.stringify({ status: 'MISSING' });
      if (op === 'click') {
        if (el === null) return JSON.stringify({ status: 'MISSING' });
        el.scrollIntoView({ block: 'center' });
        el.click();
        return JSON.stringify({ status: 'OK', op: op });
      }
      if (op === 'type') {
        if (el === null) return JSON.stringify({ status: 'MISSING' });
        el.focus();
        // React tracks values through the native setter: assigning el.value directly
        // leaves its state empty, so Enter-on-submit did nothing on startapus.
        var proto = null;
        if (typeof HTMLTextAreaElement !== 'undefined' && el instanceof HTMLTextAreaElement) proto = HTMLTextAreaElement.prototype;
        else if (typeof HTMLInputElement !== 'undefined' && el instanceof HTMLInputElement) proto = HTMLInputElement.prototype;
        var desc = proto === null ? null : Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc !== null && desc !== undefined && typeof desc.set === 'function') desc.set.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
        return JSON.stringify({ status: 'OK', op: op, length: value.length });
      }
      if (op === 'press') {
        // Real key events (with modifiers), so React handlers that submit on Enter fire.
        var target = el !== null ? el : (document.activeElement || document.body);
        target.focus();
        var raw = value === '' ? 'Enter' : value;
        var mods = [];
        while (raw.length > 1 && raw.indexOf('+') > 0) {
          var cut = raw.indexOf('+');
          mods.push(raw.slice(0, cut).toLowerCase());
          raw = raw.slice(cut + 1);
        }
        var named = { enter: 'Enter', 'return': 'Enter', tab: 'Tab', escape: 'Escape', esc: 'Escape', space: ' ', backspace: 'Backspace', 'delete': 'Delete', del: 'Delete',
          arrowup: 'ArrowUp', up: 'ArrowUp', arrowdown: 'ArrowDown', down: 'ArrowDown', arrowleft: 'ArrowLeft', left: 'ArrowLeft', arrowright: 'ArrowRight', right: 'ArrowRight',
          home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown' };
        var codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, Backspace: 8, Delete: 46, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, PageUp: 33, PageDown: 34 };
        var key = named[raw.toLowerCase()] !== undefined ? named[raw.toLowerCase()] : raw;
        var upper = key.length === 1 ? key.toUpperCase() : key;
        var code = codes[key] !== undefined ? codes[key] : (upper >= 'A' && upper <= 'Z' && key.length === 1 ? upper.charCodeAt(0) : (key >= '0' && key <= '9' && key.length === 1 ? key.charCodeAt(0) : 0));
        var domCode = key === ' ' ? 'Space' : (key.length === 1 && upper >= 'A' && upper <= 'Z' ? 'Key' + upper : (key.length === 1 && key >= '0' && key <= '9' ? 'Digit' + key : key));
        var flags = {
          ctrlKey: mods.indexOf('ctrl') >= 0 || mods.indexOf('control') >= 0,
          metaKey: mods.indexOf('meta') >= 0 || mods.indexOf('cmd') >= 0 || mods.indexOf('command') >= 0,
          shiftKey: mods.indexOf('shift') >= 0,
          altKey: mods.indexOf('alt') >= 0 || mods.indexOf('option') >= 0
        };
        var keyInit = { key: key, code: domCode, keyCode: code, which: code, bubbles: true, cancelable: true, ctrlKey: flags.ctrlKey, metaKey: flags.metaKey, shiftKey: flags.shiftKey, altKey: flags.altKey };
        var down = new KeyboardEvent('keydown', keyInit);
        var up = new KeyboardEvent('keyup', keyInit);
        target.dispatchEvent(down);
        target.dispatchEvent(up);
        var plain = !flags.ctrlKey && !flags.metaKey && !flags.altKey;
        if (!down.defaultPrevented) {
          if (key === 'Enter' && plain) {
            var form = target.form || (target.closest && target.closest('form'));
            if (form !== null && form !== undefined) form.requestSubmit();
          } else if ((flags.ctrlKey || flags.metaKey) && key.toLowerCase() === 'a' && typeof target.select === 'function') {
            target.select();
          } else if (key === 'Tab' && plain) {
            var focusables = Array.prototype.filter.call(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'), function (n) {
              return n.getAttribute('tabindex') !== '-1' && !n.disabled && n.getBoundingClientRect().width > 0;
            });
            var at = focusables.indexOf(target);
            var next = focusables[(at + (flags.shiftKey ? -1 : 1) + focusables.length) % Math.max(1, focusables.length)];
            if (next) next.focus();
          }
        }
        return JSON.stringify({ status: 'OK', op: op, key: key, modifiers: mods });
      }
      if (op === 'click_at') {
        var pointParts = value.split(',');
        var px = Number.parseFloat(pointParts[0]);
        var py = Number.parseFloat(pointParts[1]);
        if (!Number.isFinite(px) || !Number.isFinite(py)) return JSON.stringify({ status: 'ERROR', message: 'value должен быть «x,y» в координатах окна просмотра' });
        var hit = document.elementFromPoint(px, py);
        if (hit === null) return JSON.stringify({ status: 'ERROR', message: 'в точке ' + px + ',' + py + ' нет элемента (вне окна просмотра?)' });
        var pointInit = { bubbles: true, cancelable: true, clientX: px, clientY: py, view: window, button: 0 };
        if (typeof PointerEvent !== 'undefined') hit.dispatchEvent(new PointerEvent('pointerdown', pointInit));
        hit.dispatchEvent(new MouseEvent('mousedown', pointInit));
        if (typeof PointerEvent !== 'undefined') hit.dispatchEvent(new PointerEvent('pointerup', pointInit));
        hit.dispatchEvent(new MouseEvent('mouseup', pointInit));
        hit.click();
        return JSON.stringify({ status: 'OK', op: op, tag: hit.tagName.toLowerCase(), id: hit.id || '' });
      }
      if (op === 'drag') {
        if (el === null) return JSON.stringify({ status: 'MISSING' });
        el.scrollIntoView({ block: 'center' });
        var from = el.getBoundingClientRect();
        var sx = Math.round(from.left + from.width / 2);
        var sy = Math.round(from.top + from.height / 2);
        var ex = sx;
        var ey = sy;
        var destination = null;
        if (value.indexOf(',') >= 0 && !Number.isNaN(Number.parseFloat(value.split(',')[0]))) {
          ex = sx + Number.parseFloat(value.split(',')[0]);
          ey = sy + Number.parseFloat(value.split(',')[1]);
        } else if (value !== '') {
          destination = document.querySelector(value);
          if (destination === null) return JSON.stringify({ status: 'ERROR', message: 'цель перетаскивания не найдена: ' + value });
          var to = destination.getBoundingClientRect();
          ex = Math.round(to.left + to.width / 2);
          ey = Math.round(to.top + to.height / 2);
        } else {
          return JSON.stringify({ status: 'ERROR', message: 'value: селектор цели или смещение «dx,dy»' });
        }
        var mouse = function (type, node, x, y, buttons) {
          var init = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window, button: 0, buttons: buttons };
          if (typeof PointerEvent !== 'undefined' && type.indexOf('mouse') === 0) node.dispatchEvent(new PointerEvent(type.replace('mouse', 'pointer'), init));
          node.dispatchEvent(new MouseEvent(type, init));
        };
        mouse('mousedown', el, sx, sy, 1);
        var steps = 6;
        for (var step = 1; step <= steps; step += 1) {
          var mx = Math.round(sx + (ex - sx) * step / steps);
          var my = Math.round(sy + (ey - sy) * step / steps);
          mouse('mousemove', document.elementFromPoint(mx, my) || el, mx, my, 1);
        }
        var drop = destination || document.elementFromPoint(ex, ey) || el;
        mouse('mouseup', drop, ex, ey, 0);
        if (el.draggable === true && typeof DragEvent !== 'undefined' && typeof DataTransfer !== 'undefined') {
          var transfer = new DataTransfer();
          var dragInit = function (x, y) { return { bubbles: true, cancelable: true, clientX: x, clientY: y, dataTransfer: transfer }; };
          el.dispatchEvent(new DragEvent('dragstart', dragInit(sx, sy)));
          drop.dispatchEvent(new DragEvent('dragenter', dragInit(ex, ey)));
          drop.dispatchEvent(new DragEvent('dragover', dragInit(ex, ey)));
          drop.dispatchEvent(new DragEvent('drop', dragInit(ex, ey)));
          el.dispatchEvent(new DragEvent('dragend', dragInit(ex, ey)));
        }
        return JSON.stringify({ status: 'OK', op: op, from: [sx, sy], to: [ex, ey], note: 'синтетические события: нативный drag-and-drop ОС не выполняется' });
      }
      if (op === 'hover') {
        if (el === null) return JSON.stringify({ status: 'MISSING' });
        el.scrollIntoView({ block: 'center' });
        var box = el.getBoundingClientRect();
        var init = { bubbles: true, cancelable: true, clientX: Math.round(box.left + box.width / 2), clientY: Math.round(box.top + box.height / 2), view: window };
        var fire = function (type, bubbles) { el.dispatchEvent(new MouseEvent(type, Object.assign({}, init, { bubbles: bubbles }))); };
        if (typeof PointerEvent !== 'undefined') {
          el.dispatchEvent(new PointerEvent('pointerover', init));
          el.dispatchEvent(new PointerEvent('pointerenter', Object.assign({}, init, { bubbles: false })));
          el.dispatchEvent(new PointerEvent('pointermove', init));
        }
        fire('mouseover', true);
        fire('mouseenter', false);
        fire('mousemove', true);
        return JSON.stringify({ status: 'OK', op: op, note: 'синтетические события мыши: CSS :hover не включается' });
      }
      if (op === 'select') {
        if (el === null) return JSON.stringify({ status: 'MISSING' });
        if (!el.options) return JSON.stringify({ status: 'ERROR', message: 'элемент не <select>' });
        var chosen = -1;
        for (var oi = 0; oi < el.options.length; oi += 1) {
          if (el.options[oi].value === value) { chosen = oi; break; }
        }
        if (chosen < 0) {
          for (var ti = 0; ti < el.options.length; ti += 1) {
            if ((el.options[ti].text || '').trim() === value.trim()) { chosen = ti; break; }
          }
        }
        if (chosen < 0) {
          var offered = Array.prototype.slice.call(el.options, 0, 12).map(function (o) { return o.value + '=' + (o.text || '').trim(); }).join(' | ');
          return JSON.stringify({ status: 'ERROR', message: 'нет варианта «' + value + '»; есть: ' + offered });
        }
        if (el.options[chosen].disabled) return JSON.stringify({ status: 'ERROR', message: 'вариант отключён' });
        el.focus();
        if (el.multiple) el.options[chosen].selected = true;
        else el.selectedIndex = chosen;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return JSON.stringify({ status: 'OK', op: op, value: el.value });
      }
      if (op === 'check') {
        if (el === null) return JSON.stringify({ status: 'MISSING' });
        var want = !(value === 'false' || value === '0' || value === 'off');
        var aria = el.getAttribute && el.getAttribute('aria-checked');
        var native = typeof el.checked === 'boolean';
        if (!native && aria === null) return JSON.stringify({ status: 'ERROR', message: 'элемент не чекбокс/радио/переключатель' });
        if (native && el.disabled) return JSON.stringify({ status: 'ERROR', message: 'элемент отключён' });
        var now = native ? el.checked : aria === 'true';
        if (now !== want) {
          if (native && el.type === 'radio' && !want) return JSON.stringify({ status: 'ERROR', message: 'радио нельзя снять — выберите другой вариант' });
          el.scrollIntoView({ block: 'center' });
          el.click();
        }
        var after = native ? el.checked : el.getAttribute('aria-checked') === 'true';
        if (after !== want) return JSON.stringify({ status: 'ERROR', message: 'состояние не изменилось (страница отменила клик)' });
        return JSON.stringify({ status: 'OK', op: op, checked: after });
      }
      if (op === 'scroll') {
        var y = Number.parseInt(value, 10);
        if (el !== null) el.scrollIntoView({ block: 'center' });
        else window.scrollTo(0, Number.isFinite(y) ? y : 0);
        return JSON.stringify({ status: 'OK', op: op, scrollY: Math.round(window.scrollY) });
      }
      return JSON.stringify({ status: 'ERROR', message: 'неизвестная операция: ' + op });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/**
 * Page scan: a compact, stable list of meaningful/interactive nodes with
 * `ref_N` handles — the same idea as Claude's `read_page`, built from the DOM
 * because CDP Accessibility is not available to a sandboxed plugin.
 */
export function pageScanScript(limit: number, root = '', filter: 'all' | 'interactive' = 'all'): string {
  return `(() => {
    try {
      var MAX = ${limit};
      var ROOT = ${JSON.stringify(root)};
      var ONLY_INTERACTIVE = ${filter === 'interactive'};
      var scope = ROOT === '' ? document.body : document.querySelector(ROOT);
      if (!scope) return JSON.stringify({ status: 'ERROR', message: 'корень обзора не найден: ' + ROOT });
      var items = [];
      var seen = 0;
      function path(node) {
        var parts = [];
        while (node && node.nodeType === 1 && parts.length < 5) {
          var part = node.tagName.toLowerCase();
          if (node.id) { parts.unshift(part + '#' + node.id); break; }
          // Utility classes contain ':' and '[' — those break querySelector unless
          // escaped, so every segment goes through CSS.escape.
          var rawCls = (node.className || '').toString().trim().split(/\\s+/).filter(Boolean).slice(0, 2);
          var cls = rawCls.map(function (name) { return (window.CSS && CSS.escape) ? CSS.escape(name) : name.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); });
          if (cls.length) part += '.' + cls.join('.');
          var parent = node.parentElement;
          if (parent) {
            var same = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === node.tagName; });
            var index = same.indexOf(node);
            if (index >= 0) part += ':nth-of-type(' + (index + 1) + ')';
          }
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      }
      function name(node) {
        var aria = node.getAttribute('aria-label');
        if (aria) return aria;
        var labelled = node.getAttribute('aria-labelledby');
        if (labelled) {
          var byId = document.getElementById(labelled);
          if (byId) return (byId.textContent || '').trim().slice(0, 120);
        }
        var alt = node.getAttribute('alt') || node.getAttribute('title') || node.getAttribute('placeholder');
        if (alt) return String(alt).slice(0, 120);
        return (node.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 120);
      }
      var walk = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
      var node = walk.currentNode;
      while (node && items.length < MAX) {
        var tag = node.tagName.toLowerCase();
        var role = node.getAttribute('role') || (tag === 'a' ? 'link' : tag === 'button' ? 'button' : tag === 'input' || tag === 'textarea' ? 'textbox' : tag === 'select' ? 'combobox' : '');
        var interactive = ['a','button','input','textarea','select','summary','details','label'].indexOf(tag) >= 0 || role !== '';
        var heading = /^h[1-6]$/.test(tag);
        if (interactive || (heading && !ONLY_INTERACTIVE)) {
          var rect = node.getBoundingClientRect();
          var style = window.getComputedStyle(node);
          var visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          items.push({
            ref: 'ref_' + (items.length + 1),
            role: role || (heading ? 'heading' : tag),
            tag: tag,
            name: name(node),
            selector: path(node),
            visible: visible,
            disabled: node.disabled === true
          });
        }
        seen += 1;
        node = walk.nextNode();
      }
      return JSON.stringify({ status: 'OK', scanned: seen, total: items.length, items: items, url: String(location.href) });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/**
 * Visible page text, article-first (Claude's `get_page_text` contract):
 * prefer article/main, fall back to body.innerText.
 */
export function pageTextScript(limit: number): string {
  return `(() => {
    try {
      const MAX = ${limit};
      const pick = document.querySelector('article, main, [role="main"]') || document.body;
      const text = (pick && pick.innerText ? pick.innerText : '').replace(/\\n{3,}/g, '\\n\\n').trim();
      return JSON.stringify({ status: 'OK', url: String(location.href), title: String(document.title), text: text.slice(0, MAX), truncated: text.length > MAX });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/** Resource timings of the page: what was requested, how long and how heavy. */
export function networkScript(limit: number): string {
  return `(() => {
    try {
      const MAX = ${limit};
      const rows = performance.getEntriesByType('resource').map((entry) => ({
        name: String(entry.name).slice(0, 300),
        type: String(entry.initiatorType || 'other'),
        durationMs: Math.round(entry.duration),
        transferBytes: Number(entry.transferSize || 0),
        startMs: Math.round(entry.startTime)
      }));
      const slow = rows.filter((row) => row.durationMs >= 400).length;
      const heavy = rows.filter((row) => row.transferBytes >= 200000).length;
      const hook = window.__startapusNet;
      const requests = hook && Array.isArray(hook.log) ? hook.log.slice(-MAX) : [];
      const failedRequests = requests.filter((row) => !row.aborted && (row.error || row.status >= 400 || row.status === 0)).length;
      return JSON.stringify({ status: 'OK', total: rows.length, slow, heavy, entries: rows.slice(-MAX), hooked: !!hook, requests, failedRequests });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/** Targeted computed-style inspection for one selector (Claude's `preview_inspect`). */
export function inspectScript(selector: string, styles: readonly string[]): string {
  const requested = styles.length > 0 ? styles : ['color', 'background-color', 'font-size', 'font-family', 'font-weight', 'line-height', 'padding', 'margin', 'border', 'border-radius', 'display', 'position', 'width', 'height', 'gap', 'flex-direction', 'text-align', 'opacity']
  return `(() => {
    try {
      const nodes = document.querySelectorAll(${JSON.stringify(selector)});
      if (nodes.length === 0) return JSON.stringify({ status: 'MISSING', count: 0 });
      if (nodes.length > 1) return JSON.stringify({ status: 'AMBIGUOUS', count: nodes.length });
      const node = nodes[0];
      const computed = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const wanted = ${JSON.stringify(requested)};
      const styles = {};
      for (const name of wanted) styles[name] = computed.getPropertyValue(name);
      return JSON.stringify({
        status: 'OK',
        selector: ${JSON.stringify(selector)},
        tag: node.tagName.toLowerCase(),
        text: (node.textContent || '').trim().slice(0, 200),
        styles,
        rect: { x: Math.round(box.left), y: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height) },
        env: { url: String(location.href), title: String(document.title), viewport: { width: window.innerWidth, height: window.innerHeight }, dpr: window.devicePixelRatio }
      });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/**
 * One poll of a `ui_wait` condition: every requested condition must hold.
 * Returns `{ met, detail }`; an invalid selector reports `status: 'ERROR'`.
 */
export function waitScript(spec: { selector: string; state: string; text: string; networkIdle: boolean; idleMs: number }): string {
  return `(() => {
    try {
      const spec = ${JSON.stringify(spec)};
      const detail = {};
      let met = true;
      if (spec.selector !== '') {
        const el = document.querySelector(spec.selector);
        let visible = false;
        if (el) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        }
        let ok;
        if (spec.state === 'absent') ok = !el;
        else if (spec.state === 'present') ok = !!el;
        else if (spec.state === 'hidden') ok = !el || !visible;
        else ok = visible;
        detail.selector = ok;
        met = met && ok;
      }
      if (spec.text !== '') {
        const body = document.body && document.body.innerText ? document.body.innerText : '';
        const ok = body.toLowerCase().indexOf(spec.text.toLowerCase()) !== -1;
        detail.text = ok;
        met = met && ok;
      }
      if (spec.networkIdle) {
        let lastEnd = 0;
        for (const entry of performance.getEntriesByType('resource')) lastEnd = Math.max(lastEnd, entry.responseEnd || 0);
        const ok = document.readyState === 'complete' && performance.now() - lastEnd >= spec.idleMs;
        detail.networkIdle = ok;
        met = met && ok;
      }
      return JSON.stringify({ status: 'OK', met, detail });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/**
 * Approximate \`prefers-color-scheme\` emulation without CDP: media queries in
 * reachable stylesheets (and \`matchMedia\`) are rewritten to match the requested
 * scheme, \`color-scheme\` is set on the root, and everything is restorable.
 * Cross-origin stylesheets that block \`cssRules\` are counted as skipped.
 */
export function colorSchemeScript(mode: 'dark' | 'light' | 'auto'): string {
  return `(() => {
    try {
      const MODE = ${JSON.stringify(mode)};
      const w = window;
      const store = w.__startapusScheme || (w.__startapusScheme = { rules: [], attrs: [], matchMedia: null, hadRoot: false, prevRoot: '' });
      for (const item of store.rules) { try { item.rule.media.mediaText = item.orig; } catch (e) {} }
      for (const item of store.attrs) { try { if (item.orig === null) item.el.removeAttribute('media'); else item.el.setAttribute('media', item.orig); } catch (e) {} }
      store.rules = []; store.attrs = [];
      if (store.matchMedia) { w.matchMedia = store.matchMedia; store.matchMedia = null; }
      if (store.hadRoot) { document.documentElement.style.colorScheme = store.prevRoot; store.hadRoot = false; }
      if (MODE === 'auto') return JSON.stringify({ status: 'OK', mode: MODE, patchedRules: 0, skippedSheets: 0 });
      const FEATURE = /\\(\\s*prefers-color-scheme\\s*:\\s*(dark|light)\\s*\\)/ig;
      const rewrite = (text) => String(text).replace(FEATURE, (all, v) => v.toLowerCase() === MODE ? '(min-width: 0px)' : '(max-width: -1px)');
      let patched = 0, skipped = 0;
      const walk = (rules) => {
        for (const rule of Array.from(rules)) {
          if (rule.media && typeof rule.media.mediaText === 'string' && /prefers-color-scheme/i.test(rule.media.mediaText)) {
            const orig = rule.media.mediaText;
            const next = rewrite(orig);
            if (next !== orig) { try { rule.media.mediaText = next; store.rules.push({ rule, orig }); patched += 1; } catch (e) {} }
          }
          if (rule.styleSheet) { try { walk(rule.styleSheet.cssRules); } catch (e) { skipped += 1; } }
          if (rule.cssRules) walk(rule.cssRules);
        }
      };
      const roots = [document];
      for (let index = 0; index < roots.length && roots.length < 500; index += 1) {
        for (const host of Array.from(roots[index].querySelectorAll('*'))) {
          if (host.shadowRoot) roots.push(host.shadowRoot);
        }
      }
      for (const root of roots) {
        const sheets = Array.from(root.styleSheets || []).concat(Array.from(root.adoptedStyleSheets || []));
        for (const sheet of sheets) { try { walk(sheet.cssRules); } catch (e) { skipped += 1; } }
        for (const el of Array.from(root.querySelectorAll('link[media], style[media]'))) {
          const orig = el.getAttribute('media');
          if (orig && /prefers-color-scheme/i.test(orig)) { el.setAttribute('media', rewrite(orig)); store.attrs.push({ el, orig }); patched += 1; }
        }
      }
      store.matchMedia = w.matchMedia;
      const original = w.matchMedia.bind(w);
      w.matchMedia = function (query) { return original(rewrite(query)); };
      store.hadRoot = true;
      store.prevRoot = document.documentElement.style.colorScheme || '';
      document.documentElement.style.colorScheme = MODE;
      return JSON.stringify({ status: 'OK', mode: MODE, patchedRules: patched, skippedSheets: skipped });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/** Longest `ui_js` result (characters) the renderer reports back. */
export const JS_RESULT_MAX = 8000

/**
 * Run agent-supplied code as the body of an async function on the page and
 * report its JSON-serialised return value (truncated), or the thrown error.
 */
export function jsScript(code: string, max: number = JS_RESULT_MAX): string {
  return `(async () => {
    try {
      const value = await (async () => {
${code}
      })();
      let json;
      try { json = JSON.stringify(value === undefined ? null : value); } catch (error) { json = JSON.stringify(String(value)); }
      if (json === undefined) json = 'null';
      const MAX = ${max};
      return JSON.stringify({ status: 'OK', json: json.slice(0, MAX), truncated: json.length > MAX });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}

/**
 * Record `fetch` and XMLHttpRequest outcomes (status, timing, errors) of the
 * current document into `window.__startapusNet`. Resource Timing has no status
 * codes, so this hook is the only way to see 404/500 and failed calls. It is
 * idempotent and keeps the last 200 entries; the page can observe the wrapper.
 */
export function netHookScript(): string {
  return `(() => {
    try {
      const w = window;
      if (w.__startapusNet) return JSON.stringify({ status: 'OK', installed: false });
      const hook = (w.__startapusNet = { log: [] });
      const push = (row) => { hook.log.push(row); if (hook.log.length > 200) hook.log.shift(); };
      const clip = (text) => String(text).slice(0, 300);
      if (typeof w.fetch === 'function') {
        const original = w.fetch;
        w.fetch = function (input, init) {
          const started = performance.now();
          const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
          const url = clip(typeof input === 'string' ? input : (input && input.url) || input);
          return original.apply(this, arguments).then(
            (response) => { push({ kind: 'fetch', method, url, status: response.status, ok: response.ok, ms: Math.round(performance.now() - started) }); return response; },
            (error) => { const aborted = !!(error && error.name === 'AbortError'); push({ kind: 'fetch', method, url, status: 0, ok: false, ms: Math.round(performance.now() - started), error: clip(error && error.message ? error.message : error), ...(aborted ? { aborted: true } : {}) }); throw error; },
          );
        };
      }
      if (typeof w.XMLHttpRequest === 'function') {
        const proto = w.XMLHttpRequest.prototype;
        const open = proto.open;
        const send = proto.send;
        proto.open = function (method, url) { this.__startapus = { method: String(method).toUpperCase(), url: clip(url) }; return open.apply(this, arguments); };
        proto.send = function () {
          const meta = this.__startapus || { method: 'GET', url: '' };
          const started = performance.now();
          let aborted = false;
          this.addEventListener('abort', () => { aborted = true; });
          this.addEventListener('loadend', () => {
            push({ kind: 'xhr', method: meta.method, url: meta.url, status: this.status, ok: this.status >= 200 && this.status < 400, ms: Math.round(performance.now() - started), ...(aborted ? { aborted: true } : (this.status === 0 ? { error: 'сеть' } : {})) });
          });
          return send.apply(this, arguments);
        };
      }
      return JSON.stringify({ status: 'OK', installed: true });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`
}
