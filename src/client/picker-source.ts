/**
 * Source of the DOM element picker injected into a guest page.
 *
 * The DSH kernel wipes a guest's `preferences` before attach, so a preload
 * cannot be used. The panel instead injects this installer through
 * `webview.executeJavaScript`.
 *
 * The installer must return a *cloneable* value: returning a promise or
 * throwing crosses the IPC boundary with a non-cloneable Error object, which
 * surfaces as "An object could not be cloned". So the picker never returns the
 * payload directly — it parks it on `window.__startapusPick` and the panel
 * polls that plain string.
 *
 * The payload is the evidence the agent needs to reason about a defect
 * without seeing pixels: identity + accessibility + geometry + computed
 * styles + layout context + page environment.
 *
 * @module startapus-browser/client/picker-source
 */

/** Computed properties captured for every pick (kept small and decision-relevant). */
export const COMPUTED_PROPERTIES = [
  'display', 'position', 'visibility', 'opacity', 'z-index', 'overflow', 'box-sizing',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap', 'flex-direction', 'align-items', 'justify-content',
  'grid-template-columns', 'grid-template-rows',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'color', 'background-color', 'background-image',
  'border-radius', 'border-width', 'border-style', 'border-color', 'box-shadow',
  'transform', 'transition-duration', 'cursor', 'text-align', 'white-space', 'word-break',
] as const

