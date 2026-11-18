/* ==========================================================================
   GAD MIVNIM — about.js: עמוד "אודות הקבוצה" — בלי גלילת עמוד במחשב (≥1024)
   עמודת הטקסט נשארת כמו שהיא (אותו תוכן ועיצוב), נחתכת בגובה הפנוי עם דהייה רכה למטה,
   ומתחתיה "המשך קריאה ←". לחיצה על העמודה (או Enter/Space) / על הקישור פותחת חלון קריאה
   עם עותק של אותו טקסט בדיוק (cloneNode — אף מילה לא מוקלדת מחדש); הטקסט נגלל בתוך החלון.
   גובה: אם אפשר — כל העמוד כולל הפוטר נכנס במסך (טקסט ≥ 280px); אחרת — סקשן האודות במסך אחד.
   טלפון/טאבלט (<1024): בלי שינוי — גלילה רגילה.
   ========================================================================== */

(function () {
  var section = document.getElementById('about');
  var col = section && section.querySelector('.about-text');
  var link = document.getElementById('aboutMore');
  if (!col || !link) { return; }

  var desktop = window.matchMedia('(min-width: 1024px)');
  var MIN_TEXT = 280;          // מתחת לזה לא מכניסים גם את הפוטר למסך — רק את הסקשן
  var BOTTOM = 32;             // ריווח בתחתית הסקשן כשהטקסט חתוך (ראו css: #about.is-clamped)
  var LINK_GAP = 12;

  var T = window.GAD_T || {};
  var t = function (key, fb) {
    var e = T[key], l = document.documentElement.getAttribute('lang') || 'he';
    return (e && (e[l] || e.he)) || fb;
  };
  var docTop = function (el) { var y = 0; for (; el; el = el.offsetParent) { y += el.offsetTop; } return y; };   // בלי transform של reveal

  /* ---------- חיתוך העמודה לגובה הפנוי ---------- */
  function fit() {
    col.style.maxHeight = '';
    section.classList.remove('is-clamped');
    link.hidden = true;
    col.removeAttribute('role');
    col.removeAttribute('tabindex');
    col.removeAttribute('aria-haspopup');
    if (!desktop.matches) { return; }

    link.hidden = false;                                         // כדי למדוד את גובהו
    var footer = document.querySelector('.site-footer');
    var top = docTop(col);
    var room = window.innerHeight - top - link.offsetHeight - LINK_GAP - BOTTOM;
    var withFooter = room - (footer ? footer.offsetHeight : 0);
    var h = Math.floor(withFooter >= MIN_TEXT ? withFooter : room);
    if (col.scrollHeight <= h + 1) { link.hidden = true; return; }   // הטקסט נכנס כולו — אין מה לחתוך

    col.style.maxHeight = h + 'px';
    section.classList.add('is-clamped');
    col.setAttribute('role', 'button');
    col.setAttribute('tabindex', '0');
    col.setAttribute('aria-haspopup', 'dialog');
  }

  /* ---------- חלון הקריאה (אותה משפחה כמו חלונות האתר: .proj-modal) ----------
     החלון יושב בתוך #about (מחוץ ל-.container) — כך כללי העיצוב של #about .about-text חלים גם על העותק */
  var m = document.createElement('div');
  m.className = 'proj-modal ab-read';
  m.hidden = true;
  m.innerHTML =
    '<div class="proj-modal__backdrop" data-abr-close></div>' +
    '<div class="proj-modal__box ab-read__box" role="dialog" aria-modal="true" aria-labelledby="abrTitle" tabindex="-1">' +
      '<button type="button" class="proj-modal__x" data-abr-close>&times;</button>' +
      '<div class="ab-read__scroll" tabindex="0"><h2 class="ab-read__title" id="abrTitle"></h2><div class="ab-read__body"></div></div>' +
    '</div>';
  section.appendChild(m);
  var box = m.querySelector('.ab-read__box');
  var scroller = m.querySelector('.ab-read__scroll');
  var body = m.querySelector('.ab-read__body');
  var titleEl = m.querySelector('.ab-read__title');
  var xBtn = m.querySelector('.proj-modal__x');
  var opener = null;

  function render() {
    var clone = col.cloneNode(true);
    clone.removeAttribute('style');
    clone.removeAttribute('role');
    clone.removeAttribute('tabindex');
    clone.removeAttribute('aria-haspopup');
    clone.classList.remove('reveal', 'reveal-d1', 'is-visible');
    // שורת הסיום: הפס הנע נשאר בעותק (נבנה מחדש ב-open, אחרי שהחלון מוצג) — מנקים את העותקים שהועתקו
    clone.querySelectorAll('.about-mq__track').forEach(function (n) { n.innerHTML = ''; n.removeAttribute('style'); });
    var idea = section.querySelector('.about-grid > .about-sub--idea');
    if (idea) {
      var h = idea.cloneNode(true);
      h.removeAttribute('style');
      clone.insertBefore(h, clone.firstChild);
    }
    body.innerHTML = '';
    body.appendChild(clone);
    if (!m.hidden) { positionReader(); startMq(); fitModalIdea(); } // החלפת שפה בזמן שהחלון פתוח
    titleEl.textContent = t('about_eyebrow', 'אודות הקבוצה');
    xBtn.setAttribute('aria-label', t('pm_close', 'סגירה'));
  }
  // דסקטופ (≥1024): החלון נפתח מעל עמודת הטקסט (בצד שלה), עמודת התמונות נשארת גלויה. מיקום פיזי: ב-RTL הקצה הימני = הקצה הימני של העמודה.
  // הקופסה ב-zoom (--reader-scale), לכן כל מידה מקומית = מידה על המסך / scale. רוחב = רוחב העמודה (+עד 40px, בלי לכסות את התמונות).
  function positionReader() {
    var bd = m.querySelector('.proj-modal__backdrop');
    var reset = function () {
      ['position', 'top', 'right', 'left', 'width', 'maxWidth', 'maxHeight'].forEach(function (k) { box.style[k] = ''; });
      bd.style.background = '';
    };
    if (m.hidden || window.innerWidth < 1024) { reset(); return; }
    var sc = parseFloat(getComputedStyle(m).getPropertyValue('--reader-scale')) || 1;
    var rtl = document.documentElement.getAttribute('dir') !== 'ltr';
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var cr = col.getBoundingClientRect();
    var idea = section.querySelector('.about-grid > .about-sub--idea');
    var ir = idea ? idea.getBoundingClientRect() : cr;
    var tiles = section.querySelector('.about-tiles');
    var tr = tiles ? tiles.getBoundingClientRect() : null;
    var W = cr.width + 40;
    if (tr) { W = Math.min(W, rtl ? cr.right - (tr.right + 8) : (tr.left - 8) - cr.left); }
    W = Math.max(W, 320);
    var top = Math.max(12, ir.top);
    box.style.position = 'absolute';
    box.style.top = (top / sc).toFixed(2) + 'px';
    box.style.width = (W / sc).toFixed(2) + 'px';
    box.style.maxWidth = 'none';
    box.style.maxHeight = (Math.max(200, vh - top - 16) / sc).toFixed(2) + 'px';
    var edge;                                                           // קצה החלון על המסך בצד העמודה
    if (rtl) { box.style.left = 'auto'; box.style.right = ((vw - cr.right) / sc).toFixed(2) + 'px'; edge = cr.right - W; }
    else { box.style.right = 'auto'; box.style.left = (cr.left / sc).toFixed(2) + 'px'; edge = cr.left + W; }
    // הרקע: כהה כמו קודם מאחורי החלון ומעבר לו; בצד התמונות — בהיר (התמונות נראות בבירור)
    var dark = 'rgba(0,0,0,.65)', light = 'rgba(0,0,0,.12)';
    bd.style.background = rtl
      ? 'linear-gradient(90deg,' + light + ' ' + edge.toFixed(0) + 'px,' + dark + ' ' + edge.toFixed(0) + 'px)'
      : 'linear-gradient(90deg,' + dark + ' ' + edge.toFixed(0) + 'px,' + light + ' ' + edge.toFixed(0) + 'px)';
  }
  // "מדוע נולד הרעיון…" בחלון: שורה אחת שמתמלאת בדיוק לרוחב הפסקה (משנים רק את גודל הכתב). מתחת ל-768 — שבירה רגילה, ממורכז.
  function fitModalIdea() {
    var h = body.querySelector('.about-sub--idea');
    if (!h || m.hidden) { return; }
    if (window.innerWidth < 768) {
      h.style.removeProperty('white-space'); h.style.removeProperty('font-size'); h.style.removeProperty('width');
      return;
    }
    h.style.setProperty('white-space', 'nowrap', 'important');
    h.style.width = '100%';
    var fs = 16;
    for (var i = 0; i < 4; i++) {
      h.style.setProperty('font-size', fs.toFixed(3) + 'px', 'important');
      var box = h.getBoundingClientRect();
      var ratio = h.offsetWidth ? box.width / h.offsetWidth : 1;
      var rg = document.createRange(); rg.selectNodeContents(h);
      var tw = rg.getBoundingClientRect().width / (ratio || 1);
      if (tw < 20 || !h.clientWidth) { return; }
      var next = fs * h.clientWidth / tw;
      if (Math.abs(next - fs) < 0.01) { break; }
      fs = next;
    }
    h.style.setProperty('font-size', (Math.floor(fs * 100) / 100).toFixed(2) + 'px', 'important');
  }
  // פס שורת הסיום בתוך החלון: מאותחל רק כשהחלון גלוי (רוחב 0 כשהוא מוסתר). נעצר מעצמו כשהחלון נסגר (הפס יוצא מהמסך / ה-DOM מוחלף)
  function startMq() {
    var mq = body.querySelector('.about-mq');
    if (mq && typeof window.gmAboutMq === 'function') { window.gmAboutMq(mq); }
  }
  function open(from) {
    opener = from || document.activeElement;
    render();
    m.hidden = false;
    document.documentElement.classList.add('modal-open');
    box.focus({ preventScroll: true });
    scroller.scrollTop = 0;
    void m.offsetWidth;
    m.classList.add('is-open');
    positionReader();
    startMq();
    fitModalIdea();
  }
  function close() {
    if (m.hidden) { return; }
    m.classList.remove('is-open');
    m.hidden = true;
    document.documentElement.classList.remove('modal-open');
    if (opener && document.body.contains(opener)) { opener.focus({ preventScroll: true }); }
  }

  col.addEventListener('click', function (e) {
    if (!section.classList.contains('is-clamped')) { return; }
    if (window.getSelection && String(window.getSelection())) { return; }   // סימון טקסט — לא פותחים
    open(col);
  });
  col.addEventListener('keydown', function (e) {
    if (!section.classList.contains('is-clamped')) { return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(col); }
  });
  link.addEventListener('click', function () { open(link); });

  m.addEventListener('click', function (e) { if (e.target.closest('[data-abr-close]')) { close(); } });
  m.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') { return; }                                       // מלכודת פוקוס: X ↔ אזור הטקסט
    var f = [xBtn, scroller];
    if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === box)) { e.preventDefault(); f[1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ---------- מדידה מחדש: טעינה, פונטים, שינוי רוחב/גובה, שפה ---------- */
  var tm;
  var refit = function () { clearTimeout(tm); tm = setTimeout(fit, 60); };
  fit();
  window.addEventListener('load', refit);
  window.addEventListener('resize', refit);
  window.addEventListener('resize', function () { positionReader(); fitModalIdea(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(refit); }
  if ('MutationObserver' in window) {
    new MutationObserver(function () { refit(); if (!m.hidden) { render(); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if ('ResizeObserver' in window) {
    var ideaBox = section.querySelector('.about-grid > .about-sub--idea');
    if (ideaBox) { new ResizeObserver(refit).observe(ideaBox); }
  }
})();
