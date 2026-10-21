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
          '<div class="proj-modal__logo"><img src="" alt=""></div>' +
          '<div class="proj-modal__headtext">' +
            '<h2 class="proj-modal__name" id="projModalTitle"></h2>' +
            '<p class="proj-modal__sub" dir="ltr" hidden></p>' +
            '<span class="proj-modal__city" hidden></span>' +
          '</div>' +
        '</div>' +
        '<div class="proj-modal__body">' +
          '<div class="proj-modal__details">' +
            '<p class="proj-modal__title" hidden></p>' +
            '<ul class="proj-modal__items" hidden></ul>' +
            '<p class="proj-modal__soon" hidden></p>' +
          '</div>' +
          '<div class="proj-modal__thumbs" hidden></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(pm);

    var pmBox   = pm.querySelector('.proj-modal__box');
    var pmX     = pm.querySelector('.proj-modal__x');
    var pmLogo  = pm.querySelector('.proj-modal__logo img');
    var pmName  = pm.querySelector('.proj-modal__name');
    var pmSub   = pm.querySelector('.proj-modal__sub');
    var pmCity  = pm.querySelector('.proj-modal__city');
    var pmTitle = pm.querySelector('.proj-modal__title');
    var pmItems = pm.querySelector('.proj-modal__items');
    var pmSoon  = pm.querySelector('.proj-modal__soon');
    var pmThumbs = pm.querySelector('.proj-modal__thumbs');
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
      var d = PDATA[pmSlug];
      if (!d) { return; }
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var t = pmPick(d, lang);

      pmLogo.src = 'images/clients/' + (d.logo || pmSlug) + '.png';
      pmLogo.alt = t.name;
      pmName.textContent = t.name;
      pmX.setAttribute('aria-label', GT('pm_close', 'סגירה'));

      pmSub.hidden = !d.subtitle;
      if (d.subtitle) { pmSub.textContent = d.subtitle; }

      pmCity.hidden = !d.city;
      if (d.city) {
        var ck = CITY_KEY[d.city];
        pmCity.innerHTML = PIN + '<span></span>';
        pmCity.lastChild.textContent = ck ? GT(ck, d.city) : d.city;
      }

      if (t.title) {
        pmTitle.textContent = t.title; pmTitle.hidden = false;
        pmItems.innerHTML = '';
        t.items.forEach(function (it) {
          var li = document.createElement('li'); li.textContent = it; pmItems.appendChild(li);
        });
        pmItems.hidden = !t.items.length;
        pmSoon.hidden = true;
      } else {
        pmTitle.hidden = true; pmItems.hidden = true;
        pmSoon.textContent = GT('pm_soon', 'תיאור הפרויקט יתווסף בקרוב');
        pmSoon.hidden = false;
      }

      // תמונות: שורת תמונות ממוזערות במסגרת רכה
      pmThumbs.innerHTML = '';
      var imgs = (d.images || []).map(function (it) {
        var o = typeof it === 'string' ? { src: it } : it;
        return { src: o.src, alt: o.alt || t.name };
      });
      imgs.forEach(function (o, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pm-thumb';
        b.setAttribute('aria-label', 'הגדלת תמונה: ' + o.alt);
        var im = document.createElement('img');
        im.src = o.src; im.alt = o.alt; im.loading = 'lazy'; im.decoding = 'async';
        b.appendChild(im);
        b.addEventListener('click', function () { lbOpen(imgs, i, b); });
        pmThumbs.appendChild(b);
      });
      pmThumbs.hidden = !imgs.length;
      pm.querySelector('.proj-modal__body').classList.toggle('has-photos', imgs.length > 0);
    }

    function pmSetPaused(on) {
      if (marquee) { marquee.classList.toggle('is-modal-paused', on); }
    }

    function openProject(btn) {
      pmSlug = btn.getAttribute('data-client') || '';
      if (!PDATA[pmSlug]) { return; }
      pmFrom = btn;
      renderModal();
      pmBox.scrollTop = 0;
      pm.hidden = false;
      void pm.offsetWidth;
      pm.classList.add('is-open');
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
        var again = projSection.querySelector('.project-item[data-client="' + pmFrom.getAttribute('data-client') + '"]:not([aria-hidden="true"])');
        if (again) { again.focus(); }
      }
      pmFrom = null; pmSlug = null;
    }

    projSection.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.project-item[data-client]') : null;
      if (b && projSection.contains(b)) { openProject(b); }
    });
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

});
