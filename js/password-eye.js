/* ==========================================================================
   GAD MIVNIM — password-eye.js: כפתור "עין" (הצגה / הסתרה) לכל שדה סיסמה באתר — קובץ אחד, כולל העיצוב.
   - כל <input type="password"> מקבל כפתור בתוך השדה, בצד שמאל; גם שדות שנוצרים אחר כך (חלונות, שלב "סיסמה חדשה").
   - ברירת מחדל: מוסתר. בשליחת הטופס ובעזיבת הדף — חוזר למוסתר.
   - window.GMPasswordEye.show(input, true|false) — להצגה מקוד (למשל אחרי "יצירת סיסמה חזקה").
   ========================================================================== */
(function () {
  'use strict';
  var SVG = ' viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var ICONS =
    '<svg class="gm-eye-on"' + SVG + '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<svg class="gm-eye-off"' + SVG + '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  var style = document.createElement('style');
  style.textContent =
    '.gm-eye-wrap{position:relative;display:block;width:100%}' +
    '.gm-eye-wrap>input{width:100%;box-sizing:border-box;padding-left:52px!important}' +
    '.gm-eye-wrap>.gm-eye{position:absolute;left:2px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:44px;height:44px;min-width:0;min-height:0;margin:0;padding:0;border:0;border-radius:10px;background:transparent;color:var(--lb,#38bdf8);cursor:pointer}' +
    '.gm-eye-wrap>.gm-eye:hover{background:rgba(56,189,248,.14)}' +
    '.gm-eye-wrap>.gm-eye:focus-visible{outline:2px solid var(--lb,#38bdf8);outline-offset:-2px}' +
    '.gm-eye .gm-eye-off,.gm-eye[aria-pressed="true"] .gm-eye-on{display:none}' +
    '.gm-eye[aria-pressed="true"] .gm-eye-off{display:block}' +
    'input::-ms-reveal,input::-ms-clear{display:none}';                 // בלי עין כפולה ב-Edge
  document.head.appendChild(style);

  // בעמודים מתורגמים (js/i18n.js) התווית בשפת האתר; אחרת עברית
  function label(key, he) {
    var e = window.GAD_T && window.GAD_T[key], lang = document.documentElement.getAttribute('lang') || 'he';
    return (e && (e[lang] || e.he)) || he;
  }
  function paint(input) {
    var shown = input.type === 'text', btn = input.gmEye;
    btn.setAttribute('aria-pressed', shown ? 'true' : 'false');
    btn.setAttribute('aria-label', shown ? label('tn_hide_pass', 'הסתרת סיסמה') : label('tn_show_pass', 'הצגת סיסמה'));
  }
  function show(input, on) {
    enhance(input);
    input.type = on ? 'text' : 'password';
    paint(input);
  }
  function enhance(input) {
    if (!input || input.gmEye || !input.parentNode) { return; }
    var focused = document.activeElement === input;
    var wrap = document.createElement('span');
    wrap.className = 'gm-eye-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gm-eye';
    btn.innerHTML = ICONS;
    if (input.id) { btn.setAttribute('aria-controls', input.id); }
    btn.addEventListener('click', function () { show(input, input.type === 'password'); });
    wrap.appendChild(btn);
    input.gmEye = btn;
    paint(input);
    if (focused) { input.focus(); }                     // העברת השדה בעץ הדף מבטלת פוקוס — מחזירים
  }
  function scan(root) {
    if (root.matches && root.matches('input[type="password"]')) { enhance(root); }
    if (root.querySelectorAll) { Array.prototype.forEach.call(root.querySelectorAll('input[type="password"]'), enhance); }
  }
  function all(root, fn) { Array.prototype.forEach.call(root.querySelectorAll('.gm-eye-wrap > input'), fn); }
  var hide = function (input) { show(input, false); };

  scan(document);
  new MutationObserver(function (list) {
    list.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { scan(n); } }); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  new MutationObserver(function () { all(document, paint); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  document.addEventListener('submit', function (e) { if (e.target.querySelectorAll) { all(e.target, hide); } }, true);
  window.addEventListener('pagehide', function () { all(document, hide); });

  window.GMPasswordEye = { show: show };
})();
