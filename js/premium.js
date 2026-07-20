/* ==========================================================================
   GAD MIVNIM — אפקטים פרימיום (premium.js)
   פרלקסה ב-Hero · הטיה תלת-ממדית בכרטיסים · חשיפה בגלילה · מונים רצים.
   ללא ספריות. מכבד prefers-reduced-motion ומכבה אפקטים כבדים במובייל.
   ========================================================================== */

(function () {

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // הטיה 3D רק במכשירים עם עכבר אמיתי (לא מגע) — חוסך ביצועים במובייל
  var finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------------------------------------------------------------
       0) סרטון ה-Hero — כניסה חלקה: הפוסטר ברקע, הסרטון נחשף בפייד
          כשהניגון מתחיל (בלי קפיצה מתמונה לווידאו)
       --------------------------------------------------------------- */
    var heroVideo = document.querySelector('.hero-video');

    if (heroVideo) {
      var showVideo = function () { heroVideo.classList.add('is-playing'); };

      // אם הסרטון כבר רץ (מטמון מהיר) — מציגים מיד
      if (!heroVideo.paused && heroVideo.currentTime > 0) {
        showVideo();
      } else {
        heroVideo.addEventListener('playing', showVideo, { once: true });
        heroVideo.addEventListener('canplay', showVideo, { once: true });
      }
    }

    /* ---------------------------------------------------------------
       1) חשיפה בגלילה — fade-in + slide-up (Intersection Observer)
       --------------------------------------------------------------- */
    var revealTargets = document.querySelectorAll('.reveal, .reveal-group');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      // ללא אנימציה — פשוט מציגים הכל
      revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

      revealTargets.forEach(function (el) { io.observe(el); });
    }

    /* ---------------------------------------------------------------
       2) מונים רצים (01 / 02 / 03) — מתמלאים כשנכנסים לתצוגה
       --------------------------------------------------------------- */
    var counters = document.querySelectorAll('.tip-num[data-count]');

    function pad2(n) { return (n < 10 ? '0' : '') + n; }

    function runCounter(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduceMotion) { el.textContent = pad2(target); return; }
      var start = null;
      var duration = 900;
      function step(ts) {
        if (start === null) { start = ts; }
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // ease-out
        el.textContent = pad2(Math.round(eased * target));
        if (p < 1) { requestAnimationFrame(step); }
      }
      requestAnimationFrame(step);
    }

    if (counters.length) {
      if (!('IntersectionObserver' in window)) {
        counters.forEach(runCounter);
      } else {
        var cio = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { cio.observe(el); });
      }
    }

    /* ---------------------------------------------------------------
       3) פרלקסה ב-Hero — הרקע זז לאט מהתוכן
       --------------------------------------------------------------- */
    var heroBg = document.getElementById('heroBg');
    var hero   = document.getElementById('hero');

    if (heroBg && hero && !reduceMotion) {
      var ticking = false;
      function updateParallax() {
        var rect = hero.getBoundingClientRect();
        // פועל רק כשה-Hero בתצוגה
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          var offset = window.scrollY * 0.35;
          var max = hero.offsetHeight * 0.18; // גבול כדי שלא ייווצר רווח
          if (offset > max) { offset = max; }
          heroBg.style.transform = 'translate3d(0,' + offset + 'px,0)';
        }
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
      }, { passive: true });
      updateParallax();
    }

    /* ---------------------------------------------------------------
       3.4) Scrollspy — סימון הסקשן הנוכחי בתפריט (nav-state-active)
       --------------------------------------------------------------- */
    var navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

    if (navLinks.length && 'IntersectionObserver' in window) {
      var linkByTarget = {};
      navLinks.forEach(function (link) {
        var id = link.getAttribute('href').slice(1);
        if (document.getElementById(id)) { linkByTarget[id] = link; }
      });

      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.classList.remove('is-current'); });
            var link = linkByTarget[entry.target.id];
            if (link) { link.classList.add('is-current'); }
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' }); // הסקשן שבמרכז המסך

      Object.keys(linkByTarget).forEach(function (id) {
        spy.observe(document.getElementById(id));
      });
    }

    /* ---------------------------------------------------------------
       3.5) כפתור "חזרה למעלה" — מופיע אחרי גלילה, נוח לקהל מבוגר
       --------------------------------------------------------------- */
    var backTop = document.getElementById('backTop');

    if (backTop) {
      var btTicking = false;
      var updateBackTop = function () {
        backTop.classList.toggle('is-visible', window.scrollY > 600);
        btTicking = false;
      };
      window.addEventListener('scroll', function () {
        if (!btTicking) { requestAnimationFrame(updateBackTop); btTicking = true; }
      }, { passive: true });

      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }

    /* ---------------------------------------------------------------
       4) הטיה תלת-ממדית עדינה בכרטיסים (tilt) — רק בעכבר, לא במובייל
       --------------------------------------------------------------- */
    if (finePointer && !reduceMotion) {
      var MAX = 6; // מעלות מקסימום
      document.querySelectorAll('.tilt').forEach(function (card) {

        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;   // 0..1
          var py = (e.clientY - r.top) / r.height;   // 0..1
          var ry = (px - 0.5) * 2 * MAX;             // rotateY
          var rx = (0.5 - py) * 2 * MAX;             // rotateX
          card.style.transform =
            'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-6px)';
        });

        card.addEventListener('pointerleave', function () {
          card.style.transform = '';
        });
      });
    }

  });

})();
