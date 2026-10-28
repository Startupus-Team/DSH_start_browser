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
        // Real key events, so React handlers that submit on Enter fire.
        var target = el !== null ? el : (document.activeElement || document.body);
        target.focus();
        var key = value === '' ? 'Enter' : value;
        var code = key === 'Enter' ? 13 : (key === 'Tab' ? 9 : (key === 'Escape' ? 27 : 0));
        var down = new KeyboardEvent('keydown', { key: key, code: key, keyCode: code, which: code, bubbles: true, cancelable: true });
        var up = new KeyboardEvent('keyup', { key: key, code: key, keyCode: code, which: code, bubbles: true, cancelable: true });
        target.dispatchEvent(down);
        target.dispatchEvent(up);
        if (key === 'Enter') {
          var form = target.form || (target.closest && target.closest('form'));
          if (form !== null && form !== undefined) form.requestSubmit();
        }
        return JSON.stringify({ status: 'OK', op: op, key: key });
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
export function pageScanScript(limit: number): string {
  return `(() => {
    try {
      var MAX = ${limit};
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
      var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      var node = walk.currentNode;
      while (node && items.length < MAX) {
        var tag = node.tagName.toLowerCase();
        var role = node.getAttribute('role') || (tag === 'a' ? 'link' : tag === 'button' ? 'button' : tag === 'input' || tag === 'textarea' ? 'textbox' : tag === 'select' ? 'combobox' : '');
        var interactive = ['a','button','input','textarea','select','summary','details','label'].indexOf(tag) >= 0 || role !== '';
        var heading = /^h[1-6]$/.test(tag);
        if (interactive || heading) {
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
      return JSON.stringify({ status: 'OK', total: rows.length, slow, heavy, entries: rows.slice(-MAX) });
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
      const sheets = Array.from(document.styleSheets).concat(Array.from(document.adoptedStyleSheets || []));
      for (const sheet of sheets) { try { walk(sheet.cssRules); } catch (e) { skipped += 1; } }
      for (const el of Array.from(document.querySelectorAll('link[media], style[media]'))) {
        const orig = el.getAttribute('media');
        if (orig && /prefers-color-scheme/i.test(orig)) { el.setAttribute('media', rewrite(orig)); store.attrs.push({ el, orig }); patched += 1; }
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
