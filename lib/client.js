window.__ModuleLoader__.load({
  id: "startapus-browser",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/panel.tsx
var import_react4 = require("react");

// node_modules/react-icons/lib/iconBase.mjs
var import_react2 = __toESM(require("react"), 1);

// node_modules/react-icons/lib/iconContext.mjs
var import_react = __toESM(require("react"), 1);
var DefaultContext = {
  color: void 0,
  size: void 0,
  className: void 0,
  style: void 0,
  attr: void 0
};
var IconContext = import_react.default.createContext && /* @__PURE__ */ import_react.default.createContext(DefaultContext);

// node_modules/react-icons/lib/iconBase.mjs
var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /* @__PURE__ */ import_react2.default.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return (props) => /* @__PURE__ */ import_react2.default.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = (conf) => {
    var {
      attr,
      size,
      title
    } = props, svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /* @__PURE__ */ import_react2.default.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /* @__PURE__ */ import_react2.default.createElement("title", null, title), props.children);
  };
  return IconContext !== void 0 ? /* @__PURE__ */ import_react2.default.createElement(IconContext.Consumer, null, (conf) => elem(conf)) : elem(DefaultContext);
}

// node_modules/react-icons/fi/index.mjs
function FiChevronLeft(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round" }, "child": [{ "tag": "polyline", "attr": { "points": "15 18 9 12 15 6" }, "child": [] }] })(props);
}
function FiChevronRight(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round" }, "child": [{ "tag": "polyline", "attr": { "points": "9 18 15 12 9 6" }, "child": [] }] })(props);
}
function FiCopy(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round" }, "child": [{ "tag": "rect", "attr": { "x": "9", "y": "9", "width": "13", "height": "13", "rx": "2", "ry": "2" }, "child": [] }, { "tag": "path", "attr": { "d": "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }, "child": [] }] })(props);
}
function FiCrosshair(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round" }, "child": [{ "tag": "circle", "attr": { "cx": "12", "cy": "12", "r": "10" }, "child": [] }, { "tag": "line", "attr": { "x1": "22", "y1": "12", "x2": "18", "y2": "12" }, "child": [] }, { "tag": "line", "attr": { "x1": "6", "y1": "12", "x2": "2", "y2": "12" }, "child": [] }, { "tag": "line", "attr": { "x1": "12", "y1": "6", "x2": "12", "y2": "2" }, "child": [] }, { "tag": "line", "attr": { "x1": "12", "y1": "22", "x2": "12", "y2": "18" }, "child": [] }] })(props);
}
function FiExternalLink(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round" }, "child": [{ "tag": "path", "attr": { "d": "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }, "child": [] }, { "tag": "polyline", "attr": { "points": "15 3 21 3 21 9" }, "child": [] }, { "tag": "line", "attr": { "x1": "10", "y1": "14", "x2": "21", "y2": "3" }, "child": [] }] })(props);
}
function FiRotateCw(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round" }, "child": [{ "tag": "polyline", "attr": { "points": "23 4 23 10 17 10" }, "child": [] }, { "tag": "path", "attr": { "d": "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" }, "child": [] }] })(props);
}

// src/client/verify-scripts.ts
function measureScript(selector, method, property, expectTag) {
  const sel = JSON.stringify(selector);
  const prop = JSON.stringify(property);
  const m = JSON.stringify(method);
  const tag = JSON.stringify(expectTag);
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
          if (ncs.backgroundImage && ncs.backgroundImage !== 'none') { unmeasurable = '\u0444\u043E\u043D \u0441 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C \u0438\u043B\u0438 \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442\u043E\u043C'; break; }
          var bg = parseColor(ncs.backgroundColor);
          if (bg === null && ncs.backgroundColor && ncs.backgroundColor !== 'transparent') { unmeasurable = '\u0446\u0432\u0435\u0442 \u0444\u043E\u043D\u0430 \u0432 \u043D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u043E\u043C \u0444\u043E\u0440\u043C\u0430\u0442\u0435: ' + ncs.backgroundColor; break; }
          if (bg !== null && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
        }
        var fgRaw = parseColor(cs.color);
        if (unmeasurable === '' && fgRaw === null) unmeasurable = '\u0446\u0432\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u0430 \u0432 \u043D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u043E\u043C \u0444\u043E\u0440\u043C\u0430\u0442\u0435: ' + cs.color;
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
  })()`;
}
function coverageScript(covered) {
  const items = JSON.stringify(covered.map((item) => ({
    tag: item.tag ?? "",
    id: item.id ?? "",
    cls: String(item.classes ?? "").split(/\s+/).filter(Boolean)[0] ?? ""
  })));
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
  })()`;
}
function evidenceScript(selector) {
  const sel = JSON.stringify(selector);
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
          // Utility classes contain ':' and '[' \u2014 those break querySelector unless
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
  })()`;
}
function actScript(op, selector, value) {
  const operation = JSON.stringify(op);
  const sel = JSON.stringify(selector);
  const text = JSON.stringify(value);
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
            var count = Math.max(1, focusables.length);
            var next = at < 0 ? (flags.shiftKey ? focusables[count - 1] : focusables[0]) : focusables[(at + (flags.shiftKey ? -1 : 1) + count) % count];
            if (next) next.focus();
          }
        }
        return JSON.stringify({ status: 'OK', op: op, key: key, modifiers: mods });
      }
      if (op === 'click_at') {
        var pointParts = value.split(',');
        var px = Number.parseFloat(pointParts[0]);
        var py = Number.parseFloat(pointParts[1]);
        if (!Number.isFinite(px) || !Number.isFinite(py)) return JSON.stringify({ status: 'ERROR', message: 'value \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \xABx,y\xBB \u0432 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0430\u0445 \u043E\u043A\u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430' });
        var hit = document.elementFromPoint(px, py);
        if (hit === null) return JSON.stringify({ status: 'ERROR', message: '\u0432 \u0442\u043E\u0447\u043A\u0435 ' + px + ',' + py + ' \u043D\u0435\u0442 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430 (\u0432\u043D\u0435 \u043E\u043A\u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430?)' });
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
          if (destination === null) return JSON.stringify({ status: 'ERROR', message: '\u0446\u0435\u043B\u044C \u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u043D\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430: ' + value });
          var to = destination.getBoundingClientRect();
          ex = Math.round(to.left + to.width / 2);
          ey = Math.round(to.top + to.height / 2);
        } else {
          return JSON.stringify({ status: 'ERROR', message: 'value: \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u0446\u0435\u043B\u0438 \u0438\u043B\u0438 \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \xABdx,dy\xBB' });
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
        return JSON.stringify({ status: 'OK', op: op, from: [sx, sy], to: [ex, ey], note: '\u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F: \u043D\u0430\u0442\u0438\u0432\u043D\u044B\u0439 drag-and-drop \u041E\u0421 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F' });
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
        return JSON.stringify({ status: 'OK', op: op, note: '\u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043C\u044B\u0448\u0438: CSS :hover \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F' });
      }
      if (op === 'select') {
        if (el === null) return JSON.stringify({ status: 'MISSING' });
        if (!el.options) return JSON.stringify({ status: 'ERROR', message: '\u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u043D\u0435 <select>' });
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
          return JSON.stringify({ status: 'ERROR', message: '\u043D\u0435\u0442 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u0430 \xAB' + value + '\xBB; \u0435\u0441\u0442\u044C: ' + offered });
        }
        if (el.options[chosen].disabled) return JSON.stringify({ status: 'ERROR', message: '\u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D' });
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
        if (!native && aria === null) return JSON.stringify({ status: 'ERROR', message: '\u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u043D\u0435 \u0447\u0435\u043A\u0431\u043E\u043A\u0441/\u0440\u0430\u0434\u0438\u043E/\u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C' });
        if (native && el.disabled) return JSON.stringify({ status: 'ERROR', message: '\u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D' });
        var now = native ? el.checked : aria === 'true';
        if (now !== want) {
          if (native && el.type === 'radio' && !want) return JSON.stringify({ status: 'ERROR', message: '\u0440\u0430\u0434\u0438\u043E \u043D\u0435\u043B\u044C\u0437\u044F \u0441\u043D\u044F\u0442\u044C \u2014 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442' });
          el.scrollIntoView({ block: 'center' });
          el.click();
        }
        var after = native ? el.checked : el.getAttribute('aria-checked') === 'true';
        if (after !== want) return JSON.stringify({ status: 'ERROR', message: '\u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043D\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C (\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043E\u0442\u043C\u0435\u043D\u0438\u043B\u0430 \u043A\u043B\u0438\u043A)' });
        return JSON.stringify({ status: 'OK', op: op, checked: after });
      }
      if (op === 'scroll') {
        var y = Number.parseInt(value, 10);
        if (el !== null) el.scrollIntoView({ block: 'center' });
        else window.scrollTo(0, Number.isFinite(y) ? y : 0);
        return JSON.stringify({ status: 'OK', op: op, scrollY: Math.round(window.scrollY) });
      }
      return JSON.stringify({ status: 'ERROR', message: '\u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F: ' + op });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`;
}
function pageScanScript(limit, root = "", filter = "all") {
  return `(() => {
    try {
      var MAX = ${limit};
      var ROOT = ${JSON.stringify(root)};
      var ONLY_INTERACTIVE = ${filter === "interactive"};
      var scope = ROOT === '' ? document.body : document.querySelector(ROOT);
      if (!scope) return JSON.stringify({ status: 'ERROR', message: '\u043A\u043E\u0440\u0435\u043D\u044C \u043E\u0431\u0437\u043E\u0440\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D: ' + ROOT });
      var items = [];
      var seen = 0;
      function path(node) {
        var parts = [];
        while (node && node.nodeType === 1 && parts.length < 5) {
          var part = node.tagName.toLowerCase();
          if (node.id) { parts.unshift(part + '#' + node.id); break; }
          // Utility classes contain ':' and '[' \u2014 those break querySelector unless
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
  })()`;
}
function pageTextScript(limit) {
  return `(() => {
    try {
      const MAX = ${limit};
      const pick = document.querySelector('article, main, [role="main"]') || document.body;
      const text = (pick && pick.innerText ? pick.innerText : '').replace(/\\n{3,}/g, '\\n\\n').trim();
      return JSON.stringify({ status: 'OK', url: String(location.href), title: String(document.title), text: text.slice(0, MAX), truncated: text.length > MAX });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`;
}
function networkScript(limit) {
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
  })()`;
}
function inspectScript(selector, styles) {
  const requested = styles.length > 0 ? styles : ["color", "background-color", "font-size", "font-family", "font-weight", "line-height", "padding", "margin", "border", "border-radius", "display", "position", "width", "height", "gap", "flex-direction", "text-align", "opacity"];
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
  })()`;
}
function waitScript(spec) {
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
  })()`;
}
function colorSchemeScript(mode) {
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
  })()`;
}
var JS_RESULT_MAX = 8e3;
function jsScript(code, max = JS_RESULT_MAX) {
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
  })()`;
}
function netHookScript() {
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
            push({ kind: 'xhr', method: meta.method, url: meta.url, status: this.status, ok: this.status >= 200 && this.status < 400, ms: Math.round(performance.now() - started), ...(aborted ? { aborted: true } : (this.status === 0 ? { error: '\u0441\u0435\u0442\u044C' } : {})) });
          });
          return send.apply(this, arguments);
        };
      }
      return JSON.stringify({ status: 'OK', installed: true });
    } catch (error) {
      return JSON.stringify({ status: 'ERROR', message: String(error && error.message ? error.message : error) });
    }
  })()`;
}

