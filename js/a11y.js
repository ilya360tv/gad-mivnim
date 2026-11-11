/* ==========================================================================
   GAD MIVNIM — תוסף נגישות (a11y.js)
   עומד בדרישות ת"י 5568 / WCAG 2.0 AA. ללא שירותים חיצוניים.
   כל בחירה נשמרת ב-localStorage ומיושמת מחדש בטעינת העמוד.
   ========================================================================== */

(function () {
  'use strict';

  var STORE_KEY = 'gad-a11y';
  var MIN_STEP = -3, MAX_STEP = 3;   // 3 צעדים לכל כיוון
  var STEP_PCT = 10;                 // כל צעד = 10%

  /* מצב ברירת מחדל */
  var state = {
    text: 0,          // צעד גודל טקסט (-3..3)
    contrast: false,  // ניגודיות גבוהה
    grayscale: false, // גווני אפור
    links: false,     // הדגשת קישורים
    readable: false,  // פונט קריא
    motion: false,    // עצירת אנימציות
    cursor: false     // סמן גדול
  };

  /* מיפוי מפתח-הגדרה -> class על <html> */
  var CLASS_MAP = {
    contrast:  'a11y-contrast',
    grayscale: 'a11y-grayscale',
    links:     'a11y-links',
    readable:  'a11y-readable',
    motion:    'a11y-no-motion',
    cursor:    'a11y-big-cursor'
  };

  var root = document.documentElement;

  /* ---------- שמירה / טעינה ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        for (var k in state) {
          if (saved.hasOwnProperty(k)) { state[k] = saved[k]; }
        }
      }
    } catch (e) { /* אחסון חסום — ממשיכים עם ברירת מחדל */ }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { /* מתעלמים */ }
  }

  /* ---------- החלת המצב על העמוד ---------- */
  function apply() {
    // גודל טקסט — משנה את font-size של <html> (כל היחידות rem מתכווצות/גדלות)
    root.style.fontSize = (100 + state.text * STEP_PCT) + '%';

    // מחלקות המצב
    for (var key in CLASS_MAP) {
      root.classList.toggle(CLASS_MAP[key], !!state[key]);
    }

    // עצירת/הפעלת סרטון ה-Hero
    var video = document.querySelector('.hero-video');
    if (video) {
      if (state.motion) {
        try { video.pause(); } catch (e) {}
      } else {
        video.muted = true;
        video.playsInline = true;
        var pr = video.play();
        if (pr && pr.catch) { pr.catch(function () {}); }
      }
    }

    syncControls();
  }

  /* ---------- סנכרון ה-UI של הפאנל למצב ---------- */
  function syncControls() {
    var val = document.getElementById('a11yTextVal');
    if (val) { val.textContent = (100 + state.text * STEP_PCT) + '%'; }

    var minus = document.getElementById('a11yTextMinus');
    var plus  = document.getElementById('a11yTextPlus');
    if (minus) { minus.disabled = (state.text <= MIN_STEP); }
    if (plus)  { plus.disabled  = (state.text >= MAX_STEP); }

    document.querySelectorAll('.a11y-toggle[data-a11y]').forEach(function (btn) {
      var k = btn.getAttribute('data-a11y');
      btn.setAttribute('aria-pressed', state[k] ? 'true' : 'false');
    });

    var undoBtn = document.getElementById('a11yUndo');
    if (undoBtn) { undoBtn.disabled = (stateHistory.length === 0); }
  }

  /* ---------- היסטוריה: "חזרה לשלב הקודם" ---------- */
  var stateHistory = [];
  var HISTORY_MAX = 30;

  function pushHistory() {
    stateHistory.push(JSON.stringify(state));
    if (stateHistory.length > HISTORY_MAX) { stateHistory.shift(); }
  }

  function undo() {
    if (!stateHistory.length) { return; }
    try { state = JSON.parse(stateHistory.pop()); } catch (e) { return; }
    save(); apply();
  }

  /* ---------- פעולות ---------- */
  function setText(delta) {
    var next = Math.max(MIN_STEP, Math.min(MAX_STEP, state.text + delta));
    if (next === state.text) { return; }
    pushHistory();
    state.text = next;
    save(); apply();
  }

  function toggle(key) {
    pushHistory();
    state[key] = !state[key];
    save(); apply();
  }

  function reset() {
    var before = JSON.stringify(state);
    var fresh = { text: 0, contrast: false, grayscale: false, links: false,
                  readable: false, motion: false, cursor: false };
    if (before === JSON.stringify(fresh)) { return; }
    pushHistory();
    state = fresh;
    save(); apply();
  }

  /* ---------- ניהול פאנל (פתיחה/סגירה + לכידת פוקוס) ---------- */
  var fab, panel, lastFocus = null;

  function getFocusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.offsetParent !== null; });
  }

  function openPanel() {
    lastFocus = document.activeElement;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    var closeBtn = document.getElementById('a11yClose');
    requestAnimationFrame(function () { closeBtn.focus(); });
    document.addEventListener('keydown', onPanelKey, true);
  }

  function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onPanelKey, true);
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); } else { fab.focus(); }
  }

  function onPanelKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
    if (e.key === 'Tab') {
      var f = getFocusable(panel);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  /* ---------- מודאל הצהרת נגישות ---------- */
  var modal, modalLastFocus = null;

  function openModal() {
    modalLastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    var stmtClose = document.getElementById('a11yStmtClose');
    requestAnimationFrame(function () { stmtClose.focus(); });
    document.addEventListener('keydown', onModalKey, true);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onModalKey, true);
    if (modalLastFocus && modalLastFocus.focus) { modalLastFocus.focus(); }
  }

  function onModalKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Tab') {
      var f = getFocusable(modal);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  /* ---------- חיווט ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    fab   = document.getElementById('a11yFab');
    panel = document.getElementById('a11yPanel');
    modal = document.getElementById('a11yStatementModal');
    if (!fab || !panel) { return; }

    fab.addEventListener('click', function () {
      panel.classList.contains('is-open') ? closePanel() : openPanel();
    });
    document.getElementById('a11yClose').addEventListener('click', closePanel);

    // צעדי גודל טקסט
    document.getElementById('a11yTextPlus').addEventListener('click', function () { setText(+1); });
    document.getElementById('a11yTextMinus').addEventListener('click', function () { setText(-1); });

    // כפתורי טוגל
    document.querySelectorAll('.a11y-toggle[data-a11y]').forEach(function (btn) {
      btn.addEventListener('click', function () { toggle(btn.getAttribute('data-a11y')); });
    });

    // חזרה לשלב הקודם + איפוס
    var undoBtn = document.getElementById('a11yUndo');
    if (undoBtn) { undoBtn.addEventListener('click', undo); }
    document.getElementById('a11yReset').addEventListener('click', reset);

    // הצהרת נגישות
    var stmtLinks = document.querySelectorAll('.js-a11y-statement');
    stmtLinks.forEach(function (lnk) {
      lnk.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });
    if (modal) {
      document.getElementById('a11yStmtClose').addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) { closeModal(); }
      });
      // קישור "טופס יצירת הקשר" בתוך ההצהרה — סוגר את המודאל וגם את הפאנל
      var toContact = modal.querySelector('.js-a11y-close-to-contact');
      if (toContact) {
        toContact.addEventListener('click', function () {
          closeModal();
          if (panel.classList.contains('is-open')) { closePanel(); }
        });
      }
    }

    // החלת המצב השמור
    apply();
  });

  // החלה מוקדמת ככל האפשר של גודל טקסט + מחלקות (למניעת "הבהוב")
  load();
  root.style.fontSize = (100 + state.text * STEP_PCT) + '%';
  for (var key in CLASS_MAP) { root.classList.toggle(CLASS_MAP[key], !!state[key]); }

  /* כפתור הנגישות יושב מתחת לפריט "שירות לקוחות" וממורכז אליו.
     אין כפתור צף נפרד לשירות לקוחות. בתפריט סגור בטלפון הפריט לא על המסך,
     ואז הכפתור נשען למטה משמאל — מול "חזרה למעלה" שמימין. */
  function placeA11yFab() {
    var fab = document.getElementById('a11yFab');
    if (!fab) return;
    var link = document.querySelector('.main-nav a[data-i18n="nav_contact"]');
    var nav = document.querySelector('.main-nav');
    var navShown = true;
    if (nav) {
      var ns = getComputedStyle(nav);
      navShown = ns.visibility !== 'hidden' && ns.display !== 'none';
    }
    var placed = false;
    if (link && navShown) {
      var r = link.getBoundingClientRect();
      if (r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < window.innerHeight) {
        var size = fab.offsetWidth || 56;
        var left = r.left + (r.width - size) / 2;
        var top = r.bottom + 12;
        left = Math.max(8, Math.min(left, window.innerWidth - size - 8));
        if (top + size > window.innerHeight - 8) top = window.innerHeight - size - 8;
        fab.style.setProperty('left', left + 'px', 'important');
        fab.style.setProperty('top', top + 'px', 'important');
        fab.style.setProperty('right', 'auto', 'important');
        fab.style.setProperty('bottom', 'auto', 'important');
        fab.style.setProperty('transform', 'none', 'important');
        placed = true;
      }
    }
    if (!placed) {
      fab.style.setProperty('left', '16px', 'important');
      fab.style.setProperty('right', 'auto', 'important');
      fab.style.setProperty('top', 'auto', 'important');
      fab.style.setProperty('bottom', '16px', 'important');
      fab.style.setProperty('transform', 'none', 'important');
    }
  }
  placeA11yFab();
  window.addEventListener('resize', placeA11yFab);
  window.addEventListener('load', placeA11yFab);
  var navEl = document.querySelector('.main-nav');
  if (navEl && 'MutationObserver' in window) {
    new MutationObserver(placeA11yFab).observe(navEl, { attributes: true, attributeFilter: ['class'] });
  }

})();
