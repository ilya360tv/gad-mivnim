/* ==========================================================================
   GAD MIVNIM — בלי גלילת עמוד (js/page-scroll.js)
   כל עמוד (חוץ מדף הבית ומ-admin) ממלא בדיוק מסך אחד, ואין גלילת עמוד.
   אזור התוכן — כל מה שמתחת לגלולת הכותרת (H1) ולכותרת הגדולה (h2) — נכנס לקופסת גלילה משלו (.page-scroll):
   גובה = מה שנשאר עד תחתית המסך; מגלגלים בתוכו (עכבר / מקלדת / מגע). אם התוכן נכנס — אין גלילה בכלל.
   גלולת הכותרת, הכותרת הגדולה, עמודות הניווט, הלוגו ועיגול השפות — קבועים, מחוץ לקופסה.
   רץ ראשון (לפני שאר הסקריפטים), כדי שכולם יראו את ה-DOM הסופי. לא מוחק ולא מסתיר תוכן — רק עוטף.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var body = document.body;
  if (!body || body.getAttribute('data-page') === 'hero') { return; }        // דף הבית — כללי CSS משלו
  var main = document.getElementById('main');
  var section = main && main.querySelector(':scope > section');
  var container = section && section.querySelector(':scope > .container');

  // עמוד בלי מבנה סקשן (privacy / resubmit): כל העמוד גולל בתוך ה-body, בלי גלילת עמוד
  if (!container) { root.classList.add('ps-body'); return; }

  var kids = Array.prototype.filter.call(container.children, function (k) { return k.tagName !== 'SCRIPT'; });
  var eyebrow = container.querySelector(':scope > .page-eyebrow');
  var titleKid = null;
  kids.forEach(function (k) {
    if (!titleKid && (k.matches('.section-title, h1') || k.querySelector('.section-title, h1'))) { titleKid = k; }
  });
  // "אזור קבלני הבית": הכותרת בתוך הפריסה (.tn-layout) — רק גלולת הכותרת קבועה, הפריסה כולה בקופסה
  if (titleKid && titleKid.matches('.tn-layout')) { titleKid = eyebrow; }
  var headEnd = titleKid || eyebrow;
  var idx = headEnd ? kids.indexOf(headEnd) : -1;
  var tail = kids.slice(idx + 1);

  var box = document.createElement('div');
  box.className = 'page-scroll';
  box.setAttribute('data-page-scroll', '');
  if (tail.length) {
    container.insertBefore(box, tail[0]);
    tail.forEach(function (n) { box.appendChild(n); });
  } else {
    container.appendChild(box);
  }
  // פוטר (נשאר רק ב"שירות לקוחות") — בסוף אזור הגלילה, כדי שיישאר נגיש
  var footer = document.querySelector('body > .site-footer');
  if (footer) { box.appendChild(footer); }

  root.classList.add('ps-on');

  var BOTTOM = 14;                                    // מרווח בתחתית המסך
  function size() {
    box.style.maxHeight = '';
    var top = box.getBoundingClientRect().top;
    var avail = Math.floor(window.innerHeight - top - BOTTOM);
    box.style.maxHeight = Math.max(120, avail) + 'px';
  }
  var tm;
  function refit() { clearTimeout(tm); tm = setTimeout(size, 30); }
  size();
  window.addEventListener('resize', refit);
  window.addEventListener('load', function () { size(); setTimeout(size, 600); setTimeout(size, 1600); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(size); }
  if ('ResizeObserver' in window) {                   // כותרות שמתכווצות / שפה אחרת — הגובה שמעל הקופסה משתנה
    var ro = new ResizeObserver(refit);
    kids.slice(0, idx + 1).forEach(function (k) { if (k.nodeType === 1) { ro.observe(k); } });
  }
  if ('MutationObserver' in window) {
    new MutationObserver(refit).observe(root, { attributes: true, attributeFilter: ['lang', 'dir', 'class'] });
  }
  window.gmPageScroll = { box: box, size: size };
})();
