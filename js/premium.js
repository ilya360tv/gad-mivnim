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

      // ניגון בטוח: muted + playsinline לפני כל play() (בלי זה אייפון חוסם ניגון אוטומטי).
      // בלי כפתור Play: אם הניגון נחסם — נשאר הפוסטר. "עצירת אנימציות" בתפריט הנגישות — לא מנגנים.
      var heroOn = true;
      var tryPlay = function () {
        if (!heroOn || document.documentElement.classList.contains('a11y-no-motion')) { return; }
        try {
          heroVideo.muted = true;
          heroVideo.defaultMuted = true;
          heroVideo.playsInline = true;
          heroVideo.setAttribute('playsinline', '');
          heroVideo.setAttribute('webkit-playsinline', '');
          var pr = heroVideo.play();
          if (pr && pr.catch) { pr.catch(function () {}); }
        } catch (e) {}
      };

      // הקובץ הקל למובייל לא נטען / לא מפוענח במכשיר הזה → מעבר לסרטון הדסקטופ (אותו מונטאז')
      var fellBack = false;
      var fallback = function () {
        if (fellBack || /(^|\/)hero\.mp4(?:\?|$)/.test(heroVideo.currentSrc || '')) { return; }
        fellBack = true;
        heroVideo.src = 'images/hero.mp4';
        heroVideo.load();
        tryPlay();
      };
      heroVideo.addEventListener('error', fallback, true);

      tryPlay();
      window.addEventListener('load', tryPlay, { once: true });
      // רק אירועים שהדפדפן מחשיב "פעולת משתמש" (touchend / click / pointerup / keydown) מתירים play()
      // כשהניגון האוטומטי חסום (למשל "מצב חיסכון בסוללה" באייפון). מאזינים עד שהסרטון באמת מתנגן.
      var GESTURES = ['touchend', 'click', 'pointerup', 'keydown'];
      var onGesture = function () { tryPlay(); };
      GESTURES.forEach(function (ev) { document.addEventListener(ev, onGesture, { passive: true, capture: true }); });
      heroVideo.addEventListener('playing', function () {
        GESTURES.forEach(function (ev) { document.removeEventListener(ev, onGesture, { capture: true }); });
      }, { once: true });
      // חזרה לאפליקציה / ללשונית (iOS משהה וידאו ברקע)
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { tryPlay(); } });

      // משהים רק כשה-Hero באמת מחוץ למסך. isIntersecting לבד יכול לדווח "לא נראה"
      // בטעינה במובייל ולהשאיר את הסרטון מושהה.
      if ('IntersectionObserver' in window) {
        var heroSec = document.getElementById('hero');
        new IntersectionObserver(function (entries) {
          if (document.documentElement.classList.contains('a11y-no-motion')) { return; }
          var e = entries[entries.length - 1];
          var r = e.boundingClientRect;
          var off = r.bottom <= 0 || r.top >= (window.innerHeight || 0);
          heroOn = !off;
          if (heroOn) { tryPlay(); }
          else { heroVideo.pause(); }
        }).observe(heroSec || heroVideo);
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
      // threshold 0: קבוצות גבוהות (שותפים/גלריה במובייל, עמודה אחת ארוכה) לעולם לא מגיעות ל-15% נראות → נשארו שקופות
      }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });

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
       3.4) הגלולה הפעילה בתפריט — לפי העמוד (class="is-current" ב-HTML, נוצר ב-tools/build-pages.js).
            אין יותר scrollspy: כל גלולה פותחת עמוד נפרד.
       --------------------------------------------------------------- */

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
