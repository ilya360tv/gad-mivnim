/* ==========================================================================
   GAD MIVNIM — nav-3d.js: הטיה עדינה וכתם אור לכיוון העכבר בגלולות הצד, בעיגול הלוגו, בעיגול השפה, בכפתור הנגישות, בגלולת כותרת העמוד ובעיגולי התוכן (.gm-circle).
   ה-JS רק מזין משתני CSS (--n3-rx / --n3-ry / --n3-mx / --n3-my); כל העיצוב ב-css/style.css (בלוק "NAV 3D").
   פועל רק במחשב עם עכבר (≥1024px, hover, pointer fine). בלי תנועה כשמופעל "עצירת אנימציות" או prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.matchMedia) { return; }
  var TARGETS = '.site-header .main-nav ul li a, .site-header .logo, .site-header .lang-btn, .a11y-fab, #main .page-eyebrow, #main .gm-circle';
  var MAX_X = 4, MAX_Y = 8;                                        // מעלות: rotateX / rotateY
  var VARS = ['--n3-rx', '--n3-ry', '--n3-mx', '--n3-my'];
  var fine = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var el = null, box = null, x = 0, y = 0, frame = 0;

  function calm() { return reduce.matches || document.documentElement.classList.contains('a11y-no-motion'); }
  function release() {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    if (el) { VARS.forEach(function (v) { el.style.removeProperty(v); }); }
    el = null;
    box = null;
  }
  function draw() {
    frame = 0;
    if (!el || !box.width || !box.height) { return; }
    var px = Math.min(1, Math.max(0, (x - box.left) / box.width));
    var py = Math.min(1, Math.max(0, (y - box.top) / box.height));
    // הצד שמתחת לעכבר מתקרב לצופה
    el.style.setProperty('--n3-ry', (-(px * 2 - 1) * MAX_Y).toFixed(2) + 'deg');
    el.style.setProperty('--n3-rx', ((py * 2 - 1) * MAX_X).toFixed(2) + 'deg');
    el.style.setProperty('--n3-mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--n3-my', (py * 100).toFixed(1) + '%');
  }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' || !fine.matches || calm()) { release(); return; }
    var over = e.target && e.target.closest ? e.target.closest(TARGETS) : null;
    if (!over) { release(); return; }
    if (over !== el) {
      release();
      el = over;
      el.classList.add('n3-on');
      box = el.getBoundingClientRect();                            // המלבן במנוחה — נמדד בכניסה, לפני ההרמה
    }
    x = e.clientX;
    y = e.clientY;
    if (!frame) { frame = requestAnimationFrame(draw); }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', release);
  window.addEventListener('scroll', release, { passive: true, capture: true });
  window.addEventListener('resize', release);
  window.addEventListener('blur', release);
  // iOS מפעיל :active (שקיעה בלחיצה) רק כשיש מאזין מגע
  document.addEventListener('touchstart', function () {}, { passive: true });
})();