export const PICKER_SCRIPT = `
(() => {
  try {
    if (window.__startapusPickActive) return 'active';
    window.__startapusPickActive = true;
    window.__startapusPick = null;

    var PROPS = ${JSON.stringify(COMPUTED_PROPERTIES)};

    var doc = document;
    var BASE = 'position:fixed;z-index:2147483647;pointer-events:none;';
    var box = doc.createElement('div');
    box.setAttribute('data-startapus-picker', 'box');
    box.style.cssText = BASE + 'border:2px solid #4f8cff;background:rgba(79,140,255,.14);border-radius:2px;display:none;';
    var tip = doc.createElement('div');
    tip.setAttribute('data-startapus-picker', 'tip');
    tip.style.cssText = BASE + 'left:8px;bottom:8px;max-width:70vw;padding:6px 8px;border-radius:6px;' +
      'background:rgba(17,17,17,.92);color:#e8e8e8;font:11px/1.35 -apple-system,system-ui,sans-serif;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:none;';
    doc.documentElement.appendChild(box);
    doc.documentElement.appendChild(tip);

    var done = false;

    function idOf(el) {
      if (el.id) return '#' + el.id;
      var testid = el.getAttribute('data-testid') || el.getAttribute('data-test') ||
        el.getAttribute('data-qa') || el.getAttribute('data-cy');
      if (testid) return '[data-testid="' + testid + '"]';
      return '';
    }

    function cssPath(el) {
      var parts = [];
      var node = el;
      while (node && node.nodeType === 1 && parts.length < 6) {
        var part = node.tagName.toLowerCase();
        var ident = idOf(node);
        if (ident.charAt(0) === '#' || ident.charAt(0) === '[') {
          parts.unshift(part + ident);
          break;
        }
        var cls = (node.className || '').toString().trim().split(/\\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) part += '.' + cls.join('.');
        var parent = node.parentElement;
        if (parent) {
          var sameType = Array.prototype.filter.call(parent.children, function (child) {
            return child.tagName === node.tagName;
          });
          var typeIndex = sameType.indexOf(node);
          if (typeIndex >= 0) part += ':nth-of-type(' + (typeIndex + 1) + ')';
        }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    }

    function ancestorsOf(el) {
      var rows = [];
      var node = el.parentElement;
      while (node && node.nodeType === 1 && rows.length < 5) {
        rows.push({
          tag: node.tagName.toLowerCase(),
          id: node.id || '',
          classes: (node.className || '').toString().trim().slice(0, 160),
          testid: node.getAttribute('data-testid') || ''
        });
        node = node.parentElement;
      }
      return rows;
    }

    function accessibleName(el) {
      var aria = el.getAttribute('aria-label');
      if (aria) return aria;
      var labelledby = el.getAttribute('aria-labelledby');
      if (labelledby) {
        var parts = [];
        labelledby.split(/\\s+/).forEach(function (id) {
          var ref = doc.getElementById(id);
          if (ref) parts.push((ref.textContent || '').trim());
        });
        if (parts.length) return parts.join(' ');
      }
      var alt = el.getAttribute('alt');
      if (alt) return alt;
      var title = el.getAttribute('title');
      if (title) return title;
      var value = el.getAttribute('value');
      if (value) return String(value);
      return (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 160);
    }

    function computedOf(el) {
      var out = {};
      var cs = window.getComputedStyle(el);
      for (var i = 0; i < PROPS.length; i += 1) {
        var name = PROPS[i];
        var value = cs.getPropertyValue(name);
        if (value !== '' && value !== 'normal' && value !== 'none' && value !== 'auto' &&
            value !== '0px' && value !== 'rgba(0, 0, 0, 0)') {
          out[name] = value;
        }
      }
      return out;
    }

    function pseudoOf(el, which) {
      try {
        var cs = window.getComputedStyle(el, which);
        var content = cs.getPropertyValue('content');
        if (!content || content === 'none' || content === 'normal') return null;
        return {
          content: content.slice(0, 120),
          display: cs.getPropertyValue('display'),
          color: cs.getPropertyValue('color'),
          fontSize: cs.getPropertyValue('font-size')
        };
      } catch (error) {
        return null;
      }
    }

    function serializeFragment(root, limit) {
      var out = [];
      var queue = [{ node: root, depth: 0 }];
      while (queue.length > 0 && out.length < limit) {
        var item = queue.shift();
        var node = item.node;
        if (!node || node.nodeType !== 1) continue;
        var text = (node.childNodes.length === 1 && node.firstChild && node.firstChild.nodeType === 3)
          ? String(node.firstChild.nodeValue || '').trim().replace(/\\s+/g, ' ').slice(0, 80)
          : '';
        out.push({
          depth: item.depth,
          tag: node.tagName.toLowerCase(),
          id: node.id || '',
          classes: (node.className || '').toString().trim().slice(0, 120),
          text: text
        });
        if (item.depth >= 4) continue;
        var children = node.children;
        for (var index = 0; index < children.length && queue.length < limit * 2; index += 1) {
          queue.push({ node: children[index], depth: item.depth + 1 });
        }
      }
      return out;
    }

    function payloadOf(el) {
      var rect = el.getBoundingClientRect();
      var cs = window.getComputedStyle(el);
      var text = (el.innerText || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 300);
      var scrollable = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      return {
        selector: cssPath(el),
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        classes: (el.className || '').toString().trim().slice(0, 300),
        testid: el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('data-qa') || '',
        role: el.getAttribute('role') || '',
        a11y: {
          role: el.getAttribute('role') || el.tagName.toLowerCase(),
          name: accessibleName(el),
          ariaHidden: el.getAttribute('aria-hidden') || '',
          ariaDisabled: el.getAttribute('aria-disabled') || '',
          ariaExpanded: el.getAttribute('aria-expanded') || '',
          tabIndex: el.getAttribute('tabindex') || ''
        },
        text: text,
        href: el.getAttribute('href') || '',
        src: el.getAttribute('src') || '',
        rect: {
          x: Math.round(rect.left), y: Math.round(rect.top),
          width: Math.round(rect.width), height: Math.round(rect.height),
          docX: Math.round(rect.left + window.scrollX),
          docY: Math.round(rect.top + window.scrollY)
        },
        box: {
          clientWidth: el.clientWidth, clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight,
          scrollable: scrollable,
          overflowX: el.scrollWidth > el.clientWidth + 1,
          overflowY: el.scrollHeight > el.clientHeight + 1
        },
        state: {
          disabled: el.disabled === true,
          readOnly: el.readOnly === true,
          checked: typeof el.checked === 'boolean' ? el.checked : null,
          hidden: cs.display === 'none' || cs.visibility === 'hidden',
          focused: doc.activeElement === el,
          inShadowRoot: el.getRootNode() !== doc
        },
        computed: computedOf(el),
        pseudo: { before: pseudoOf(el, '::before'), after: pseudoOf(el, '::after') },
        ancestors: ancestorsOf(el),
        fragment: serializeFragment(el, 50),
        outerHTML: el.outerHTML ? el.outerHTML.slice(0, 2000) : '',
        env: {
          url: String(location.href),
          title: String(document.title || ''),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          dpr: window.devicePixelRatio || 1,
          zoom: window.visualViewport ? window.visualViewport.scale : 1,
          scrollX: Math.round(window.scrollX),
          scrollY: Math.round(window.scrollY),
          theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
          reducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          colorScheme: window.matchMedia && window.matchMedia('(forced-colors: active)').matches ? 'forced' : ''
        }
      };
    }

    function show(el) {
      var rect = el.getBoundingClientRect();
      box.style.display = 'block';
      box.style.left = rect.left + 'px';
      box.style.top = rect.top + 'px';
      box.style.width = rect.width + 'px';
      box.style.height = rect.height + 'px';
      tip.style.display = 'block';
      tip.textContent = cssPath(el);
    }

    function cleanup() {
      doc.removeEventListener('mousemove', onMove, true);
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('keydown', onKey, true);
      box.remove();
      tip.remove();
      window.__startapusPickActive = false;
    }

    function finish(value) {
      if (done) return;
      done = true;
      window.__startapusPick = value;
      cleanup();
    }

    function onMove(event) {
      var el = doc.elementFromPoint(event.clientX, event.clientY);
      if (el && el.getAttribute && el.getAttribute('data-startapus-picker')) {
        box.style.display = 'none';
        return;
      }
      if (el && el !== doc.documentElement && el !== doc.body) show(el);
    }

    function onClick(event) {
      if (event.isTrusted !== true) return;
      event.preventDefault();
      event.stopPropagation();
      var el = doc.elementFromPoint(event.clientX, event.clientY);
      finish(el ? JSON.stringify(payloadOf(el)) : '');
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finish('');
      }
    }

    doc.addEventListener('mousemove', onMove, true);
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('keydown', onKey, true);
    return 'installed';
  } catch (error) {
    window.__startapusPick = 'ERROR:' + String(error && error.message ? error.message : error);
    return 'failed';
  }
})()
`