// src/client/rules.ts
var PRIVATE_HOST = /^(localhost|[^.]+\.localhost|0\.0\.0\.0|\[::1?\]|127(\.\d{1,3}){3}|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|169\.254(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2})$/i;
var NAMED_SCHEME = /^(javascript|data|file|about|mailto|blob|view-source|chrome|chrome-extension|ftp|ws|wss|tel|sms):/i;
function normalizeAddress(raw, options = {}) {
  const value = (raw ?? "").trim();
  if (value === "") return { ok: false, reason: "\u043F\u0443\u0441\u0442\u043E\u0439 \u0430\u0434\u0440\u0435\u0441" };
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || NAMED_SCHEME.test(value);
  const bareHost = value.split(/[/?#]/)[0].replace(/^.*@/, "").replace(/:\d+$/, "");
  const defaultScheme = PRIVATE_HOST.test(bareHost) ? "http" : "https";
  const withScheme = hasScheme ? value : `${defaultScheme}://${value}`;
  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: `\u0430\u0434\u0440\u0435\u0441 \u043D\u0435 \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u043D: ${value}` };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "\u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E http(s)" };
  }
  if (options.allowPrivate !== true && PRIVATE_HOST.test(parsed.hostname)) {
    return { ok: false, reason: "\u043F\u0440\u0438\u0432\u0430\u0442\u043D\u044B\u0435 \u0430\u0434\u0440\u0435\u0441\u0430 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u044B" };
  }
  return { ok: true, url: parsed.toString() };
}
function pickSessionToEvict(ages, cap) {
  if (ages.length < cap) return null;
  const oldest = [...ages].sort((a, b) => a.lastActiveAt - b.lastActiveAt)[0];
  return oldest === void 0 ? null : oldest.tabId;
}
function verifyNeedsReload(args) {
  return args.reload === true;
}
function verifySettleMs(reload) {
  return reload ? 1500 : 250;
}
function cropRect(rect, ratio, image) {
  const scale = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  const sx = Math.max(0, Math.min(image.width - 1, Math.round(rect.x * scale)));
  const sy = Math.max(0, Math.min(image.height - 1, Math.round(rect.y * scale)));
  const sw = Math.max(1, Math.min(image.width - sx, Math.round(rect.width * scale)));
  const sh = Math.max(1, Math.min(image.height - sy, Math.round(rect.height * scale)));
  return { sx, sy, sw, sh };
}
var WAIT_STATES = ["visible", "hidden", "present", "absent"];
var WAIT_MAX_MS = 3e4;
function normalizeWait(args) {
  const selector = typeof args.selector === "string" ? args.selector.trim() : "";
  const text = typeof args.text === "string" ? args.text.trim() : "";
  const networkIdle = args.networkIdle === true;
  if (selector === "" && text === "" && !networkIdle) {
    return { ok: false, reason: "\u043D\u0443\u0436\u043D\u043E \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u0443\u0441\u043B\u043E\u0432\u0438\u0435: selector, text \u0438\u043B\u0438 networkIdle" };
  }
  const rawState = typeof args.state === "string" ? args.state : "visible";
  if (!WAIT_STATES.includes(rawState)) {
    return { ok: false, reason: `state \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C ${WAIT_STATES.join(" | ")}` };
  }
  if (selector === "" && typeof args.state === "string") {
    return { ok: false, reason: "state \u0438\u043C\u0435\u0435\u0442 \u0441\u043C\u044B\u0441\u043B \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 selector" };
  }
  const timeout = typeof args.timeoutMs === "number" && Number.isFinite(args.timeoutMs) ? args.timeoutMs : 1e4;
  const idle = typeof args.idleMs === "number" && Number.isFinite(args.idleMs) ? args.idleMs : 500;
  return {
    ok: true,
    spec: {
      selector,
      state: rawState,
      text,
      networkIdle,
      idleMs: Math.min(5e3, Math.max(100, Math.round(idle))),
      timeoutMs: Math.min(WAIT_MAX_MS, Math.max(500, Math.round(timeout)))
    }
  };
}
function diffPixels(before, after, width, height, threshold = 24) {
  const total = Math.max(0, width * height);
  let changed = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let index = 0; index < total; index += 1) {
    const offset = index * 4;
    if (Math.abs(before[offset] - after[offset]) > threshold || Math.abs(before[offset + 1] - after[offset + 1]) > threshold || Math.abs(before[offset + 2] - after[offset + 2]) > threshold || Math.abs(before[offset + 3] - after[offset + 3]) > threshold) {
      changed += 1;
      const x = index % width;
      const y = Math.floor(index / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return {
    changedPixels: changed,
    totalPixels: total,
    changedRatio: total === 0 ? 0 : Math.round(changed / total * 1e4) / 1e4,
    bbox: changed === 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  };
}
function captureKey(tabId, selector) {
  return `${tabId === "" ? "*" : tabId}|${selector}`;
}
function rememberedScheme(mode) {
  return mode === "dark" || mode === "light" ? mode : null;
}

// src/client/tabs.ts
var context = null;
function setTabsApi(source) {
  context = source;
}
function controller() {
  const source = context;
  if (source === null || source === void 0) return void 0;
  if (typeof source.get === "function") {
    try {
      const service = source.get("sidebarRight");
      if (service !== void 0 && service !== null) return service;
    } catch {
    }
  }
  try {
    return source.sidebarRight;
  } catch {
    return void 0;
  }
}
function openStartapusTab(kind, params = {}) {
  try {
    const api = controller();
    if (api === void 0) return { opened: false, error: "sidebarRight \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D" };
    if (typeof api.openTab !== "function") return { opened: false, error: "openTab \u043D\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u044F" };
    api.openTab(kind, { params });
    return { opened: true, error: "" };
  } catch (error) {
    return { opened: false, error: String(error instanceof Error ? error.message : error) };
  }
}
var closingTabs = /* @__PURE__ */ new Set();
function markTabClosing(tabKey) {
  if (typeof tabKey === "string" && tabKey !== "") closingTabs.add(tabKey);
}
function registerTabsCloseHandler(kind, handler) {
  try {
    const source = context;
    if (source === null || source === void 0) return false;
    const service = typeof source.get === "function" ? source.get("sidebarRight") : source.sidebarRight;
    if (service === void 0 || typeof service.registerCloseHandler !== "function") return false;
    service.registerCloseHandler(kind, (_sessionId, tab) => {
      try {
        handler(String(tab?.id ?? ""));
      } catch {
      }
    });
    return true;
  } catch {
    return false;
  }
}
function focusStartapusTab(tabId) {
  try {
    const source = context;
    if (source === null || source === void 0) return false;
    const service = typeof source.get === "function" ? source.get("sidebarRight") : source.sidebarRight;
    if (service === void 0 || service === null || typeof service.focus !== "function") return false;
    service.focus(tabId);
    return true;
  } catch {
    return false;
  }
}

// src/client/tab-titles.ts
var import_react3 = require("react");
var titles = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Set();
function setTabTitle(key, title) {
  if (typeof key !== "string" || key === "") return;
  const next = (title ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  if ((titles.get(key) ?? "") === next) return;
  titles.set(key, next);
  for (const listener of listeners) listener();
}
function getTabTitle(key) {
  if (typeof key !== "string" || key === "") return "";
  return titles.get(key) ?? "";
}
function subscribeTitles(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function useTabTitle(key) {
  const [value, setValue] = (0, import_react3.useState)(() => getTabTitle(key ?? ""));
  (0, import_react3.useEffect)(() => {
    setValue(getTabTitle(key ?? ""));
    return subscribeTitles(() => setValue(getTabTitle(key ?? "")));
  }, [key]);
  return value;
}

// src/client/transport.ts
var BASES = ["", "dsh-app://app"];
var INSTANCE_ID = `inst-${Math.random().toString(36).slice(2, 10)}`;
var INSTANCE_STARTED = Date.now();
var reportMeta = {};
function setReportMeta(meta) {
  reportMeta = { ...reportMeta, ...meta };
}
var lastHostRev = "";
var currentTab = "startapus-browser";
function authHeaders() {
  return { "x-startapus-client": "1" };
}
async function probe() {
  for (const base2 of BASES) {
    try {
      const response = await fetch(`${base2}/startapus-browser/health`, { headers: authHeaders() });
      if (response.ok) return base2;
    } catch {
    }
  }
  return null;
}
async function poll(base2) {
  try {
    const response = await fetch(`${base2}/startapus-browser/client/poll`, {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ tabKey: currentTab, wait: true, instanceId: INSTANCE_ID, startedAt: INSTANCE_STARTED })
    });
    if (!response.ok) return null;
    if (response.status === 204) {
      try {
        const empty = await response.json();
        if (typeof empty.hostRev === "string") lastHostRev = empty.hostRev;
      } catch {
      }
      return null;
    }
    const body = await response.json();
    if (typeof body.hostRev === "string") lastHostRev = body.hostRev;
    return body.command ?? null;
  } catch {
    return null;
  }
}
async function note(name, data = {}) {
  const base2 = await probe();
  if (base2 === null) return;
  try {
    await fetch(`${base2}/startapus-browser/client/event`, {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ note: { name, data, at: Date.now() } })
    });
  } catch {
  }
}
async function report(base2, payload) {
  try {
    await fetch(`${base2}/startapus-browser/client/event`, {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ ...reportMeta, ...payload, tabKey: currentTab, instanceId: INSTANCE_ID, startedAt: INSTANCE_STARTED })
    });
  } catch {
  }
}

