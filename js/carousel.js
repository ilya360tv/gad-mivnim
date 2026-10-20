/* ==========================================================================
   GAD MIVNIM — קרוסלת כרטיסים בשורה אחת (carousel.js)
   דפי החטיבות: שורה אחת, גלילה אופקית, חיצי הקודם/הבא בדסקטופ.
   מכבד RTL ו-prefers-reduced-motion. ללא ספריות.
   ========================================================================== */

(function () {

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    var track = root.querySelector('.cards-track');
    var prev  = root.querySelector('.car-prev');
    var next  = root.querySelector('.car-next');
    if (!track) { return; }

    function isRtl() { return getComputedStyle(track).direction === 'rtl'; }

    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var pos = Math.abs(track.scrollLeft);
      var fits = max <= 1;
      root.classList.toggle('is-fit', fits);
      if (prev) { prev.hidden = fits || pos <= 1; }
      if (next) { next.hidden = fits || pos >= max - 1; }
    }

    // גלילה בכרטיס אחד: dir = +1 קדימה (הבא), -1 אחורה (הקודם)
    function step(dir) {
      var card = track.querySelector('.card');
      if (!card) { return; }
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var amount = card.getBoundingClientRect().width + gap;
      var sign = isRtl() ? -1 : 1;
      track.scrollBy({ left: sign * dir * amount, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    if (prev) { prev.addEventListener('click', function () { step(-1); }); }
    if (next) { next.addEventListener('click', function () { step(1); }); }

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    if ('ResizeObserver' in window) { new ResizeObserver(update).observe(track); }
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.cards-carousel').forEach(init);
  });

})();