/**
 * Poll expression: returns the parked payload, `''` for a cancelled pick, or
 * `null` while the picker is still waiting for a click.
 */
export const PICKER_POLL = 'window.__startapusPick === undefined ? null : window.__startapusPick'

/**
 * Area picker: drag a rectangle over the page, receive its bounds plus the
 * elements it covers. Parks the same way as the element picker.
 */
export const AREA_SCRIPT = `
(() => {
  try {
    if (window.__startapusAreaActive) return 'active';
    window.__startapusAreaActive = true;
    window.__startapusPick = null;
    var doc = document;
    var mask = doc.createElement('div');
    mask.setAttribute('data-startapus-area', 'mask');
    mask.style.cssText = 'position:fixed;inset:0;z-index:2147483646;cursor:crosshair;background:rgba(79,140,255,.06);';
    var box = doc.createElement('div');
    box.setAttribute('data-startapus-area', 'box');
    box.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;border:2px dashed #4f8cff;background:rgba(79,140,255,.14);display:none;';
    doc.documentElement.appendChild(mask);
    doc.documentElement.appendChild(box);
    var startX = 0, startY = 0, drawing = false, done = false;

    function bounds(x, y) {
      var left = Math.min(startX, x);
      var top = Math.min(startY, y);
      return { x: left, y: top, width: Math.abs(x - startX), height: Math.abs(y - startY) };
    }

    function finish(rect) {
      if (done) return;
      done = true;
      var covered = [];
      if (rect.width > 2 && rect.height > 2) {
        var nodes = doc.querySelectorAll('body *');
        for (var index = 0; index < nodes.length && covered.length < 40; index += 1) {
          var node = nodes[index];
          if (node.getAttribute('data-startapus-area')) continue;
          var r = node.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.left >= rect.x && r.top >= rect.y && r.right <= rect.x + rect.width && r.bottom <= rect.y + rect.height) {
            covered.push({ tag: node.tagName.toLowerCase(), id: node.id || '', classes: (node.className || '').toString().trim().slice(0, 100) });
          }
        }
      }
      mask.remove();
      box.remove();
      window.__startapusAreaActive = false;
      window.__startapusPick = JSON.stringify({
        kind: 'area',
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        covered: covered,
        env: {
          url: String(location.href),
          title: String(document.title || ''),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          dpr: window.devicePixelRatio || 1
        }
      });
    }

    function onDown(event) {
      if (event.isTrusted !== true) return;
      drawing = true;
      startX = event.clientX;
      startY = event.clientY;
      event.preventDefault();
    }

    function onMove(event) {
      if (!drawing) return;
      var rect = bounds(event.clientX, event.clientY);
      box.style.display = 'block';
      box.style.left = rect.x + 'px';
      box.style.top = rect.y + 'px';
      box.style.width = rect.width + 'px';
      box.style.height = rect.height + 'px';
    }

    function onUp(event) {
      if (!drawing) return;
      drawing = false;
      finish(bounds(event.clientX, event.clientY));
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        finish({ x: 0, y: 0, width: 0, height: 0 });
      }
    }

    doc.addEventListener('mousedown', onDown, true);
    doc.addEventListener('mousemove', onMove, true);
    doc.addEventListener('mouseup', onUp, true);
    doc.addEventListener('keydown', onKey, true);
    return 'installed';
  } catch (error) {
    window.__startapusPick = 'ERROR:' + String(error && error.message ? error.message : error);
    return 'failed';
  }
})()
`
