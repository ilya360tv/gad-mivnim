/* ==========================================================================
   GAD MIVNIM — סקריפטים (script.js)
   שלב 3: סינון פרויקטים + גלריה עם הגדלה (lightbox).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------------
     1) סינון פרויקטים — מגזר פרטי / עסקי / הכל
     --------------------------------------------------------------- */
  var projectItems  = document.querySelectorAll('#projects .projects-grid .project-item');

  /* ---------------------------------------------------------------
     1ב) פרויקטים — לשוניות מגזר (הכל / עסקי / פרטי) + פס נע אינסופי (marquee) הנגרר בעכבר ובמגע.
         הפס נבנה מהכרטיסים הקיימים לפי שדה sector ב-js/projects-data.js;
         בהחלפת לשונית או שפה הוא נבנה מחדש. עם prefers-reduced-motion נשארת רשת סטטית.
     --------------------------------------------------------------- */
  var projSection = document.getElementById('projects');
  var marquee = projSection ? projSection.querySelector('.marquee') : null;
  var mqTrack = marquee ? marquee.querySelector('.marquee-track') : null;
  var stage   = projSection ? projSection.querySelector('.projects-stage') : null;
  var emptyMsg = projSection ? projSection.querySelector('.projects-empty') : null;
  var tabs    = projSection ? Array.prototype.slice.call(projSection.querySelectorAll('.sector-tab')) : [];
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PDATA = window.PROJECTS_DATA || {};
  var IPDATA = window.IN_PROGRESS_DATA || {};     // כרטיסי #in-progress — אותו חלון (#projModal)
  var currentSector = 'all';

  function sectorOf(el) {
    var slug = el.getAttribute('data-client') || '';
    return (PDATA[slug] && PDATA[slug].sector) || 'business-private';
  }

  var sources = Array.prototype.slice.call(projectItems);

  function matching() {
    return sources.filter(function (c) { return currentSector === 'all' || sectorOf(c) === currentSector; });
  }

  /* ----- מנוע פס נע משותף (פס לוגואי #projects ופס הכרטיסים של #in-progress) -----
         התנועה ב-JS: offset בפיקסלים בטווח [-W, 0), כש-W = רוחב עותק אחד. גרירה, גלגלת ותנופה
         משנים את אותו offset, והלולאה אינסופית וחלקה לשני הכיוונים.
         box = המכל (overflow hidden), track = הרצועה, opts.isPaused() = תנאי השהיה נוספים.
         מחזיר: state, measure(per) — מודד W לפי מספר הפריטים בעותק אחד, wrap(), apply(). ----- */
  var MQ_SPEED = { desktop: 58, mobile: 65 };      // פיקסלים לשנייה — זהה לשני הפסים
  function initMarquee(box, track, opts) {
    opts = opts || {};
    var s = { offset: 0, W: 0, speed: 0, vel: 0, dragging: false, hover: false, resumeAt: 0, last: 0 };
    var visible = true, looping = false;      // הלולאה רצה רק כשהפס בתוך המסך
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function wrap() {
      if (!s.W) { return; }
      while (s.offset >= 0) { s.offset -= s.W; }
      while (s.offset < -s.W) { s.offset += s.W; }
    }
    function apply() { track.style.transform = 'translate3d(' + s.offset.toFixed(2) + 'px,0,0)'; }
    function measure(per) {
      // רוחב עותק אחד = המרחק בין הפריט הראשון לפריט הראשון של העותק השני (כולל הרווחים)
      var kids = track.children;
      if (!per || kids.length < per + 1) { s.W = 0; return; }
      s.W = kids[per].offsetLeft - kids[0].offsetLeft;
      s.speed = (window.innerWidth < 768 ? MQ_SPEED.mobile : MQ_SPEED.desktop) / 1000;
      s.offset = 0; s.vel = 0;
      wrap(); apply();
    }
    function paused() {
      // עוצרים רק לפי כפתור "עצירת אנימציות" בתפריט הנגישות של האתר — לא לפי הגדרת חיסכון/הפחתת תנועה של הטלפון
      // (הגדרה זו פעילה בהרבה טלפונים בלי שהמשתמש יודע, והפס לא זז בכלל במובייל)
      if (document.documentElement.classList.contains('a11y-no-motion')) { return true; }
      if (s.dragging || s.hover) { return true; }
      if (opts.isPaused && opts.isPaused()) { return true; }
      return performance.now() < s.resumeAt;
    }
    function tick(now) {
      var dt = Math.min(now - (s.last || now), 50);
      s.last = now;
      if (!box.isConnected) { looping = false; return; }
      if (s.W && !document.hidden) {
        if (!s.dragging && Math.abs(s.vel) > 0.02) {                 // תנופה אחרי שחרור
          s.offset += s.vel * dt;
          s.vel *= Math.pow(0.94, dt / 16);
          s.resumeAt = Math.max(s.resumeAt, now + 1500);
        } else if (!s.dragging) {
          s.vel = 0;
          if (!paused()) { s.offset += s.speed * dt; }               // כיוון הגלילה: ימינה
        }
        wrap();
        apply();
      }
      if (visible) { requestAnimationFrame(tick); } else { looping = false; }
    }
    function startLoop() {
      if (looping) { return; }
      looping = true; s.last = 0;
      requestAnimationFrame(tick);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) { startLoop(); }
      }).observe(box);
    }

    // ----- גרירה (עכבר / מגע / עט) -----
    var DRAG_PX = 6;                         // תנועה קטנה מזה = לחיצה; גדולה = גרירה (ולא מפעילה לחיצות)
    var pid = null, startX = 0, startY = 0, lastX = 0, lastT = 0, moved = 0, captured = false, swallow = false, vertical = false;
    box.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) { return; }
      pid = e.pointerId; startX = lastX = e.clientX; startY = e.clientY; lastT = performance.now(); moved = 0; captured = false;
      vertical = false;
      s.vel = 0; s.dragging = false;
    });
    box.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid || vertical) { return; }
      var dx = e.clientX - lastX;
      if (!s.dragging && e.pointerType !== 'mouse') {
        // מגע: תנועה ראשונה בעיקר אנכית = גלילת הדף, לא גרירת הפס (ובלי setPointerCapture)
        var adx = Math.abs(e.clientX - startX), ady = Math.abs(e.clientY - startY);
        if (ady > DRAG_PX && ady * 1.5 > adx) { vertical = true; pid = null; moved = 0; return; }
        if (adx <= DRAG_PX) { return; }
      }
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      if (!s.dragging) {
        if (moved <= DRAG_PX) { return; }
        s.dragging = true;
        box.classList.add('is-dragging');
        try { box.setPointerCapture(pid); captured = true; } catch (err) {}
        lastX = e.clientX; lastT = performance.now();
        return;
      }
      var now = performance.now(), dtm = Math.max(now - lastT, 1);
      s.offset += dx;
      s.vel = 0.7 * s.vel + 0.3 * (dx / dtm);        // מהירות מוחלקת לתנופה
      lastX = e.clientX; lastT = now;
      wrap(); apply();
    });
    function endDrag(e) {
      if (e.pointerId !== pid) { return; }
      var was = s.dragging;
      pid = null;
      if (captured) { try { box.releasePointerCapture(e.pointerId); } catch (err) {} }
      captured = false; s.dragging = false;
      box.classList.remove('is-dragging');
      if (was) {
        swallow = true;
        setTimeout(function () { swallow = false; }, 50);
        if (Math.abs(s.vel) > 0.6) { s.vel = s.vel > 0 ? 0.6 : -0.6; }
        s.resumeAt = performance.now() + 1500;
      }
    }
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);
    box.addEventListener('click', function (e) {
      if (swallow || moved > DRAG_PX) { e.stopPropagation(); e.preventDefault(); }
    }, true);
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { s.hover = true; } });   // ריחוף = השהיה
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { s.hover = false; } });
    box.addEventListener('wheel', function (e) {                    // גלגלת אופקית / משטח מגע
      var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!dx) { return; }                   // גלילה אנכית רגילה — עוברת לדף
      e.preventDefault();
      s.offset -= dx; s.vel = 0; s.resumeAt = performance.now() + 1500;
      wrap(); apply();
    }, { passive: false });

    startLoop();
    return { state: s, measure: measure, wrap: wrap, apply: apply };
  }

  var mqE = (marquee && mqTrack) ? initMarquee(marquee, mqTrack, {
    isPaused: function () {
      if (marquee.classList.contains('is-modal-paused')) { return true; }
      try { if (marquee.querySelector(':focus-visible')) { return true; } } catch (err) {}   // פוקוס מקלדת עוצר את הפס
      return false;
    }
  }) : null;
  var mq = mqE ? mqE.state : {};

  function buildMarquee() {
    var cards = matching();
    if (!marquee || !mqTrack || !cards.length) { return; }

    var vw = marquee.clientWidth || window.innerWidth;
    var cardW = window.innerWidth < 768 ? 115 : 145;
    var step  = cardW + 16;
    var reps  = Math.max(1, Math.ceil((vw + step) / (step * cards.length)));

    function makeSet(hidden) {
      var frag = document.createDocumentFragment();
      for (var r = 0; r < reps; r++) {
        cards.forEach(function (c) {
          var n = c.cloneNode(true);
          n.classList.remove('is-hidden', 'reveal');
          var im = n.querySelector('img');
          var ttl = im ? (im.getAttribute('alt') || '') : '';
          if ((n.tagName === 'A' || n.tagName === 'BUTTON') && ttl) { n.setAttribute('aria-label', ttl); }
          if (im) { im.setAttribute('draggable', 'false'); }
          if (im && !im.parentNode.classList.contains('project-media')) {
            var wrap = document.createElement('div');
            wrap.className = 'project-media';
            im.parentNode.insertBefore(wrap, im);
            wrap.appendChild(im);
          }
          if (hidden) {
            n.setAttribute('aria-hidden', 'true');
            if (n.tagName === 'A' || n.tagName === 'BUTTON') { n.setAttribute('tabindex', '-1'); }
          }
          frag.appendChild(n);
        });
      }
      return frag;
    }

    mqTrack.innerHTML = '';
    mqTrack.appendChild(makeSet(false));
    mqTrack.appendChild(makeSet(true));
    mqE.measure(reps * cards.length);
  }

  // מציג את התוכן של הלשונית הנוכחית: פס/רשת, או הודעת "בקרוב" כשאין לקוחות במגזר
  function renderSector() {
    sources.forEach(function (c) {                                // אריחי טקסט (לקוח בלי לוגו): שם לפי השפה
      var tn = c.querySelector('.logo-name'), dd = PDATA[c.getAttribute('data-client')];
      if (!tn || !dd) { return; }
      var lg = document.documentElement.getAttribute('lang') || 'he';
      var nm = (lg !== 'he' && dd.i18n && dd.i18n[lg] && dd.i18n[lg].name) || dd.name;
      tn.textContent = nm; c.setAttribute('aria-label', nm);
    });
    var cards = matching();
    var empty = !cards.length;
    if (stage) { stage.classList.toggle('is-empty', empty); }
    if (emptyMsg) { emptyMsg.hidden = !empty; }
    sources.forEach(function (c) { c.classList.toggle('is-hidden', !(currentSector === 'all' || sectorOf(c) === currentSector)); });
    if (!empty && marquee && mqTrack) { buildMarquee(); }
  }
  window.rebuildMarquee = function () { renderSector(); };

  function selectTab(tab, focus) {
    var sector = tab.getAttribute('data-sector');
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.setAttribute('tabindex', on ? '0' : '-1');
    });
    if (focus) { tab.focus(); }
    if (sector === currentSector) { return; }
    currentSector = sector;
    if (stage) {
      stage.setAttribute('aria-labelledby', tab.id);
      stage.classList.add('is-fading');                 // דהייה החוצה, החלפה, דהייה פנימה — בלי קפיצת פריסה
      setTimeout(function () {
        renderSector();
        stage.classList.remove('is-fading');
      }, reduceMq ? 0 : 180);
    } else {
      renderSector();
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      var next = -1;
      if (e.key === 'ArrowRight') { next = rtl ? i - 1 : i + 1; }
      else if (e.key === 'ArrowLeft') { next = rtl ? i + 1 : i - 1; }
      else if (e.key === 'Home') { next = 0; }
      else if (e.key === 'End') { next = tabs.length - 1; }
      if (next < 0 || next >= tabs.length) { return; }
      e.preventDefault();
      selectTab(tabs[next], true);
    });
  });

  if (marquee && mqTrack && projectItems.length) {
    if ('MutationObserver' in window) {
      new MutationObserver(function () { window.rebuildMarquee(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }

    marquee.hidden = false;
    marquee.classList.add('is-on');
    renderSector();

    var mqTimer;
    var mqW = window.innerWidth;   // במובייל גלילה משנה רק את הגובה (שורת כתובת) — לא בונים מחדש
    window.addEventListener('resize', function () {
      if (window.innerWidth === mqW) { return; }
      mqW = window.innerWidth;
      clearTimeout(mqTimer);
      mqTimer = setTimeout(function () { window.rebuildMarquee(); }, 200);
    });
  } else {
    renderSector();
  }

  /* ---------------------------------------------------------------
     2) גלריה + Lightbox
     --------------------------------------------------------------- */
  var galleryItems = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-item')
  );

  var lightbox      = document.getElementById('lightbox');
  var lightboxImg   = document.getElementById('lightboxImg');
  var closeBtn      = document.getElementById('lightboxClose');
  var prevBtn       = document.getElementById('lightboxPrev');
  var nextBtn       = document.getElementById('lightboxNext');

  // הגלריה והלייטבוקס קיימים רק בדף הבית — בדפי החטיבות מדלגים
  if (lightbox && lightboxImg && closeBtn && prevBtn && nextBtn) {
    var currentIndex  = 0;

    function showImage(index) {
      // מעבר מעגלי (מהסוף לתחילה ולהיפך)
      if (index < 0) { index = galleryItems.length - 1; }
      if (index >= galleryItems.length) { index = 0; }
      currentIndex = index;

      var img = galleryItems[index].querySelector('img');
      lightboxImg.src = img.getAttribute('src');
      lightboxImg.alt = img.getAttribute('alt') || '';
    }

    function openLightbox(index) {
      showImage(index);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // מונע גלילת רקע
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // פתיחה בלחיצה על תמונה בגלריה
    galleryItems.forEach(function (item, index) {
      item.addEventListener('click', function () { openLightbox(index); });
    });

    // כפתורי ניווט וסגירה
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function () { showImage(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { showImage(currentIndex + 1); });

    // לחיצה על הרקע השחור סוגרת
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { closeLightbox(); }
    });

    // ניווט במקלדת
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) { return; }
      if (e.key === 'Escape')     { closeLightbox(); }
      if (e.key === 'ArrowLeft')  { showImage(currentIndex + 1); } // RTL: שמאל = הבא
      if (e.key === 'ArrowRight') { showImage(currentIndex - 1); } // RTL: ימין = הקודם
    });
  }

  /* ---------------------------------------------------------------
     3) טופס צור קשר — הצגת הודעת הצלחה (בלי שרת)
     --------------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault(); // אין שרת — לא שולחים לשום מקום

      // בדיקה בסיסית שהשדות מולאו
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      // הצגת הודעת ההצלחה וניקוי הטופס
      formSuccess.hidden = false;
      contactForm.reset();
    });
  }

  /* ---------------------------------------------------------------
     4) תפריט המבורגר (מובייל)
     --------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav   = document.getElementById('mainNav');
  var rootEl    = document.documentElement;
  var desktopMq = window.matchMedia('(min-width: 1024px)');

  function setNav(open) {
    mainNav.classList.toggle('is-open', open);
    navToggle.classList.toggle('is-open', open);
    rootEl.classList.toggle('nav-open', open);      // נעילת גלילת הרקע
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      setNav(!mainNav.classList.contains('is-open'));
    });

    // סגירת התפריט אחרי לחיצה על קישור
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setNav(false); });
    });

    // סגירה במקש Escape (והחזרת המיקוד להמבורגר)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        setNav(false);
        navToggle.focus();
      }
    });

    // מעבר לדסקטופ בזמן שהמגירה פתוחה — סוגרים ומשחררים את הגלילה
    var onMq = function () { if (desktopMq.matches) { setNav(false); } };
    if (desktopMq.addEventListener) { desktopMq.addEventListener('change', onMq); }
    else if (desktopMq.addListener) { desktopMq.addListener(onMq); }
  }


  /* ---------------------------------------------------------------
     5) דרושים — כפתור "שלחו קורות חיים" בוחר תחום וגולל לטופס;
        הטופס מציג הודעת הצלחה (בלי שרת, כמו טופס צור קשר)
     --------------------------------------------------------------- */
  var careersForm    = document.getElementById('careersForm');
  var careersSuccess = document.getElementById('careersSuccess');
  var careerField    = document.getElementById('careerField');

  if (careersForm) {
    document.querySelectorAll('.role-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (careerField) { careerField.value = btn.getAttribute('data-role'); }
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        careersForm.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        var first = document.getElementById('careerName');
        if (first) { first.focus({ preventScroll: true }); }
      });
    });

    careersForm.addEventListener('submit', function (e) {
      e.preventDefault(); // אין שרת — לא שולחים לשום מקום
      if (!careersForm.checkValidity()) {
        careersForm.reportValidity();
        return;
      }
      careersSuccess.hidden = false;
      careersForm.reset();
    });
  }

  /* ---------------------------------------------------------------
     6) מיקום עוגנים — מודדים את גובה ההדר הדביק בפועל (שתי שורות בדסקטופ,
        עשוי להשתנות) ומעדכנים scroll-padding-top = גובה + 16px.
        בנוסף, כל סקשן מקבל scroll-margin-top שמבטל את ריווח העליון שלו,
        כך שהכותרת נוחתת ~36px מתחת להדר — בלי רווח ריק גדול.
     --------------------------------------------------------------- */
  var siteHeader = document.querySelector('.site-header');
  var spySections = document.querySelectorAll('main > section[id]');
  var CONTENT_GAP = 20;   // 16px (scroll-padding) + 20px = ~36px מתחת להדר

  function updateAnchorOffsets() {
    if (!siteHeader) { return; }
    var h = Math.round(siteHeader.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-h', h + 'px');

    spySections.forEach(function (sec) {
      var pad = parseFloat(getComputedStyle(sec).paddingTop) || 0;
      sec.style.scrollMarginTop = (pad > CONTENT_GAP ? (CONTENT_GAP - pad) : 0) + 'px';
    });
  }

  updateAnchorOffsets();
  var aoW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === aoW) { return; }
    aoW = window.innerWidth;
    updateAnchorOffsets();
  });
  window.addEventListener('load', updateAnchorOffsets);
  if ('ResizeObserver' in window && siteHeader) {
    new ResizeObserver(updateAnchorOffsets).observe(siteHeader);   // גם אם ההדר מתכווץ בגלילה
  }

  /* ---------------------------------------------------------------
     7) חלון פרויקט (modal) — נפתח בלחיצה על לוגו לקוח בפס #projects.
        התוכן מגיע מ-js/projects-data.js (window.PROJECTS_DATA); עברית = המקור,
        en / ru / fr מתוך d.i18n. תמונות נפתחות בלייטבוקס עם כיתוב, מונה וחיצים.
     --------------------------------------------------------------- */
  if (projSection && Object.keys(PDATA).length) {
    var GT = function (key, fallback) {
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var e = window.GAD_T && window.GAD_T[key];
      return (e && e[lang]) || fallback;
    };
    var CITY_KEY = { 'תל אביב': 'city_tlv', 'ירושלים': 'city_jlm' };
    var PIN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

    var pm = document.createElement('div');
    pm.className = 'proj-modal';
    pm.id = 'projModal';
    pm.hidden = true;
    pm.innerHTML =
      '<div class="proj-modal__backdrop" data-pm-close></div>' +
      '<div class="proj-modal__box" role="dialog" aria-modal="true" aria-labelledby="projModalTitle" tabindex="-1">' +
        '<button type="button" class="proj-modal__x" data-pm-close>&times;</button>' +
        '<div class="proj-modal__head">' +
          '<div class="proj-modal__logo"><img src="" alt=""><span class="proj-modal__logotext" aria-hidden="true"></span></div>' +
          '<div class="proj-modal__headtext">' +
            '<h2 class="proj-modal__name" id="projModalTitle"></h2>' +
            '<p class="proj-modal__sub" dir="ltr" hidden></p>' +
            '<span class="proj-modal__city" hidden></span>' +
            '<div class="proj-modal__prog" hidden>' +
              '<span class="proj-modal__badge"></span>' +
              '<div class="proj-modal__meter"><strong></strong><span class="proj-modal__bar"><i></i></span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pm-flow"></div>' +
      '</div>';
    document.body.appendChild(pm);

    var pmBox   = pm.querySelector('.proj-modal__box');
    var pmX     = pm.querySelector('.proj-modal__x');
    var pmLogo  = pm.querySelector('.proj-modal__logo img');
    var pmName  = pm.querySelector('.proj-modal__name');
    var pmSub   = pm.querySelector('.proj-modal__sub');
    var pmCity  = pm.querySelector('.proj-modal__city');
    var pmProg  = pm.querySelector('.proj-modal__prog');
    var pmLogoBox = pm.querySelector('.proj-modal__logo');
    var pmLogoText = pm.querySelector('.proj-modal__logotext');
    var pmFlow = pm.querySelector('.pm-flow');
    var pmStrips = [];
    var pmFrom = null, pmSlug = null;

    function pmPick(d, lang) {
      var tr = d.i18n && d.i18n[lang];
      return {
        name:  (tr && tr.name) || d.name || '',
        title: (tr && tr.title != null) ? tr.title : (d.title || ''),
        items: (tr && tr.items) ? tr.items : (d.items || [])
      };
    }

    // ----- לייטבוקס לתמונות (מעל החלון) -----
    var lb = document.createElement('div');
    lb.className = 'pj-lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<div class="pj-lb__backdrop" data-close></div>' +
      '<button type="button" class="pj-lb__x" data-close>&times;</button>' +
      '<button type="button" class="pj-lb__nav pj-lb__prev"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<button type="button" class="pj-lb__nav pj-lb__next"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<figure class="pj-lb__fig"><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption');
    var lbPrev = lb.querySelector('.pj-lb__prev'), lbNext = lb.querySelector('.pj-lb__next'), lbX = lb.querySelector('.pj-lb__x');
    var lbList = [], lbCur = 0, lbFrom = null;

    function lbShow(i) {
      var n = lbList.length;
      lbCur = (i + n) % n;
      lbImg.src = lbList[lbCur].src;
      lbImg.alt = lbList[lbCur].alt;
      lbCap.textContent = lbList[lbCur].alt;
    }
    function lbOpen(list, i, trigger) {
      lbList = list; lbFrom = trigger;
      lbPrev.hidden = lbNext.hidden = list.length < 2;
      lbX.setAttribute('aria-label', GT('pm_close', 'סגירה'));
      lbShow(i);
      lb.hidden = false;
      document.documentElement.classList.add('pj-lb-open');
      lbX.focus();
    }
    function lbClose() {
      if (lb.hidden) { return; }
      lb.hidden = true;
      document.documentElement.classList.remove('pj-lb-open');
      if (lbFrom) { lbFrom.focus(); }
    }
    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { lbClose(); }
      else if (e.target.closest('.pj-lb__prev')) { lbShow(lbCur - 1); }
      else if (e.target.closest('.pj-lb__next')) { lbShow(lbCur + 1); }
    });
    var lbSx = null;
    lb.addEventListener('touchstart', function (e) { lbSx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (lbSx === null) { return; }
      var dx = e.changedTouches[0].clientX - lbSx; lbSx = null;
      if (Math.abs(dx) > 50 && lbList.length > 1) { lbShow(dx < 0 ? lbCur + 1 : lbCur - 1); }
    }, { passive: true });

    // ----- תוכן החלון -----
    function renderModal() {
      var d = PDATA[pmSlug] || IPDATA[pmSlug];
      if (!d) { return; }
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var t = pmPick(d, lang);
      if (d.inProgress) { t.name = GT('ip_name', t.name); }

      pmLogoBox.classList.toggle('is-photo', !!d.inProgress);      // כרטיס בביצוע: התמונה במקום הלוגו
      var cityTxt = '';                                                // העיר נשארת בשורת השם: "שם, עיר" (כמו Sweet Home)
      if (d.city) {
        var ck = CITY_KEY[d.city];
        cityTxt = d.inProgress ? GT('ip_loc', d.city) : (ck ? GT(ck, d.city) : d.city);
      }
      var fullName = t.name + (cityTxt ? ', ' + cityTxt : '');
      var textLogo = !d.inProgress && ('logo' in d) && !d.logo;       // לקוח בלי לוגו: השם כטקסט בתוך האריח
      pm.classList.toggle('is-textlogo', textLogo);
      pmLogoText.textContent = textLogo ? fullName : '';
      if (textLogo) { pmLogo.removeAttribute('src'); }
      else { pmLogo.src = d.inProgress ? d.photo : 'images/clients/' + (d.logo || pmSlug) + '.png'; }
      pmLogo.alt = textLogo ? '' : t.name;
      pmName.textContent = fullName;
      pmX.setAttribute('aria-label', GT('pm_close', 'סגירה'));

      pmSub.hidden = !d.subtitle;
      if (d.subtitle) { pmSub.textContent = d.subtitle; }

      pmCity.hidden = true;                                            // תגית העיר בוטלה — העיר בשורת השם

      pmProg.hidden = !d.inProgress;
      if (d.inProgress) {
        pmProg.querySelector('.proj-modal__badge').textContent = GT('ip_status', 'בביצוע');
        pmProg.querySelector('strong').textContent = d.progress + '%';
        pmProg.querySelector('.proj-modal__bar i').style.width = d.progress + '%';
      }

      // כותרת (תגית), תיאור (ticker) ותמונות (רצועה) — תבנית אחת לכל הלקוחות
      var imgs = (d.images || []).map(function (it) {
        var o = typeof it === 'string' ? { src: it } : it;
        return { src: o.src, alt: o.alt || t.name, portrait: !!(o.width && o.height && o.height > o.width * 1.15), known: !!(o.width && o.height) };
      });
      pmFlow.innerHTML = '';
      pmStrips = [];
      pmBuildFlow(t, imgs);
      if (!pm.hidden) { pmMeasure(); }
    }

    // ----- תבנית החלון: תיאור העבודה ורצועת תמונות כפסים נעים (initMarquee המשותף) -----
    function pmStrip(cls) {
      var box = document.createElement('div');
      box.className = 'pm-sbox ' + cls;
      var track = document.createElement('div');
      track.className = 'pm-strack';
      box.appendChild(track);
      return { box: box, track: track };
    }
    // ממלא את הרצועה: עותק אחד נמדד, ואז reps עותקים + reps עותקים כפולים (חבויים) — לולאה חלקה
    function pmFill(st, makeSet) {
      var track = st.track, box = st.box;
      track.innerHTML = '';
      makeSet(false).forEach(function (n) { track.appendChild(n); });
      var setW = track.getBoundingClientRect().width;
      var count = track.children.length;
      if (!setW || !count) { return; }
      var reps = Math.max(1, Math.ceil(box.clientWidth / setW));
      track.innerHTML = '';
      [false, true].forEach(function (hidden) {
        for (var r = 0; r < reps; r++) { makeSet(hidden).forEach(function (n) { track.appendChild(n); }); }
      });
      st.eng.measure(reps * count);
    }
    function pmMeasure() { pmStrips.forEach(function (st) { pmFill(st, st.makeSet); }); }

    function pmBuildFlow(t, imgs) {
      var reduce = document.documentElement.classList.contains('a11y-no-motion');   // רק כפתור הנגישות של האתר
      // 0) כותרת העבודה: תגית (badge-chip של האתר) מתחת לשם החברה
      if (t.title) {
        var pill = document.createElement('span');
        pill.className = 'badge-chip pm-pill';
        pill.textContent = t.title;
        pmFlow.appendChild(pill);
      }
      // 1) התיאור (הפריטים בלבד)
      if (!t.items.length) {
        var soon = document.createElement('p');
        soon.className = 'proj-modal__soon';
        soon.textContent = GT('pm_soon', 'תיאור הפרויקט יתווסף בקרוב');
        pmFlow.appendChild(soon);
      } else {
        var seq = t.items.slice();
        if (reduce) {                                   // בלי תנועה: רשימה ממורכזת עוטפת שורות
          var list = document.createElement('p');
          list.className = 'pm-tk-static';
          seq.forEach(function (txt, i) {
            if (i) { var dd = document.createElement('span'); dd.className = 'pm-dot'; dd.setAttribute('aria-hidden', 'true'); list.appendChild(dd); }
            var sp = document.createElement('span'); sp.textContent = txt; if (t.title && i === 0) { sp.className = 'pm-tk-title'; } list.appendChild(sp);
          });
          pmFlow.appendChild(list);
        } else {
          var tk = pmStrip('pm-ticker');
          tk.eng = initMarquee(tk.box, tk.track, {});
          tk.makeSet = function (hidden) {
            var out = [];
            seq.slice().reverse().forEach(function (txt) {          // סדר קריאה ימין→שמאל בתוך העותק (הכותרת בימין)
              var sp = document.createElement('span');
              sp.className = 'pm-tk' + (t.title && txt === t.title ? ' pm-tk-title' : '');
              sp.textContent = txt;
              var dd = document.createElement('span'); dd.className = 'pm-dot';
              if (hidden) { sp.setAttribute('aria-hidden', 'true'); }
              dd.setAttribute('aria-hidden', 'true');
              out.push(sp, dd);
            });
            return out;
          };
          tk.box.setAttribute('role', 'group');
          tk.box.setAttribute('aria-label', t.items.join(', '));
          pmFlow.appendChild(tk.box);
          pmStrips.push(tk);
        }
      }
      // 2) התמונות
      if (!imgs.length) {
        var ph = document.createElement('div');
        ph.className = 'pm-ptile pm-ptile--empty';
        ph.innerHTML = '<div class="pm-ptile__empty"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.1-1.6A1.5 1.5 0 0 1 10.05 4.7h3.9a1.5 1.5 0 0 1 1.25.7L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9z"/><circle cx="12" cy="12.6" r="3.2"/></svg><span></span></div>';
        ph.querySelector('span').textContent = GT('pm_photos_soon', 'תמונות הפרויקט יתווספו בקרוב');
        pmFlow.appendChild(ph);
        return;
      }
      var ps = pmStrip('pm-photos');
      ps.eng = initMarquee(ps.box, ps.track, {});
      ps.makeSet = function (hidden) {
        return imgs.map(function (o, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'pm-ptile';
          b.setAttribute('aria-label', 'הגדלת תמונה ' + (i + 1) + ' מתוך ' + imgs.length);
          var bl = document.createElement('span');
          bl.className = 'pm-ptile__blur';
          bl.setAttribute('aria-hidden', 'true');
          bl.style.setProperty('--pm-bg', 'url("' + new URL(o.src, document.baseURI).href.replace(/"/g, '%22') + '")');
          var im = document.createElement('img');
          im.src = o.src; im.alt = hidden ? '' : o.alt; im.decoding = 'async'; im.draggable = false;
          if (o.portrait) { b.classList.add('is-portrait'); }
          else if (!o.known) { im.addEventListener('load', function () { if (im.naturalHeight > im.naturalWidth * 1.15) { b.classList.add('is-portrait'); } }); }
          b.appendChild(bl); b.appendChild(im);
          if (hidden) { b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
          b.addEventListener('click', function () { lbOpen(imgs, i, b); });
          return b;
        });
      };
      pmFlow.appendChild(ps.box);
      pmStrips.push(ps);
    }

    function pmSetPaused(on) {
      if (marquee) { marquee.classList.toggle('is-modal-paused', on); }
      var ipb = document.querySelector('#in-progress .ip-marquee');
      if (ipb) { ipb.classList.toggle('is-modal-paused', on); }
    }

    function openProject(btn) {
      pmSlug = btn.getAttribute('data-client') || '';
      if (!PDATA[pmSlug] && !IPDATA[pmSlug]) { return; }
      pmFrom = btn;
      renderModal();
      pmBox.scrollTop = 0;
      pm.hidden = false;
      void pm.offsetWidth;
      pm.classList.add('is-open');
      pmMeasure();                                       // רצועות ה-ticker נמדדות רק כשהחלון גלוי
      document.documentElement.classList.add('modal-open');
      pmSetPaused(true);
      pmBox.focus();
    }

    function closeProject() {
      if (pm.hidden) { return; }
      pm.classList.remove('is-open');
      pm.hidden = true;
      document.documentElement.classList.remove('modal-open');
      pmSetPaused(false);
      if (pmFrom && document.body.contains(pmFrom)) { pmFrom.focus(); }
      else if (pmFrom) {
        var again = document.querySelector('.project-item[data-client="' + pmFrom.getAttribute('data-client') + '"]:not([aria-hidden="true"]), .progress-card[data-client="' + pmFrom.getAttribute('data-client') + '"]:not([aria-hidden="true"])');
        if (again) { again.focus(); }
      }
      pmFrom = null; pmSlug = null;
    }

    projSection.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.project-item[data-client]') : null;
      if (b && projSection.contains(b)) { openProject(b); }
    });
    var ipSecEl = document.getElementById('in-progress');
    if (ipSecEl) {                                       // כרטיסי #in-progress: לחיצה אמיתית בלבד (גרירה נבלעת במנוע הפס)
      ipSecEl.addEventListener('click', function (e) {
        var c = e.target.closest ? e.target.closest('.progress-card[data-client]') : null;
        if (c && ipSecEl.contains(c)) { openProject(c); }
      });
      ipSecEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') { return; }
        var c = e.target.closest ? e.target.closest('.progress-card[data-client]') : null;
        if (c && e.target === c) { e.preventDefault(); openProject(c); }
      });
    }
    pm.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-pm-close]')) { closeProject(); }
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.hidden) {                                   // הלייטבוקס מעל החלון — הוא מטפל במקשים
        if (e.key === 'Escape') { e.stopPropagation(); lbClose(); }
        else if (e.key === 'ArrowLeft')  { e.preventDefault(); lbShow(lbCur + 1); }   // RTL: שמאל = הבאה
        else if (e.key === 'ArrowRight') { e.preventDefault(); lbShow(lbCur - 1); }
        else if (e.key === 'Tab') {
          var f = lb.querySelectorAll('button:not([hidden])');
          if (f.length) {
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
        return;
      }
      if (pm.hidden) { return; }
      if (e.key === 'Escape') { e.stopPropagation(); closeProject(); return; }
      if (e.key === 'Tab') {                             // מלכודת פוקוס בתוך החלון
        var g = pm.querySelectorAll('button:not([hidden]):not([disabled])');
        if (!g.length) { return; }
        var gf = g[0], gl = g[g.length - 1];
        if (e.shiftKey && (document.activeElement === gf || document.activeElement === pmBox)) { e.preventDefault(); gl.focus(); }
        else if (!e.shiftKey && document.activeElement === gl) { e.preventDefault(); gf.focus(); }
      }
    }, true);

    // החלפת שפה בזמן שהחלון פתוח
    if ('MutationObserver' in window) {
      new MutationObserver(function () { if (!pm.hidden) { renderModal(); } })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  /* מפה במובייל: מכוסה עד הקשה, כדי שהחלקה עליה תגלול את הדף */
  var mapBtn = document.getElementById('mapActivate');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () { mapBtn.parentNode.classList.add('is-active'); });
  }

  /* ---------------------------------------------------------------
     8) פרויקטים בביצוע — אותו פס נע כמו #projects (initMarquee המשותף).
        הכרטיסים המקוריים נשארים כרשת סטטית (גיבוי); הפס נבנה מהם במשוכפל.
     --------------------------------------------------------------- */
  var ipSec  = document.getElementById('in-progress');
  var ipGrid = ipSec ? ipSec.querySelector('.progress-grid') : null;
  var ipBox  = ipSec ? ipSec.querySelector('.ip-marquee') : null;
  var ipTrack = ipBox ? ipBox.querySelector('.ip-track') : null;

  if (ipSec && ipGrid && ipBox && ipTrack) {
    var ipSrc = Array.prototype.slice.call(ipGrid.querySelectorAll('.progress-card'));
    var ipE = initMarquee(ipBox, ipTrack, {
      isPaused: function () {
        if (ipBox.classList.contains('is-modal-paused')) { return true; }
        try { if (ipBox.querySelector(':focus-visible')) { return true; } } catch (err) {}   // כמו #projects
        return false;
      }
    });

    var ipBuild = function () {
      var narrow = window.innerWidth < 768;
      var step = (narrow ? 115 : 145) + 16;   // אותו אריח כמו פס הלוגואים
      var vw = ipBox.clientWidth || window.innerWidth;
      var reps = Math.max(1, Math.ceil((vw + step) / (step * ipSrc.length)));
      function set(hidden) {
        var f = document.createDocumentFragment();
        for (var r = 0; r < reps; r++) {
          ipSrc.forEach(function (c) {
            var n = c.cloneNode(true);
            if (hidden) { n.setAttribute('aria-hidden', 'true'); n.setAttribute('tabindex', '-1'); }
            f.appendChild(n);
          });
        }
        return f;
      }
      ipTrack.innerHTML = '';
      ipTrack.appendChild(set(false));
      ipTrack.appendChild(set(true));
      ipE.measure(reps * ipSrc.length);
      if (window.setLanguage) { window.setLanguage(document.documentElement.getAttribute('lang') || 'he'); }
    };

    ipBox.hidden = false;
    ipBox.classList.add('is-on');
    ipGrid.classList.add('is-replaced');
    ipBuild();

    var ipTimer;
    var ipW = window.innerWidth;   // רק שינוי רוחב אמיתי (לא שורת כתובת בגלילה)
    window.addEventListener('resize', function () {
      if (window.innerWidth === ipW) { return; }
      ipW = window.innerWidth;
      clearTimeout(ipTimer);
      ipTimer = setTimeout(ipBuild, 200);
    });

    // התקדמות מתמלאת בכניסה ראשונה לתצוגה (גם בעותק המשוכפל)
    if ('IntersectionObserver' in window) {
      var ipIo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { ipSec.classList.add('ip-in'); ipIo.disconnect(); } });
      }, { threshold: 0.15 });
      ipIo.observe(ipSec);
    } else { ipSec.classList.add('ip-in'); }

    if ('MutationObserver' in window) {
      var ipLang = document.documentElement.getAttribute('lang');   // מגן מלולאה אינסופית: setLanguage כותב שוב את lang ומפעיל את המשקיף
      new MutationObserver(function () {
        var cur = document.documentElement.getAttribute('lang') || 'he';
        if (cur === ipLang) { return; }
        ipLang = cur;
        if (window.setLanguage) { window.setLanguage(cur); }
      })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }


  /* ---------------------------------------------------------------
     9) Hero H1 — הלוגו + "בכל מקום במפה" כפס נע אינסופי (אותו מנוע initMarquee כמו #projects).
        הכותרת האמיתית (ל-SEO ולקוראי מסך) נשארת ב-.hero-mq__src (מוסתרת ויזואלית);
        הפס עצמו aria-hidden ונבנה ממנה מחדש בכל החלפת שפה.
     --------------------------------------------------------------- */
  var hmBox = document.querySelector('.hero-mq');
  var hmTrack = hmBox ? hmBox.querySelector('.hero-mq__track') : null;
  var hmSrc = document.querySelector('.hero-mq__src');
  if (hmBox && hmTrack && hmSrc) {
    var hmE = initMarquee(hmBox, hmTrack, {});
    var hmBuild = function () {
      var html = hmSrc.innerHTML.trim().replace(/(<img[^>]*>)\s+/i, '$1');   // בלי רווח/טקסט תועה בין הלוגו לטקסט
      var one = document.createElement('span');
      one.className = 'hero-mq__item'; one.innerHTML = html;
      hmTrack.innerHTML = ''; hmTrack.appendChild(one);
      var w = one.getBoundingClientRect().width || 600;
      var vw = hmBox.clientWidth || window.innerWidth;
      var reps = Math.max(1, Math.ceil((vw + w) / w));
      hmTrack.innerHTML = '';
      for (var k = 0; k < reps * 2; k++) {
        var it = document.createElement('span');
        it.className = 'hero-mq__item'; it.innerHTML = html;
        it.querySelectorAll('img').forEach(function (im) { im.setAttribute('alt', ''); im.setAttribute('draggable', 'false'); });
        hmTrack.appendChild(it);
      }
      hmE.measure(reps);
    };
    hmBuild();
    window.addEventListener('load', hmBuild);                          // אחרי טעינת הפונט/הלוגו — מדידה מדויקת
    var hmW = window.innerWidth, hmT;
    window.addEventListener('resize', function () {
      if (window.innerWidth === hmW) { return; }
      hmW = window.innerWidth; clearTimeout(hmT); hmT = setTimeout(hmBuild, 200);
    });
    if ('MutationObserver' in window) {                               // החלפת שפה כותבת מחדש את המקור
      new MutationObserver(function () { clearTimeout(hmT); hmT = setTimeout(hmBuild, 50); })
        .observe(hmSrc, { childList: true, subtree: true, characterData: true });
    }
  }


  /* ---------------------------------------------------------------
     10) #about — הכותרת "מדוע נולד הרעיון..." בשורה אחת, ברוחב עמודת הטקסט בדיוק
         (מחשב ≥1024). גודל הכתב מחושב כך שהשורה נגמרת בקצה הפסקאות. במובייל — שבירה רגילה.
     --------------------------------------------------------------- */
  var abTitle = document.querySelector('#about .about-title');
  var abCol = document.querySelector('#about .about-text');
  if (abTitle && abCol) {
    var fitAbout = function () {
      abTitle.style.fontSize = '';
      if (window.innerWidth < 1024) { abTitle.style.whiteSpace = ''; return; }
      abTitle.style.whiteSpace = 'nowrap';
      var target = abCol.getBoundingClientRect().width;
      var r = document.createRange(); r.selectNodeContents(abTitle);
      var w = r.getBoundingClientRect().width;
      if (target && w > target) {
        var fs = parseFloat(getComputedStyle(abTitle).fontSize);
        abTitle.style.fontSize = (fs * target / w * 0.995).toFixed(2) + 'px';
      }
    };
    fitAbout();
    window.addEventListener('load', fitAbout);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitAbout); }
    var abW = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== abW) { abW = window.innerWidth; fitAbout(); } });
    if ('MutationObserver' in window) {
      new MutationObserver(function () { setTimeout(fitAbout, 30); })
        .observe(abTitle, { childList: true, characterData: true, subtree: true });
    }
  }


  /* ---------------------------------------------------------------
     11) #about — כותרות בקו אחד בדיוק עם הטקסט: מודדים את קצה האות הראשונה (ימין)
         של כל כותרת מול קצה הטקסט של הפסקה שאחריה, ומיישרים בפיקסלים (ריווח האותיות דוחף שמאלה).
     --------------------------------------------------------------- */
  var abHeads = document.querySelectorAll('#about .section-eyebrow, #about .about-title, #about .about-text h3, #about .about-text h4');
  var abRef = document.querySelector('#about .about-text > p');
  if (abHeads.length && abRef) {
    var textRight = function (el) {
      var r = document.createRange(); r.selectNodeContents(el);
      var rs = r.getClientRects(); if (!rs.length) { return null; }
      var m = -Infinity; for (var q = 0; q < rs.length; q++) { if (rs[q].width && rs[q].right > m) { m = rs[q].right; } }
      return m === -Infinity ? null : m;
    };
    var alignHeads = function () {
      abHeads.forEach(function (h) { h.style.transform = ''; });
      var rtl = (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';
      if (!rtl) { return; }
      var ref = textRight(abRef); if (ref === null) { return; }
      abHeads.forEach(function (h) {
        var hr = textRight(h); if (hr === null) { return; }
        // בעברית ריווח האותיות נוסף גם מימין לאות הראשונה — מורידים אותו כדי שהאות עצמה תעמוד על הקו
        var ls = parseFloat(getComputedStyle(h).letterSpacing) || 0;
        var d = ref - (hr - ls);
        if (Math.abs(d) > 0.5 && Math.abs(d) < 40) { h.style.transform = 'translateX(' + d.toFixed(1) + 'px)'; }
      });
    };
    alignHeads();
    window.addEventListener('load', alignHeads);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(alignHeads); }
    var ahW = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== ahW) { ahW = window.innerWidth; alignHeads(); } });
    if ('MutationObserver' in window) {
      new MutationObserver(function () { setTimeout(alignHeads, 60); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    }
  }

});