// src/client/engine.ts
var CLIENT_REV = true ? "575489472f4d" : "dev";
var WORKSPACE_KEY = "startapus-browser";
var MAX_SESSIONS = 6;
var SESSION_IDLE_MS = 15 * 60 * 1e3;
var START_URL = "https://startapus.com";
var sessions = /* @__PURE__ */ new Map();
var pending = /* @__PURE__ */ new Map();
var consoleRing = [];
var counters = { acquires: 0, releases: 0, attachFailures: 0, recoveries: 0, panics: 0, navigations: 0, loadErrors: 0, crashes: 0 };
var lastLoadError = null;
var evidence = null;
var crop = null;
var area = null;
var status = "\u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 guest\u2026";
var stage = "ready";
var activeTabId = null;
var loopStarted = false;
var stopEngine = () => void 0;
var ticking = false;
var misses = 0;
var base = null;
var controlHolder = null;
var agentActiveUntil = 0;
var AGENT_ACTIVE_MS = 1e4;
var closeRequested = () => false;
var tabClosers = /* @__PURE__ */ new Map();
function setTabCloser(tabKey, closer) {
  tabClosers.set(tabKey, closer);
  return () => {
    if (tabClosers.get(tabKey) === closer) tabClosers.delete(tabKey);
  };
}
var pickRequested = () => void 0;
var openTabRequested = null;
var focusTabRequested = null;
var guideCardFallback = null;
var activateTabFallback = null;
var shortcutState = null;
var lastNavAttempt = null;
var listeners2 = /* @__PURE__ */ new Set();
var mountedPaneKeys = /* @__PURE__ */ new Set();
var recoveryLedger = /* @__PURE__ */ new Map();
var deferredCreate = /* @__PURE__ */ new Map();
function hostVisible(host) {
  if (host === null || !host.isConnected) return false;
  if (typeof host.getBoundingClientRect !== "function") return true;
  let node = host;
  for (let depth = 0; node !== null && depth < 12; depth += 1) {
    if (typeof node.getBoundingClientRect !== "function") return true;
    const style = typeof window.getComputedStyle === "function" ? window.getComputedStyle(node) : null;
    if (style !== null && (style.display === "none" || style.visibility === "hidden")) return false;
    const transparent = style !== null && style.display === "contents";
    const rect = node.getBoundingClientRect();
    if (rect === void 0) return true;
    if (!transparent && (rect.width <= 1 || rect.height <= 1)) return false;
    node = node.parentElement ?? null;
  }
  return true;
}
var recovering = /* @__PURE__ */ new Set();
var panelMounts = 0;
function browserBridge() {
  const desktop = window.dshDesktop;
  return desktop?.browser;
}
function notePanelMounted(tabKey) {
  if (!mountedPaneKeys.has(tabKey)) panelMounts += 1;
  mountedPaneKeys.add(tabKey);
  notify();
}
function notePanelUnmounted(tabKey) {
  mountedPaneKeys.delete(tabKey);
  notify();
}
function engineState() {
  return {
    stage,
    control: controlHolder,
    agentActive: Date.now() < agentActiveUntil,
    status,
    activeTab: activeTabId,
    tabs: sessions.size,
    url: activeTabId === null ? "" : sessions.get(activeTabId)?.url ?? "",
    hasGuest: activeGuest() !== null,
    counters: { ...counters },
    panes: [...paneState.entries()].map(([tabId, state]) => ({ tabId, url: state.url, visible: state.visible }))
  };
}
function subscribeEngine(listener) {
  listeners2.add(listener);
  return () => listeners2.delete(listener);
}
function notify() {
  try {
    const attached = [...sessions.values()].some((session) => session.ready && session.guest !== null && session.container.isConnected);
    const visible = [...paneState.values()].some((state) => state.visible);
    setReportMeta({ attached, visible, instanceId: INSTANCE_ID, panels: mountedPaneKeys.size });
  } catch {
  }
  for (const listener of listeners2) {
    try {
      listener();
    } catch {
    }
  }
}
function noteShortcutState(state) {
  shortcutState = state;
  notify();
}
function shortcutHint() {
  return shortcutState?.ok === true ? "" : "\u2318T";
}
function setStatus(next) {
  status = next;
  notify();
}
function openInSession(tabId, rawUrl, fromPerson = false) {
  const normalized = normalizeAddress(rawUrl, { allowPrivate: fromPerson });
  if (!normalized.ok) {
    lastNavAttempt = { url: rawUrl, ok: false, reason: normalized.reason, hasGuest: false, hasLoadURL: false, at: Date.now() };
    notify();
    return { ok: false, reason: normalized.reason, url: rawUrl };
  }
  const session = sessions.get(tabId);
  void note("address:nav", { tabId, host: hostOf(normalized.url), hasSession: session !== void 0, ready: session?.ready === true, hasGuest: session?.guest != null });
  const guest = session?.guest ?? null;
  if (session !== void 0 && !session.ready) {
    session.pendingUrl = normalized.url;
    lastNavAttempt = { url: normalized.url, ok: true, reason: "\u043E\u0442\u043B\u043E\u0436\u0435\u043D\u043E \u0434\u043E dom-ready", hasGuest: true, hasLoadURL: true, at: Date.now() };
    setStatus(`\u043E\u0442\u043A\u0440\u043E\u044E ${normalized.url} \u043F\u043E\u0441\u043B\u0435 \u0433\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u0438 \u0433\u043E\u0441\u0442\u044F`);
    notify();
    return { ok: true, reason: "", url: normalized.url };
  }
  const hasLoadURL = typeof guest?.loadURL === "function";
  if (guest === null || guest === void 0 || !hasLoadURL) {
    requestedUrl.set(tabId, normalized.url);
    const state = paneState.get(tabId);
    if (state !== void 0) paneState.set(tabId, { ...state, url: normalized.url });
    lastNavAttempt = { url: normalized.url, ok: true, reason: "\u0433\u043E\u0441\u0442\u044C \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0437\u0434\u0430\u043D \u0438 \u043E\u0442\u043A\u0440\u043E\u0435\u0442 \u0430\u0434\u0440\u0435\u0441", hasGuest: false, hasLoadURL: false, at: Date.now() };
    notify();
    setStatus(`\u0441\u043E\u0437\u0434\u0430\u043C \u0433\u043E\u0441\u0442\u044F \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u0438 \u043E\u0442\u043A\u0440\u043E\u044E ${normalized.url}`);
    scheduleReconcile();
    return { ok: true, reason: "", url: normalized.url };
  }
  if (false) {
    const reason = "";
    lastNavAttempt = { url: normalized.url, ok: false, reason, hasGuest: true, hasLoadURL, at: Date.now() };
    notify();
    setStatus(`\u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C: ${reason}`);
    return { ok: false, reason, url: normalized.url };
  }
  try {
    counters.navigations += 1;
    guest.loadURL(normalized.url);
    lastNavAttempt = { url: normalized.url, ok: true, reason: "", hasGuest: true, hasLoadURL: true, at: Date.now() };
    setStatus(`\u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E ${normalized.url}`);
    notify();
    return { ok: true, reason: "", url: normalized.url };
  } catch (error) {
    const reason = String(error instanceof Error ? error.message : error);
    lastNavAttempt = { url: normalized.url, ok: false, reason, hasGuest: true, hasLoadURL: true, at: Date.now() };
    setStatus(`\u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C: ${reason}`);
    notify();
    return { ok: false, reason, url: normalized.url };
  }
}
function requestOpenTab(url = "") {
  if (openTabRequested !== null && openTabRequested(url)) return { ok: true, via: "pane", error: "" };
  const fallback = openStartapusTab("startapus-browser", url === "" ? {} : { url });
  if (!fallback.opened) return { ok: false, via: "controller", error: fallback.error };
  if (mountedPaneKeys.size === 0 && guideCardFallback !== null && guideCardFallback()) {
    return { ok: true, via: "guide", error: "" };
  }
  return { ok: true, via: "controller", error: "" };
}
function setGuideFallback(run) {
  guideCardFallback = run;
}
function setActivateFallback(run) {
  activateTabFallback = run;
}
var paneState = /* @__PURE__ */ new Map();
var crashedTabs = /* @__PURE__ */ new Map();
var requestedUrl = /* @__PURE__ */ new Map();
var reconciling = false;
function setPaneState(tabId, state) {
  const previous = paneState.get(tabId) ?? { url: START_URL, host: null, visible: false };
  paneState.set(tabId, {
    url: state.url ?? previous.url,
    host: state.host ?? previous.host,
    visible: state.visible ?? previous.visible
  });
  scheduleReconcile();
}
function scheduleReconcile() {
  window.setTimeout(() => {
    void reconcile();
  }, 0);
}
async function reconcile() {
  if (reconciling) return;
  reconciling = true;
  try {
    for (const [tabId, state] of [...paneState.entries()]) {
      const crashed = crashedTabs.get(tabId);
      if (crashed !== void 0) {
        continue;
      }
      const session = sessions.get(tabId);
      if (!state.visible) {
        if (session !== void 0) position(session, false);
        continue;
      }
      if (session !== void 0 && session.guest !== null && session.container.isConnected) {
        position(session, true);
        if (activeTabId !== tabId) {
          activeTabId = tabId;
          session.lastActiveAt = Date.now();
          notify();
        }
        continue;
      }
      const url = state.url === "" ? START_URL : state.url;
      await showSession(tabId, url, state.host);
    }
  } finally {
    reconciling = false;
  }
}
function restoreCrashedTab(tabId) {
  const crashed = crashedTabs.get(tabId);
  if (crashed === void 0) return false;
  crashedTabs.delete(tabId);
  const state = paneState.get(tabId);
  paneState.set(tabId, { url: crashed.url, host: state?.host ?? null, visible: true });
  setStatus("\u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u043F\u043E\u0441\u043B\u0435 \u043F\u0430\u0434\u0435\u043D\u0438\u044F");
  scheduleReconcile();
  return true;
}
function desiredUrlFor(tabId) {
  const requested = requestedUrl.get(tabId);
  if (requested !== void 0) return requested;
  const state = paneState.get(tabId);
  return state === void 0 ? null : state.url;
}
function crashedInfo(tabId) {
  return crashedTabs.get(tabId) ?? null;
}
function requestPick() {
  try {
    pickRequested();
    return true;
  } catch {
    return false;
  }
}
function activateOwnTab() {
  if (activateTabFallback === null) return false;
  try {
    return activateTabFallback();
  } catch {
    return false;
  }
}
function takeHumanControl() {
  controlHolder = "human";
  agentActiveUntil = 0;
  setStatus("\u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0432\u0430\u0441: \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0430\u0433\u0435\u043D\u0442\u0430 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B");
  notify();
}
function releaseToAgent() {
  controlHolder = "agent";
  agentActiveUntil = Date.now() + AGENT_ACTIVE_MS;
  setStatus("\u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0430\u0433\u0435\u043D\u0442\u0430");
  notify();
}
function noteAgentAction() {
  if (controlHolder === "human") return;
  controlHolder = "agent";
  agentActiveUntil = Date.now() + AGENT_ACTIVE_MS;
  notify();
}
function activeGuest() {
  const current = activeTabId === null ? void 0 : sessions.get(activeTabId);
  if (current?.guest !== void 0 && current?.guest !== null) return current.guest;
  for (const session of sessions.values()) {
    if (session.guest !== null) {
      activeTabId = session.tabId;
      return session.guest;
    }
  }
  return null;
}
async function readyView(command, timeoutMs = 3e3) {
  const tabId = String(command.args.tabId ?? "");
  const preferred = tabId !== "" ? sessions.get(tabId) : sessions.get(activeTabId ?? "");
  const deadline = Date.now() + timeoutMs;
  let candidate = preferred;
  for (; ; ) {
    if (candidate !== void 0 && candidate.guest !== null && candidate.ready) return candidate.guest;
    if (Date.now() >= deadline) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (candidate === void 0 || candidate.guest === null) {
      candidate = sessions.get(activeTabId ?? "") ?? candidate;
    }
  }
  if (tabId === "") {
    for (const session of sessions.values()) {
      if (session.ready && session.guest !== null && session.container.isConnected) return session.guest;
    }
  }
  return null;
}
function guestOf(tabId) {
  return sessions.get(tabId)?.guest ?? null;
}
function setEvidence(pick) {
  evidence = pick;
}
function setViewHooks(hooks) {
  if (hooks.closeRequested !== void 0) closeRequested = hooks.closeRequested;
  if (hooks.pickRequested !== void 0) pickRequested = hooks.pickRequested;
  if (hooks.openTabRequested !== void 0) openTabRequested = hooks.openTabRequested;
  if (hooks.focusTabRequested !== void 0) focusTabRequested = hooks.focusTabRequested;
}
function position(session, visible) {
  session.container.style.display = visible ? "flex" : "none";
}
async function ensureSession(tabId, initialUrl, host) {
  const existing = sessions.get(tabId);
  if (existing !== void 0) return existing;
  const inFlight = pending.get(tabId);
  if (inFlight !== void 0) return inFlight;
  const creation = createSession(tabId, initialUrl, host).finally(() => pending.delete(tabId));
  pending.set(tabId, creation);
  return creation;
}
async function createSession(tabId, initialUrl, host) {
  const evict = pickSessionToEvict([...sessions.values()], MAX_SESSIONS);
  if (evict !== null && closeSession(evict)) {
    setStatus(`\u0432\u043A\u043B\u0430\u0434\u043A\u0430 ${evict}: \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0432\u044B\u0433\u0440\u0443\u0436\u0435\u043D\u0430 (\u043B\u0438\u043C\u0438\u0442 ${MAX_SESSIONS})`);
  }
  const bridge = browserBridge();
  if (bridge === void 0) {
    setStatus("desktop bridge \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D: \u0433\u043E\u0441\u0442\u044C \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D");
    return null;
  }
  const container = document.createElement("div");
  container.style.cssText = "display:flex;flex-direction:column;flex:1 1 auto;min-height:0;width:100%;height:100%;overflow:hidden;border:none;";
  const mount = host ?? document.body;
  mount.appendChild(container);
  const session = {
    tabId,
    container,
    guest: null,
    lease: null,
    url: initialUrl,
    title: "",
    scrollY: 0,
    lastActiveAt: Date.now(),
    host,
    ready: false,
    pendingUrl: "",
    recoveryAttempts: 0,
    lastRecoveryAt: 0,
    navigated: false,
    colorScheme: null
  };
  sessions.set(tabId, session);
  notify();
  try {
    counters.acquires += 1;
    setStatus("\u0437\u0430\u043F\u0440\u043E\u0441 \u0440\u0435\u0437\u0435\u0440\u0432\u0430\u0446\u0438\u0438 guest\u2026");
    const reservation = await bridge.acquire(WORKSPACE_KEY);
    void note("lease:acquire", { tabId, lease: reservation.lease.slice(0, 12) });
    session.lease = reservation.lease;
    setStatus(`\u0440\u0435\u0437\u0435\u0440\u0432\u0430\u0446\u0438\u044F ok \xB7 partition ${reservation.partition}`);
    void report(base ?? await probe() ?? "", {}).catch(() => void 0);
    const created = document.createElement("webview");
    created.dataset.sidebarBrowserFrame = "webview";
    created.setAttribute("name", reservation.lease);
    created.setAttribute("partition", reservation.partition);
    created.setAttribute("allowpopups", "");
    created.setAttribute("src", `about:blank#${reservation.lease}`);
    created.style.cssText = "display:flex;flex:1 1 auto;min-height:0;width:100%;height:100%;border:none;";
    const installNetHook = () => {
      try {
        void Promise.resolve(created.executeJavaScript?.(netHookScript(), false)).catch(() => void 0);
      } catch {
      }
    };
    const reapplyScheme = () => {
      try {
        if (session.colorScheme === null) return;
        void Promise.resolve(created.executeJavaScript?.(colorSchemeScript(session.colorScheme), false)).catch(() => void 0);
      } catch {
      }
    };
    created.addEventListener("did-finish-load", reapplyScheme);
    created.addEventListener("dom-ready", () => {
      session.ready = true;
      void note("guest:dom-ready", { tabId: session.tabId, navigated: session.navigated, pending: hostOf(session.pendingUrl) });
      installNetHook();
      reapplyScheme();
      if (session.navigated && session.pendingUrl !== "") {
        const queued = session.pendingUrl;
        session.pendingUrl = "";
        counters.navigations += 1;
        created.loadURL?.(queued);
        notify();
        return;
      }
      if (session.navigated) {
        notify();
        return;
      }
      session.navigated = true;
      session.recoveryAttempts = 0;
      const remembered = session.url.startsWith("about:blank") ? "" : session.url;
      const target = session.pendingUrl !== "" ? session.pendingUrl : remembered === "" ? initialUrl : remembered;
      session.pendingUrl = "";
      counters.navigations += 1;
      created.loadURL?.(target);
      setStatus(`guest \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D: ${target}`);
      notify();
    });
    created.addEventListener("did-navigate", () => onNavigate(session, created));
    created.addEventListener("did-navigate-in-page", () => onNavigate(session, created));
    created.addEventListener("page-title-updated", () => onTitle(session, created));
    created.addEventListener("console-message", (event) => {
      const detail = event.detail;
      const loose = event;
      const level = typeof loose.level === "number" ? loose.level : typeof detail?.level === "number" ? detail.level : 0;
      const message = String(loose.message ?? loose.text ?? detail?.message ?? detail?.text ?? "");
      consoleRing.push({ level, message: message.slice(0, 300) });
      while (consoleRing.length > 200) consoleRing.shift();
    });
    const onLost = (kind) => (event) => {
      const detail = event.detail;
      const loose = event;
      const raw = loose.reason ?? loose.details ?? detail?.reason ?? detail?.details;
      const reason = raw === void 0 || raw === null ? "" : typeof raw === "string" ? raw : String(raw.reason ?? JSON.stringify(raw));
      handleGuestLoss(session, reason === "" ? kind : `${kind}:${reason}`);
    };
    created.addEventListener("render-process-gone", onLost("render-process-gone"));
    created.addEventListener("crashed", onLost("crashed"));
    created.addEventListener("destroyed", onLost("destroyed"));
    created.addEventListener("did-fail-load", (event) => {
      const detail = event.detail;
      const code = Number(detail?.errorCode ?? 0);
      if (code === -3 || code === 0) return;
      if (detail?.isMainFrame === false) return;
      counters.loadErrors += 1;
      lastLoadError = {
        code,
        description: String(detail?.errorDescription ?? ""),
        url: String(detail?.validatedURL ?? created.getURL?.() ?? ""),
        at: Date.now()
      };
      setStatus(`\u043E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 ${code} ${lastLoadError.description} \xB7 ${lastLoadError.url}`);
      notify();
    });
    container.appendChild(created);
    session.guest = created;
    notify();
    window.setTimeout(() => {
      if (session.ready || session.guest === null) return;
      counters.attachFailures += 1;
      const trace = [];
      let cursor = host;
      while (cursor !== null && trace.length < 5) {
        const box = cursor.getBoundingClientRect();
        const id = cursor.id === "" ? "" : `#${cursor.id}`;
        trace.push(`${cursor.tagName.toLowerCase()}${id}(${Math.round(box.width)}x${Math.round(box.height)})`);
        cursor = cursor.parentElement;
      }
      setStatus(`guest \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u043B\u0441\u044F: \u044F\u0434\u0440\u043E \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B\u043E attach \xB7 ${trace.join(" < ") || "\u043D\u0435\u0442 host"}`);
      const chain = [];
      let node = host;
      while (node !== null && chain.length < 8) {
        chain.push({
          tag: node.tagName.toLowerCase(),
          id: node.id,
          cls: String(node.className).slice(0, 80),
          dataset: JSON.stringify(node.dataset).slice(0, 200),
          rect: (() => {
            const r = node.getBoundingClientRect();
            return `${Math.round(r.width)}x${Math.round(r.height)}`;
          })()
        });
        node = node.parentElement;
      }
      void note("attach:timeout", {
        tabId,
        lease: session.lease === null ? "" : session.lease.slice(0, 12),
        connected: created.isConnected,
        url: created.getURL?.() ?? "",
        chain
      });
    }, 4e3);
    return session;
  } catch (error) {
    counters.attachFailures += 1;
    setStatus(`acquire \u0443\u043F\u0430\u043B: ${String(error)}`);
    container.remove();
    sessions.delete(tabId);
    notify();
    return null;
  }
}
function handleGuestLoss(session, kind) {
  if (session.guest === null) return;
  if (sessions.get(session.tabId) !== session) return;
  if (kind.startsWith("render-process-gone") || kind.startsWith("crashed")) {
    counters.crashes += 1;
    sessions.delete(session.tabId);
    releaseLease(session);
    try {
      session.container.remove();
    } catch {
    }
    crashedTabs.set(session.tabId, { url: session.url, reason: kind, at: Date.now() });
    setStatus(`\u0440\u0435\u043D\u0434\u0435\u0440\u0435\u0440 \u0443\u043F\u0430\u043B (${kind}) \u2014 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430, \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C\xBB \u0432 \u043F\u0430\u043D\u0435\u043B\u0438`);
    void note("guest:crashed", { tabId: session.tabId, kind, url: session.url.slice(0, 120) });
    notify();
    return;
  }
  const now = Date.now();
  if (now - session.lastRecoveryAt < 3e3) return;
  session.lastRecoveryAt = now;
  const recent = (recoveryLedger.get(session.tabId) ?? []).filter((at) => now - at < 1e4);
  if (recent.length >= 3) {
    recoveryLedger.set(session.tabId, recent);
    setStatus(`E_GUEST_LOOP: \u0433\u043E\u0441\u0442\u044C \u043F\u0430\u0434\u0430\u0435\u0442 (${kind}) \u0431\u043E\u043B\u044C\u0448\u0435 3 \u0440\u0430\u0437 \u0437\u0430 10 \u0441 \u2014 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435`);
    sessions.delete(session.tabId);
    releaseLease(session);
    try {
      session.container.remove();
    } catch {
    }
    notify();
    return;
  }
  recent.push(now);
  recoveryLedger.set(session.tabId, recent);
  if (session.recoveryAttempts >= 3) {
    setStatus(`E_GUEST_LOOP: \u0433\u043E\u0441\u0442\u044C \u043F\u0430\u0434\u0430\u0435\u0442 (${kind}) \u0431\u043E\u043B\u044C\u0448\u0435 3 \u0440\u0430\u0437 \u2014 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435, \u043F\u0435\u0440\u0435\u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443`);
    session.guest = null;
    session.ready = false;
    notify();
    return;
  }
  session.recoveryAttempts += 1;
  counters.recoveries += 1;
  session.guest = null;
  session.ready = false;
  session.navigated = false;
  setStatus(`\u0433\u043E\u0441\u0442\u044C \u043F\u043E\u0442\u0435\u0440\u044F\u043D (${kind}) \u2014 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443`);
  notify();
  const host = session.host;
  const url = session.url.startsWith("about:blank") ? START_URL : session.url;
  void note("guest:lost", {
    tabId: session.tabId,
    kind,
    attempt: session.recoveryAttempts,
    url: session.url.slice(0, 120),
    lease: session.lease === null ? "" : session.lease.slice(0, 12)
  });
  window.setTimeout(() => {
    if (sessions.get(session.tabId) !== session) return;
    if (recovering.has(session.tabId)) return;
    recovering.add(session.tabId);
    sessions.delete(session.tabId);
    releaseLease(session);
    try {
      session.container.remove();
    } catch {
    }
    void showSession(session.tabId, url, host).catch(() => void 0).finally(() => recovering.delete(session.tabId));
  }, 0);
}
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}
function onNavigate(session, guest) {
  try {
    const url = String(guest.getURL?.() ?? session.url);
    void note("guest:navigated", { tabId: session.tabId, host: hostOf(url) });
    if (!url.startsWith("about:blank")) session.url = url;
    setTabTitle(session.tabId, session.title === "" ? session.url : session.title);
    notify();
  } catch {
  }
}
function onTitle(session, guest) {
  try {
    const title = typeof guest.getTitle === "function" ? guest.getTitle() : "";
    session.title = title;
    setTabTitle(session.tabId, title === "" ? session.url : title);
    notify();
  } catch {
  }
}
async function showSession(tabId, initialUrl, host) {
  activeTabId = tabId;
  const inFlight = pending.get(tabId);
  if (inFlight !== void 0) {
    const raced = await inFlight;
    for (const other of sessions.values()) {
      if (other.tabId !== tabId) position(other, false);
    }
    if (raced !== null) position(raced, true);
    notify();
    return;
  }
  if (host !== null) {
    let visible = hostVisible(host);
    for (let waited = 0; !visible && waited < 600; waited += 100) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      visible = hostVisible(host);
    }
    if (!visible) {
      const trace = [];
      let cursor = host;
      for (let depth = 0; cursor !== null && depth < 6; depth += 1) {
        const box = typeof cursor.getBoundingClientRect === "function" ? cursor.getBoundingClientRect() : null;
        const style = typeof window.getComputedStyle === "function" ? window.getComputedStyle(cursor) : null;
        trace.push(`${cursor.tagName.toLowerCase()}${cursor.id === "" ? "" : `#${cursor.id}`}(${box === null ? "?" : `${Math.round(box.width)}x${Math.round(box.height)}`},${style?.display ?? "?"})`);
        cursor = cursor.parentElement ?? null;
      }
      setStatus(`\u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u0441\u043A\u0440\u044B\u0442\u0430: \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0441\u043E\u0437\u0434\u0430\u0441\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0435\u0451 \u043F\u043E\u043A\u0430\u0436\u0443\u0442 \xB7 ${trace.join(" < ")}`);
      void note("pane:hidden", { tabId, trace });
      notify();
      return;
    }
  }
  deferredCreate.delete(tabId);
  const known = sessions.get(tabId);
  if (known !== void 0 && !known.container.isConnected) {
    releaseLease(known);
    sessions.delete(tabId);
  }
  const targetUrl = requestedUrl.get(tabId) ?? (initialUrl === "" ? START_URL : initialUrl);
  const session = sessions.get(tabId) ?? await ensureSession(tabId, targetUrl, host);
  requestedUrl.delete(tabId);
  for (const other of sessions.values()) {
    if (other.tabId !== tabId) position(other, false);
  }
  if (session !== null) {
    session.lastActiveAt = Date.now();
    position(session, true);
  }
  notify();
}
function setSessionRect(tabId, visible) {
  const session = sessions.get(tabId);
  if (session === void 0) return;
  position(session, visible && activeTabId === tabId);
}
function detachSession(tabId) {
  const session = sessions.get(tabId);
  if (session === void 0) return;
  session.container.style.display = "none";
  if (activeTabId === tabId) activeTabId = null;
  notify();
}
function closeSession(tabId) {
  const session = sessions.get(tabId);
  if (session === void 0) return false;
  sessions.delete(tabId);
  try {
    session.container.remove();
  } catch {
  }
  if (activeTabId === tabId) activeTabId = null;
  const bridge = browserBridge();
  releaseLease(session);
  notify();
  return true;
}
function disposeSession(tabId) {
  const session = sessions.get(tabId);
  if (session === void 0) return false;
  sessions.delete(tabId);
  try {
    session.container.remove();
  } catch {
  }
  if (activeTabId === tabId) activeTabId = null;
  notify();
  return true;
}
function collectIdleSessions() {
  const now = Date.now();
  for (const session of [...sessions.values()]) {
    if (session.tabId === activeTabId) continue;
    if (now - session.lastActiveAt < SESSION_IDLE_MS) continue;
    closeSession(session.tabId);
  }
}
function releaseLease(session) {
  if (session.lease === null) return;
  const lease = session.lease;
  session.lease = null;
  counters.releases += 1;
  void note("lease:release", { tabId: session.tabId, lease: lease.slice(0, 12), reason: session.ready ? "close" : "lost" });
  const bridge = browserBridge();
  if (bridge !== void 0) void bridge.release(lease).catch(() => void 0);
}
function listSessions() {
  return [...sessions.values()].map((session) => ({ tabId: session.tabId, url: session.url, title: session.title }));
}
async function runInActive(code, timeoutMs = 5e3) {
  const guest = activeGuest();
  if (guest === null || guest.executeJavaScript === void 0) {
    throw new Error("E_NO_GUEST: \u0433\u043E\u0441\u0442\u044C \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D");
  }
  return withTimeout(guest.executeJavaScript(code, false), timeoutMs, "E_TIMEOUT");
}
function withTimeout(promise, ms, code) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(code)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}
async function cropDataUrl(dataUrl, rect, guest) {
  let viewportWidth = 0;
  try {
    const raw = await guest.executeJavaScript?.("String(window.innerWidth)", false);
    viewportWidth = Number.parseInt(typeof raw === "string" ? raw : "", 10) || 0;
  } catch {
    viewportWidth = 0;
  }
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("E_CROP_DECODE"));
    element.src = dataUrl;
  });
  const ratio = viewportWidth > 0 ? image.width / viewportWidth : 1;
  const { sx, sy, sw, sh } = cropRect(rect, ratio, { width: image.width, height: image.height });
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const context2 = canvas.getContext("2d");
  if (context2 === null) throw new Error("E_CROP_CONTEXT");
  context2.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL("image/png");
}
function navigateGuest(view, action) {
  try {
    if (action === "reload") {
      if (typeof view.reload !== "function") return { ok: false, reason: "\u0433\u043E\u0441\u0442\u044C \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 reload" };
      view.reload();
      return { ok: true, reason: "" };
    }
    if (action === "back") {
      if (typeof view.goBack !== "function") return { ok: false, reason: "\u0433\u043E\u0441\u0442\u044C \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 history" };
      if (view.canGoBack?.() === false) return { ok: false, reason: "\u043D\u0435\u0442 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438" };
      view.goBack();
      return { ok: true, reason: "" };
    }
    if (action === "forward") {
      if (typeof view.goForward !== "function") return { ok: false, reason: "\u0433\u043E\u0441\u0442\u044C \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 history" };
      if (view.canGoForward?.() === false) return { ok: false, reason: "\u043D\u0435\u0442 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438" };
      view.goForward();
      return { ok: true, reason: "" };
    }
    return { ok: false, reason: `\u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435: ${action}` };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}
var lastCaptures = /* @__PURE__ */ new Map();
var MAX_REMEMBERED_CAPTURES = 8;
async function decodePixels(dataUrl) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("E_DIFF_DECODE"));
    image.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context2 = canvas.getContext("2d", { willReadFrequently: true });
  if (context2 === null) throw new Error("E_DIFF_DECODE");
  context2.drawImage(image, 0, 0);
  const frame = context2.getImageData(0, 0, canvas.width, canvas.height);
  return { data: frame.data, width: canvas.width, height: canvas.height };
}
async function diffAgainstPrevious(key, dataUrl, compare) {
  if (!compare) return {};
  const previous = lastCaptures.get(key);
  lastCaptures.delete(key);
  lastCaptures.set(key, dataUrl);
  while (lastCaptures.size > MAX_REMEMBERED_CAPTURES) {
    const oldest = lastCaptures.keys().next().value;
    if (oldest === void 0) break;
    lastCaptures.delete(oldest);
  }
  if (previous === void 0) return { hasPrevious: false };
  try {
    const [before, after] = await Promise.all([decodePixels(previous), decodePixels(dataUrl)]);
    if (before.width !== after.width || before.height !== after.height) {
      return { hasPrevious: true, sameSize: false, before: { width: before.width, height: before.height }, after: { width: after.width, height: after.height } };
    }
    return { hasPrevious: true, sameSize: true, ...diffPixels(before.data, after.data, after.width, after.height) };
  } catch (error) {
    return { hasPrevious: true, error: String(error) };
  }
}
async function capturePageDataUrl(guest, rect) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const image = await withTimeout(Promise.resolve(guest.capturePage?.(rect)), 5e3, "E_CAPTURE_TIMEOUT");
      const dataUrl = image?.toDataURL?.();
      if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
        const size = image?.getSize?.();
        const wide = size !== void 0 ? size.width : 0;
        const tall = size !== void 0 ? size.height : 0;
        const usable = rect === void 0 ? wide >= 2 && tall >= 2 : wide >= 2 && tall >= 2 && tall >= Math.min(4, rect.height - 2);
        if (usable || size === void 0) {
          return { dataUrl, source: attempt === 0 ? "guest" : "guest-retry" };
        }
      }
    } catch {
    }
  }
  const full = await withTimeout(Promise.resolve(guest.capturePage?.(void 0)), 6e3, "E_CAPTURE_TIMEOUT");
  const fullUrl = full?.toDataURL?.();
  if (typeof fullUrl !== "string" || !fullUrl.startsWith("data:image/")) {
    throw new Error("E_CAPTURE_EMPTY");
  }
  if (rect === void 0) return { dataUrl: fullUrl, source: "full" };
  return { dataUrl: await cropDataUrl(fullUrl, rect, guest), source: "canvas-crop" };
}
function startEngine() {
  if (loopStarted) return stopEngine;
  loopStarted = true;
  const tick = async () => {
    try {
      await tickOnce();
    } catch (error) {
      setStatus(`\u0446\u0438\u043A\u043B: ${String(error)}`);
    } finally {
      ticking = false;
    }
  };
  const tickOnce = async () => {
    if (base === null) {
      const found = await probe();
      if (found === null) {
        misses += 1;
        if (misses === 3) setStatus("\u043A\u0430\u043D\u0430\u043B \u0441 \u0430\u0433\u0435\u043D\u0442\u043E\u043C \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D: \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u043F\u043B\u0430\u0433\u0438\u043D\u0430 \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442");
        return;
      }
      base = found;
      misses = 0;
    }
    const command = await poll(base);
    if (lastHostRev !== "" && lastHostRev !== CLIENT_REV) {
      void note("rev:mismatch", { client: CLIENT_REV, host: lastHostRev });
    }
    if (command !== null) {
      await report(base, { lastCommand: { id: command.id, kind: command.kind, at: Date.now() } });
      if (command.kind === "open" && typeof command.args.url === "string") {
        const targetUrl = String(command.args.url);
        const keySession = sessions.get(activeTabId ?? "");
        const view = await readyView(command);
        if (keySession !== void 0 && !keySession.ready) {
          keySession.pendingUrl = targetUrl;
          setStatus(`\u0430\u0433\u0435\u043D\u0442: \u043E\u0442\u043A\u0440\u043E\u044E ${targetUrl} \u043F\u043E\u0441\u043B\u0435 \u0433\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u0438 \u0433\u043E\u0441\u0442\u044F`);
        } else if (view === null || typeof view.loadURL !== "function") {
          setStatus("\u0430\u0433\u0435\u043D\u0442: E_GUEST_GONE \u2014 \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D");
        } else {
          counters.navigations += 1;
          view.loadURL(targetUrl);
          setStatus(`\u0430\u0433\u0435\u043D\u0442: \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E ${targetUrl}`);
        }
      } else if (command.kind === "reload") {
        const view = activeGuest();
        if (view !== null && typeof view.reload === "function") view.reload();
        setStatus("\u0430\u0433\u0435\u043D\u0442: \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430");
      } else if (command.kind === "pick") {
        setStatus("\u0430\u0433\u0435\u043D\u0442: \u0432\u044B\u0431\u043E\u0440 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430");
        pickRequested();
      } else if (command.kind === "read_page") {
        const view = await readyView(command);
        const limit = Math.min(200, Math.max(10, Number(command.args.limit ?? 120)));
        const scanRoot = typeof command.args.root === "string" ? command.args.root : "";
        const scanFilter = command.args.filter === "interactive" ? "interactive" : "all";
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { pageScan: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)" } });
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(pageScanScript(limit, scanRoot, scanFilter), false), 8e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            if (parsed.status === "OK") {
              await report(base, { pageScan: { url: parsed.url ?? "", total: parsed.total ?? 0, items: parsed.items ?? [] } });
              setStatus(`\u043E\u0431\u0437\u043E\u0440 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B: ${parsed.total ?? 0} \u0443\u0437\u043B\u043E\u0432`);
            } else {
              await report(base, { pageScan: { error: parsed.message ?? "\u043E\u0431\u0437\u043E\u0440 \u043D\u0435 \u0443\u0434\u0430\u043B\u0441\u044F" } });
            }
          } catch (error) {
            await report(base, { pageScan: { error: String(error) } });
          }
        }
      } else if (command.kind === "act_batch" && controlHolder === "human") {
        await report(base, { actResults: [{ op: "-", status: "ERROR", message: "E_HUMAN_CONTROL: \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430" }] });
        setStatus("\u0430\u0433\u0435\u043D\u0442: \u043F\u0430\u043A\u0435\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043E\u0442\u043A\u043B\u043E\u043D\u0451\u043D \u2014 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0432\u0430\u0441");
      } else if (command.kind === "act_batch") {
        noteAgentAction();
        const view = await readyView(command);
        const items = Array.isArray(command.args.items) ? command.args.items : [];
        const results = [];
        if (view === null || view.executeJavaScript === void 0) {
          results.push({ op: "-", status: "ERROR", message: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)" });
        } else {
          for (const item of items) {
            try {
              const raw = await withTimeout(view.executeJavaScript(actScript(item.op, item.selector, item.value), false), 5e3, "E_TIMEOUT");
              const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
              results.push({ op: item.op, status: parsed.status ?? "ERROR", message: parsed.message ?? "" });
            } catch (error) {
              results.push({ op: item.op, status: "ERROR", message: String(error) });
            }
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
        }
        await report(base, { actResults: results });
        setStatus(`\u043F\u0430\u043A\u0435\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439: ${results.filter((row) => row.status === "OK").length}/${results.length} \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E`);
      } else if (command.kind === "page_text") {
        const view = await readyView(command);
        const limit = Math.min(2e4, Math.max(1e3, Number(command.args.limit ?? 5e3)));
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { pageText: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)" } });
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(pageTextScript(limit), false), 6e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            await report(base, { pageText: { ...parsed, at: Date.now() } });
          } catch (error) {
            await report(base, { pageText: { error: String(error), at: Date.now() } });
          }
        }
      } else if (command.kind === "network") {
        const view = await readyView(command);
        const limit = Math.min(200, Math.max(10, Number(command.args.limit ?? 100)));
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { network: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)" } });
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(networkScript(limit), false), 6e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            await report(base, { network: { ...parsed, at: Date.now() } });
          } catch (error) {
            await report(base, { network: { error: String(error), at: Date.now() } });
          }
        }
      } else if (command.kind === "measure") {
        const view = await readyView(command);
        const selector = String(command.args.selector ?? "");
        const properties = Array.isArray(command.args.properties) ? command.args.properties.map(String).slice(0, 8) : [];
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { measure: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D", at: Date.now() } });
        } else {
          const values = {};
          for (const property of properties) {
            try {
              const raw = await withTimeout(view.executeJavaScript(measureScript(selector, "computed", property, ""), false), 4e3, "E_TIMEOUT");
              const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
              values[property] = String(parsed.value ?? parsed.error ?? "");
            } catch (error) {
              values[property] = `E_MEASURE: ${String(error)}`;
            }
          }
          await report(base, { measure: { selector, values, at: Date.now() } });
        }
      } else if (command.kind === "inspect") {
        const view = await readyView(command);
        const selector = String(command.args.selector ?? "");
        const styles = Array.isArray(command.args.styles) ? command.args.styles.map(String).slice(0, 40) : [];
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { inspect: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)" } });
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(inspectScript(selector, styles), false), 6e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            await report(base, { inspect: { ...parsed, at: Date.now() } });
          } catch (error) {
            await report(base, { inspect: { error: String(error), at: Date.now() } });
          }
        }
      } else if (command.kind === "guest_state") {
        const view = await readyView(command);
        if (view === null) {
          await report(base, { guestState: { error: "guest \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D" } });
        } else {
          try {
            const raw = await withTimeout(
              view.executeJavaScript("JSON.stringify({ url: String(location.href), title: String(document.title), readyState: String(document.readyState), textLength: (document.body ? document.body.innerText.length : 0) })", false),
              5e3,
              "E_TIMEOUT"
            );
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            await report(base, { guestState: { ...parsed, getURL: String(view.getURL?.() ?? "") } });
          } catch (error) {
            await report(base, { guestState: { error: String(error), getURL: String(view.getURL?.() ?? "") } });
          }
        }
      } else if (command.kind === "activate_self") {
        const activated = activateOwnTab();
        setStatus(activated ? "\u0430\u043A\u0442\u0438\u0432\u0438\u0440\u0443\u044E \u0432\u043A\u043B\u0430\u0434\u043A\u0443 \u043A\u043B\u0438\u043A\u043E\u043C \u043F\u043E \u044F\u0440\u043B\u044B\u043A\u0443" : "\u043D\u0435 \u043D\u0430\u0448\u0451\u043B \u044F\u0440\u043B\u044B\u043A \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u0432 \u043F\u043E\u043B\u043E\u0441\u0435");
        await report(base, { activateResult: { activated, at: Date.now() } });
      } else if (command.kind === "focus_tab") {
        const target = String(command.args.tabId ?? "");
        const focused = focusTabRequested !== null && focusTabRequested(target) || focusStartapusTab(target);
        await report(base, { focusTabResult: { tabId: target, focused } });
        setStatus(focused ? `\u0432\u043A\u043B\u0430\u0434\u043A\u0430 ${target} \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D\u0430` : `\u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C ${target}`);
      } else if (command.kind === "close_tab") {
        const requested = typeof command.args.tabId === "string" && command.args.tabId !== "" ? command.args.tabId : activeTabId;
        let via = "none";
        let closed = false;
        if (requested !== null) {
          const kernelClosed = tabClosers.get(requested)?.() === true;
          if (kernelClosed) {
            for (let waited = 0; waited < 1500 && sessions.has(requested); waited += 100) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (sessions.has(requested)) disposeSession(requested);
            via = "kernel";
            closed = true;
          } else {
            closed = closeSession(requested) === true;
            via = closed ? "session" : "none";
          }
        }
        await report(base, { closeTabResult: { closed, via } });
        setStatus(closed ? via === "kernel" ? "\u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u0437\u0430\u043A\u0440\u044B\u0442\u0430 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043F\u0430\u043D\u0435\u043B\u044C\u044E" : "\u0441\u0435\u0441\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430, \u043F\u0430\u043D\u0435\u043B\u044C \u043E\u0441\u0442\u0430\u043B\u0430\u0441\u044C: \u044F\u0434\u0440\u043E \u043D\u0435 \u0434\u0430\u043B\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0443" : "\u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0443 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C: \u043D\u0435\u0442 \u0442\u0430\u043A\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438");
      } else if (command.kind === "new_tab") {
        const target = String(command.args.url ?? "");
        const viaPane = openTabRequested === null ? false : openTabRequested(target);
        const result = viaPane ? { opened: true, error: "" } : openStartapusTab("startapus-browser", target === "" ? {} : { url: target });
        await report(base, { newTabResult: { opened: result.opened, url: target, error: result.error } });
        setStatus(result.opened ? viaPane ? `\u043E\u0442\u043A\u0440\u044B\u0442\u0430 \u043D\u043E\u0432\u0430\u044F \u0432\u043A\u043B\u0430\u0434\u043A\u0430${target === "" ? "" : `: ${target}`}` : `\u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0430 \u043E\u0431\u0449\u0438\u043C \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u043B\u0435\u0440\u043E\u043C${target === "" ? "" : ` (${target})`}: \u0435\u0441\u043B\u0438 \u043F\u0430\u043D\u0435\u043B\u044C \u043D\u0435 \u043F\u043E\u044F\u0432\u0438\u043B\u0430\u0441\u044C \u2014 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443 \u0432 \u043F\u043E\u043B\u043E\u0441\u0435` : `\u043D\u043E\u0432\u0430\u044F \u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u043B\u0430\u0441\u044C: ${result.error}`);
      } else if (command.kind === "console_clear") {
        consoleRing.length = 0;
        setStatus("\u043A\u043E\u043D\u0441\u043E\u043B\u044C \u043E\u0447\u0438\u0449\u0435\u043D\u0430");
      } else if (command.kind === "select") {
        const view = await readyView(command);
        const selector = String(command.args.selector ?? "");
        if (view === null || view.executeJavaScript === void 0) {
          setStatus("\u0432\u044B\u0431\u043E\u0440 \u043F\u043E \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0443: guest \u043D\u0435 \u0433\u043E\u0442\u043E\u0432");
          await report(base, { selectResult: { selector, status: "ERROR", count: 0 } });
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(evidenceScript(selector), false), 5e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            await report(base, { selectResult: { selector, status: parsed.status ?? "ERROR", count: parsed.count ?? 0 } });
            if (parsed.status === "OK" && parsed.evidence !== void 0) {
              evidence = parsed.evidence;
              await report(base, { evidence: parsed.evidence });
              setStatus(`\u0432\u044B\u0431\u0440\u0430\u043D \u043F\u043E \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0443: ${String(parsed.evidence.selector).slice(0, 80)}`);
            } else if (parsed.status === "AMBIGUOUS") {
              setStatus(`\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u043D\u0435\u043E\u0434\u043D\u043E\u0437\u043D\u0430\u0447\u0435\u043D: \u043D\u0430\u0439\u0434\u0435\u043D\u043E ${parsed.count ?? 0}`);
            } else if (parsed.status === "MISSING") {
              setStatus("\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0448\u0451\u043B");
            } else {
              setStatus(`\u0432\u044B\u0431\u043E\u0440 \u043D\u0435 \u0443\u0434\u0430\u043B\u0441\u044F: ${parsed.message ?? ""}`);
            }
          } catch (error) {
            setStatus(`\u0432\u044B\u0431\u043E\u0440 \u043F\u043E \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0443 \u0443\u043F\u0430\u043B: ${String(error)}`);
            await report(base, { selectResult: { selector, status: "ERROR", count: 0 } });
          }
        }
      } else if (command.kind === "act" && controlHolder === "human") {
        await report(base, { actResult: { op: String(command.args.op ?? ""), status: "ERROR", message: "E_HUMAN_CONTROL: \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430" } });
        setStatus("\u0430\u0433\u0435\u043D\u0442: \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u043E \u2014 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0432\u0430\u0441");
      } else if (command.kind === "act") {
        noteAgentAction();
        const view = await readyView(command);
        const op = String(command.args.op ?? "");
        const selector = String(command.args.selector ?? "");
        const value = String(command.args.value ?? "");
        if (view === null || view.executeJavaScript === void 0) {
          setStatus("\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435: guest \u043D\u0435 \u0433\u043E\u0442\u043E\u0432");
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(actScript(op, selector, value), false), 5e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            await report(base, { actResult: { op, status: parsed.status ?? "ERROR", message: parsed.message ?? "" } });
            setStatus(parsed.status === "OK" ? `\u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E: ${op}` : `\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C: ${parsed.message ?? ""}`);
          } catch (error) {
            await report(base, { actResult: { op, status: "ERROR", message: String(error) } });
          }
        }
      } else if (command.kind === "capture") {
        const selector = String(command.args.selector ?? "");
        await report(base, { captureStage: { step: "start", selector } });
        const view = await readyView(command);
        await report(base, { captureStage: { step: "guest", hasView: view !== null, hasCapture: view?.capturePage !== void 0 } });
        if (view === null || view.capturePage === void 0) {
          setStatus("\u0441\u043D\u0438\u043C\u043E\u043A \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D: capturePage \u043D\u0435\u0442");
          await report(base, { captureError: "capturePage \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0443 \u0433\u043E\u0441\u0442\u044F" });
        } else {
          try {
            let rect;
            if (selector !== "" && view.executeJavaScript !== void 0) {
              const rawRect = await view.executeJavaScript(
                `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return ''; const r = el.getBoundingClientRect(); return JSON.stringify({ x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) }) })()`,
                false
              );
              if (typeof rawRect === "string" && rawRect !== "") rect = JSON.parse(rawRect);
            }
            await report(base, { captureStage: { step: "capturing", hasRect: rect !== void 0 } });
            const captured = await capturePageDataUrl(view, rect);
            await report(base, { captureStage: { step: "captured", source: captured.source } });
            const dataUrl = captured.dataUrl;
            if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
              setStatus("\u0441\u043D\u0438\u043C\u043E\u043A: \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043F\u0443\u0441\u0442\u043E\u0435 (\u043F\u0430\u043D\u0435\u043B\u044C \u0441\u043A\u0440\u044B\u0442\u0430?)");
              await report(base, { captureError: "toDataURL \u0432\u0435\u0440\u043D\u0443\u043B \u043D\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435" });
            } else {
              const comma = dataUrl.indexOf(",");
              const base64 = comma > 0 ? dataUrl.slice(comma + 1) : "";
              const bytes = Math.floor(base64.length * 3 / 4);
              const size = void 0;
              const shotKey = captureKey(typeof command.args.tabId === "string" && command.args.tabId !== "" ? command.args.tabId : activeTabId ?? "", selector);
              const wantDiff = command.args.diff === true;
              const compared = await diffAgainstPrevious(shotKey, dataUrl, wantDiff);
              const diff = wantDiff ? compared : void 0;
              const semicolon = dataUrl.indexOf(";");
              const mime = semicolon > 5 ? dataUrl.slice(5, semicolon) : "image/png";
              await report(base, {
                crop: {
                  bytes,
                  width: rect?.width ?? size?.width ?? 0,
                  height: rect?.height ?? size?.height ?? 0,
                  mime,
                  base64,
                  ...diff === void 0 ? {} : { diff }
                }
              });
              setStatus(`\u0441\u043D\u0438\u043C\u043E\u043A \u0441\u043D\u044F\u0442: ${bytes} \u0431\u0430\u0439\u0442`);
            }
          } catch (error) {
            const message = String(error);
            setStatus(`\u0441\u043D\u0438\u043C\u043E\u043A \u043D\u0435 \u0443\u0434\u0430\u043B\u0441\u044F: ${message}`);
            await report(base, { captureError: message });
          }
        }
      } else if (command.kind === "verify_area") {
        const view = await readyView(command);
        const taskId = String(command.args.taskId ?? "");
        const covered = Array.isArray(command.args.covered) ? command.args.covered : [];
        setStatus(`\u0430\u0433\u0435\u043D\u0442: \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E \u043E\u0431\u043B\u0430\u0441\u0442\u044C (${covered.length} \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432)`);
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { coverage: { taskId, error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D" } });
        } else {
          const reload = verifyNeedsReload(command.args);
          if (reload) view.reload?.();
          await new Promise((resolve) => setTimeout(resolve, verifySettleMs(reload)));
          try {
            const rawCoverage = await withTimeout(
              view.executeJavaScript(coverageScript(covered), false),
              5e3,
              "E_TIMEOUT"
            );
            let parsedCoverage = {};
            try {
              parsedCoverage = typeof rawCoverage === "string" ? JSON.parse(rawCoverage) : {};
            } catch {
              parsedCoverage = { status: "ERROR", message: String(rawCoverage) };
            }
            if (parsedCoverage.status === "OK") {
              await report(base, {
                coverage: { taskId, found: parsedCoverage.found ?? 0, total: parsedCoverage.total ?? 0 }
              });
              setStatus(`\u043E\u0431\u043B\u0430\u0441\u0442\u044C: ${parsedCoverage.found ?? 0}/${parsedCoverage.total ?? 0} \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432`);
            } else {
              await report(base, { coverage: { taskId, error: parsedCoverage.message ?? "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C" } });
            }
          } catch (error) {
            await report(base, { coverage: { taskId, error: String(error) } });
          }
        }
      } else if (command.kind === "pick_area") {
        const view = await readyView(command);
        setStatus("\u0430\u0433\u0435\u043D\u0442: \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u043C\u044B\u0448\u044C\u044E \xB7 Esc \u2014 \u043E\u0442\u043C\u0435\u043D\u0430");
        if (view === null || view.executeJavaScript === void 0) {
          setStatus("\u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E: guest \u043D\u0435 \u0433\u043E\u0442\u043E\u0432");
        } else {
          try {
            await view.executeJavaScript(AREA_SCRIPT, true);
            const startedArea = Date.now();
            const areaTimer = window.setInterval(() => {
              const target = activeGuest();
              if (target === null || target.executeJavaScript === void 0) {
                window.clearInterval(areaTimer);
                return;
              }
              if (Date.now() - startedArea > 12e4) {
                window.clearInterval(areaTimer);
                setStatus("\u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438: \u0432\u0440\u0435\u043C\u044F \u0438\u0441\u0442\u0435\u043A\u043B\u043E");
                return;
              }
              void target.executeJavaScript(PICKER_POLL, false).then((value) => {
                if (value === null || value === void 0) return;
                window.clearInterval(areaTimer);
                const raw = typeof value === "string" ? value : "";
                if (raw === "") {
                  setStatus("\u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E");
                  return;
                }
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed.kind !== "area") {
                    setStatus("\u043E\u0431\u043B\u0430\u0441\u0442\u044C \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u0430");
                    return;
                  }
                  area = parsed;
                  setStatus(`\u043E\u0431\u043B\u0430\u0441\u0442\u044C ${parsed.rect?.width ?? 0}\xD7${parsed.rect?.height ?? 0} \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430`);
                } catch {
                  setStatus("\u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0432\u0435\u0440\u043D\u0443\u043B\u0430 \u043D\u0435\u0447\u0438\u0442\u0430\u0435\u043C\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435");
                }
              }).catch(() => void 0);
            }, 250);
          } catch (error) {
            setStatus(`\u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043D\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u043E\u0441\u044C: ${String(error)}`);
          }
        }
      } else if (command.kind === "wait") {
        const view = await readyView(command);
        const parsedSpec = normalizeWait(command.args);
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { waitResult: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)", at: Date.now() } });
        } else if (!parsedSpec.ok) {
          await report(base, { waitResult: { met: false, invalid: true, message: parsedSpec.reason, at: Date.now() } });
        } else {
          const spec = parsedSpec.spec;
          const startedAt = Date.now();
          let detail = {};
          let outcome = null;
          let lastBeat = startedAt;
          const stillHeld = () => {
            if (controlHolder === "human") return "human";
            for (const candidate of sessions.values()) if (candidate.guest === view) return null;
            return "closed";
          };
          while (outcome === null) {
            const aborted = stillHeld();
            if (aborted !== null) {
              outcome = { met: false, timedOut: false, aborted, waitedMs: Date.now() - startedAt, detail };
              break;
            }
            if (Date.now() - lastBeat >= 4e3) {
              lastBeat = Date.now();
              await report(base, {}).catch(() => void 0);
            }
            try {
              const raw = await withTimeout(view.executeJavaScript(waitScript(spec), false), 4e3, "E_TIMEOUT");
              const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
              if (parsed.status === "ERROR") {
                outcome = { met: false, invalid: true, message: String(parsed.message ?? "\u043E\u0448\u0438\u0431\u043A\u0430 \u0443\u0441\u043B\u043E\u0432\u0438\u044F"), waitedMs: Date.now() - startedAt };
              } else {
                detail = parsed.detail ?? {};
                if (parsed.met === true) outcome = { met: true, timedOut: false, waitedMs: Date.now() - startedAt, detail };
              }
            } catch (error) {
              detail = { error: String(error) };
            }
            if (outcome === null) {
              if (Date.now() - startedAt >= spec.timeoutMs) outcome = { met: false, timedOut: true, waitedMs: Date.now() - startedAt, detail };
              else await new Promise((resolve) => setTimeout(resolve, 200));
            }
          }
          await report(base, { waitResult: { ...outcome, at: Date.now() } });
          setStatus(outcome.met === true ? `\u0443\u0441\u043B\u043E\u0432\u0438\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E \u0437\u0430 ${String(outcome.waitedMs)} \u043C\u0441` : `\u043E\u0436\u0438\u0434\u0430\u043D\u0438\u0435: \u0443\u0441\u043B\u043E\u0432\u0438\u0435 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E`);
        }
      } else if (command.kind === "navigate" && controlHolder === "human") {
        await report(base, { navResult: { ok: false, reason: "E_HUMAN_CONTROL: \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430", at: Date.now() } });
      } else if (command.kind === "navigate") {
        noteAgentAction();
        const view = await readyView(command);
        const action = String(command.args.action ?? "");
        if (view === null) {
          await report(base, { navResult: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)", at: Date.now() } });
        } else {
          const before = view.getURL?.() ?? "";
          let outcome = navigateGuest(view, action);
          if (outcome.ok) {
            const deadline = Date.now() + 3e3;
            while (action !== "reload" && Date.now() < deadline && (view.getURL?.() ?? "") === before) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (action === "reload") await new Promise((resolve) => setTimeout(resolve, 500));
            if (action === "back" && (view.getURL?.() ?? "").startsWith("about:blank")) {
              view.goForward?.();
              await new Promise((resolve) => setTimeout(resolve, 500));
              outcome = { ok: false, reason: "\u043D\u0430\u0447\u0430\u043B\u043E \u0438\u0441\u0442\u043E\u0440\u0438\u0438: \u0434\u0430\u043B\u044C\u0448\u0435 \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u043B\u0443\u0436\u0435\u0431\u043D\u0430\u044F \u043F\u0443\u0441\u0442\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430" };
            } else if (action !== "reload" && (view.getURL?.() ?? "") === before) {
              outcome = { ok: false, reason: "\u0430\u0434\u0440\u0435\u0441 \u043D\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u0437\u0430 3 \u0441 (\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043C\u043E\u0433\u043B\u0430 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u0445\u043E\u0434)" };
            }
          }
          await report(base, { navResult: { ...outcome, url: view.getURL?.() ?? "", at: Date.now() } });
          setStatus(outcome.ok ? `\u0430\u0433\u0435\u043D\u0442: ${action}` : `\u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0430: ${outcome.reason}`);
        }
      } else if (command.kind === "js") {
        const view = await readyView(command);
        const code = typeof command.args.code === "string" ? command.args.code.slice(0, 4e3) : "";
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { jsResult: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)", at: Date.now() } });
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(jsScript(code), false), 8e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            if (parsed.status === "OK") await report(base, { jsResult: { status: "OK", json: parsed.json ?? "null", truncated: parsed.truncated === true, at: Date.now() } });
            else await report(base, { jsResult: { status: "ERROR", message: String(parsed.message ?? "\u043E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F"), at: Date.now() } });
          } catch (error) {
            await report(base, { jsResult: { status: "ERROR", message: String(error), at: Date.now() } });
          }
        }
      } else if (command.kind === "color_scheme") {
        const view = await readyView(command);
        const mode = command.args.mode === "dark" || command.args.mode === "light" ? command.args.mode : "auto";
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { schemeResult: { error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)", at: Date.now() } });
        } else {
          try {
            const raw = await withTimeout(view.executeJavaScript(colorSchemeScript(mode), false), 5e3, "E_TIMEOUT");
            const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
            if (parsed.status === "ERROR") await report(base, { schemeResult: { error: String(parsed.message ?? "\u043E\u0448\u0438\u0431\u043A\u0430"), at: Date.now() } });
            else {
              for (const candidate of sessions.values()) {
                if (candidate.guest === view) candidate.colorScheme = rememberedScheme(mode);
              }
              await report(base, { schemeResult: { ...parsed, at: Date.now() } });
              setStatus(`\u0442\u0435\u043C\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B: ${mode}`);
            }
          } catch (error) {
            await report(base, { schemeResult: { error: String(error), at: Date.now() } });
          }
        }
      } else if (command.kind === "viewport") {
        const zoom = Number(command.args.zoom ?? 1);
        const view = await readyView(command);
        if (view !== null && view.setZoomFactor !== void 0 && Number.isFinite(zoom)) {
          try {
            view.setZoomFactor(Math.min(2, Math.max(0.5, zoom)));
            setStatus(`\u043C\u0430\u0441\u0448\u0442\u0430\u0431 ${zoom}`);
          } catch (error) {
            setStatus(`\u043C\u0430\u0441\u0448\u0442\u0430\u0431 \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0451\u043D: ${String(error)}`);
          }
        }
      } else if (command.kind === "viewport_width") {
        const view = await readyView(command);
        const target = Number(command.args.width ?? 0);
        if (view === null || view.executeJavaScript === void 0 || view.setZoomFactor === void 0) {
          await report(base, { viewportResult: { width: target, innerWidth: 0, zoom: 1, error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D (\u043F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u043A\u043B\u0430\u0434\u043A\u0443)" } });
        } else {
          try {
            const readWidth = async () => {
              const raw = await withTimeout(view.executeJavaScript("String(window.innerWidth)", false), 4e3, "E_TIMEOUT");
              const parsed = Number.parseInt(typeof raw === "string" ? raw : "", 10);
              return Number.isFinite(parsed) ? parsed : 0;
            };
            const currentZoom = typeof view.getZoomFactor === "function" ? view.getZoomFactor() : 1;
            const from = await readWidth();
            if (from <= 0 || target <= 0) throw new Error("\u0448\u0438\u0440\u0438\u043D\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430");
            const nextZoom = Math.min(3, Math.max(0.25, currentZoom * (from / target)));
            view.setZoomFactor(nextZoom);
            await new Promise((resolve) => setTimeout(resolve, 300));
            const after = await readWidth();
            await report(base, { viewportResult: { width: target, innerWidth: after, zoom: nextZoom, error: "" } });
            setStatus(`\u0448\u0438\u0440\u0438\u043D\u0430 ${after}px (\u043C\u0430\u0441\u0448\u0442\u0430\u0431 ${nextZoom.toFixed(2)})`);
          } catch (error) {
            await report(base, { viewportResult: { width: target, innerWidth: 0, zoom: 1, error: String(error) } });
            setStatus(`\u0448\u0438\u0440\u0438\u043D\u0430 \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0430: ${String(error)}`);
          }
        }
      } else if (command.kind === "verify") {
        const view = await readyView(command);
        const taskId = String(command.args.taskId ?? "");
        const target = String(command.args.selector ?? "");
        const method = String(command.args.method ?? "computed");
        const property = String(command.args.property ?? "");
        setStatus(`\u0430\u0433\u0435\u043D\u0442: \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E ${property === "" ? method : property}`);
        if (view === null || view.executeJavaScript === void 0) {
          await report(base, { verify: { taskId, commandId: command.id, error: "E_GUEST_GONE: \u0433\u043E\u0441\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D" } });
        } else {
          const reload = verifyNeedsReload(command.args);
          if (reload) view.reload?.();
          await new Promise((resolve) => setTimeout(resolve, verifySettleMs(reload)));
          try {
            const rawResult = await withTimeout(
              view.executeJavaScript(measureScript(target, method, property, String(command.args.tag ?? "")), false),
              5e3,
              "E_TIMEOUT"
            );
            let parsed = {};
            try {
              parsed = typeof rawResult === "string" ? JSON.parse(rawResult) : {};
            } catch {
              parsed = { status: "ERROR", value: String(rawResult) };
            }
            if (parsed.status === "OK" && typeof parsed.value === "string") {
              await report(base, { verify: { taskId, commandId: command.id, value: parsed.value } });
              setStatus(`\u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E: ${parsed.value.slice(0, 80)}`);
            } else if (parsed.status === "MISSING") {
              await report(base, { verify: { taskId, commandId: command.id, error: "E_STALE: \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" } });
            } else if (parsed.status === "AMBIGUOUS") {
              await report(base, { verify: { taskId, commandId: command.id, error: `E_AMBIGUOUS: \u043B\u043E\u043A\u0430\u0442\u043E\u0440 \u043D\u0430\u0448\u0451\u043B ${parsed.count ?? 0} \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432` } });
            } else if (parsed.status === "STALE") {
              await report(base, { verify: { taskId, error: `E_STALE: \u0442\u0435\u0433 ${parsed.tag ?? "?"} \u0432\u043C\u0435\u0441\u0442\u043E ${parsed.expect ?? "?"}` } });
            } else {
              await report(base, { verify: { taskId, error: parsed.value ?? "\u0437\u0430\u043C\u0435\u0440 \u043D\u0435 \u0443\u0434\u0430\u043B\u0441\u044F" } });
            }
          } catch (error) {
            await report(base, { verify: { taskId, commandId: command.id, error: String(error) } });
          }
        }
      }
    }
    await report(base, {
      stage: "ready",
      url: activeGuest()?.getURL?.() ?? "",
      status,
      hasGuest: activeGuest() !== null,
      evidence,
      console: consoleRing.slice(-200),
      crop,
      area,
      hidden: typeof document !== "undefined" && document.visibilityState === "hidden",
      counters,
      sessions: listSessions(),
      activeTab: activeTabId,
      panels: mountedPaneKeys.size,
      panes: [...mountedPaneKeys],
      lastNavAttempt,
      shortcutState,
      clientRev: CLIENT_REV,
      panelMounts,
      lastLoadError,
      control: controlHolder,
      agentActive: Date.now() < agentActiveUntil
    });
  };
  void tick();
  const pollTimer = window.setInterval(() => void tick(), 2500);
  const hintTimer = window.setTimeout(() => {
    if (sessions.size === 0) {
      setStatus("\u043D\u0435\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0438: \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u2318T (Ctrl+T) \u2014 \u043F\u0435\u0440\u0432\u0443\u044E \u0432\u043A\u043B\u0430\u0434\u043A\u0443 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0447\u0435\u043B\u043E\u0432\u0435\u043A, \u0434\u0430\u043B\u044C\u0448\u0435 \u0430\u0433\u0435\u043D\u0442 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u0430\u043C");
    }
  }, 6e3);
  const idleTimer = window.setInterval(collectIdleSessions, 6e4);
  stopEngine = () => {
    if (!loopStarted) return;
    loopStarted = false;
    window.clearInterval(pollTimer);
    window.clearTimeout(hintTimer);
    window.clearInterval(idleTimer);
    stopEngine = () => void 0;
  };
  return stopEngine;
}

