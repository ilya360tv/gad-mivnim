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
    var Y = opts.axis === 'y';                 // פס אנכי: translateY, מדידת גבהים, גרירה אנכית בעכבר, תנועה כלפי מעלה
    var visible = true, looping = false;      // הלולאה רצה רק כשהפס בתוך המסך
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function wrap() {
      if (!s.W) { return; }
      // opts.wrap — לולאה מותאמת (רצועת התמונות ב-#about ממחזרת 3 פריימים). בלי זה: שני עותקים זהים.
      if (opts.wrap) { opts.wrap(s); return; }
      while (s.offset >= 0) { s.offset -= s.W; }
      while (s.offset < -s.W) { s.offset += s.W; }
    }
    function apply() {
      // אנכי: פיקסלים שלמים — קו 2px נשאר חד ולא נמרח בין שורות
      track.style.transform = Y
        ? 'translate3d(0,' + Math.round(s.offset) + 'px,0)'
        : 'translate3d(' + s.offset.toFixed(2) + 'px,0,0)';
    }
    function measure(per, fixed) {
      // רוחב עותק אחד = המרחק בין הפריט הראשון לפריט הראשון של העותק השני (כולל הרווחים).
      // fixed > 0 — גובה/רוחב ידוע מראש (כשהרצועה עדיין מוסתרת ו-offsetTop לא אמין).
      var kids = track.children;
      if (!per || kids.length < per + 1) { s.W = 0; return; }
      var prevW = s.W, prevOff = s.offset;
      s.W = (fixed > 0) ? fixed : (Y ? kids[per].offsetTop - kids[0].offsetTop : kids[per].offsetLeft - kids[0].offsetLeft);
      s.speed = (opts.speed || (window.innerWidth < 768 ? MQ_SPEED.mobile : MQ_SPEED.desktop)) / 1000;
      s.vel = 0;
      if (opts.place) { opts.place(s, prevW, prevOff); }
      else { s.offset = 0; }
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
          if (!paused()) { s.offset += (Y ? -s.speed : s.speed) * (opts.dir || 1) * dt; }   // כיוון הגלילה: ימינה (אנכי: למעלה); opts.dir = -1 הפוך
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
      if (Y && e.pointerType !== 'mouse') { return; }                  // מגע בפס אנכי: לא לוכדים — הדף ממשיך לגלול
      pid = e.pointerId; startX = lastX = Y ? e.clientY : e.clientX; startY = Y ? e.clientX : e.clientY; lastT = performance.now(); moved = 0; captured = false;
      vertical = false;
      s.vel = 0; s.dragging = false;
    });
    box.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid || vertical) { return; }
      var dx = (Y ? e.clientY : e.clientX) - lastX;
      if (!s.dragging && e.pointerType !== 'mouse') {
        // מגע: תנועה ראשונה בעיקר אנכית = גלילת הדף, לא גרירת הפס (ובלי setPointerCapture)
        var adx = Math.abs((Y ? e.clientY : e.clientX) - startX), ady = Math.abs((Y ? e.clientX : e.clientY) - startY);
        if (ady > DRAG_PX && ady * 1.5 > adx) { vertical = true; pid = null; moved = 0; return; }
        if (adx <= DRAG_PX) { return; }
      }
      moved = Math.max(moved, Math.abs((Y ? e.clientY : e.clientX) - startX));
      if (!s.dragging) {
        if (moved <= DRAG_PX) { return; }
        s.dragging = true;
        box.classList.add('is-dragging');
        try { box.setPointerCapture(pid); captured = true; } catch (err) {}
        lastX = Y ? e.clientY : e.clientX; lastT = performance.now();
        return;
      }
      var now = performance.now(), dtm = Math.max(now - lastT, 1);
      s.offset += dx;
      s.vel = 0.7 * s.vel + 0.3 * (dx / dtm);        // מהירות מוחלקת לתנופה
      lastX = Y ? e.clientY : e.clientX; lastT = now;
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
      if (Y) { return; }                     // פס אנכי: הגלגלת גוללת את הדף
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
  var lightboxCap   = document.getElementById('lightboxCap');
  var closeBtn      = document.getElementById('lightboxClose');
  var prevBtn       = document.getElementById('lightboxPrev');
  var nextBtn       = document.getElementById('lightboxNext');

  // הגלריה והלייטבוקס קיימים רק בדף הבית — בדפי החטיבות מדלגים
  if (lightbox && lightboxImg && closeBtn && prevBtn && nextBtn) {
    var currentIndex  = 0;

    var lbList = null;      // רשימה מותאמת (למשל תמונות "היום" ב-#about); null = הגלריה

    function showImage(index) {
      var n = lbList ? lbList.length : galleryItems.length;
      // מעבר מעגלי (מהסוף לתחילה ולהיפך)
      if (index < 0) { index = n - 1; }
      if (index >= n) { index = 0; }
      currentIndex = index;

      if (lightboxCap) {                       // כיתוב מתחת לתמונה (למשל שם הפרויקט בגלריה)
        var cap = lbList && lbList[index].caption;
        lightboxCap.textContent = cap || '';
        lightboxCap.hidden = !cap;
      }
      if (lbList) {
        lightboxImg.src = lbList[index].src;
        lightboxImg.alt = lbList[index].alt || '';
        return;
      }
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

    // פתיחת רשימת תמונות מותאמת: list = [{src, alt}], index = התמונה הראשונה
    window.openImageLightbox = function (list, index) { lbList = list; openLightbox(index); };

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // פתיחה בלחיצה על תמונה בגלריה
    galleryItems.forEach(function (item, index) {
      item.addEventListener('click', function () { lbList = null; openLightbox(index); });
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
     2א) #gallery — שני פסים נעים מתמונות הפרויקטים האמיתיים (js/projects-data.js — המקור היחיד).
         שורה 1 בכיוון הרגיל, שורה 2 בכיוון ההפוך. לחיצה פותחת את ה-lightbox עם שם הפרויקט.
         הרשת הסטטית מוצגת רק כשכפתור "עצירת אנימציות" פעיל (ב-CSS).
     --------------------------------------------------------------- */
  var galSec = document.getElementById('gallery');
  var galGrid = galSec ? galSec.querySelector('.gal-grid') : null;
  if (galGrid && window.PROJECTS_DATA) {
    var GAL_MIN = 500;                                   // תמונות קטנות מזה (בצד הקצר) לא נכנסות
    var galLang = function () { return document.documentElement.getAttribute('lang') || 'he'; };
    var galName = function (slug) {
      var c = window.PROJECTS_DATA[slug] || {}, tr = c.i18n && c.i18n[galLang()];
      return (tr && tr.name) || c.name || '';
    };
    // תמונות לפי פרויקט (בלי קטנות ובלי כפולות), מחולקות לסירוגין בין שתי השורות
    var galSeen = {}, galRows = [{}, {}], galN = 0;     // מונה משותף — שתי השורות כמעט שוות
    Object.keys(window.PROJECTS_DATA).forEach(function (slug) {
      var c = window.PROJECTS_DATA[slug];
      (c.images || []).forEach(function (im, i) {
        var src = typeof im === 'string' ? im : im.src;
        if (!src || galSeen[src]) { return; }
        if (im.width && im.height && Math.min(im.width, im.height) < GAL_MIN) { return; }
        galSeen[src] = true;
        var row = galRows[galN++ % 2];
        (row[slug] = row[slug] || []).push({ src: src, slug: slug, alt: (im.alt || (c.name + ' - תמונה ' + (i + 1))) });
      });
    });
    // ערבוב: בכל צעד — הפרויקט עם הכי הרבה תמונות שנשארו, ולא אותו פרויקט כמו התמונה הקודמת
    var galMix = function (groups) {
      var out = [], last = null;
      var left = function () { return Object.keys(groups).filter(function (k) { return groups[k].length; }); };
      for (var ks = left(); ks.length; ks = left()) {
        ks.sort(function (a, b) { return groups[b].length - groups[a].length; });
        var k = (ks[0] !== last || ks.length === 1) ? ks[0] : ks[1];
        out.push(groups[k].shift()); last = k;
      }
      return out;
    };
    var galLists = galRows.map(galMix);
    var galAll = galLists[0].concat(galLists[1]);        // ה-lightbox עובר על כל תמונות הגלריה
    galAll.forEach(function (p, i) { p.i = i; });

    var galTile = function (p, hidden) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gal-tile';
      b.setAttribute('data-gi', p.i);
      if (hidden) { b.setAttribute('aria-hidden', 'true'); b.setAttribute('tabindex', '-1'); }
      else { b.setAttribute('aria-label', p.alt); }
      var img = document.createElement('img');
      img.src = p.src; img.alt = hidden ? '' : p.alt;
      img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false;
      b.appendChild(img);
      return b;
    };
    galAll.forEach(function (p) { galGrid.appendChild(galTile(p, false)); });

    galSec.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('.gal-tile[data-gi]') : null;
      if (!t || !window.openImageLightbox) { return; }
      window.openImageLightbox(galAll.map(function (p) {
        return { src: p.src, alt: p.alt, caption: galName(p.slug) };
      }), +t.getAttribute('data-gi'));
    });

    var galBoxes = galSec.querySelectorAll('.gal-marquee');
    var galBuilds = [];
    Array.prototype.forEach.call(galBoxes, function (box, r) {
      var track = box.querySelector('.gal-track'), list = galLists[r];
      if (!track || !list.length) { return; }
      var eng = initMarquee(box, track, {
        dir: r === 1 ? -1 : 1,
        isPaused: function () {
          if (document.querySelector('#lightbox.is-open')) { return true; }
          try { if (box.querySelector(':focus-visible')) { return true; } } catch (err) {}
          return false;
        }
      });
      var set = function (reps, firstReal) {
        var f = document.createDocumentFragment();
        for (var k = 0; k < reps; k++) {
          list.forEach(function (p) { f.appendChild(galTile(p, !(firstReal && k === 0))); });
        }
        return f;
      };
      galBuilds.push(function () {
        track.innerHTML = '';
        track.appendChild(set(1, false));
        var a = track.children[0], b = track.children[1];
        var step = (a && b) ? Math.abs(b.offsetLeft - a.offsetLeft) : 294;
        var vw = box.clientWidth || window.innerWidth;
        var reps = Math.max(1, Math.ceil((vw + step) / (step * list.length)));
        track.innerHTML = '';
        track.appendChild(set(reps, true));
        track.appendChild(set(reps, false));
        eng.measure(reps * list.length);
      });
      box.hidden = false;
      box.classList.add('is-on');
    });
    if (galBuilds.length) {
      galGrid.classList.add('is-replaced');
      var galBuild = function () { galBuilds.forEach(function (f) { f(); }); };
      galBuild();
      var galW = window.innerWidth, galT;
      window.addEventListener('resize', function () {
        if (window.innerWidth === galW) { return; }
        galW = window.innerWidth; clearTimeout(galT); galT = setTimeout(galBuild, 200);
      });
    }
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

    // סגירת התפריט אחרי לחיצה על קישור; קטגוריות "בקרוב" (data-soon) — לחיצה לא עושה כלום
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (link.hasAttribute('data-soon')) { e.preventDefault(); return; }
        setNav(false);
      });
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
     5) דרושים — לחיצה על כרטיס תפקיד (או על "לפרטים") פותחת חלון פרטים
        (אותו מראה כמו חלון הפרויקט: .proj-modal). התוכן מ-js/careers-data.js.
        בתחתית החלון טופס "הגשת מועמדות" אחד לכל התפקידים: התחום נקבע לפי
        התפקיד (שדה לקריאה בלבד + role נסתר). בלי שרת — הודעת תודה בתוך החלון.
     --------------------------------------------------------------- */
  var careersSec = document.getElementById('careers');
  var CDATA      = window.CAREERS_DATA || null;

  if (careersSec && CDATA) {
    var CT = function (key, fallback) {
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var e = window.GAD_T && window.GAD_T[key];
      return (e && e[lang]) || fallback;
    };

    var rm = document.createElement('div');
    rm.className = 'proj-modal role-modal';
    rm.id = 'roleModal';
    rm.hidden = true;
    rm.innerHTML =
      '<div class="proj-modal__backdrop" data-rm-close></div>' +
      '<div class="proj-modal__box role-modal__box" role="dialog" aria-modal="true" aria-labelledby="roleModalTitle" tabindex="-1">' +
        '<button type="button" class="proj-modal__x" data-rm-close>&times;</button>' +
        '<div class="role-modal__head">' +
          '<span class="role-icon" aria-hidden="true"></span>' +
          '<h2 class="proj-modal__name" id="roleModalTitle"></h2>' +
          '<p class="role-modal__intro"></p>' +
        '</div>' +
        '<div class="role-modal__body"></div>' +
        '<form class="contact-form role-form" name="careers-application" method="POST" action="/" enctype="multipart/form-data" data-netlify="true" netlify-honeypot="bot-field" novalidate>' +
          '<input type="hidden" name="form-name" value="careers-application">' +
          '<p class="role-form__hp" hidden><label>Leave empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
          '<h3 class="role-modal__h role-form__title"></h3>' +
          '<div class="role-form__row">' +
            '<div class="form-field">' +
              '<label for="roleFormName" data-rf="car_f_name"></label>' +
              '<input type="text" id="roleFormName" name="name" autocomplete="name" required>' +
            '</div>' +
            '<div class="form-field">' +
              '<label for="roleFormPhone" data-rf="f_phone"></label>' +
              '<input type="tel" id="roleFormPhone" name="phone" autocomplete="tel" placeholder="05X-XXXXXXX" required>' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="roleFormField" data-rf="car_f_field"></label>' +
            '<input type="text" id="roleFormField" class="role-form__chip" readonly tabindex="-1">' +
            '<input type="hidden" name="role">' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="roleFormCv" data-rf="car_cv"></label>' +
            '<div class="cv-drop">' +
              '<input type="file" id="roleFormCv" name="cv" class="cv-drop__input" aria-required="true" aria-describedby="roleFormCvHint roleFormCvErr"' +
                ' accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">' +
              '<div class="cv-drop__empty">' +
                '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' +
                '<span class="cv-drop__text" id="roleFormCvHint" data-rf="car_cv_hint"></span>' +
                '<span class="cv-drop__types" data-rf="car_cv_types"></span>' +
              '</div>' +
              '<div class="cv-drop__file" hidden>' +
                '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>' +
                '<span class="cv-drop__meta"><span class="cv-drop__name" dir="auto"></span><span class="cv-drop__size"></span></span>' +
                '<button type="button" class="cv-drop__x">&times;</button>' +
              '</div>' +
            '</div>' +
            '<p class="cv-drop__err" id="roleFormCvErr" role="alert" hidden></p>' +
          '</div>' +
          '<button type="submit" class="btn btn-primary form-submit" data-rf="car_submit"></button>' +
          '<p class="form-success role-form__ok" role="status" hidden></p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(rm);

    var rmBox   = rm.querySelector('.proj-modal__box');
    var rmX     = rm.querySelector('.proj-modal__x');
    var rmIcon  = rm.querySelector('.role-icon');
    var rmTitle = rm.querySelector('.proj-modal__name');
    var rmIntro = rm.querySelector('.role-modal__intro');
    var rmBody  = rm.querySelector('.role-modal__body');
    var rmForm  = rm.querySelector('.role-form');
    var rmChip  = rm.querySelector('.role-form__chip');
    var rmRoleIn = rmForm.querySelector('input[name="role"]');
    var rmOk    = rm.querySelector('.role-form__ok');
    var rmSubmit = rmForm.querySelector('.form-submit');
    var cvInput = rm.querySelector('.cv-drop__input');
    var cvDrop  = rm.querySelector('.cv-drop');
    var cvEmpty = rm.querySelector('.cv-drop__empty');
    var cvFileBox = rm.querySelector('.cv-drop__file');
    var cvErr   = rm.querySelector('.cv-drop__err');
    var cvX     = rm.querySelector('.cv-drop__x');
    var CV_MAX  = 5 * 1024 * 1024;
    var rmRole = null, rmFrom = null, rmStatus = null, cvErrKey = null;

    var THANKS = 'תודה! קורות החיים התקבלו לתפקיד {role}. נחזור אליכם בהקדם.';
    var CV_ERR = { car_cv_err_type: 'ניתן להעלות קבצי PDF או Word בלבד', car_cv_err_size: 'הקובץ גדול מ-5MB', car_cv_req: 'יש לצרף קובץ קורות חיים' };

    // ----- העלאת קורות חיים: לחיצה / גרירה, PDF או Word בלבד, עד 5MB -----
    function cvSize(n) { return n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1024 / 1024).toFixed(1) + ' MB'; }
    function cvShowErr(key) {
      cvErrKey = key;
      cvErr.textContent = key ? CT(key, CV_ERR[key]) : '';
      cvErr.hidden = !key;
      cvDrop.classList.toggle('is-invalid', !!key);
    }
    function cvRender() {
      var f = cvInput.files && cvInput.files[0];
      cvDrop.classList.toggle('has-file', !!f);
      cvEmpty.hidden = !!f;
      cvFileBox.hidden = !f;
      if (f) {
        cvFileBox.querySelector('.cv-drop__name').textContent = f.name;
        cvFileBox.querySelector('.cv-drop__size').textContent = cvSize(f.size);
      }
    }
    function cvClear() { cvInput.value = ''; cvRender(); }
    function cvCheck() {                                 // true אם הקובץ תקין (או שעדיין אין קובץ)
      var f = cvInput.files && cvInput.files[0];
      if (!f) { cvRender(); return true; }
      if (!/\.(pdf|docx?)$/i.test(f.name)) { cvClear(); cvShowErr('car_cv_err_type'); return false; }
      if (f.size > CV_MAX) { cvClear(); cvShowErr('car_cv_err_size'); return false; }
      cvShowErr(null);
      cvRender();
      return true;
    }
    cvInput.addEventListener('change', cvCheck);
    cvDrop.addEventListener('click', function (e) {
      if (e.target.closest('.cv-drop__x') || e.target === cvInput) { return; }
      cvInput.click();
    });
    cvX.addEventListener('click', function () { cvClear(); cvShowErr(null); cvInput.focus(); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      cvDrop.addEventListener(ev, function (e) { e.preventDefault(); cvDrop.classList.add('is-drag'); });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      cvDrop.addEventListener(ev, function (e) { if (!cvDrop.contains(e.relatedTarget)) { cvDrop.classList.remove('is-drag'); } });
    });
    cvDrop.addEventListener('drop', function (e) {
      e.preventDefault();
      cvDrop.classList.remove('is-drag');
      var files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) { return; }
      var dt = new DataTransfer();                       // קובץ אחד בלבד
      dt.items.add(files[0]);
      cvInput.files = dt.files;
      cvCheck();
    });
    // קובץ שנזרק מחוץ לתיבה לא נפתח בלשונית במקום האתר
    rm.addEventListener('dragover', function (e) { e.preventDefault(); });
    rm.addEventListener('drop', function (e) { e.preventDefault(); });

    function roleHe() { var e = window.GAD_T && window.GAD_T['car_' + rmRole]; return (e && e.he) || roleName(); }
    function showStatus() {
      rmOk.hidden = !rmStatus;
      rmOk.classList.toggle('is-error', rmStatus === 'fail');
      if (rmStatus === 'ok') { rmOk.textContent = CT('car_thanks', THANKS).replace('{role}', roleName()); }
      else if (rmStatus === 'fail') { rmOk.textContent = CT('car_fail', 'השליחה נכשלה, נסו שוב.'); }
    }

    function rmList(heading, items) {
      if (!items || !items.length) { return; }
      var h = document.createElement('h3');
      h.className = 'role-modal__h';
      h.textContent = heading;
      var ul = document.createElement('ul');
      ul.className = 'role-modal__list';
      items.forEach(function (txt) {
        var li = document.createElement('li');
        li.textContent = txt;
        ul.appendChild(li);
      });
      rmBody.appendChild(h);
      rmBody.appendChild(ul);
    }

    function roleName() {
      var card = careersSec.querySelector('.role-card[data-role="' + rmRole + '"]');
      var cardTitle = card ? card.querySelector('h3') : null;
      return CT('car_' + rmRole, cardTitle ? cardTitle.textContent : '');
    }

    function renderRole() {
      var all = CDATA.roles && CDATA.roles[rmRole];
      if (!all) { return; }
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var d = all[lang] || all.he;
      var card = careersSec.querySelector('.role-card[data-role="' + rmRole + '"]');
      var cardIcon = card ? card.querySelector('.role-icon') : null;
      rmIcon.innerHTML = cardIcon ? cardIcon.innerHTML : '';
      rmTitle.textContent = roleName();
      rmIntro.textContent = d.intro || '';
      rmIntro.hidden = !d.intro;
      rmBody.innerHTML = '';
      rmList(CT('car_req', 'דרישות התפקיד'), d.req);
      rmList(CT('car_adv', 'יתרון'), d.adv);
      rmList(CT('car_offer', 'מה אנחנו מציעים'), (CDATA.offer && (CDATA.offer[lang] || CDATA.offer.he)) || []);

      // טופס: טקסטים לפי שפה, התחום לפי התפקיד
      rmForm.querySelector('.role-form__title').textContent = CT('car_apply', 'הגשת מועמדות');
      rmForm.querySelectorAll('[data-rf]').forEach(function (el) { el.textContent = CT(el.getAttribute('data-rf'), el.textContent); });
      rm.querySelector('#roleFormName').placeholder = CT('car_f_name', 'שם מלא');
      rmChip.value = roleName();
      rmRoleIn.value = roleHe();
      cvX.setAttribute('aria-label', CT('car_cv_remove', 'הסרת הקובץ'));
      if (cvErrKey) { cvShowErr(cvErrKey); }
      showStatus();
      rmX.setAttribute('aria-label', CT('pm_close', 'סגירה'));
    }

    function openRole(role, from) {
      if (!CDATA.roles || !CDATA.roles[role]) { return; }
      rmRole = role;
      rmFrom = from;
      rmStatus = null;
      rmForm.reset();
      cvShowErr(null);
      cvRender();
      renderRole();
      rmBox.scrollTop = 0;
      rm.hidden = false;
      void rm.offsetWidth;
      rm.classList.add('is-open');
      document.documentElement.classList.add('modal-open');
      rmBox.focus();
    }

    function closeRole() {
      if (rm.hidden) { return; }
      rm.classList.remove('is-open');
      rm.hidden = true;
      document.documentElement.classList.remove('modal-open');
      if (rmFrom && rmFrom.focus) { rmFrom.focus(); }
      rmFrom = null;
    }

    // כל הכרטיס לחיץ; הכפתור "לפרטים" בתוכו הוא נקודת הכניסה למקלדת
    careersSec.querySelectorAll('.role-card').forEach(function (card) {
      var btn = card.querySelector('.role-btn');
      if (btn && !card.hasAttribute('data-role')) { card.setAttribute('data-role', btn.getAttribute('data-role')); }
      card.addEventListener('click', function () {
        openRole(card.getAttribute('data-role'), btn || card);
      });
    });

    rm.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-rm-close]')) { closeRole(); }
    });

    // שליחה אמיתית ל-Netlify Forms (טופס careers-application; עותק סטטי חבוי ב-index.html לזיהוי בזמן הפריסה)
    rmForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!rmForm.checkValidity()) {
        rmForm.reportValidity();
        return;
      }
      if (!cvCheck()) { cvInput.focus(); return; }
      if (!(cvInput.files && cvInput.files[0])) { cvShowErr('car_cv_req'); cvInput.focus(); return; }

      rmRoleIn.value = roleHe();
      var data = new FormData(rmForm);
      var label = rmSubmit.textContent;
      rmSubmit.disabled = true;
      rmSubmit.textContent = CT('car_sending', 'שולח…');
      rmStatus = null;
      showStatus();
      fetch(rmForm.getAttribute('action') || '/', { method: 'POST', body: data })
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status); }
          rmForm.reset();
          cvShowErr(null);
          cvRender();
          rmChip.value = roleName();                     // reset מוחק גם את התחום — מחזירים
          rmRoleIn.value = roleHe();
          rmStatus = 'ok';
        })
        .catch(function () { rmStatus = 'fail'; })
        .then(function () {
          rmSubmit.disabled = false;
          rmSubmit.textContent = label;
          showStatus();
          rmOk.scrollIntoView({ block: 'nearest' });
        });
    });

    document.addEventListener('keydown', function (e) {
      if (rm.hidden) { return; }
      if (e.key === 'Escape') { e.stopPropagation(); closeRole(); return; }
      if (e.key === 'Tab') {                             // מלכודת פוקוס בתוך החלון
        var g = Array.prototype.filter.call(
          rm.querySelectorAll('button:not([hidden]):not([disabled]), input:not([type="hidden"]):not([tabindex="-1"])'),
          function (el) { return el.offsetParent !== null; });
        if (!g.length) { return; }
        var gf = g[0], gl = g[g.length - 1];
        if (e.shiftKey && (document.activeElement === gf || document.activeElement === rmBox)) { e.preventDefault(); gl.focus(); }
        else if (!e.shiftKey && document.activeElement === gl) { e.preventDefault(); gf.focus(); }
      }
    }, true);

    // החלפת שפה בזמן שהחלון פתוח (הערכים שהוקלדו נשמרים)
    if ('MutationObserver' in window) {
      new MutationObserver(function () { if (!rm.hidden) { renderRole(); } })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  // מכרזים / מנויים — הרשמה לעדכונים: אותה התנהגות (הודעת הצלחה + איפוס, בלי שרת)
  var tendersForm    = document.getElementById('tendersForm');
  var tendersSuccess = document.getElementById('tendersSuccess');
  if (tendersForm && tendersSuccess) {
    tendersForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!tendersForm.checkValidity()) {
        tendersForm.reportValidity();
        return;
      }
      tendersSuccess.hidden = false;
      tendersForm.reset();
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
    // דסקטופ: הניווט בעמודות צד קבועות — אין הדר עליון, ההיסט לעוגנים = 16px בלבד (scroll-padding)
    var h = window.matchMedia('(min-width: 1024px)').matches ? 0 : Math.round(siteHeader.getBoundingClientRect().height);
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
     6ב) #tenders / #app (דסקטופ ≥1024): לחיצה על הגלולה — הבלוק (מהכותרת העליונה ועד סוף הטופס / הכרטיסים)
         ממורכז אנכית במסך כשהוא נכנס בו; אחרת — צמוד למעלה עם 16px. גם בטעינה ישירה עם #tenders / #app.
         המדידה לפי offsetTop (בלי transform של אנימציות ה-reveal).
     --------------------------------------------------------------- */
  var CENTER_BLOCKS = { tenders: '.careers-form-card', app: '.plans-grid' };
  var docTop = function (el) {
    var y = 0;
    for (; el; el = el.offsetParent) { y += el.offsetTop; }
    return y;
  };
  var centerBlockTarget = function (id) {
    var sec = document.getElementById(id);
    var head = sec && sec.querySelector('.section-eyebrow');
    var last = sec && sec.querySelector(CENTER_BLOCKS[id]);
    if (!head || !last) { return null; }
    var top = docTop(head), bottom = docTop(last) + last.offsetHeight;
    var free = window.innerHeight - (bottom - top);
    return Math.max(0, Math.round(free >= 32 ? top - free / 2 : top - 16));
  };
  var centerBlock = function (id, behavior) {
    var y = centerBlockTarget(id);
    if (y === null) { return; }
    window.scrollTo({ top: y, behavior: behavior });
    // בזמן הגלילה תוכן מעל (תמונות lazy) עשוי לשנות גובה בכמה פיקסלים — תיקון קטן בסוף הגלילה
    var fix = function () {
      var y2 = centerBlockTarget(id);
      if (y2 !== null && Math.abs(y2 - window.scrollY) > 1) { window.scrollTo({ top: y2, behavior: 'instant' }); }
    };
    if ('onscrollend' in window) { window.addEventListener('scrollend', fix, { once: true }); }
    setTimeout(fix, 1500);
  };
  document.querySelectorAll('a[href="#tenders"], a[href="#app"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!desktopMq.matches) { return; }                          // טלפון/טאבלט — גלילה רגילה לעוגן
      e.preventDefault();
      var id = link.getAttribute('href').slice(1);
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      centerBlock(id, reduce ? 'auto' : 'smooth');
      if (history.replaceState) { history.replaceState(null, '', '#' + id); }
    });
  });
  var hashId = location.hash.slice(1);
  if (CENTER_BLOCKS[hashId] && desktopMq.matches) {
    var centerOnLoad = function () { centerBlock(hashId, 'instant'); };
    window.addEventListener('load', function () { setTimeout(centerOnLoad, 60); });   // אחרי קפיצת העוגן של הדפדפן
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(centerOnLoad); }
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
    window.gadPhotoLightbox = lbOpen;                  // גם לחלון השותפים (סעיף 7ב)
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

  /* ---------------------------------------------------------------
     7ב) חלון שותף — לחיצה על כרטיס ב-#partners פותחת חלון אחד (מראה .proj-modal):
         כותרת + סלוגן מהכרטיס, גלריה (תמונה ראשית + רצועת תמונות קטנות) ותוכן.
         התמונות והתוכן מגיעים מ-js/partners-data.js (window.PARTNERS_DATA) לפי data-slug.
     --------------------------------------------------------------- */
  var ptSec = document.getElementById('partners');
  var PTDATA = window.PARTNERS_DATA || {};
  if (ptSec) {
    var PT = function (key, fallback) {
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var e = window.GAD_T && window.GAD_T[key];
      return (e && e[lang]) || fallback;
    };
    var ptm = document.createElement('div');
    ptm.className = 'proj-modal pt-modal';
    ptm.hidden = true;
    ptm.innerHTML =
      '<div class="proj-modal__backdrop" data-ptm-close></div>' +
      '<div class="proj-modal__box pt-modal__box" role="dialog" aria-modal="true" aria-labelledby="ptModalTitle" tabindex="-1">' +
        '<button type="button" class="proj-modal__x" data-ptm-close>&times;</button>' +
        '<div class="pt-modal__head">' +
          '<h2 class="proj-modal__name" id="ptModalTitle"></h2>' +
          '<p class="pt-modal__tag"></p>' +
        '</div>' +
        '<button type="button" class="pt-modal__photo"><img alt="" decoding="async"></button>' +
        '<div class="pt-modal__thumbs" hidden></div>' +
        '<div class="pt-modal__content"></div>' +
      '</div>';
    document.body.appendChild(ptm);

    var ptBox = ptm.querySelector('.proj-modal__box');
    var ptX = ptm.querySelector('.proj-modal__x');
    var ptPhoto = ptm.querySelector('.pt-modal__photo');
    var ptImg = ptPhoto.querySelector('img');
    var ptName = ptm.querySelector('.proj-modal__name');
    var ptTag = ptm.querySelector('.pt-modal__tag');
    var ptThumbs = ptm.querySelector('.pt-modal__thumbs');
    var ptContent = ptm.querySelector('.pt-modal__content');
    var ptCard = null, ptPhotos = [], ptCur = 0;

    function ptShow(i) {
      ptCur = i;
      ptImg.src = ptPhotos[i] || '';
      ptThumbs.querySelectorAll('.pt-modal__thumb').forEach(function (t, k) {
        t.classList.toggle('is-active', k === i);
        t.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
    }

    function renderPartner() {
      if (!ptCard) { return; }
      var d = PTDATA[ptCard.getAttribute('data-slug')] || {};
      var title = ptCard.querySelector('strong');
      var tag = ptCard.querySelector('.partner-slogan');
      var cardImg = ptCard.querySelector('.partner-photo img');
      ptName.textContent = title ? title.textContent : '';
      ptTag.textContent = tag ? tag.textContent : '';
      ptTag.classList.toggle('is-soon', !!(tag && tag.classList.contains('is-soon')));
      ptImg.alt = ptName.textContent;
      ptPhoto.setAttribute('aria-label', ptName.textContent);

      ptPhotos = (d.photos && d.photos.length) ? d.photos.slice() : (cardImg ? [cardImg.getAttribute('src')] : []);
      ptThumbs.innerHTML = '';
      ptThumbs.hidden = ptPhotos.length < 2;              // תמונה אחת — בלי רצועת תמונות קטנות
      if (ptPhotos.length > 1) {
        ptPhotos.forEach(function (src, i) {
          var t = document.createElement('button');
          t.type = 'button';
          t.className = 'pt-modal__thumb';
          t.setAttribute('aria-label', ptName.textContent + ' ' + (i + 1));
          var im = document.createElement('img');
          im.src = src; im.alt = ''; im.decoding = 'async';
          t.appendChild(im);
          t.addEventListener('click', function () { ptShow(i); });
          ptThumbs.appendChild(t);
        });
      }
      ptShow(Math.min(ptCur, Math.max(ptPhotos.length - 1, 0)));

      ptContent.textContent = d.content || PT('pt_content_soon', 'תוכן יתווסף בקרוב');
      ptContent.classList.toggle('is-soon', !d.content);
      ptX.setAttribute('aria-label', PT('pm_close', 'סגירה'));
    }

    function openPartner(card) {
      ptCard = card;
      ptCur = 0;
      renderPartner();
      ptBox.scrollTop = 0;
      ptm.hidden = false;
      document.documentElement.classList.add('modal-open');
      ptBox.focus();
      // אנימציית הפתיחה מתחילה רק אחרי שהתמונה נטענה — החלון לא "קופץ"
      var shown = false;
      var show = function () { if (shown || ptCard !== card) { return; } shown = true; void ptm.offsetWidth; ptm.classList.add('is-open'); };
      if (ptImg.complete && ptImg.naturalWidth) { show(); }
      else {
        ptImg.addEventListener('load', show, { once: true });
        ptImg.addEventListener('error', show, { once: true });
        setTimeout(show, 1500);
      }
    }

    function closePartner() {
      if (ptm.hidden) { return; }
      ptm.classList.remove('is-open');
      ptm.hidden = true;
      document.documentElement.classList.remove('modal-open');
      if (ptCard) { ptCard.focus(); }
      ptCard = null;
    }

    ptSec.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.partner-chip[data-slug]') : null;
      if (c) { e.preventDefault(); openPartner(c); }
    });
    ptSec.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') { return; }
      var c = e.target.closest ? e.target.closest('.partner-chip[data-slug]') : null;
      if (c && e.target === c) { e.preventDefault(); openPartner(c); }
    });
    ptm.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-ptm-close]')) { closePartner(); }
    });
    ptPhoto.addEventListener('click', function () {      // לייטבוקס עם הקודמת/הבאה על כל תמונות הקטגוריה
      var list = ptPhotos.map(function (src) { return { src: src, alt: ptName.textContent }; });
      if (window.gadPhotoLightbox) { window.gadPhotoLightbox(list, ptCur, ptPhoto); }
      else if (window.openImageLightbox) { window.openImageLightbox(list, ptCur); }
    });

    document.addEventListener('keydown', function (e) {
      if (ptm.hidden || document.documentElement.classList.contains('pj-lb-open')) { return; }   // הלייטבוקס מעל — הוא מטפל
      if (e.key === 'Escape') { e.stopPropagation(); closePartner(); return; }
      if (e.key === 'Tab') {                             // מלכודת פוקוס בתוך החלון
        var g = Array.prototype.filter.call(ptm.querySelectorAll('button, a[href]'), function (el) { return el.offsetParent !== null; });
        var gf = g[0], gl = g[g.length - 1];
        if (e.shiftKey && (document.activeElement === gf || document.activeElement === ptBox)) { e.preventDefault(); gl.focus(); }
        else if (!e.shiftKey && document.activeElement === gl) { e.preventDefault(); gf.focus(); }
      }
    });

    if ('MutationObserver' in window) {
      new MutationObserver(function () { if (!ptm.hidden) { renderPartner(); } })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }

    /* ----- פס נע של כרטיסי הקטגוריות — אותו מנוע (initMarquee) כמו #projects ו-#in-progress.
             הרשת המקורית נשארת כגיבוי (וכתצוגה סטטית כשכפתור "עצירת אנימציות" פעיל — ב-CSS).
             לחיצה/מקלדת על כרטיס בפס פותחת את החלון דרך ההאזנה של ptSec; גרירה נבלעת במנוע. ----- */
    var ptGrid = ptSec.querySelector('.partners-grid');
    var ptqBox = ptSec.querySelector('.pt-marquee');
    var ptqTrack = ptqBox ? ptqBox.querySelector('.pt-track') : null;
    if (ptGrid && ptqBox && ptqTrack) {
      var ptqSrc = Array.prototype.slice.call(ptGrid.querySelectorAll('.partner-chip'));
      var ptqE = initMarquee(ptqBox, ptqTrack, {
        isPaused: function () {
          if (!ptm.hidden) { return true; }                                                   // החלון פתוח
          try { if (ptqBox.querySelector(':focus-visible')) { return true; } } catch (err) {}   // פוקוס מקלדת עוצר את הפס
          return false;
        }
      });

      var ptqBuild = function () {
        var iw = window.innerWidth;
        var gap = 16;
        var vw = ptqBox.clientWidth || iw;
        // רוחב כרטיס כמו ברשת (= כרטיסי #services): דסקטופ 5 בשורה, טאבלט 2 בשורה (עד 900px);
        // מובייל: מעט קטן יותר, אותן פרופורציות
        var cardW = iw < 768 ? 240
          : iw < 1024 ? Math.round((Math.min(vw, 900) - 20) / 2)
          : Math.round((vw - 4 * gap) / 5);
        ptqBox.style.setProperty('--pt-card-w', cardW + 'px');
        ptqBox.style.setProperty('--pt-card-gap', gap + 'px');
        var step = cardW + gap;
        var reps = Math.max(1, Math.ceil((vw + step) / (step * ptqSrc.length)));
        function set(hidden) {
          var f = document.createDocumentFragment();
          for (var r = 0; r < reps; r++) {
            ptqSrc.forEach(function (c) {
              var n = c.cloneNode(true);
              var im = n.querySelector('img');
              if (im) { im.setAttribute('draggable', 'false'); im.loading = 'eager'; }
              if (hidden) { n.setAttribute('aria-hidden', 'true'); n.setAttribute('tabindex', '-1'); }
              f.appendChild(n);
            });
          }
          return f;
        }
        ptqTrack.innerHTML = '';
        ptqTrack.appendChild(set(false));
        ptqTrack.appendChild(set(true));
        ptqE.measure(reps * ptqSrc.length);
        if (window.setLanguage) { window.setLanguage(document.documentElement.getAttribute('lang') || 'he'); }
        ptqTitles();
      };
      // כל אזורי הכותרת בגובה הכותרת הגבוהה ביותר (כותרת ארוכה נשברת לשתי שורות) — התמונות נשארות על קו אחד
      var ptqTitles = function () {
        ptqBox.style.removeProperty('--pt-title-h');
        var h = 0;
        ptqTrack.querySelectorAll('.partner-chip strong').forEach(function (t) { h = Math.max(h, t.offsetHeight); });
        if (h) { ptqBox.style.setProperty('--pt-title-h', h + 'px'); }
      };
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ptqTitles(); }); }

      ptqBox.hidden = false;
      ptqBox.classList.add('is-on');
      ptGrid.classList.add('is-replaced');
      ptqBuild();

      var ptqTimer;
      var ptqW = window.innerWidth;   // רק שינוי רוחב אמיתי (לא שורת כתובת בגלילה)
      window.addEventListener('resize', function () {
        if (window.innerWidth === ptqW) { return; }
        ptqW = window.innerWidth;
        clearTimeout(ptqTimer);
        ptqTimer = setTimeout(ptqBuild, 200);
      });

      if ('MutationObserver' in window) {
        var ptqLang = document.documentElement.getAttribute('lang');   // מגן מלולאה: setLanguage כותב שוב את lang
        new MutationObserver(function () {
          var cur = document.documentElement.getAttribute('lang') || 'he';
          if (cur === ptqLang) { return; }
          ptqLang = cur;
          ptqBuild();
        })
          .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      }
    }
  }

  /* ---------------------------------------------------------------
     7ג) #info — כרטיסי נושאים (18). לחיצה (או Enter/Space) פותחת חלון באותו עיצוב וגודל כמו חלון השותפים:
         כותרת + אייקון + משפט + תוכן. הכרטיסים והתוכן נבנים מ-js/info-data.js (window.INFO_DATA) — המקור היחיד.
     --------------------------------------------------------------- */
  var icSec = document.getElementById('info');
  var icGrid = icSec ? icSec.querySelector('.info-cards') : null;
  var ICDATA = window.INFO_DATA || [];
  if (icGrid) {
    var IT = function (key, fallback) {
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var e = window.GAD_T && window.GAD_T[key];
      return (e && e[lang]) || fallback;
    };
    var IL = function (o) {
      var lang = document.documentElement.getAttribute('lang') || 'he';
      return !o ? '' : (typeof o === 'string' ? o : (o[lang] || o.he || ''));
    };
    // תיבת האייקון: הלוגו (ימין) · קו מפריד · אייקון הנושא (שמאל)
    var icBoxHTML = function (icon) {
      return '<img class="ic-logo" src="images/gad_mivnim_logo.svg" alt="" width="40" height="40" decoding="async">' +
        '<span class="ic-divider" aria-hidden="true"></span>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icon || '') + '</svg>';
    };
    var icFind = function (slug) {
      for (var i = 0; i < ICDATA.length; i++) { if (ICDATA[i].slug === slug) { return ICDATA[i]; } }
      return null;
    };
    // הרשת המקורית: כרטיס לכל נושא, בסדר של INFO_DATA
    ICDATA.forEach(function (d) {
      var c = document.createElement('div');
      c.className = 'info-card';
      c.setAttribute('data-slug', d.slug);
      c.setAttribute('role', 'button');
      c.setAttribute('tabindex', '0');
      c.innerHTML = '<strong><span></span></strong>' +
        '<div class="info-card__icon">' + icBoxHTML(d.icon) + '</div>' +
        '<span class="info-card__teaser"></span>';
      icGrid.appendChild(c);
    });
    // טקסט הכרטיסים לפי השפה הנוכחית
    var icFill = function () {
      icGrid.querySelectorAll('.info-card[data-slug]').forEach(function (c) {
        var d = icFind(c.getAttribute('data-slug'));
        if (!d) { return; }
        c.querySelector('strong > span').textContent = IL(d.title);
        c.querySelector('.info-card__teaser').textContent = IL(d.teaser);
        c.setAttribute('title', IL(d.title));             // הכותרת המלאה (בכרטיס היא נחתכת אחרי 2 שורות)
      });
    };
    icFill();
    var icm = document.createElement('div');
    icm.className = 'proj-modal pt-modal ic-modal';
    icm.hidden = true;
    icm.innerHTML =
      '<div class="proj-modal__backdrop" data-icm-close></div>' +
      '<div class="proj-modal__box pt-modal__box" role="dialog" aria-modal="true" aria-labelledby="icModalTitle" tabindex="-1">' +
        '<button type="button" class="proj-modal__x" data-icm-close>&times;</button>' +
        '<div class="pt-modal__head">' +
          '<h2 class="proj-modal__name" id="icModalTitle"></h2>' +
          '<p class="pt-modal__tag"></p>' +
        '</div>' +
        '<div class="ic-modal__icon"></div>' +
        '<div class="pt-modal__content"></div>' +
        '<button type="button" class="ic-modal__cta"></button>' +
      '</div>';
    document.body.appendChild(icm);

    var icBox = icm.querySelector('.proj-modal__box');
    var icX = icm.querySelector('.proj-modal__x');
    var icName = icm.querySelector('.proj-modal__name');
    var icTag = icm.querySelector('.pt-modal__tag');
    var icIcon = icm.querySelector('.ic-modal__icon');
    var icContent = icm.querySelector('.pt-modal__content');
    var icCta = icm.querySelector('.ic-modal__cta');
    var icCard = null;

    var renderInfo = function () {
      if (!icCard) { return; }
      var d = icFind(icCard.getAttribute('data-slug')) || {};
      var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) { n.className = cls; } if (text) { n.textContent = text; } return n; };
      icName.textContent = IL(d.title);
      icTag.textContent = IL(d.teaser);
      icIcon.innerHTML = icBoxHTML(d.icon);
      // תוכן: פתיחה, "מה חשוב לדעת" (נקודות תכלת), תיבת "טיפ GAD MIVNIM"
      var has = !!(d.intro || (d.bullets && d.bullets.length) || d.tip);
      icContent.innerHTML = '';
      icContent.classList.toggle('is-soon', !has);
      icContent.classList.toggle('is-rich', has);
      if (!has) { icContent.textContent = IT('pt_content_soon', 'תוכן יתווסף בקרוב'); }
      else {
        var sec = el('section', 'ic-sec');
        if (d.intro) { sec.appendChild(el('p', 'ic-sec__intro', IL(d.intro))); }
        if (d.bullets && d.bullets.length) {
          sec.appendChild(el('h4', 'ic-sec__know', IT('ic_know', 'מה חשוב לדעת')));
          var ul = el('ul', 'ic-sec__list');
          d.bullets.forEach(function (pt) { ul.appendChild(el('li', '', IL(pt))); });
          sec.appendChild(ul);
        }
        if (d.tip) {
          var tip = el('div', 'ic-tip');
          var head = el('span', 'ic-tip__head');
          head.appendChild(el('span', 'ic-tip__icon', '✦'));
          head.appendChild(document.createTextNode(' ' + IT('ic_tip', 'טיפ GAD MIVNIM')));
          tip.appendChild(head);
          tip.appendChild(el('p', 'ic-tip__text', IL(d.tip)));
          sec.appendChild(tip);
        }
        icContent.appendChild(sec);
      }
      icCta.textContent = IT('ic_cta', 'דברו איתנו ←');
      icX.setAttribute('aria-label', IT('pm_close', 'סגירה'));
    };
    var openInfo = function (card) {
      icCard = card;
      renderInfo();
      icBox.scrollTop = 0;
      icm.hidden = false;
      document.documentElement.classList.add('modal-open');
      icBox.focus({ preventScroll: true });
      icBox.scrollTop = 0;                               // כל חלון נפתח מלמעלה (גם אחרי חלון שגולל)
      void icm.offsetWidth; icm.classList.add('is-open');
    };
    var closeInfo = function (noFocus) {
      if (icm.hidden) { return; }
      icm.classList.remove('is-open');
      icm.hidden = true;
      document.documentElement.classList.remove('modal-open');
      if (!noFocus && icCard && icCard.isConnected) { icCard.focus(); }
      icCard = null;
    };
    // "דברו איתנו" — סוגר את החלון וגולל לטופס צור קשר
    icCta.addEventListener('click', function () {
      closeInfo(true);
      var ct = document.getElementById('contact');
      if (ct) { ct.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });

    // האזנה על כל הסקשן: גם הכרטיסים ברשת וגם בפס הנע (גרירה בפס נבלעת במנוע ולא מגיעה לכאן)
    icSec.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.info-card[data-slug]') : null;
      if (c) { e.preventDefault(); openInfo(c); }
    });
    icSec.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') { return; }
      var c = e.target.closest ? e.target.closest('.info-card[data-slug]') : null;
      if (c && e.target === c) { e.preventDefault(); openInfo(c); }
    });
    icm.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-icm-close]')) { closeInfo(); }
    });
    document.addEventListener('keydown', function (e) {
      if (icm.hidden) { return; }
      if (e.key === 'Escape') { e.stopPropagation(); closeInfo(); return; }
      if (e.key === 'Tab') {                             // מלכודת פוקוס: סגירה ↔ "דברו איתנו"
        e.preventDefault();
        (document.activeElement === icX ? icCta : icX).focus();
      }
    });

    /* ----- פס נע של הכרטיסים — אותו מנוע (initMarquee) כמו #projects ו-#partners.
             הרשת המקורית נשארת כגיבוי ותצוגה סטטית כשכפתור "עצירת אנימציות" פעיל (ב-CSS).
             העותק הראשון נגיש; כל השאר aria-hidden + tabindex -1. ----- */
    var icqBox = icSec.querySelector('.ic-marquee');
    var icqTrack = icqBox ? icqBox.querySelector('.ic-track') : null;
    var icqBuild = function () {};
    if (icqBox && icqTrack) {
      var icqSrc = Array.prototype.slice.call(icGrid.querySelectorAll('.info-card'));
      var icqE = initMarquee(icqBox, icqTrack, {
        isPaused: function () {
          if (!icm.hidden) { return true; }                                                   // החלון פתוח
          try { if (icqBox.querySelector(':focus-visible')) { return true; } } catch (err) {}   // פוקוס מקלדת עוצר את הפס
          return false;
        }
      });
      var icqSet = function (reps, firstReal) {
        var f = document.createDocumentFragment();
        for (var r = 0; r < reps; r++) {
          icqSrc.forEach(function (c) {
            var n = c.cloneNode(true);
            if (!(firstReal && r === 0)) { n.setAttribute('aria-hidden', 'true'); n.setAttribute('tabindex', '-1'); }
            f.appendChild(n);
          });
        }
        return f;
      };
      icqBuild = function () {
        icqTrack.innerHTML = '';
        icqTrack.appendChild(icqSet(1, false));
        var first = icqTrack.children[0], second = icqTrack.children[1];
        var step = (second && first) ? Math.abs(second.offsetLeft - first.offsetLeft) : 230;
        var vw = icqBox.clientWidth || window.innerWidth;
        var reps = Math.max(1, Math.ceil((vw + step) / (step * icqSrc.length)));
        icqTrack.innerHTML = '';
        icqTrack.appendChild(icqSet(reps, true));
        icqTrack.appendChild(icqSet(reps, false));
        icqE.measure(reps * icqSrc.length);
      };
      icqBox.hidden = false;
      icqBox.classList.add('is-on');
      icGrid.classList.add('is-replaced');
      icqBuild();
      window.addEventListener('load', icqBuild);
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(icqBuild); }
      var icW = window.innerWidth, icT;
      window.addEventListener('resize', function () {
        if (window.innerWidth === icW) { return; }
        icW = window.innerWidth; clearTimeout(icT); icT = setTimeout(icqBuild, 200);
      });
    }
    if ('MutationObserver' in window) {
      var icqLang = document.documentElement.getAttribute('lang');   // רק החלפת שפה אמיתית
      new MutationObserver(function () {
        var cur = document.documentElement.getAttribute('lang') || 'he';
        if (cur === icqLang) { return; }
        icqLang = cur;
        icFill();                                         // החלפת שפה: הכרטיסים מתורגמים מ-INFO_DATA,
        icqBuild();                                       // והפס נבנה מחדש מהרשת המתורגמת
        if (!icm.hidden) { renderInfo(); }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  /* ---------------------------------------------------------------
     7ד) #podcast — כרטיסי פרקים בפס נע + חלון פרק (באותו עיצוב כמו #info).
         הכרטיסים, החלון והנגן נבנים מ-js/podcast-data.js (window.PODCAST_DATA) — המקור היחיד.
         נגן: כשלפרק יש audio — מנגן (HTML5 audio); בלי audio — נגן מעוצב + "הפרק יעלה בקרוב".
     --------------------------------------------------------------- */
  var pcSec = document.getElementById('podcast');
  var pcGrid = pcSec ? pcSec.querySelector('.pod-cards') : null;
  var PCDATA = window.PODCAST_DATA || [];
  var PCUI = window.PODCAST_UI || {};
  if (pcGrid && PCDATA.length) {
    var PL = function (o) {
      var lang = document.documentElement.getAttribute('lang') || 'he';
      return !o ? '' : (typeof o === 'string' ? o : (o[lang] || o.he || ''));
    };
    var PT = function (key, fallback) {
      var lang = document.documentElement.getAttribute('lang') || 'he';
      var e = window.GAD_T && window.GAD_T[key];
      return (e && e[lang]) || fallback;
    };
    var pcFind = function (n) {
      for (var i = 0; i < PCDATA.length; i++) { if (String(PCDATA[i].n) === String(n)) { return PCDATA[i]; } }
      return null;
    };
    var pcDur = function (d) { return d.min + ' ' + PL(PCUI.min); };
    var pcClock = function (sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      var m = Math.floor(sec / 60), s = sec % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    };
    var PC_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
    var PC_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>';

    // הרשת המקורית: כרטיס לכל פרק, בסדר של PODCAST_DATA
    PCDATA.forEach(function (d) {
      var c = document.createElement('div');
      c.className = 'info-card pod-card';
      c.setAttribute('data-ep', d.n);
      c.setAttribute('role', 'button');
      c.setAttribute('tabindex', '0');
      c.innerHTML = '<span class="pod-card__meta"><span class="pod-chip"></span><span class="pod-dur"></span></span>' +
        '<strong><span></span></strong>' +
        '<span class="pod-card__cover"><span class="pod-play">' + PC_PLAY + '</span></span>' +
        '<span class="pod-card__guest"></span>';
      pcGrid.appendChild(c);
    });
    var pcFill = function () {
      pcGrid.querySelectorAll('.pod-card[data-ep]').forEach(function (c) {
        var d = pcFind(c.getAttribute('data-ep'));
        if (!d) { return; }
        c.querySelector('.pod-chip').textContent = PL(PCUI.ep) + ' ' + d.n;
        c.querySelector('.pod-dur').textContent = pcDur(d);
        c.querySelector('strong > span').textContent = PL(d.title);
        c.querySelector('.pod-card__guest').textContent = PL(d.guest);
        c.setAttribute('title', PL(d.title));
      });
    };
    pcFill();

    // חלון הפרק — אותו חלון כמו חלון הנושא ב-#info
    var pcm = document.createElement('div');
    pcm.className = 'proj-modal pt-modal ic-modal pod-modal';
    pcm.hidden = true;
    pcm.innerHTML =
      '<div class="proj-modal__backdrop" data-pcm-close></div>' +
      '<div class="proj-modal__box pt-modal__box" role="dialog" aria-modal="true" aria-labelledby="pcModalTitle" tabindex="-1">' +
        '<button type="button" class="proj-modal__x" data-pcm-close>&times;</button>' +
        '<div class="pt-modal__head">' +
          '<h2 class="proj-modal__name" id="pcModalTitle"></h2>' +
          '<p class="pt-modal__tag pod-modal__meta"></p>' +
          '<p class="pod-modal__guest"></p>' +
        '</div>' +
        '<div class="pod-player">' +
          '<button type="button" class="pod-player__btn"></button>' +
          '<div class="pod-player__main">' +
            '<div class="pod-player__bar"><span class="pod-player__fill"></span></div>' +
            '<span class="pod-player__time"></span>' +
          '</div>' +
          '<p class="pod-player__note"></p>' +
          '<audio preload="none"></audio>' +
        '</div>' +
        '<div class="pt-modal__content is-rich"></div>' +
        '<button type="button" class="ic-modal__cta"></button>' +
      '</div>';
    document.body.appendChild(pcm);

    var pcBox = pcm.querySelector('.proj-modal__box');
    var pcX = pcm.querySelector('.proj-modal__x');
    var pcName = pcm.querySelector('.proj-modal__name');
    var pcMeta = pcm.querySelector('.pod-modal__meta');
    var pcGuest = pcm.querySelector('.pod-modal__guest');
    var pcBtn = pcm.querySelector('.pod-player__btn');
    var pcBar = pcm.querySelector('.pod-player__bar');
    var pcFillBar = pcm.querySelector('.pod-player__fill');
    var pcTime = pcm.querySelector('.pod-player__time');
    var pcNote = pcm.querySelector('.pod-player__note');
    var pcAudio = pcm.querySelector('audio');
    var pcContent = pcm.querySelector('.pt-modal__content');
    var pcCta = pcm.querySelector('.ic-modal__cta');
    var pcCard = null, pcEp = null;

    var pcPlayerUI = function () {
      var d = pcEp || {}, has = !!d.audio, playing = has && !pcAudio.paused;
      var total = (has && isFinite(pcAudio.duration) && pcAudio.duration) ? pcAudio.duration : (d.min || 0) * 60;
      var cur = has ? pcAudio.currentTime : 0;
      pcBtn.innerHTML = playing ? PC_PAUSE : PC_PLAY;
      pcBtn.setAttribute('aria-label', PL(playing ? PCUI.pause : PCUI.play));
      pcBtn.disabled = !has;
      pcFillBar.style.width = (total ? Math.min(100, cur / total * 100) : 0) + '%';
      pcTime.textContent = pcClock(cur) + ' / ' + pcClock(total);
      pcNote.textContent = PL(PCUI.soon);
      pcNote.hidden = has;
      pcm.querySelector('.pod-player').classList.toggle('is-soon', !has);
    };
    var renderEp = function () {
      var d = pcEp;
      if (!d) { return; }
      var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) { n.className = cls; } if (text) { n.textContent = text; } return n; };
      pcName.textContent = PL(d.title);
      pcMeta.textContent = PL(PCUI.ep) + ' ' + d.n + ' · ' + pcDur(d);
      pcGuest.textContent = PL(d.guest);
      pcContent.innerHTML = '';
      var sec = el('section', 'ic-sec');
      if (d.desc) { sec.appendChild(el('p', 'ic-sec__intro', PL(d.desc))); }
      if (d.points && d.points.length) {
        sec.appendChild(el('h4', 'ic-sec__know', PL(PCUI.inEp)));
        var ul = el('ul', 'ic-sec__list');
        d.points.forEach(function (pt) { ul.appendChild(el('li', '', PL(pt))); });
        sec.appendChild(ul);
      }
      pcContent.appendChild(sec);
      pcCta.textContent = PT('ic_cta', 'דברו איתנו ←');
      pcX.setAttribute('aria-label', PT('pm_close', 'סגירה'));
      pcPlayerUI();
    };
    var openEp = function (card) {
      pcCard = card;
      pcEp = pcFind(card.getAttribute('data-ep'));
      if (!pcEp) { return; }
      pcAudio.pause();
      if (pcEp.audio) { pcAudio.src = pcEp.audio; } else { pcAudio.removeAttribute('src'); }
      renderEp();
      pcm.hidden = false;
      document.documentElement.classList.add('modal-open');
      pcBox.focus({ preventScroll: true });
      pcBox.scrollTop = 0;
      void pcm.offsetWidth; pcm.classList.add('is-open');
    };
    var closeEp = function (noFocus) {
      if (pcm.hidden) { return; }
      pcAudio.pause();
      pcm.classList.remove('is-open');
      pcm.hidden = true;
      document.documentElement.classList.remove('modal-open');
      if (!noFocus && pcCard && pcCard.isConnected) { pcCard.focus(); }
      pcCard = null;
    };
    pcBtn.addEventListener('click', function () {
      if (!pcEp || !pcEp.audio) { return; }
      if (pcAudio.paused) { pcAudio.play(); } else { pcAudio.pause(); }
    });
    ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach(function (ev) { pcAudio.addEventListener(ev, pcPlayerUI); });
    pcBar.addEventListener('click', function (e) {                // לחיצה על הפס = קפיצה בזמן (רק כשיש שמע)
      if (!pcEp || !pcEp.audio || !isFinite(pcAudio.duration)) { return; }
      var r = pcBar.getBoundingClientRect();
      var f = (e.clientX - r.left) / r.width;
      if (getComputedStyle(pcBar).direction === 'rtl') { f = 1 - f; }
      pcAudio.currentTime = Math.max(0, Math.min(1, f)) * pcAudio.duration;
    });
    pcCta.addEventListener('click', function () {
      closeEp(true);
      var ct = document.getElementById('contact');
      if (ct) { ct.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    pcSec.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.pod-card[data-ep]') : null;
      if (c) { e.preventDefault(); openEp(c); }
    });
    pcSec.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') { return; }
      var c = e.target.closest ? e.target.closest('.pod-card[data-ep]') : null;
      if (c && e.target === c) { e.preventDefault(); openEp(c); }
    });
    pcm.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-pcm-close]')) { closeEp(); }
    });
    document.addEventListener('keydown', function (e) {
      if (pcm.hidden) { return; }
      if (e.key === 'Escape') { e.stopPropagation(); closeEp(); return; }
      if (e.key === 'Tab') {                             // מלכודת פוקוס: סגירה ↔ נגן (כשפעיל) ↔ "דברו איתנו"
        e.preventDefault();
        var f = [pcX, pcBtn, pcCta].filter(function (x) { return !x.disabled; });
        var i = f.indexOf(document.activeElement);
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });

    /* ----- פס נע — אותו מנוע (initMarquee) ואותה בנייה כמו ב-#info ----- */
    var pcqBox = pcSec.querySelector('.pod-marquee');
    var pcqTrack = pcqBox ? pcqBox.querySelector('.ic-track') : null;
    var pcqBuild = function () {};
    if (pcqBox && pcqTrack) {
      var pcqSrc = Array.prototype.slice.call(pcGrid.querySelectorAll('.pod-card'));
      var pcqE = initMarquee(pcqBox, pcqTrack, {
        isPaused: function () {
          if (!pcm.hidden) { return true; }
          try { if (pcqBox.querySelector(':focus-visible')) { return true; } } catch (err) {}
          return false;
        }
      });
      var pcqSet = function (reps, firstReal) {
        var f = document.createDocumentFragment();
        for (var r = 0; r < reps; r++) {
          pcqSrc.forEach(function (c) {
            var n = c.cloneNode(true);
            if (!(firstReal && r === 0)) { n.setAttribute('aria-hidden', 'true'); n.setAttribute('tabindex', '-1'); }
            f.appendChild(n);
          });
        }
        return f;
      };
      pcqBuild = function () {
        pcqTrack.innerHTML = '';
        pcqTrack.appendChild(pcqSet(1, false));
        var first = pcqTrack.children[0], second = pcqTrack.children[1];
        var step = (second && first) ? Math.abs(second.offsetLeft - first.offsetLeft) : 230;
        var vw = pcqBox.clientWidth || window.innerWidth;
        var reps = Math.max(1, Math.ceil((vw + step) / (step * pcqSrc.length)));
        pcqTrack.innerHTML = '';
        pcqTrack.appendChild(pcqSet(reps, true));
        pcqTrack.appendChild(pcqSet(reps, false));
        pcqE.measure(reps * pcqSrc.length);
      };
      pcqBox.setAttribute('aria-label', PL(PCUI.strip));
      pcqBox.hidden = false;
      pcqBox.classList.add('is-on');
      pcGrid.classList.add('is-replaced');
      pcqBuild();
      window.addEventListener('load', pcqBuild);
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(pcqBuild); }
      var pcW = window.innerWidth, pcT;
      window.addEventListener('resize', function () {
        if (window.innerWidth === pcW) { return; }
        pcW = window.innerWidth; clearTimeout(pcT); pcT = setTimeout(pcqBuild, 200);
      });
    }
    if ('MutationObserver' in window) {
      var pcLang = document.documentElement.getAttribute('lang');   // רק החלפת שפה אמיתית
      new MutationObserver(function () {
        var cur = document.documentElement.getAttribute('lang') || 'he';
        if (cur === pcLang) { return; }
        pcLang = cur;
        pcFill();
        if (pcqBox) { pcqBox.setAttribute('aria-label', PL(PCUI.strip)); }
        pcqBuild();
        if (!pcm.hidden) { renderEp(); }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
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
    window.addEventListener('pageshow', function (e) { if (e.persisted) { hmBuild(); } });   // חזרה מ-bfcache
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
     9ב) #about — שורת הסיום כפס נע אינסופי (אותו מנוע initMarquee כמו ה-Hero).
         הטקסט האמיתי נשאר פעם אחת ב-.about-mq__src (מוסתר ויזואלית); העותקים הנעים aria-hidden
         ונבנים מחדש בהחלפת שפה ורק בשינוי רוחב אמיתי.
     --------------------------------------------------------------- */
  var aqBox = document.querySelector('.about-mq');
  var aqTrack = aqBox ? aqBox.querySelector('.about-mq__track') : null;
  var aqSrc = document.querySelector('.about-mq__src');
  if (aqBox && aqTrack && aqSrc) {
    var aqE = initMarquee(aqBox, aqTrack, {});
    var aqItem = function () {
      var one = document.createElement('span');
      one.className = 'about-mq__item';
      var parts = aqSrc.children;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].cloneNode(true);
        if (i === parts.length - 1) { p.classList.add('is-reg'); }          // "משנים את הדרך..." — לא מודגש
        one.appendChild(p);
      }
      return one;
    };
    var aqBuild = function () {
      if (!aqSrc.children.length) { return; }
      aqTrack.innerHTML = '';
      var first = aqItem(); aqTrack.appendChild(first);
      var w = first.getBoundingClientRect().width || 600;
      var vw = aqBox.clientWidth || window.innerWidth;
      var reps = Math.max(1, Math.ceil((vw + w) / w));
      aqTrack.innerHTML = '';
      for (var k = 0; k < reps * 2; k++) { aqTrack.appendChild(aqItem()); }
      aqE.measure(reps);
    };
    aqBuild();
    window.addEventListener('load', aqBuild);
    if (document.fonts && document.fonts.load) { document.fonts.load('1em "Gveret Levin"', 'משנים').then(aqBuild, function () {}); }   // גופן המכחול — מדידה מחדש אחרי הטעינה
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(aqBuild); }
    var aqW = window.innerWidth, aqT;
    window.addEventListener('resize', function () {
      if (window.innerWidth === aqW) { return; }
      aqW = window.innerWidth; clearTimeout(aqT); aqT = setTimeout(aqBuild, 200);
    });
    if ('MutationObserver' in window) {
      new MutationObserver(function () { clearTimeout(aqT); aqT = setTimeout(aqBuild, 50); })
        .observe(aqSrc, { childList: true, subtree: true, characterData: true });
    }
  }


  /* ---------------------------------------------------------------
     9ג) #info — הכותרת "עם קצת ידע... חשבנו בשבילכם על הכל..." כשורה נעה (אותו מנוע initMarquee כמו ה-Hero ו-#about).
         ה-<h2> האמיתי נשאר פעם אחת ב-.info-mq__src (מוסתר ויזואלית); העותקים הנעים aria-hidden.
     --------------------------------------------------------------- */
  var iqBox = document.querySelector('#info .info-mq');
  var iqTrack = iqBox ? iqBox.querySelector('.info-mq__track') : null;
  var iqSrc = document.querySelector('#info .info-mq__src');
  if (iqBox && iqTrack && iqSrc) {
    var iqE = initMarquee(iqBox, iqTrack, {});
    var iqItem = function () {
      var one = document.createElement('span');
      one.className = 'info-mq__item';
      iqSrc.childNodes.forEach(function (n) { one.appendChild(n.cloneNode(true)); });   // כולל הרווחים בין החלקים
      one.querySelectorAll('[data-i18n]').forEach(function (el) { el.removeAttribute('data-i18n'); });   // התרגום כותב רק למקור
      return one;
    };
    var iqBuild = function () {
      if (!iqSrc.textContent.trim()) { return; }
      iqTrack.innerHTML = '';
      var first = iqItem(); iqTrack.appendChild(first);
      var w = first.getBoundingClientRect().width || 600;
      var vw = iqBox.clientWidth || window.innerWidth;
      var reps = Math.max(1, Math.ceil((vw + w) / w));
      iqTrack.innerHTML = '';
      for (var k = 0; k < reps * 2; k++) { iqTrack.appendChild(iqItem()); }
      iqE.measure(reps);
    };
    iqBuild();
    window.addEventListener('load', iqBuild);
    if (document.fonts && document.fonts.load) { document.fonts.load('1em "Guttman Yad-Brush"', 'חשבנו').then(iqBuild, function () {}); }   // גופן המכחול
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(iqBuild); }
    var iqW = window.innerWidth, iqT;
    window.addEventListener('resize', function () {
      if (window.innerWidth === iqW) { return; }
      iqW = window.innerWidth; clearTimeout(iqT); iqT = setTimeout(iqBuild, 200);
    });
    if ('MutationObserver' in window) {
      new MutationObserver(function () { clearTimeout(iqT); iqT = setTimeout(iqBuild, 50); })
        .observe(iqSrc, { childList: true, subtree: true, characterData: true });
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
      abTitle.style.maxWidth = '';
      if (window.innerWidth < 1024) { abTitle.style.whiteSpace = ''; return; }
      abTitle.style.whiteSpace = 'nowrap';
      var target = abCol.getBoundingClientRect().width;
      var r = document.createRange(); r.selectNodeContents(abTitle);
      var w = r.getBoundingClientRect().width;
      if (target && w) {
        // מגדילים או מכווצים כך שהשורה תמלא בדיוק את רוחב עמודת הטקסט (עד 40px)
        var fs = parseFloat(getComputedStyle(abTitle).fontSize);
        var raw = fs * target / w * 0.998;
        var next = Math.max(12, Math.min(40, raw));
        abTitle.style.fontSize = next.toFixed(2) + 'px';
        // הכותרת לעולם לא יוצאת מעמודת הטקסט (גם ב-LTR, שם עמודת התמונה בצד השני): אם אפילו ב-12px היא רחבה מהעמודה — שבירת שורות בתוך העמודה
        var isLtr = (document.documentElement.getAttribute('dir') || 'rtl') === 'ltr';
        if (raw < 12 || isLtr) { abTitle.style.maxWidth = target.toFixed(1) + 'px'; }
        if (raw < 12) {
          var p0 = abCol.querySelector('p');
          abTitle.style.whiteSpace = 'normal';
          abTitle.style.fontSize = (p0 ? parseFloat(getComputedStyle(p0).fontSize) * 1.1 : 16).toFixed(2) + 'px';
        }
      }
      if (typeof liftMedia === 'function') { liftMedia(); }          // הכותרת השתנתה — מיישרים מחדש את כותרת התמונות
    };
    fitAbout();
    window.addEventListener('load', fitAbout);
    window.addEventListener('pageshow', function (e) { if (e.persisted) { fitAbout(); } });   // חזרה מ-bfcache
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitAbout); }
    var abW = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== abW) { abW = window.innerWidth; fitAbout(); } });
    if ('MutationObserver' in window) {
      new MutationObserver(function () { setTimeout(fitAbout, 30); })
        .observe(abTitle, { childList: true, characterData: true, subtree: true });
    }
  }


  /* ---------------------------------------------------------------
     12) בורר השפה — תג עגול: הדגל במרכז המדויק, שם השפה מעוקל לאורך הקשת העליונה באמצע הטבעת החופשית
         (בין הדגל לקצה העיגול), כוכב קטן בקשת התחתונה. הטקסט נלקח מ-#langLabel ומתאים את עצמו לכל שפה.
         viewBox 0 0 100 100: עיגול r=50, דגל r=22 (44%), אמצע הטבעת r=36.
     --------------------------------------------------------------- */
  var lgBtn = document.getElementById('langBtn');
  var lgLabel = document.getElementById('langLabel');
  if (lgBtn && lgLabel) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lang-arc');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('id', 'langArcPath');
    path.setAttribute('fill', 'none');
    var txt = document.createElementNS(NS, 'text');
    var tp = document.createElementNS(NS, 'textPath');
    tp.setAttribute('href', '#langArcPath');
    tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#langArcPath');
    tp.setAttribute('startOffset', '50%');
    tp.setAttribute('text-anchor', 'middle');
    txt.appendChild(tp);
    var star = document.createElementNS(NS, 'path');        // ✦ עדין בקשת התחתונה (r=36)
    star.setAttribute('class', 'lang-star');
    star.setAttribute('d', 'M50,82.5 Q50.9,85.1 53.5,86 Q50.9,86.9 50,89.5 Q49.1,86.9 46.5,86 Q49.1,85.1 50,82.5Z');
    svg.appendChild(path); svg.appendChild(txt); svg.appendChild(star);
    lgBtn.appendChild(svg);

    var RING_MID = 36, CAP = 0.7, SPAN = 125 * Math.PI / 180;   // אמצע הטבעת, גובה אות/גודל, פרישה רצויה (125°)
    var FS_MIN = 12.5, FS_MAX = 14, LS_MAX = 0.45;               // 12.5 יחידות = 7px בעיגול 56px
    var fitArc = function () {
      var t = (lgLabel.textContent || '').trim();
      tp.textContent = t;
      if (!t) { return; }
      var n = Math.max(t.length - 1, 1);
      var fs = 13, ls = 0, rb = RING_MID - CAP * fs / 2;
      txt.style.letterSpacing = '0px';
      for (var i = 0; i < 3; i++) {
        txt.style.fontSize = fs + 'px';
        rb = RING_MID - CAP * fs / 2;                              // אמצע גובה האותיות על r=36
        path.setAttribute('d', 'M ' + (50 - rb).toFixed(2) + ',50 A ' + rb.toFixed(2) + ',' + rb.toFixed(2) + ' 0 0 1 ' + (50 + rb).toFixed(2) + ',50');
        var L = tp.getComputedTextLength();
        if (!L) { return; }
        var T = rb * SPAN;
        fs = Math.max(FS_MIN, Math.min(FS_MAX, fs * T / L));        // קודם גודל, בין המינימום למקסימום
      }
      txt.style.fontSize = fs + 'px';
      rb = RING_MID - CAP * fs / 2;
      path.setAttribute('d', 'M ' + (50 - rb).toFixed(2) + ',50 A ' + rb.toFixed(2) + ',' + rb.toFixed(2) + ' 0 0 1 ' + (50 + rb).toFixed(2) + ',50');
      var L2 = tp.getComputedTextLength(), T2 = rb * SPAN;
      ls = Math.max(-0.1 * fs, Math.min(LS_MAX * fs, (T2 - L2) / n));   // אחר כך ריווח אותיות (לא מקצרים את המילה)
      txt.style.letterSpacing = ls.toFixed(2) + 'px';
      var pl = path.getTotalLength();                              // ריווח נוסף גם אחרי האות האחרונה — מקזזים כדי שהמילה תהיה סימטרית
      tp.setAttribute('startOffset', (50 + (ls / 2) / pl * 100).toFixed(2) + '%');
    };
    fitArc();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitArc); }
    window.addEventListener('load', fitArc);
    if ('MutationObserver' in window) {
      new MutationObserver(fitArc).observe(lgLabel, { childList: true, characterData: true, subtree: true });
    }
  }

  /* ---------------------------------------------------------------
     12ב) תפריט השפות — נפתח תמיד בתוך המסך, לכיוון מרכז הדף.
          פופאובר צמוד לעיגול (10px מהקצה) עם חץ אליו. מחשב (≥1024): בצד הפונה למרכז, ממורכז אנכית לעיגול.
          טאבלט/טלפון: מתחת לעיגול. הצד נשמר ב-data-side, מיקום החץ ב---lm-arrow (CSS בסוף style.css).
          position: fixed; מקזזים את ראשית ה-containing block (אב עם backdrop-filter/transform) במדידה,
          כולל ה-scale של אנימציית הפתיחה.
     --------------------------------------------------------------- */
  var lmMenu = document.getElementById('langMenu');
  if (lgBtn && lmMenu && 'MutationObserver' in window) {
    var LM_M = 12, LM_GAP = 10, LM_ARROW_MIN = 16;
    var placeLangMenu = function () {
      if (lmMenu.hidden) { return; }
      lmMenu.style.left = '0px'; lmMenu.style.top = '0px';
      var o = lmMenu.getBoundingClientRect(), b = lgBtn.getBoundingClientRect();
      var w = lmMenu.offsetWidth, h = lmMenu.offsetHeight;          // גודל אמיתי, בלי ה-scale של האנימציה
      var s = w ? o.width / w : 1;
      var tOrig = getComputedStyle(lmMenu).transformOrigin.split(' ');
      var ox = o.left - parseFloat(tOrig[0]) * (1 - s), oy = o.top - parseFloat(tOrig[1]) * (1 - s);
      var vw = document.documentElement.clientWidth, vh = window.innerHeight;
      var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      var toRight = cx < vw / 2;                                     // העיגול בחצי השמאלי — נפתחים ימינה
      var x, y, side;
      if (window.innerWidth >= 1024) {
        side = toRight ? 'right' : 'left';
        x = toRight ? b.right + LM_GAP : b.left - LM_GAP - w;
        if (x < LM_M || x + w > vw - LM_M) { side = toRight ? 'left' : 'right'; x = toRight ? b.left - LM_GAP - w : b.right + LM_GAP; }   // הפיכה
        y = cy - h / 2;
      } else {
        side = 'bottom';
        x = cx - w / 2;
        y = b.bottom + LM_GAP;
        if (y + h > vh - LM_M) { side = 'top'; y = b.top - LM_GAP - h; }
      }
      x = Math.max(LM_M, Math.min(x, vw - LM_M - w));
      y = Math.max(LM_M, Math.min(y, vh - LM_M - h));
      var arrow = (side === 'left' || side === 'right') ? cy - y : cx - x;
      arrow = Math.max(LM_ARROW_MIN, Math.min(arrow, ((side === 'left' || side === 'right') ? h : w) - LM_ARROW_MIN));
      lmMenu.setAttribute('data-side', side);
      lmMenu.style.setProperty('--lm-arrow', arrow.toFixed(1) + 'px');
      lmMenu.style.left = (x - ox).toFixed(1) + 'px';
      lmMenu.style.top = (y - oy).toFixed(1) + 'px';
    };
    var lmOpen = false;
    new MutationObserver(function () {
      var open = !lmMenu.hidden;
      if (open === lmOpen) { return; }
      lmOpen = open;
      if (open) {
        placeLangMenu();
        window.addEventListener('resize', placeLangMenu);
        window.addEventListener('scroll', placeLangMenu, { passive: true });
      } else {
        window.removeEventListener('resize', placeLangMenu);
        window.removeEventListener('scroll', placeLangMenu);
      }
    }).observe(lmMenu, { attributes: true, attributeFilter: ['hidden'] });
  }


  /* ---------------------------------------------------------------
     13) #about — הכותרת "מאז ועד היום..." (מעל התמונות) עולה לגובה של "מדוע נולד הרעיון..." (מחשב ≥1024)
     --------------------------------------------------------------- */
  var mdHead = document.querySelector('#about .about-media-title');
  var mdRef = document.querySelector('#about .about-title');
  if (mdHead && mdRef) {
    var mdCol = mdHead.closest('.about-media') || mdHead.parentNode;   // כל העמודה עולה — התמונות נשארות צמודות לכותרת
    var LM_MAX = 120;   // העמודה זזה לכל היותר 120px; ערך גדול יותר = מדידה שגויה — מתעלמים
    var liftMedia = function () {
      mdCol.style.marginTop = '';
      if (window.innerWidth < 1024) { return; }
      // העמודה היא position: sticky — אחרי רענון באמצע הדף (הדפדפן משחזר את הגלילה) היא "תקועה" והמיקום שלה במסך שגוי.
      // מודדים במיקום הטבעי: sticky כבוי לרגע המדידה (באותו פריים — בלי הבהוב), ואז מחזירים
      var prevPos = mdCol.style.position;
      mdCol.style.position = 'static';
      // מגביהים רק אם הכותרת לא חופפת אופקית את עמודת התמונה (בשתי הכיוונים הכותרת יושבת מעל עמודת הטקסט בלבד)
      var rg = document.createRange(); rg.selectNodeContents(mdRef);
      var lines = rg.getClientRects();
      var t = rg.getBoundingClientRect(), m = mdCol.getBoundingClientRect();
      var d = 0;
      if (t.right <= m.left + 0.5 || t.left >= m.right - 0.5) {
        var a = (lines.length > 1 || document.documentElement.getAttribute('dir') === 'ltr') ? lines[0] : mdRef.getBoundingClientRect();   // כותרת בשורות מרובות — יישור לשורה הראשונה
        var b = mdHead.getBoundingClientRect();
        d = (a.top + a.height / 2) - (b.top + b.height / 2);
      }
      mdCol.style.position = prevPos;
      if (Math.abs(d) > 0.5 && Math.abs(d) <= LM_MAX) { mdCol.style.marginTop = d.toFixed(1) + 'px'; }
    };
    liftMedia();
    window.addEventListener('load', liftMedia);
    window.addEventListener('pageshow', function (e) { if (e.persisted) { liftMedia(); } });   // חזרה מ-bfcache
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(liftMedia); }
    var lmW = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== lmW) { lmW = window.innerWidth; liftMedia(); } });
    if ('MutationObserver' in window) {
      new MutationObserver(function () { setTimeout(liftMedia, 80); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  /* ---------------------------------------------------------------
     14) #about — הכותרת "מאז ועד היום..." כשורה נעה אינסופית (אותו מנוע initMarquee כמו שאר הפסים); התמונות סטטיות.
         הכותרת האמיתית נשארת פעם אחת ב-.about-hmq__src (מוסתרת ויזואלית); העותקים הנעים aria-hidden ונבנים מחדש
         בהחלפת שפה ורק בשינוי רוחב אמיתי. אחרי הבנייה מריצים מחדש את liftMedia (סעיף 13).
     --------------------------------------------------------------- */
  var hmqBox = document.querySelector('.about-hmq');
  var hmqTrack = hmqBox ? hmqBox.querySelector('.about-hmq__track') : null;
  var hmqSrc = document.querySelector('.about-hmq__src');
  if (hmqBox && hmqTrack && hmqSrc) {
    var hmqE = initMarquee(hmqBox, hmqTrack, {});
    var hmqBuild = function () {
      var html = hmqSrc.innerHTML.trim();
      if (!html) { return; }
      var mk = function () { var it = document.createElement('span'); it.className = 'about-hmq__item'; it.innerHTML = html; return it; };
      hmqTrack.innerHTML = '';
      var one = mk(); hmqTrack.appendChild(one);
      var w = one.getBoundingClientRect().width || 200;
      var vw = hmqBox.clientWidth || window.innerWidth;
      var reps = Math.max(1, Math.ceil((vw * 2) / w));
      hmqTrack.innerHTML = '';
      for (var k = 0; k < reps * 2; k++) { hmqTrack.appendChild(mk()); }
      hmqE.measure(reps);
      hmqBox.classList.add('is-ready');
      if (hmqBox.parentNode) { hmqBox.parentNode.classList.add('has-hmq'); }
      if (typeof liftMedia === 'function') { liftMedia(); }
    };
    hmqBuild();
    window.addEventListener('load', hmqBuild);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(hmqBuild); }
    var hmqW = window.innerWidth, hmqT;
    window.addEventListener('resize', function () {
      if (window.innerWidth === hmqW) { return; }
      hmqW = window.innerWidth; clearTimeout(hmqT); hmqT = setTimeout(hmqBuild, 200);
    });
    if ('MutationObserver' in window) {
      new MutationObserver(function () { clearTimeout(hmqT); hmqT = setTimeout(hmqBuild, 50); })
        .observe(hmqSrc, { childList: true, subtree: true, characterData: true });
    }
  }


  /* ---------------------------------------------------------------
     15) #about — אריחי "מאז" ו"היום": כל תמונה ממלאת את האריח בדיוק ורצה כלפי מעלה.
         שני האריחים נעים כיחידה אחת: מנוע initMarquee אחד (axis:'y') עם offset אחד מניע את שתי הרצועות
         (אותה מהירות, אותו כיוון, אותה התחלה, אותו גובה תמונה ורווח) — גבולות התמונות תמיד באותו גובה.
         ריחוף/גרירה על אחד האריחים (המכל .about-tiles) עוצרים את שניהם; מחוץ למסך — שניהם נעצרים.
         ב-DOM של כל אריח רק 3 פריימים (קודם / נוכחי / הבא) שממוחזרים לפי אינדקס — לכן גם אם בכל אריח מספר תמונות שונה
         (ב"מאז" 102, ב"היום" 14) הלולאה נשארת מיושרת. התמונות עולות רק כשהאריחים קרובים למסך.
         המקור ב-.about-reel__src (התמונה הראשונה סטטית לפני המוכנות וב"עצירת אנימציות").
         רשימה ארוכה: data-src-base + data-count. לחיצה פותחת לייטבוקס על כל התמונות; גרירה לא נחשבת ללחיצה.
     --------------------------------------------------------------- */
  var RL_GAP = 10;                                           // הרווח בין תמונות (מראה את רקע הסקשן) — זהה ל-gap ב-CSS
  var rlTilesBox = document.querySelector('#about .about-tiles');
  var rlReels = [];
  Array.prototype.forEach.call(document.querySelectorAll('.about-tile--reel'), function (rlTile) {
    var rlTrack = rlTile.querySelector('.about-reel__track');
    var rlSrc = rlTile.querySelector('.about-reel__src');
    if (!rlTrack || !rlSrc || !rlTile.querySelector('.about-reel')) { return; }

    var rlList = [];
    Array.prototype.forEach.call(rlSrc.querySelectorAll('img'), function (im) {
      var u = im.getAttribute('src') || im.getAttribute('data-src');
      if (u) { rlList.push({ src: u, alt: im.getAttribute('alt') || '' }); }
    });
    var rlBase = rlSrc.getAttribute('data-src-base');
    var rlTotal = parseInt(rlSrc.getAttribute('data-count') || '0', 10);
    var rlExt = rlSrc.getAttribute('data-ext') || '.jpg';
    if (rlBase && rlTotal > rlList.length) {
      var rlAlt = (rlList[0] && rlList[0].alt) || 'GAD MIVNIM';
      for (var n = rlList.length + 1; n <= rlTotal; n++) {
        rlList.push({ src: rlBase + n + rlExt, alt: rlAlt });
      }
    }
    if (!rlList.length) { return; }

    var rlIndex = 0;
    function rlMod(i) {
      var len = rlList.length;
      return ((i % len) + len) % len;
    }
    var rlPre = {}, rlPreQ = [];
    function rlPreload(i) {
      var u = rlList[rlMod(i)].src;
      if (rlPre[u]) { return; }
      var im = new Image();
      im.decoding = 'async';
      im.src = u;
      rlPre[u] = im;
      rlPreQ.push(u);
      while (rlPreQ.length > 8) { delete rlPre[rlPreQ.shift()]; }
    }
    function rlWarm(idxs, done) {
      var left = idxs.length;
      if (!left) { done(); return; }
      idxs.forEach(function (i) {
        var im = new Image();
        var fin = function () {
          if (fin.did) { return; }
          fin.did = true;
          if (--left === 0) { done(); }
        };
        im.decoding = 'async';
        im.onload = im.onerror = fin;
        im.src = rlList[rlMod(i)].src;
        if (im.complete) { fin(); }
      });
    }
    function rlAssign(el, i) {
      if (!el) { return; }
      var rec = rlList[rlMod(i)];
      var im = el.querySelector('img');
      if (!im || im.getAttribute('src') === rec.src) { return; }
      im.alt = '';
      im.decoding = 'async';
      im.src = rec.src;
    }
    // סיבוב ה-DOM (לא החלפת src של הפריים שנראה) — הלולאה נשארת בלי קפיצה
    function rlStep(dir) {
      if (dir > 0) {
        rlTrack.appendChild(rlTrack.firstElementChild);
        rlIndex = rlMod(rlIndex + 1);
        rlAssign(rlTrack.children[2], rlIndex + 1);
      } else {
        rlTrack.insertBefore(rlTrack.lastElementChild, rlTrack.firstElementChild);
        rlIndex = rlMod(rlIndex - 1);
        rlAssign(rlTrack.children[0], rlIndex - 1);
      }
      rlPreload(rlIndex + 2);
      rlPreload(rlIndex - 2);
    }

    rlTrack.innerHTML = '';
    for (var s = 0; s < 3; s++) {
      var it = document.createElement('span');
      it.className = 'about-reel__item';
      var cl = document.createElement('img');
      cl.alt = '';
      cl.decoding = 'async';
      cl.draggable = false;
      it.appendChild(cl);
      rlTrack.appendChild(it);
    }

    var reel = {
      tile: rlTile, track: rlTrack, step: rlStep, ready: false, armed: false, tries: 0,
      // גובה האריח המדויק (כולל שברי פיקסל) — כל פריים בגובה האריח בדיוק
      height: function () { return rlTile.getBoundingClientRect().height; },
      size: function (h) {
        Array.prototype.forEach.call(rlTrack.children, function (el) { el.style.height = h + 'px'; });
      },
      reveal: function () {
        var kids = rlTrack.children;
        rlAssign(kids[0], rlIndex - 1);
        rlAssign(kids[1], rlIndex);
        rlAssign(kids[2], rlIndex + 1);
        rlPreload(rlIndex + 2);
        var h = reel.height();
        if (!h) {
          if (reel.tries++ < 90) { requestAnimationFrame(reel.reveal); }
          return;
        }
        reel.size(h);
        rlTile.classList.add('is-ready');
        reel.ready = true;
        rlLayout();
      },
      arm: function () {
        if (reel.armed) { return; }
        reel.armed = true;
        rlWarm([0, 1, 2, rlList.length - 1], reel.reveal);
      }
    };
    rlReels.push(reel);

    rlTile.addEventListener('click', function (e) {
      var it = e.target.closest ? e.target.closest('.about-reel__item') : null;
      if (!it || !window.openImageLightbox) { return; }
      var kids = Array.prototype.slice.call(rlTrack.children);
      var slot = kids.indexOf(it);
      if (slot < 0) { return; }
      window.openImageLightbox(rlList, rlMod(rlIndex + (slot - 1)));
    });
  });

  if (rlTilesBox && rlReels.length) {
    // "רצועה" וירטואלית אחת: מנוע אחד כותב את אותו transform לשתי הרצועות
    var rlProxy = { style: {}, children: rlReels[0].track.children };
    Object.defineProperty(rlProxy.style, 'transform', {
      set: function (v) { rlReels.forEach(function (r) { r.track.style.transform = v; }); },
      get: function () { return rlReels[0].track.style.transform; }
    });
    var rlE = initMarquee(rlTilesBox, rlProxy, {
      axis: 'y',
      speed: 40,
      place: function (st, prevW, prevOff) {
        var f = 0;                                  // שני האריחים מתחילים יחד, בלי הזזה זה ביחס לזה
        if (prevW) {
          f = (-prevOff / prevW) - 1;
          f = ((f % 1) + 1) % 1;
          if (f > 0.999) { f = 0; }
        }
        st.offset = -st.W * (1 + f);                // -W = תמונה מלאה; עד -2W = המעבר. W כולל את הרווח
      },
      wrap: function (st) {
        if (!st.W) { return; }
        var guard = 0;
        while (st.offset <= -2 * st.W && guard++ < 40) {
          st.offset += st.W;
          rlReels.forEach(function (r) { r.step(1); });
        }
        while (st.offset > -st.W && guard++ < 80) {
          st.offset -= st.W;
          rlReels.forEach(function (r) { r.step(-1); });
        }
      }
    });
    // מידות + מדידה מחדש לשני האריחים יחד: גובה תמונה = גובה האריח, צעד הלולאה = גובה + רווח
    var rlLayout = function () {
      var hs = rlReels.filter(function (r) { return r.ready; }).map(function (r) { return r.height(); }).filter(Boolean);
      if (!hs.length) { return false; }
      var h = hs[0];
      rlReels.forEach(function (r) { if (r.ready) { r.size(h); } });
      rlE.measure(1, h + RL_GAP);
      return true;
    };
    var rlT;
    var rlStart = function () {
      window.addEventListener('resize', function () {
        clearTimeout(rlT);
        rlT = setTimeout(rlLayout, 200);
      });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (ents) {
          if (ents.some(function (e) { return e.isIntersecting; })) {
            io.disconnect();
            rlReels.forEach(function (r) { r.arm(); });        // שני האריחים נטענים ומתחילים יחד
          }
        }, { rootMargin: '600px 0px' });
        io.observe(rlTilesBox);
      } else {
        rlReels.forEach(function (r) { r.arm(); });
      }
      rlLayout();
    };
    if (document.readyState === 'complete') { rlStart(); }
    else { window.addEventListener('load', rlStart); }
  }


});
