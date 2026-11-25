/* ==========================================================================
   GAD MIVNIM — חלון הפרסומות בדף הבית (index.html בלבד).
   נטען רק אחרי שהדף נטען (טעינת הסקריפט נעשית מ-index.html באירוע load) — אין השפעה על ה-Hero.
   פרסומות של החברה ושל שותפיה בלבד. בלי רשתות פרסום, בלי מעקב, בלי עוגיות, בלי סטטיסטיקה (גרסה 1).
   מצבים: LARGE (מחשב/טאבלט ≥769px) → SMALL (נגרר) → MINIMIZED (לשונית) → CLOSED (✕, עד סוף הביקור).
   אחסון: localStorage gm:ads-pos (מיקום הכרטיס הקטן), gm:ads-large-at (מתי נפתח הגדול לאחרונה);
          sessionStorage gm:ads-closed (נסגר בביקור הזה). הכול פונקציונלי — לא נשלח לשום מקום.
   ========================================================================== */
(function () {
  'use strict';
  var CFG = window.GM_SUPABASE || {};
  if (!CFG.url || !CFG.key || !window.fetch) { return; }

  var POS_KEY = 'gm:ads-pos', LARGE_KEY = 'gm:ads-large-at', CLOSED_KEY = 'gm:ads-closed';
  var OPEN_DELAY = 4000, ROTATE_MS = 7000, DAY_MS = 24 * 60 * 60 * 1000, MARGIN = 12;
  var BUCKET_URL = String(CFG.url).replace(/\/+$/, '') + '/storage/v1/object/public/site-ads/';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  if (ssGet(CLOSED_KEY) === '1') { return; }                       // נסגר ב-✕ בביקור הזה

  var isMobile = function () { return window.matchMedia('(max-width: 768px)').matches; };
  var calmNow = function () {
    return document.documentElement.classList.contains('a11y-no-motion') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  var safeHref = function (u) {
    if (typeof u !== 'string') { return ''; }
    u = u.trim();
    if (/^https:\/\/[^\s]+$/i.test(u)) { return u; }
    if (/^\/[^\s\/\\][^\s]*$/.test(u)) { return u; }                // עמוד פנימי באתר שלנו
    return '';
  };
  var isExternal = function (u) { return /^https:\/\//i.test(u); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- טעינת הפרסומות (מפתח ציבורי; ה-RLS מחזיר רק פעילות בטווח התאריכים) ---------- */
  var query = '/rest/v1/ads?select=id,title,advertiser,media_path,media_type,poster_path,alt_text,link_url,cta_text&order=sort_order.asc,created_at.asc&limit=30';
  fetch(String(CFG.url).replace(/\/+$/, '') + query, { headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var ads = (Array.isArray(rows) ? rows : []).filter(function (a) { return a && a.media_path && (a.media_type === 'image' || a.media_type === 'video'); });
      if (!ads.length) { return; }                                  // אין פרסומות פעילות — לא מופיע כלום
      start(ads);
    })
    .catch(function () { /* בלי פרסומות — האתר ממשיך כרגיל */ });

  function start(ads) {
    var first = ads[0];
    var firstSrc = BUCKET_URL + (first.media_type === 'video' ? (first.poster_path || '') : first.media_path);
    var go = function () { setTimeout(function () { init(ads); }, OPEN_DELAY); };
    // מחכים 4 שניות מהטעינה; התמונה הראשונה נטענת מראש כדי שלא תהיה הבהוב
    if (firstSrc !== BUCKET_URL) { var im = new Image(); im.src = firstSrc; }
    go();
  }

  function init(ads) {
    if (ssGet(CLOSED_KEY) === '1') { return; }

    var multi = ads.length > 1;
    var state = 'small', idx = 0, paused = calmNow(), timer = null, root, card, backdrop, tab, media, ttl, adv, cta, btnPause, btnNext, handle;
    var lastFocus = null, inertEls = [];
    var pos = null;                                                  // { x, y } של הכרטיס הקטן (פיקסלים)

    /* ---------- בניית ה-DOM ---------- */
    root = document.createElement('div');
    root.className = 'gmads-root';
    root.innerHTML =
      '<div class="gmads-backdrop" hidden></div>' +
      '<div class="gmads-card" data-state="small" tabindex="-1" hidden>' +
        '<div class="gmads-bar">' +
          '<span class="gmads-label">פרסומת</span>' +
          '<span class="gmads-spacer"></span>' +
          '<button type="button" class="gmads-handle gmads-only-small" aria-label="גרירת חלון הפרסומות — מקשי החצים מזיזים (Shift = קפיצה גדולה)">⠿⠿⠿</button>' +
          '<button type="button" class="gmads-btn gmads-pause" aria-label="השהיית החלפת הפרסומות">⏸</button>' +
          (multi ? '<button type="button" class="gmads-btn gmads-next" aria-label="לפרסומת הבאה">›</button>' : '') +
          '<button type="button" class="gmads-btn gmads-shrink gmads-only-large" aria-label="הקטנת החלון">הקטנה ⤡</button>' +
          '<button type="button" class="gmads-btn gmads-enlarge gmads-only-small" aria-label="הגדלת החלון">הגדלה ⤢</button>' +
          '<button type="button" class="gmads-btn gmads-min gmads-only-small" aria-label="מזעור החלון">–</button>' +
          '<button type="button" class="gmads-btn gmads-close" aria-label="סגירת הפרסומות">✕</button>' +
        '</div>' +
        '<div class="gmads-media"></div>' +
        '<div class="gmads-foot"><div class="gmads-ttl"><strong></strong><span></span></div><a class="gmads-cta" hidden></a></div>' +
      '</div>' +
      '<button type="button" class="gmads-tab" hidden aria-label="פתיחת הפרסומות">פרסומות ▲</button>';
    document.body.appendChild(root);
    backdrop = root.querySelector('.gmads-backdrop');
    card = root.querySelector('.gmads-card');
    tab = root.querySelector('.gmads-tab');
    media = root.querySelector('.gmads-media');
    ttl = root.querySelector('.gmads-ttl strong');
    adv = root.querySelector('.gmads-ttl span');
    cta = root.querySelector('.gmads-cta');
    btnPause = root.querySelector('.gmads-pause');
    btnNext = root.querySelector('.gmads-next');
    handle = root.querySelector('.gmads-handle');

    // שקופיות: תמונה/סרטון, עטופות בקישור אם יש link_url
    var slides = ads.map(function (a, i) {
      var el = document.createElement('div');
      el.className = 'gmads-slide';
      el.setAttribute('aria-hidden', 'true');
      var href = safeHref(a.link_url);
      var inner;
      if (a.media_type === 'video') {
        inner = '<video muted playsinline preload="none" aria-label="' + esc(a.alt_text) + '"' + (a.poster_path ? ' poster="' + esc(BUCKET_URL + a.poster_path) + '"' : '') + (multi ? '' : ' loop') + '></video>';
      } else {
        inner = '<img alt="' + esc(a.alt_text) + '" decoding="async" loading="lazy" draggable="false">';
      }
      if (href) {
        var ext = isExternal(href);
        el.innerHTML = '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener sponsored"' : ' rel="sponsored"') + ' tabindex="-1">' + inner + '</a>';
      } else {
        el.innerHTML = '<div>' + inner + '</div>';
      }
      media.appendChild(el);
      var v = el.querySelector('video');
      if (v) {
        v.muted = true; v.defaultMuted = true; v.playsInline = true;
        v.addEventListener('ended', function () { if (idx === i && multi) { next(); } });
        v.addEventListener('error', function () { if (idx === i && multi) { clearTimeout(timer); timer = setTimeout(next, 1200); } });
      }
      return el;
    });

    function mediaSrcOf(i) { return BUCKET_URL + ads[i].media_path; }
    function ensureLoaded(i) {
      var a = ads[i], el = slides[i];
      if (a.media_type === 'video') {
        var v = el.querySelector('video');
        if (v && !v.getAttribute('src')) { v.preload = 'metadata'; v.src = mediaSrcOf(i); }
      } else {
        var im = el.querySelector('img');
        if (im && !im.getAttribute('src')) { im.src = mediaSrcOf(i); }
      }
    }

    /* ---------- הצגת פרסומת + סיבוב ---------- */
    function visibleNow() { return (state === 'large' || state === 'small') && !document.hidden; }
    function updatePauseBtn() {
      btnPause.textContent = paused ? '▶' : '⏸';
      btnPause.setAttribute('aria-label', paused ? 'הפעלת החלפת הפרסומות' : 'השהיית החלפת הפרסומות');
      btnPause.setAttribute('aria-pressed', paused ? 'true' : 'false');
    }
    function showAd(i) {
      idx = (i + ads.length) % ads.length;
      slides.forEach(function (el, k) {
        var on = k === idx;
        el.classList.toggle('is-on', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
        var link = el.querySelector('a');
        if (link) { link.tabIndex = on ? 0 : -1; }
        var v = el.querySelector('video');
        if (v && !on) { try { v.pause(); v.currentTime = 0; } catch (e) { /* ignore */ } }
      });
      ensureLoaded(idx);
      if (multi) { ensureLoaded((idx + 1) % ads.length); }
      var a = ads[idx], href = safeHref(a.link_url);
      ttl.textContent = a.title;
      adv.textContent = a.advertiser || '';
      if (href) {
        cta.hidden = false;
        cta.href = href;
        cta.textContent = '→ ' + (a.cta_text || 'לפרטים');
        if (isExternal(href)) { cta.target = '_blank'; cta.rel = 'noopener sponsored'; } else { cta.removeAttribute('target'); cta.rel = 'sponsored'; }
      } else { cta.hidden = true; cta.removeAttribute('href'); }
      schedule();
    }
    function next() { showAd(idx + 1); }
    function schedule() {
      clearTimeout(timer);
      var v = slides[idx].querySelector('video');
      if (!visibleNow()) { if (v) { v.pause(); } return; }
      if (v) {
        if (paused) { v.pause(); return; }
        var p = v.play();
        if (p && p.catch) { p.catch(function () { if (multi) { timer = setTimeout(next, ROTATE_MS); } }); }
        return;                                                      // סרטון: עובר הלאה ב-ended
      }
      if (multi && !paused) { timer = setTimeout(next, ROTATE_MS); }
    }
    btnPause.addEventListener('click', function () { paused = !paused; updatePauseBtn(); schedule(); });
    if (btnNext) { btnNext.addEventListener('click', function () { showAd(idx + 1); }); }
    document.addEventListener('visibilitychange', schedule);

    /* ---------- מיקום ---------- */
    function sizeSmall() { return isMobile() ? { w: 260, h: 160 } : { w: 320, h: 200 }; }
    function vis(el) {
      if (!el || el.hidden) { return null; }
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) { return null; }
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) { return null; }
      if (r.right <= 0 || r.bottom <= 0 || r.left >= window.innerWidth || r.top >= window.innerHeight) { return null; }
      return { l: r.left, t: r.top, r: r.right, b: r.bottom };
    }
    function rectsOf(selectors) {
      var out = [];
      selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) { if (root.contains(el)) { return; } var r = vis(el); if (r) { out.push(r); } });
      });
      return out;
    }
    // אלמנטים שאסור לכסות כשעוזבים את הכרטיס: גלולות הניווט, הלוגו, עיגול השפה, כפתור הנגישות (+ המבורגר במובייל)
    function chromeRects() { return rectsOf(['.main-nav a', '.logo', '.nav-toggle', '#langBtn', '#a11yFab', '.back-top.is-visible']); }
    // ברירת המחדל מתרחקת גם מכותרות ה-Hero ותמונת האולם
    function heroRects() { return rectsOf(['.hero-title', '.hero-badge', '.hero-showroom', '.hero-location', '.hero-showroom-frame']); }
    function hit(x, y, w, h, list, pad) {
      for (var i = 0; i < list.length; i++) {
        var o = list[i];
        if (x < o.r + pad && x + w > o.l - pad && y < o.b + pad && y + h > o.t - pad) { return true; }
      }
      return false;
    }
    function bounds(w, h) {
      var hd = document.querySelector('.site-header'), top = hd ? Math.max(0, hd.getBoundingClientRect().bottom) : 0;
      return { minX: MARGIN, maxX: Math.max(MARGIN, window.innerWidth - w - MARGIN), minY: Math.max(MARGIN, top + 8), maxY: Math.max(MARGIN, window.innerHeight - h - MARGIN) };
    }
    var clamp = function (v, lo, hi) { return Math.min(Math.max(v, lo), hi); };
    // המקום הפנוי הקרוב ביותר לנקודה (x,y). lockY — לשונית: רק זזים לאורך הקצה.
    function nearestFree(x, y, w, h, obstacles, pad, lockY) {
      var b = bounds(w, h);
      x = clamp(x, b.minX, b.maxX); y = clamp(y, b.minY, b.maxY);
      if (!hit(x, y, w, h, obstacles, pad)) { return { x: x, y: y }; }
      var best = null, bestD = Infinity, step = 10, yy, xx;
      for (yy = lockY ? y : b.minY; yy <= (lockY ? y : b.maxY); yy += step) {
        for (xx = b.minX; xx <= b.maxX; xx += step) {
          if (hit(xx, yy, w, h, obstacles, pad)) { continue; }
          var d = (xx - x) * (xx - x) + (yy - y) * (yy - y);
          if (d < bestD) { bestD = d; best = { x: xx, y: yy }; }
        }
      }
      return best;
    }
    function settle(x, y, w, h) {
      var spot = nearestFree(x, y, w, h, chromeRects(), 6, false);
      if (spot) { return spot; }
      var b = bounds(w, h);
      return { x: clamp(x, b.minX, b.maxX), y: clamp(y, b.minY, b.maxY) };
    }
    function defaultPos(w, h) {
      var b = bounds(w, h), wantX = b.maxX, wantY = b.maxY;           // תחתית אזור התוכן, צד ימין
      var spot = nearestFree(wantX, wantY, w, h, chromeRects().concat(heroRects()), 8, false) || nearestFree(wantX, wantY, w, h, chromeRects(), 6, false);
      return spot || { x: wantX, y: wantY };
    }
    function loadPos() {
      var raw = lsGet(POS_KEY);
      if (!raw) { return null; }
      try { var p = JSON.parse(raw); if (p && isFinite(p.x) && isFinite(p.y)) { return { x: +p.x, y: +p.y }; } } catch (e) { /* ignore */ }
      return null;
    }
    function savePos() { if (pos) { lsSet(POS_KEY, JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) })); } }
    function applyPos() {
      card.style.setProperty('--gm-x', Math.round(pos.x) + 'px');
      card.style.setProperty('--gm-y', Math.round(pos.y) + 'px');
    }
    function placeSmall(useSaved) {
      var s = sizeSmall();
      var saved = useSaved ? (pos || loadPos()) : null;
      pos = saved ? settle(saved.x, saved.y, s.w, s.h) : defaultPos(s.w, s.h);
      applyPos();
    }

    /* ---------- מעברי מצב ---------- */
    function setInert(on) {
      if (on) {
        inertEls = [];
        Array.prototype.forEach.call(document.body.children, function (el) {
          if (el === root || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) { return; }
          el.setAttribute('inert', ''); inertEls.push(el);
        });
      } else { inertEls.forEach(function (el) { el.removeAttribute('inert'); }); inertEls = []; }
    }
    function flip(fromRect, toRect) {
      if (calmNow() || !card.animate) { return; }
      var dx = (fromRect.left + fromRect.width / 2) - (toRect.left + toRect.width / 2);
      var dy = (fromRect.top + fromRect.height / 2) - (toRect.top + toRect.height / 2);
      var sx = fromRect.width / toRect.width;
      card.animate([
        { transformOrigin: '50% 50%', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ')' },
        { transformOrigin: '50% 50%', transform: 'none' }
      ], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    function setRole() {
      if (state === 'large') {
        card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-label', 'פרסומת');
      } else {
        card.setAttribute('role', 'region'); card.removeAttribute('aria-modal'); card.setAttribute('aria-label', 'פרסומות');
      }
    }
    function toLarge(animate) {
      var before = state === 'small' && !card.hidden ? card.getBoundingClientRect() : null;
      lastFocus = document.activeElement;
      state = 'large';
      tab.hidden = true;
      card.hidden = false;
      card.dataset.state = 'large';
      setRole();
      backdrop.hidden = false;
      void backdrop.offsetWidth;
      backdrop.classList.add('is-on');
      setInert(true);
      var after = card.getBoundingClientRect();
      if (animate && !calmNow() && card.animate) {
        if (before) { flip(before, after); }
        else { card.animate([{ opacity: 0, transform: 'scale(.88)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
      }
      lsSet(LARGE_KEY, String(Date.now()));
      showAd(idx);
      card.querySelector('.gmads-shrink').focus();
    }
    function toSmall(animate, focusIt) {
      var before = state === 'large' ? card.getBoundingClientRect() : null;
      state = 'small';
      backdrop.classList.remove('is-on');
      backdrop.hidden = true;
      setInert(false);
      tab.hidden = true;
      card.hidden = false;
      card.dataset.state = 'small';
      setRole();
      placeSmall(true);
      if (before && animate) { flip(before, card.getBoundingClientRect()); }
      showAd(idx);
      if (focusIt) {
        var f = isMobile() ? handle : card.querySelector('.gmads-enlarge');
        (f || handle).focus();
      }
    }
    function toMin() {
      var r = card.getBoundingClientRect();
      var h = 36, w = 130, b = bounds(w, h), bottom = r.top + r.height / 2 > window.innerHeight / 2;
      var y = bottom ? window.innerHeight - h - 6 : Math.max(6, b.minY);
      var spot = nearestFree(r.left, y, w, h, chromeRects(), 6, true) || { x: clamp(r.left, b.minX, b.maxX), y: y };
      state = 'min';
      card.hidden = true;
      backdrop.hidden = true;
      setInert(false);
      tab.style.setProperty('--gm-x', Math.round(spot.x) + 'px');
      tab.style.setProperty('--gm-y', Math.round(spot.y) + 'px');
      tab.hidden = false;
      schedule();
      tab.focus();
    }
    function closeAll() {
      ssSet(CLOSED_KEY, '1');
      state = 'closed';
      clearTimeout(timer);
      slides.forEach(function (el) { var v = el.querySelector('video'); if (v) { v.pause(); } });
      setInert(false);
      root.remove();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKey, true);
      if (lastFocus && document.body.contains(lastFocus)) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
    }

    card.querySelector('.gmads-shrink').addEventListener('click', function () { toSmall(true, true); });
    card.querySelector('.gmads-enlarge').addEventListener('click', function () { if (!isMobile()) { toLarge(true); } });
    card.querySelector('.gmads-min').addEventListener('click', toMin);
    card.querySelector('.gmads-close').addEventListener('click', closeAll);
    tab.addEventListener('click', function () { toSmall(false, true); });
    backdrop.addEventListener('click', function () { if (state === 'large') { toSmall(true, true); } });

    function onKey(e) {
      if (state !== 'large') { return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); toSmall(true, true); return; }
      if (e.key !== 'Tab') { return; }
      var f = Array.prototype.filter.call(card.querySelectorAll('button, a[href]'), function (el) { return el.offsetParent !== null && !el.disabled && el.tabIndex !== -1; });
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1], act = document.activeElement;
      if (!card.contains(act)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);

    /* ---------- גרירה (Pointer Events) + מקלדת — רק בקטן ---------- */
    var drag = null;
    handle.addEventListener('pointerdown', function (e) {
      if (state !== 'small' || (e.pointerType === 'mouse' && e.button !== 0)) { return; }
      e.preventDefault();
      var s = sizeSmall();
      drag = { id: e.pointerId, dx: e.clientX - pos.x, dy: e.clientY - pos.y, w: s.w, h: s.h };
      handle.setPointerCapture(e.pointerId);
      handle.classList.add('is-dragging');
      card.classList.remove('is-sliding');
      document.documentElement.style.userSelect = 'none';
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) { return; }
      e.preventDefault();
      var b = bounds(drag.w, drag.h);
      pos = { x: clamp(e.clientX - drag.dx, b.minX, b.maxX), y: clamp(e.clientY - drag.dy, b.minY, b.maxY) };
      applyPos();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) { return; }
      try { handle.releasePointerCapture(drag.id); } catch (err) { /* ignore */ }
      handle.classList.remove('is-dragging');
      document.documentElement.style.userSelect = '';
      var s = { w: drag.w, h: drag.h };
      drag = null;
      slideToFree(s);
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    handle.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    function slideToFree(s) {
      var spot = settle(pos.x, pos.y, s.w, s.h);
      if (Math.abs(spot.x - pos.x) > 1 || Math.abs(spot.y - pos.y) > 1) { card.classList.add('is-sliding'); pos = spot; applyPos(); setTimeout(function () { card.classList.remove('is-sliding'); }, 320); }
      else { pos = spot; applyPos(); }
      savePos();
    }
    var keyTimer = null;
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 50 : 10, dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') { dx = -step; } else if (e.key === 'ArrowRight') { dx = step; }
      else if (e.key === 'ArrowUp') { dy = -step; } else if (e.key === 'ArrowDown') { dy = step; } else { return; }
      e.preventDefault();
      var s = sizeSmall(), b = bounds(s.w, s.h);
      pos = { x: clamp(pos.x + dx, b.minX, b.maxX), y: clamp(pos.y + dy, b.minY, b.maxY) };
      applyPos();
      clearTimeout(keyTimer);
      keyTimer = setTimeout(function () { slideToFree(s); }, 500);   // אחרי שהמשתמש מפסיק — מתרחקים מגלולות/לוגו/נגישות
    });

    /* ---------- שינוי גודל / סיבוב מסך / "עצירת אנימציות" ---------- */
    var resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (state === 'large' && isMobile()) { toSmall(false, false); return; }
        if (state === 'small') { var s = sizeSmall(); pos = settle(pos.x, pos.y, s.w, s.h); applyPos(); savePos(); }
        if (state === 'min') { toMinReposition(); }
      }, 120);
    }
    function toMinReposition() {
      var h = 36, w = 130, b = bounds(w, h);
      var x = clamp(parseFloat(tab.style.getPropertyValue('--gm-x')) || b.minX, b.minX, b.maxX);
      var y = clamp(parseFloat(tab.style.getPropertyValue('--gm-y')) || b.maxY, b.minY, window.innerHeight - h - 6);
      tab.style.setProperty('--gm-x', x + 'px'); tab.style.setProperty('--gm-y', y + 'px');
    }
    window.addEventListener('resize', onResize);
    new MutationObserver(function () {
      if (calmNow() && !paused) { paused = true; updatePauseBtn(); schedule(); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      var onMq = function () { if (calmNow() && !paused) { paused = true; updatePauseBtn(); schedule(); } };
      if (mq.addEventListener) { mq.addEventListener('change', onMq); }
    }

    /* ---------- פתיחה ראשונה ---------- */
    updatePauseBtn();
    ensureLoaded(0);
    var lastLarge = parseInt(lsGet(LARGE_KEY) || '0', 10) || 0;
    var wantLarge = !isMobile() && (Date.now() - lastLarge >= DAY_MS || lastLarge > Date.now());
    pos = loadPos();
    if (wantLarge) {
      // ממקמים מראש את הקטן (המיקום שאליו ההקטנה תנוע), ואז פותחים את הגדול
      card.hidden = false; card.dataset.state = 'small'; placeSmall(true); card.hidden = true;
      toLarge(true);
    } else {
      card.hidden = false;
      toSmall(false, false);
      if (!calmNow() && card.animate) { card.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' }); }
    }
  }
})();