// src/client/picker-source.ts
var COMPUTED_PROPERTIES = [
  "display",
  "position",
  "visibility",
  "opacity",
  "z-index",
  "overflow",
  "box-sizing",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "gap",
  "row-gap",
  "column-gap",
  "flex-direction",
  "align-items",
  "justify-content",
  "grid-template-columns",
  "grid-template-rows",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "color",
  "background-color",
  "background-image",
  "border-radius",
  "border-width",
  "border-style",
  "border-color",
  "box-shadow",
  "transform",
  "transition-duration",
  "cursor",
  "text-align",
  "white-space",
  "word-break"
];
var PICKER_SCRIPT = `
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
      // Bind the payload to the nonce the panel generated for this picker run:
      // a stale or foreign payload is rejected by the panel instead of trusted.
      var nonce = window.__startapusNonce || '';
      if (typeof value === 'string' && value.charAt(0) === '{') {
        try {
          var parsed = JSON.parse(value);
          parsed.nonce = nonce;
          value = JSON.stringify(parsed);
        } catch (error) {
          value = 'ERROR:' + String(error && error.message ? error.message : error);
        }
      }
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
`;
var PICKER_POLL2 = "window.__startapusPick === undefined ? null : window.__startapusPick";

// src/client/panel.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var STYLES = `
.dsh-startapus-browser { position:relative; display:flex; flex-direction:column; height:100%; min-height:0; font-size:12px; }
.dsh-startapus-browser-toolbar { display:flex; align-items:center; gap:4px; padding:6px 8px; border-bottom:1px solid color-mix(in srgb, currentColor 12%, transparent); }
.dsh-startapus-browser-btn { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border:none; border-radius:6px; background:transparent; color:inherit; cursor:pointer; }
.dsh-startapus-browser-btn svg { width:16px; height:16px; display:block; }
.dsh-startapus-browser-btn:hover { background:color-mix(in srgb, currentColor 10%, transparent); }
.dsh-startapus-browser-address { flex:1; min-width:0; height:26px; padding:0 8px; border:1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius:6px; background:transparent; color:inherit; font:inherit; outline:none; }
.dsh-startapus-browser-status { padding:4px 10px 8px; opacity:0.72; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-startapus-browser-host { flex:1; min-height:0; }
.dsh-startapus-browser-tasksBtn { width:auto; padding:0 8px; font-size:11px; }
.dsh-startapus-browser-tasks { position:absolute; top:34px; left:8px; right:8px; max-height:60%; overflow:auto; z-index:7; display:flex; flex-direction:column; gap:6px; padding:8px; border-radius:8px; background:color-mix(in srgb, #111 92%, white 8%); box-shadow:0 6px 24px rgba(0,0,0,0.4); font-size:11px; }
.dsh-startapus-browser-tasksHead { display:flex; align-items:center; justify-content:space-between; }
.dsh-startapus-browser-tasks ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:4px; }
.dsh-startapus-browser-tasks li { display:grid; grid-template-columns:auto 1fr; gap:2px 6px; padding:4px 6px; border-radius:6px; background:color-mix(in srgb, currentColor 6%, transparent); }
.dsh-startapus-browser-taskState { grid-row:span 2; align-self:center; font-size:10px; padding:1px 6px; border-radius:10px; background:color-mix(in srgb, currentColor 12%, transparent); }
.dsh-startapus-browser-taskText { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-startapus-browser-taskMeta { opacity:0.6; }
.dsh-startapus-browser-tasksEmpty, .dsh-startapus-browser-tasksErr { opacity:0.7; }
.dsh-startapus-browser-crash { position:absolute; top:34px; left:8px; right:8px; z-index:6; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 8px; border-radius:6px; font-size:11px; background:color-mix(in srgb, #d9534f 28%, #111 72%); box-shadow:0 2px 10px rgba(0,0,0,0.3); }
.dsh-startapus-browser-crash button { font-size:11px; padding:2px 8px; cursor:pointer; }
.dsh-startapus-browser-control { position:absolute; top:34px; left:8px; right:8px; z-index:5; display:flex; align-items:center; gap:8px; padding:5px 8px; border-radius:6px; font-size:11px; background:color-mix(in srgb, #f5a623 22%, #111 78%); box-shadow:0 2px 10px rgba(0,0,0,0.25); }
.dsh-startapus-browser-control button { border:1px solid currentColor; border-radius:5px; background:transparent; color:inherit; font:inherit; padding:2px 8px; cursor:pointer; }
`;
function StartapusBrowserPanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelChrome, { ...props }) });
}
function PanelChrome(props) {
  const tabKey = props.tabKey ?? "startapus-browser";
  const initialUrl = typeof props.params?.url === "string" ? props.params.url : "https://startapus.com";
  const hostRef = (0, import_react4.useRef)(null);
  const [snapshot, setSnapshot] = (0, import_react4.useState)(() => engineState());
  const [draft, setDraft] = (0, import_react4.useState)(initialUrl);
  const [editing, setEditing] = (0, import_react4.useState)(false);
  const [addressNote, setAddressNote] = (0, import_react4.useState)("");
  const typedSinceFocus = (0, import_react4.useRef)(false);
  const [picking, setPicking] = (0, import_react4.useState)(false);
  const [tasksOpen, setTasksOpen] = (0, import_react4.useState)(false);
  const [taskRows, setTaskRows] = (0, import_react4.useState)([]);
  const [tasksError, setTasksError] = (0, import_react4.useState)("");
  const pickingRef = (0, import_react4.useRef)(false);
  (0, import_react4.useEffect)(() => {
    notePanelMounted(tabKey);
    return () => notePanelUnmounted(tabKey);
  }, [tabKey]);
  (0, import_react4.useEffect)(() => {
    const off = subscribeEngine(() => setSnapshot(engineState()));
    setSnapshot(engineState());
    return off;
  }, []);
  (0, import_react4.useEffect)(() => {
    const host = hostRef.current;
    if (host === null) return;
    setPaneState(tabKey, { url: initialUrl, host, visible: props.visible !== false });
    if (props.visible === false) {
      focusStartapusTab(tabKey);
      if (props.visible !== true) activateOwnTab();
    }
    const observer = new ResizeObserver(() => {
      setPaneState(tabKey, { host: hostRef.current, visible: props.visible !== false });
      if (props.visible !== false) setSessionRect(tabKey, true);
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
      detachSession(tabKey);
    };
  }, [tabKey, initialUrl]);
  (0, import_react4.useEffect)(() => {
    const paneVisible = () => {
      let node = hostRef.current;
      if (node === null || !node.isConnected) return false;
      for (let depth = 0; node !== null && depth < 10; depth += 1) {
        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const box = node.getBoundingClientRect();
        if (style.display !== "contents" && (box.width <= 1 || box.height <= 1)) return false;
        node = node.parentElement;
      }
      return true;
    };
    const reportVisibility = () => {
      setPaneState(tabKey, { url: initialUrl, host: hostRef.current, visible: paneVisible() });
    };
    reportVisibility();
    const visibilityTimer = window.setInterval(reportVisibility, 700);
    window.addEventListener("resize", reportVisibility);
    return () => {
      window.clearInterval(visibilityTimer);
      window.removeEventListener("resize", reportVisibility);
    };
  }, [tabKey, initialUrl]);
  const togglePick = (0, import_react4.useCallback)(() => {
    const next = !pickingRef.current;
    pickingRef.current = next;
    setPicking(next);
    setStatus(next ? "\u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435" : "\u0432\u044B\u0431\u043E\u0440 \u043E\u0442\u043C\u0435\u043D\u0451\u043D");
    if (!next) return;
    void (async () => {
      try {
        const nonce = `pick-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        await runInActive(`window.__startapusNonce = ${JSON.stringify(nonce)}`, 3e3);
        await runInActive(PICKER_SCRIPT, 1e4);
        for (; ; ) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (!pickingRef.current) return;
          const raw = await runInActive(PICKER_POLL2, 5e3).catch(() => null);
          if (typeof raw !== "string" || raw === "") continue;
          const pick = JSON.parse(raw);
          if (pick.nonce !== nonce) {
            setStatus("\u0432\u044B\u0431\u043E\u0440 \u043E\u0442\u043A\u043B\u043E\u043D\u0451\u043D: \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043D\u0435 \u043E\u0442 \u044D\u0442\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u043F\u0438\u043A\u0435\u0440\u0430");
            void runInActive("window.__startapusPick = undefined", 2e3).catch(() => void 0);
            continue;
          }
          void runInActive("window.__startapusPick = undefined", 2e3).catch(() => void 0);
          pickingRef.current = false;
          setPicking(false);
          setEvidence(pick);
          setStatus(`\u0432\u044B\u0431\u0440\u0430\u043D: ${String(pick.selector).slice(0, 80)}`);
          props.onPick?.(pick);
          return;
        }
      } catch (error) {
        pickingRef.current = false;
        setPicking(false);
        setStatus(`\u0432\u044B\u0431\u043E\u0440 \u043D\u0435 \u0443\u0434\u0430\u043B\u0441\u044F: ${String(error)}`);
      }
    })();
  }, [props]);
  (0, import_react4.useEffect)(() => {
    return setTabCloser(tabKey, () => props.onClose?.() === true);
  }, [tabKey, props]);
  (0, import_react4.useEffect)(() => {
    setViewHooks({
      pickRequested: () => togglePick(),
      closeRequested: () => props.onClose?.() === true,
      openTabRequested: (url) => props.onOpenTab?.(url) === true,
      focusTabRequested: (tabId) => props.onFocusTab?.(tabId) === true
    });
  }, [togglePick, props]);
  const navigate = (0, import_react4.useCallback)((next) => {
    const result = openInSession(tabKey, next, true);
    let host = "";
    try {
      host = new URL(result.url).host;
    } catch {
      host = "";
    }
    void note("address:submit", { ok: result.ok, reason: result.reason, host, length: next.length });
    setAddressNote(result.ok ? "" : `\u0410\u0434\u0440\u0435\u0441 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0442: ${result.reason}`);
    if (!result.ok) setStatus(`\u0430\u0434\u0440\u0435\u0441: ${result.reason}`);
  }, [tabKey]);
  const go = (0, import_react4.useCallback)((direction) => {
    const guest = guestOf(tabKey) ?? activeGuest();
    if (guest === null) return;
    if (direction === "back") guest.goBack?.();
    else if (direction === "forward") guest.goForward?.();
    else guest.reload?.();
  }, [tabKey]);
  const copyAddress = (0, import_react4.useCallback)(() => {
    const target = snapshot.url === "" ? draft : snapshot.url;
    if (target === "") {
      setStatus("\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435: \u0430\u0434\u0440\u0435\u0441 \u043F\u0443\u0441\u0442");
      return;
    }
    void navigator.clipboard.writeText(target).then(() => setStatus(`\u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E: ${target}`)).catch((error) => setStatus(`\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C: ${String(error)}`));
  }, [draft, snapshot.url]);
  const openExternally = (0, import_react4.useCallback)(() => {
    const target = snapshot.url === "" ? draft : snapshot.url;
    if (!/^https?:/i.test(target)) {
      setStatus("\u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0432\u043E\u0432\u043D\u0435: \u043D\u0443\u0436\u0435\u043D http(s) \u0430\u0434\u0440\u0435\u0441");
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
    setStatus(`\u043E\u0442\u043A\u0440\u044B\u0442\u043E \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E: ${target}`);
  }, [draft, snapshot.url]);
  const desired = desiredUrlFor(tabKey) ?? "";
  const shownUrl = snapshot.url !== "" ? snapshot.url : desired;
  const address = editing ? draft : shownUrl === "" ? draft : shownUrl;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-startapus-browser", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: STYLES }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-startapus-browser-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-startapus-browser-btn", onClick: () => go("back"), title: "\u041D\u0430\u0437\u0430\u0434", "aria-label": "\u041D\u0430\u0437\u0430\u0434", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FiChevronLeft, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-startapus-browser-btn", onClick: () => go("forward"), title: "\u0412\u043F\u0435\u0440\u0451\u0434", "aria-label": "\u0412\u043F\u0435\u0440\u0451\u0434", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FiChevronRight, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-startapus-browser-btn", onClick: () => go("reload"), title: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C", "aria-label": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FiRotateCw, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          className: "dsh-startapus-browser-address",
          value: address,
          placeholder: "https://\u2026",
          onChange: (event) => {
            setDraft(event.target.value);
            if (addressNote !== "") setAddressNote("");
            if (!typedSinceFocus.current) {
              typedSinceFocus.current = true;
              void note("address:input", { length: event.target.value.length });
            }
          },
          onFocus: (event) => {
            typedSinceFocus.current = false;
            void note("address:focus", {});
            setDraft(shownUrl);
            setEditing(true);
            event.currentTarget.select();
          },
          onBlur: () => {
            setEditing(false);
            const active = document.activeElement;
            void note("address:blur", { typed: typedSinceFocus.current, to: active === null ? "" : `${active.tagName.toLowerCase()}${active.id === "" ? "" : `#${active.id}`}` });
          },
          onKeyDown: (event) => {
            if (event.key !== "Enter") return;
            void note("address:enter", { editing, draftLength: draft.length });
            navigate(draft);
            setEditing(false);
            event.currentTarget.blur();
          },
          "aria-label": "\u0410\u0434\u0440\u0435\u0441"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "dsh-startapus-browser-btn dsh-startapus-browser-tasksBtn",
          onClick: () => {
            const next = !tasksOpen;
            setTasksOpen(next);
            if (!next) return;
            setTasksError("");
            void fetch(`${location.origin}/startapus-browser/tasks`).then((response) => response.json()).then((body) => {
              setTaskRows(Array.isArray(body.tasks) ? body.tasks.slice(-30).reverse() : []);
            }).catch((error) => setTasksError(String(error)));
          },
          title: "\u041E\u0447\u0435\u0440\u0435\u0434\u044C \u0437\u0430\u0434\u0430\u0447 \u0440\u0435\u0432\u044C\u044E",
          "aria-label": "\u041E\u0447\u0435\u0440\u0435\u0434\u044C \u0437\u0430\u0434\u0430\u0447 \u0440\u0435\u0432\u044C\u044E",
          children: "\u0417\u0430\u0434\u0430\u0447\u0438"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-startapus-browser-btn", onClick: copyAddress, title: "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0430\u0434\u0440\u0435\u0441", "aria-label": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0430\u0434\u0440\u0435\u0441", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FiCopy, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-startapus-browser-btn", onClick: openExternally, title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E", "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FiExternalLink, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "dsh-startapus-browser-btn",
          onClick: togglePick,
          title: picking ? "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0432\u044B\u0431\u043E\u0440" : "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u044D\u043B\u0435\u043C\u0435\u043D\u0442",
          "aria-label": "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u044D\u043B\u0435\u043C\u0435\u043D\u0442",
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FiCrosshair, {})
        }
      )
    ] }),
    addressNote === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { role: "alert", style: { padding: "4px 10px", fontSize: 11, color: "#e5484d" }, children: addressNote }),
    tasksOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-startapus-browser-tasks", role: "dialog", "aria-label": "\u041E\u0447\u0435\u0440\u0435\u0434\u044C \u0437\u0430\u0434\u0430\u0447", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-startapus-browser-tasksHead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u041E\u0447\u0435\u0440\u0435\u0434\u044C \u0437\u0430\u0434\u0430\u0447" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => setTasksOpen(false), children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })
      ] }),
      tasksError !== "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-startapus-browser-tasksErr", children: tasksError }),
      taskRows.length === 0 && tasksError === "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-startapus-browser-tasksEmpty", children: "\u0417\u0430\u0434\u0430\u0447 \u043D\u0435\u0442" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: taskRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `dsh-startapus-browser-taskState state-${row.state}`, children: row.state }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-startapus-browser-taskText", children: row.problem }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-startapus-browser-taskMeta", children: [
          row.id,
          " \xB7 \u043F\u043E\u043F\u044B\u0442\u043E\u043A ",
          row.attempts
        ] })
      ] }, row.id)) })
    ] }),
    (() => {
      const crash = crashedInfo(tabKey);
      if (crash === null) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-startapus-browser-crash", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          "\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430: ",
          crash.reason,
          ". \u0410\u0434\u0440\u0435\u0441 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D."
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => restoreCrashedTab(tabKey), children: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C" })
      ] });
    })(),
    (snapshot.agentActive || snapshot.control === "human") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-startapus-browser-control", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: snapshot.control === "human" ? "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443 \u0432\u0430\u0441: \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0430\u0433\u0435\u043D\u0442\u0430 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B" : "\u0410\u0433\u0435\u043D\u0442 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435\u0439" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          onClick: () => {
            if (snapshot.control === "human") releaseToAgent();
            else takeHumanControl();
          },
          children: snapshot.control === "human" ? "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0430\u0433\u0435\u043D\u0442\u0443" : "\u0417\u0430\u0431\u0440\u0430\u0442\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: hostRef, className: "dsh-startapus-browser-host" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-startapus-browser-status", children: snapshot.status })
  ] });
}
var PanelBoundary = class extends import_react4.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  componentDidCatch(error) {
    setStatus(`\u043F\u0430\u043D\u0435\u043B\u044C \u0443\u043F\u0430\u043B\u0430: ${error instanceof Error ? error.message : String(error)}`);
  }
  render() {
    if (this.state.error !== null) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-startapus-browser", style: { padding: 12, fontSize: 12, lineHeight: 1.5 }, children: [
        "Startapus Browser: \u043F\u0430\u043D\u0435\u043B\u044C \u0443\u043F\u0430\u043B\u0430 \u2014 ",
        this.state.error
      ] });
    }
    return this.props.children;
  }
};

