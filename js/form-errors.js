/* ==========================================================================
   GAD MIVNIM — form-errors.js: הודעות שגיאה ליד השדה + קפיצה לשדה הראשון (כל הטפסים באתר).
   window.GMFormErrors:
     set(el, msg)          — מסגרת אדומה + הודעה בעברית מתחת לשדה (aria-invalid + aria-describedby)
     clear(el)             — מסיר (גם אוטומטית כשהשדה הופך לתקין — ראו watch)
     summary(box, n, msg)  — "יש לתקן 2 שדות" בראש הטופס / השלב (aria-live)
     jump(el)              — גלילה חלקה לשדה (גלוי במלואו מתחת להדר), פוקוס והדגשה קצרה
     watch(el, check)      — בדיקה ביציאה מהשדה (blur) ומחיקת ההודעה ברגע שהשדה תקין
     run(form, rules, box) — בודק רשימת כללים [{ el, check() → הודעה | '' }], מציג, וקופץ לראשון. מחזיר true אם תקין
   ההדגשה (רעידה קלה) כבויה כשמופעל "עצירת אנימציות" בתפריט הנגישות או prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';
  var uid = 0;

  // השדה "המארח" של ההודעה: .form-field / .cwz-field, או האלמנט עצמו
  function hostOf(el) { return (el && el.closest && el.closest('[data-fe-host], .form-field, .cwz-field')) || el; }
  function focusTarget(el) {
    if (!el) { return null; }
    if (el.matches && el.matches('input, select, textarea, button, [tabindex]')) { return el; }
    return el.querySelector('input:not([type="hidden"]):not([disabled]), select, textarea, button, [tabindex]') || el;
  }
  function msgEl(el, create) {
    var host = hostOf(el);
    var m = host.querySelector(':scope > .fe-msg');
    if (!m && create) {
      m = document.createElement('p');
      m.className = 'fe-msg';
      m.id = 'fe-' + (++uid);
      host.appendChild(m);
    }
    return m;
  }
  function describe(target, id, on) {
    if (!target || !target.setAttribute) { return; }
    var ids = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== id; });
    if (on) { ids.push(id); }
    if (ids.length) { target.setAttribute('aria-describedby', ids.join(' ')); } else { target.removeAttribute('aria-describedby'); }
  }

  function set(el, msg) {
    if (!el) { return; }
    var host = hostOf(el), m = msgEl(el, true), t = focusTarget(el);
    m.textContent = msg;
    m.hidden = false;
    host.classList.add('fe-invalid');
    if (t) { t.setAttribute('aria-invalid', 'true'); describe(t, m.id, true); }
  }
  var boxes = [];                                   // סיכומים פעילים — מתעדכנים כשמתקנים שדה
  function clear(el) {
    if (!el) { return; }
    var host = hostOf(el), m = msgEl(el, false), t = focusTarget(el);
    var was = host.classList.contains('fe-invalid');
    host.classList.remove('fe-invalid');
    if (t) { t.removeAttribute('aria-invalid'); }
    if (m) { m.hidden = true; m.textContent = ''; describe(t, m.id, false); }
    if (was) { refresh(); }
  }
  function refresh() {
    boxes = boxes.filter(function (b) { return document.contains(b.box) && !b.box.hidden; });
    boxes.forEach(function (b) {
      var n = b.rules.filter(function (r) { return document.contains(r.el) && hostOf(r.el).classList.contains('fe-invalid'); }).length;
      summary(b.box, n);
    });
  }
  function summary(box, n, text) {
    if (!box) { return; }
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('role', 'status');
    if (!n && !text) { box.hidden = true; box.textContent = ''; return; }
    box.textContent = text || (n === 1 ? 'יש לתקן שדה אחד' : 'יש לתקן ' + n + ' שדות');
    box.hidden = false;
  }
  function calm() {
    return document.documentElement.classList.contains('a11y-no-motion') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function jump(el) {
    if (!el) { return; }
    var host = hostOf(el), t = focusTarget(el);
    host.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
    if (t && t.focus) { t.focus({ preventScroll: true }); }
    host.classList.remove('fe-flash');
    void host.offsetWidth;
    if (!calm()) { host.classList.add('fe-flash'); setTimeout(function () { host.classList.remove('fe-flash'); }, 900); }
  }
  // check() מחזיר הודעה (לא תקין) או '' (תקין)
  function watch(el, check) {
    if (!el || el.__feWatch) { return; }
    el.__feWatch = true;
    var t = focusTarget(el) || el;
    var touched = false;
    t.addEventListener('blur', function () {
      if (!touched && !String(t.value || '').trim()) { return; }      // לא מציגים שגיאה על שדה ריק שרק עברו בו
      var m = check(); if (m) { set(el, m); } else { clear(el); }
    });
    ['input', 'change'].forEach(function (ev) {
      t.addEventListener(ev, function () {
        touched = true;
        if (!hostOf(el).classList.contains('fe-invalid')) { return; }
        if (!check()) { clear(el); }
      });
    });
  }
  function run(rules, box) {
    var bad = [];
    rules.forEach(function (r) {
      var m = r.check();
      if (m) { set(r.el, m); bad.push(r.el); } else { clear(r.el); }
    });
    summary(box, bad.length);
    boxes = boxes.filter(function (b) { return b.box !== box; });
    if (box && bad.length) { boxes.push({ box: box, rules: rules }); }
    if (bad.length) { jump(bad[0]); }
    return !bad.length;
  }

  // כללי בדיקה משותפים
  var V = {
    phone: function (v) {
      var s = String(v || '').replace(/[\s\-().]/g, '').replace(/^\+972/, '0');
      return /^0(5\d{8}|7\d{8}|[2-489]\d{7})$/.test(s) ? '' : 'מספר טלפון לא תקין – יש להזין 10 ספרות (05X-XXXXXXX)';
    },
    email: function (v) {
      var s = String(v || '').trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200 && s.toLowerCase().indexOf('@users.gad-mivnim.app') === -1 ? '' : 'כתובת דוא"ל לא תקינה';
    },
    required: function (v, label) { return String(v || '').trim() ? '' : (label ? 'יש למלא ' + label : 'שדה חובה'); }
  };

  window.GMFormErrors = { set: set, clear: clear, summary: summary, jump: jump, watch: watch, run: run, V: V };
})();
