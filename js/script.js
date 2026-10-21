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
     1ב) פרויקטים — לשוניות מגזר (עסקי / פרטי) + פס נע אינסופי (marquee).
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
  var currentSector = 'business';

  function sectorOf(el) {
    var slug = el.getAttribute('data-client') || '';
    return (PDATA[slug] && PDATA[slug].sector) || 'business';
  }

  var sources = Array.prototype.slice.call(projectItems);

  function matching() {
    return sources.filter(function (c) { return sectorOf(c) === currentSector; });
  }

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

    mqTrack.style.animation = 'none';
    mqTrack.innerHTML = '';
    mqTrack.appendChild(makeSet(false));
    mqTrack.appendChild(makeSet(true));
    void mqTrack.offsetWidth;              // מאפס את האנימציה
    mqTrack.style.animation = '';
  }

  // מציג את התוכן של הלשונית הנוכחית: פס/רשת, או הודעת "בקרוב" כשאין לקוחות במגזר
  function renderSector() {
    var cards = matching();
    var empty = !cards.length;
    if (stage) { stage.classList.toggle('is-empty', empty); }
    if (emptyMsg) { emptyMsg.hidden = !empty; }
    sources.forEach(function (c) { c.classList.toggle('is-hidden', sectorOf(c) !== currentSector); });
    if (!empty && !reduceMq) { buildMarquee(); }
  }
  window.rebuildMarquee = function () { if (!reduceMq) { renderSector(); } };

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

  if (marquee && mqTrack && !reduceMq && projectItems.length) {
    if ('MutationObserver' in window) {
      new MutationObserver(function () { window.rebuildMarquee(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }

    marquee.hidden = false;
    marquee.classList.add('is-on');
    renderSector();

    var mqTimer;
    window.addEventListener('resize', function () {
      clearTimeout(mqTimer);
      mqTimer = setTimeout(function () { window.rebuildMarquee(); }, 200);
    });
    // החזקה במגע = השהיה
    marquee.addEventListener('touchstart', function () { marquee.classList.add('is-paused'); }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (ev) {
      marquee.addEventListener(ev, function () { marquee.classList.remove('is-paused'); }, { passive: true });
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
  window.addEventListener('resize', updateAnchorOffsets);
  window.addEventListener('load', updateAnchorOffsets);
  if ('ResizeObserver' in window && siteHeader) {
    new ResizeObserver(updateAnchorOffsets).observe(siteHeader);   // גם אם ההדר מתכווץ בגלילה
  }
});