// src/client/element-refs.ts
var ELEMENT_SOURCE = "startapus-element";
var elements = /* @__PURE__ */ new Map();
var lexiconListeners = /* @__PURE__ */ new Set();
var seq = 0;
function notifyLexicon() {
  for (const listener of lexiconListeners) {
    try {
      listener();
    } catch {
    }
  }
}
function labelOf(ref) {
  return elements.get(ref)?.label ?? ref;
}
function rememberElement(pick) {
  seq += 1;
  const ref = `element-${seq}`;
  const label = `\u042D\u043B\u0435\u043C\u0435\u043D\u0442${seq}`;
  elements.set(ref, { label, pick });
  notifyLexicon();
  return { ref, label };
}
function tagLine(p) {
  const attrs = [];
  if (p.id !== "") attrs.push(` id="${p.id}"`);
  if (p.classes !== "") attrs.push(` class="${p.classes.slice(0, 120)}"`);
  if (p.role !== "") attrs.push(` role="${p.role}"`);
  if (p.testid !== void 0 && p.testid !== "") attrs.push(` data-testid="${p.testid}"`);
  return `<${p.tag}${attrs.join("")}>`;
}
function elementModelText(ref) {
  const entry = elements.get(ref);
  if (!entry) throw new Error(`\u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \xAB${ref}\xBB`);
  const p = entry.pick;
  const env = p.env;
  const url = env?.url ?? p.url ?? "";
  const title = env?.title ?? p.title ?? "";
  const lines = [];
  lines.push(`${entry.label} \u2014 \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B ${url}${title === "" ? "" : ` (\xAB${title}\xBB)`}:`);
  lines.push(`- \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440: ${p.selector}`);
  lines.push(`- \u0442\u0435\u0433: ${tagLine(p)}`);
  if (p.a11y !== void 0) {
    const a11yBits = [];
    if (p.a11y.role !== void 0 && p.a11y.role !== "") a11yBits.push(`role=${p.a11y.role}`);
    if (p.a11y.name !== void 0 && p.a11y.name !== "") a11yBits.push(`name="${p.a11y.name.slice(0, 80)}"`);
    if (p.a11y.ariaHidden !== void 0 && p.a11y.ariaHidden !== "") a11yBits.push(`aria-hidden=${p.a11y.ariaHidden}`);
    if (p.a11y.ariaExpanded !== void 0 && p.a11y.ariaExpanded !== "") a11yBits.push(`aria-expanded=${p.a11y.ariaExpanded}`);
    if (p.a11y.tabIndex !== void 0 && p.a11y.tabIndex !== "") a11yBits.push(`tabindex=${p.a11y.tabIndex}`);
    if (a11yBits.length > 0) lines.push(`- a11y: ${a11yBits.join(", ")}`);
  }
  if (p.text !== "") lines.push(`- \u0442\u0435\u043A\u0441\u0442: ${JSON.stringify(p.text.slice(0, 200))}`);
  if (p.href !== "") lines.push(`- href: ${p.href.slice(0, 160)}`);
  const rect = p.rect;
  const docX = rect.docX ?? rect.x;
  const docY = rect.docY ?? rect.y;
  const envBits = [];
  if (env?.viewport !== void 0) envBits.push(`viewport ${env.viewport.width}x${env.viewport.height}`);
  if (env?.dpr !== void 0) envBits.push(`dpr ${env.dpr}`);
  if (env?.zoom !== void 0 && env.zoom !== 1) envBits.push(`zoom ${env.zoom}`);
  if (env?.theme !== void 0) envBits.push(`theme ${env.theme}`);
  if (env !== void 0 && ((env.scrollX ?? 0) !== 0 || (env.scrollY ?? 0) !== 0)) {
    envBits.push(`scroll ${env.scrollX ?? 0},${env.scrollY ?? 0}`);
  }
  lines.push(`- \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435: ${rect.width}x${rect.height} @ ${rect.x},${rect.y} (\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ${docX},${docY})` + (envBits.length > 0 ? `; ${envBits.join("; ")}` : ""));
  if (p.box !== void 0) {
    const boxBits = [];
    if (p.box.clientWidth !== void 0) boxBits.push(`client ${p.box.clientWidth}x${p.box.clientHeight ?? 0}`);
    if (p.box.scrollWidth !== void 0) boxBits.push(`scroll ${p.box.scrollWidth}x${p.box.scrollHeight ?? 0}`);
    if (p.box.overflowX === true || p.box.overflowY === true) {
      boxBits.push(`\u043F\u0435\u0440\u0435\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 ${p.box.overflowX === true ? "X" : ""}${p.box.overflowY === true ? "Y" : ""}`);
    }
    if (boxBits.length > 0) lines.push(`- box: ${boxBits.join(", ")}`);
  }
  if (p.state !== void 0) {
    const stateBits = [];
    if (p.state.disabled === true) stateBits.push("disabled");
    if (p.state.readOnly === true) stateBits.push("readOnly");
    if (p.state.checked === true) stateBits.push("checked");
    if (p.state.hidden === true) stateBits.push("hidden");
    if (p.state.focused === true) stateBits.push("focused");
    if (p.state.inShadowRoot === true) stateBits.push("\u0432 shadow root");
    if (stateBits.length > 0) lines.push(`- \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435: ${stateBits.join(", ")}`);
  }
  const computed = p.computed ?? {};
  const keys = Object.keys(computed).sort().slice(0, 24);
  if (keys.length > 0) {
    const pairs = keys.map((key) => `${key}=${(computed[key] ?? "").slice(0, 60)}`);
    lines.push(`- computed (${Object.keys(computed).length}, \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B ${keys.length}): ${pairs.join("; ")}`);
  }
  const before = p.pseudo?.before?.content ?? "";
  const after = p.pseudo?.after?.content ?? "";
  if (before !== "" || after !== "") {
    const parts = [];
    if (before !== "") parts.push(`::before content=${before}`);
    if (after !== "") parts.push(`::after content=${after}`);
    lines.push(`- pseudo: ${parts.join("; ")}`);
  }
  const ancestors = p.ancestors ?? [];
  if (ancestors.length > 0) {
    const chain = ancestors.slice(0, 3).map((a) => {
      const cls = a.classes === "" ? "" : `.${a.classes.split(/\s+/).slice(0, 2).join(".")}`;
      return `${a.tag}${a.id === "" ? "" : `#${a.id}`}${cls}`;
    });
    lines.push(`- \u043F\u0440\u0435\u0434\u043A\u0438: ${chain.join(" < ")}`);
  }
  const fragment = p.fragment ?? [];
  if (fragment.length > 0) {
    lines.push(`- \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442 (${fragment.length} \u0443\u0437\u043B\u043E\u0432, \u0433\u043B\u0443\u0431\u0438\u043D\u0430 \u22644):`);
    for (const node of fragment.slice(0, 20)) {
      const cls = node.classes === "" ? "" : `.${node.classes.split(/\s+/).slice(0, 2).join(".")}`;
      const own = node.text === "" ? "" : ` "${node.text}"`;
      lines.push(`${"  ".repeat(Math.min(node.depth, 4))}<${node.tag}${node.id === "" ? "" : `#${node.id}`}${cls}>${own}`);
    }
    if (fragment.length > 20) lines.push(`  \u2026 \u0435\u0449\u0451 ${fragment.length - 20} \u0443\u0437\u043B\u043E\u0432`);
  }
  return lines.filter(Boolean).join("\n");
}
function elementSource() {
  return {
    trigger: "@",
    name: ELEMENT_SOURCE,
    order: 90,
    candidates: async () => [...elements.entries()].reverse().map(([ref, entry]) => ({
      name: entry.label,
      description: `<${entry.pick.tag}> ${entry.pick.text.slice(0, 60)}`,
      value: ref
    })),
    onPick: (pick) => {
      const ref = pick?.candidate?.value;
      const entry = ref === void 0 ? void 0 : elements.get(ref);
      if (pick?.action !== "pick" || ref === void 0 || entry === void 0) return void 0;
      return {
        insert: {
          source: ELEMENT_SOURCE,
          ref,
          label: entry.label,
          clipboardText: entry.label,
          appearance: "session"
        }
      };
    },
    lexicon: () => [...elements.values()].map((entry) => entry.label),
    subscribeLexicon: (_session, listener) => {
      lexiconListeners.add(listener);
      return () => lexiconListeners.delete(listener);
    },
    codec: {
      clipboardText: (ref) => labelOf(ref),
      serialize: async (ref) => elementModelText(ref)
    }
  };
}
function insertElementRef(ctx, sessionId, pick) {
  const sessions2 = ctx.sessions;
  const conversation = ctx.conversation;
  const binding = sessions2.binding(sessionId);
  if (binding === void 0) throw new Error("\u0441\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
  const input = conversation.input.for(binding.ctx);
  const state = input.state.getSnapshot();
  const { ref, label } = rememberElement(pick);
  const chipExtra = state.occurrences.reduce((sum, occurrence) => sum + (occurrence.length - 1), 0);
  const at = Math.max(0, state.draft.length - chipExtra);
  const applied = input.insertReference(
    { source: ELEMENT_SOURCE, ref, label, clipboardText: label, appearance: "session" },
    { start: at, end: at, draftRev: state.draftRev }
  );
  if (!applied) throw new Error("\u043A\u043E\u043C\u043F\u043E\u0437\u0435\u0440 \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B \u0432\u0441\u0442\u0430\u0432\u043A\u0443");
  return label;
}

// src/client/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var TAB_ID = "startapus-browser";
var TAB_KIND = "startapus-browser";
var inject = ["slots", "sidebarRightTabs"];
function StartapusMark({ size = 14 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      "aria-hidden": "true",
      style: { flex: "none" },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "1.6", y: "2.6", width: "12.8", height: "10.8", rx: "3", stroke: "currentColor", strokeWidth: "1.4" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M1.9 6.1h12.2", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "3.9", cy: "4.35", r: "0.65", fill: "currentColor" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "5.9", cy: "4.35", r: "0.65", fill: "currentColor" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5.2 10.1c0.45 0.9 1.6 1.5 2.8 1.5s2.35-0.6 2.8-1.5", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })
      ]
    }
  );
}
function StartapusArtwork() {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "100%", height: "100%", viewBox: "0 0 48 48", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "4.5", y: "7.5", width: "39", height: "33", rx: "9", stroke: "currentColor", strokeWidth: "2.6", opacity: "0.85" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5.2 17h37.6", stroke: "currentColor", strokeWidth: "2", opacity: "0.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "11", cy: "12.2", r: "1.9", fill: "#6DED6B" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "17.2", cy: "12.2", r: "1.9", fill: "#6DED6B" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M15 27c1.7 3.1 4.8 5 9 5s7.3-1.9 9-5", stroke: "#6DED6B", strokeWidth: "3", strokeLinecap: "round" })
  ] });
}
function StartapusTabTitle(props) {
  let tabId;
  try {
    const info = typeof props?.useTabInfo === "function" ? props.useTabInfo() : void 0;
    tabId = typeof info?.tab?.id === "string" ? info.tab.id : void 0;
  } catch {
    tabId = void 0;
  }
  let pageTitle = "";
  try {
    pageTitle = useTabTitle(tabId);
  } catch {
    pageTitle = "";
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0, maxWidth: "100%" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StartapusMark, {}),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: pageTitle === "" ? "Startapus" : pageTitle })
  ] });
}
function apply(ctx) {
  ctx.inject(["sidebarRight"], (inner) => {
    try {
      setTabsApi(inner);
    } catch {
    }
  });
  ctx.inject(["sidebarRightTabs"], (inner) => {
    try {
      setTabsApi(inner);
    } catch {
    }
  });
  try {
    registerTabsCloseHandler(TAB_ID, (tabId) => markTabClosing(tabId));
  } catch {
  }
  try {
    const onKeyDown = (event) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "t") return;
      const target = event.target;
      const tag = target?.tagName?.toLowerCase() ?? "";
      if (tag === "input" || tag === "textarea" || target?.isContentEditable === true) return;
      event.preventDefault();
      requestOpenTab();
    };
    window.addEventListener("keydown", onKeyDown, true);
    ctx.effect(() => () => window.removeEventListener("keydown", onKeyDown, true), "startapus-browser: shortcut listener");
  } catch {
  }
  try {
    ctx.inject(["shortcuts"], (scope) => {
      const service = scope.shortcuts;
      if (service === void 0 || typeof service.register !== "function") {
        noteShortcutState({ id: "startapus-browser.new", keys: "", ok: false, error: "servicio shortcuts \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D" });
        return;
      }
      const candidates = [
        { keys: "Cmd+T", defaults: { "desktop:macos": { code: "KeyT", modifiers: ["primary"] } } },
        { keys: "Cmd+Shift+T", defaults: { "desktop:macos": { code: "KeyT", modifiers: ["primary", "shift"] } } },
        { keys: "Cmd+Alt+B", defaults: { "desktop:macos": { code: "KeyB", modifiers: ["primary", "alt"] } } },
        { keys: "Cmd+Shift+B", defaults: { "desktop:macos": { code: "KeyB", modifiers: ["primary", "shift"] } } }
      ];
      let registered = false;
      let lastError = "";
      for (const candidate of candidates) {
        try {
          scope.effect(() => service.register?.({
            id: "startapus-browser.new",
            label: () => "\u041E\u0442\u043A\u0440\u044B\u0442\u044C Startapus Browser",
            aliases: ["startapus", "browser", "\u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0431\u0440\u0430\u0443\u0437\u0435\u0440"],
            defaults: candidate.defaults,
            regions: ["page", "editable"],
            modals: [],
            resolve: () => ({ status: "handled", run: () => {
              requestOpenTab();
            } })
          }) ?? (() => void 0), "startapus-browser: shortcut");
          noteShortcutState({ id: "startapus-browser.new", keys: candidate.keys, ok: true, error: "" });
          registered = true;
          break;
        } catch (error) {
          lastError = String(error instanceof Error ? error.message : error);
        }
      }
      if (!registered) {
        noteShortcutState({ id: "startapus-browser.new", keys: "", ok: false, error: lastError });
      }
    });
  } catch (error) {
    noteShortcutState({ id: "startapus-browser.new", keys: "", ok: false, error: String(error) });
  }
  try {
    setGuideFallback(() => {
      try {
        const title = "Startapus Browser";
        const nodes = Array.from(document.querySelectorAll('[role="button"], button, a'));
        for (const node of nodes) {
          if (!(node.textContent ?? "").includes(title)) continue;
          if (node.closest(".dsh-startapus-browser") !== null) continue;
          node.click();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });
  } catch {
  }
  try {
    setActivateFallback(() => {
      try {
        const layout = ctx.get("layout");
        if (layout?.openRightbar !== void 0) {
          layout.openRightbar("tabs", false);
          void note("layout:openRightbar", { track: "tabs" });
        }
      } catch (error) {
        void note("layout:openRightbar:error", { error: String(error) });
      }
      try {
        const chips = [];
        const walk = (root) => {
          for (const node of Array.from(root.querySelectorAll("*"))) {
            if (node.getAttribute("role") === "tab" || node.getAttribute("aria-selected") !== null) chips.push(node);
            if (node.shadowRoot !== null) walk(node.shadowRoot);
          }
        };
        walk(document);
        for (const node of chips) {
          const label = `${node.getAttribute("aria-label") ?? ""} ${node.title ?? ""} ${node.textContent ?? ""}`;
          if (!/Стартапус|Startapus/i.test(label)) continue;
          if (node.getAttribute("aria-selected") === "false") continue;
          node.click();
          void note("tab:activated", { label: label.slice(0, 60) });
          return true;
        }
        void note("dom:tabs", { scanned: chips.length });
        return false;
      } catch (error) {
        void note("dom:tabs:error", { error: String(error) });
        return false;
      }
    });
    try {
      ctx.inject(["shortcuts"], (scope) => {
        const service = scope.shortcuts;
        if (service === void 0 || typeof service.register !== "function") return;
        for (const candidate of [
          { keys: "Cmd+Shift+P", modifiers: ["primary", "shift"] },
          { keys: "Cmd+Alt+P", modifiers: ["primary", "alt"] }
        ]) {
          try {
            scope.effect(() => service.register?.({
              id: "startapus-browser.pick",
              label: () => "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 (Startapus)",
              aliases: ["startapus", "pick", "\u044D\u043B\u0435\u043C\u0435\u043D\u0442"],
              defaults: { "desktop:macos": { code: "KeyP", modifiers: candidate.modifiers } },
              regions: ["page"],
              modals: [],
              resolve: () => ({ status: "handled", run: () => {
                requestPick();
              } })
            }) ?? (() => void 0), "startapus-browser: pick shortcut");
            void note("shortcut:pick", { keys: candidate.keys, ok: true });
            break;
          } catch (error) {
            void note("shortcut:pick", { keys: candidate.keys, ok: false, error: String(error) });
          }
        }
      });
    } catch {
    }
    try {
      const onPickKey = (event) => {
        if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) return;
        if (event.key.toLowerCase() !== "p") return;
        event.preventDefault();
        requestPick();
      };
      window.addEventListener("keydown", onPickKey, true);
      ctx.effect(() => () => window.removeEventListener("keydown", onPickKey, true), "startapus-browser: pick listener");
    } catch {
    }
    ctx.effect(() => startEngine(), "startapus-browser: agent channel");
  } catch {
  }
  let composer;
  ctx.inject(["sessions", "conversation"], (inner) => {
    try {
      composer = inner;
    } catch {
    }
  });
  ctx.inject(["inputTriggers"], (inner) => {
    try {
      const registry = inner.inputTriggers;
      if (registry === void 0 || typeof registry.registerSource !== "function") return;
      ctx.effect(() => registry.registerSource(elementSource()), "startapus-browser: element source");
    } catch {
    }
  });
  const definition = {
    id: TAB_ID,
    kind: TAB_KIND,
    // Several Startapus tabs may coexist, like the built-in browser.
    multiple: true,
    // Sidebar keeps the DOM of an inactive tab mounted; without it a panel stops
    // polling as soon as another tab is focused.
    keepMounted: true,
    priority: "extension",
    title: () => "Startapus Browser",
    guide: [{
      id: "new",
      commandId: "startapus-browser.new",
      order: 10,
      title: () => "Startapus Browser",
      description: () => {
        const hint = shortcutHint();
        return hint === "" ? "\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u0432 \u043F\u0440\u0430\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438: \u043B\u044E\u0431\u044B\u0435 \u0441\u0430\u0439\u0442\u044B, \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432, \u0430\u0433\u0435\u043D\u0442\u0441\u043A\u0438\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B" : `${hint} \xB7 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u0432 \u043F\u0440\u0430\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438: \u043B\u044E\u0431\u044B\u0435 \u0441\u0430\u0439\u0442\u044B, \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432`;
      },
      icon: StartapusArtwork
    }]
  };
  ctx.effect(() => {
    return ctx.sidebarRightTabs.register(definition);
  }, "startapus-browser: tab type");
  ctx.effect(() => ctx.slots.inject(
    "sidebar.right.pane.tab",
    () => ctx.slots.register({
      name: "sidebar.right.pane.tab",
      key: TAB_ID
    }, (props) => {
      const useTabInfo = props.useTabInfo;
      let info;
      try {
        info = typeof useTabInfo === "function" ? useTabInfo() : void 0;
      } catch {
        info = void 0;
      }
      const tabId = typeof info?.tab?.id === "string" ? info.tab.id : void 0;
      const params = info?.tab?.navigation?.params;
      const requestedUrl2 = typeof params?.url === "string" ? params.url : void 0;
      const tabVisible = info?.tab?.visible === true;
      const actions = props.actions;
      const sessionId = props?.sessionId;
      const onClose = () => {
        try {
          if (actions?.closeTab === void 0 || typeof sessionId !== "string" || tabId === void 0) return false;
          actions.closeTab(sessionId, tabId);
          return true;
        } catch {
          return false;
        }
      };
      const onOpenTab = (url) => {
        try {
          if (actions?.openTab === void 0) return false;
          actions.openTab(TAB_KIND, url === "" ? {} : { params: { url } });
          return true;
        } catch {
          return false;
        }
      };
      const onFocusTab = (target) => {
        try {
          if (actions?.focusTab === void 0 || typeof sessionId !== "string") return false;
          actions.focusTab(sessionId, target);
          return true;
        } catch {
          return false;
        }
      };
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        StartapusBrowserPanel,
        {
          tabKey: tabId,
          visible: tabVisible,
          onClose,
          onOpenTab,
          onFocusTab,
          params: requestedUrl2 === void 0 ? void 0 : { url: requestedUrl2 },
          sessionId: props?.sessionId,
          onPick: (pick) => {
            const sessionId2 = props?.sessionId;
            if (composer === void 0) return { ok: false, reason: "\u043A\u043E\u043C\u043F\u043E\u0437\u0435\u0440 \u0435\u0449\u0451 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D" };
            if (typeof sessionId2 !== "string" || sessionId2 === "") {
              return { ok: false, reason: "\u043D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438" };
            }
            try {
              return { ok: true, label: insertElementRef(composer, sessionId2, pick) };
            } catch (error) {
              return { ok: false, reason: String(error) };
            }
          }
        }
      );
    })
  ), "startapus-browser: tab body");
  ctx.effect(() => {
    try {
      return ctx.slots.inject(
        "sidebar.right.pane.tab.title",
        () => ctx.slots.register({
          name: "sidebar.right.pane.tab.title",
          key: TAB_ID
        }, StartapusTabTitle)
      );
    } catch {
      return void 0;
    }
  }, "startapus-browser: tab title");
}
    return module.exports;
  }
});
