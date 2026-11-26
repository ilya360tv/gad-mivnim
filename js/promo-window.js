/* ==========================================================================
   GAD MIVNIM — חלון הפרסומות בכל העמודים הציבוריים (קובץ משותף יחיד; הקבצים נקראים promo כדי שחוסמי פרסומות לא יחסמו אותם).
   נטען ב-defer (לא חוסם רינדור). הרשימה והטעינה המוקדמת — js/promo-boot.js (משובץ ב-<head> ע"י tools/build-pages.js).
   דף הבית (index.html): אין חלון קופץ — אותו נגן חי בתוך מסגרת תמונת האולם (.hero-showroom-frame, מצב inline), בעיצוב "ערוץ טלוויזיה"
   (class gmpr-tv): מסך ראשי עם LIVE, פס התקדמות, תמונות ממוזערות, "הבא בתור" ומונה. 'הגדלה' פותחת את הפרסומת במסך מלא; Esc / ✕ / הקטנה חוזרים למסגרת. בלי פרסומות פעילות — תמונת האולם המקורית נשארת.
   בשאר העמודים: מסך מלא — פעם אחת בביקור, בעמוד הראשון שנפתח. בכל עמוד אחר: הכרטיס הקטן באותו מיקום ובאותה פרסומת/שנייה (sessionStorage gm:ads-state).
   בעמודי טפסים (careers / contact / tenders) הכרטיס מתחיל ממוזער. באזור החברים של tenders אחרי כניסה — לא מוצג.
   פרסומות של החברה ושל שותפיה בלבד. בלי רשתות פרסום, בלי מעקב, בלי עוגיות, בלי סטטיסטיקה (גרסה 1).
   מצבים: LARGE (מחשב/טאבלט ≥769px) → SMALL (קבוע, לא נגרר) → MINIMIZED (לשונית) → CLOSED (✕, עד סוף הביקור).
   אחסון: localStorage gm:ads-geo (גודל לפי מסך), gm:ads-large-at (מתי נפתח הגדול לאחרונה);
          sessionStorage gm:ads-large-shown / gm:ads-state / gm:ads-list. ✕ סוגר רק את תצוגת העמוד הנוכחי (אין סימון 'נסגר' לביקור). הכול פונקציונלי — לא נשלח לשום מקום.
   ========================================================================== */
(function () {
  'use strict';
  var G = window.GMAds;                                            // נוצר ע"י js/promo-boot.js
  if (!G || !G.list || !window.fetch) { return; }
  if (window.__gmPromoStarted) { return; }                         // הגנה מהרצה כפולה
  window.__gmPromoStarted = true;

  var POS_KEY = 'gm:ads-pos', LARGE_KEY = 'gm:ads-large-at', CLOSED_KEY = 'gm:ads-closed';
  // תדירות פתיחת החלון הגדול (מסך מלא): 'session' = פעם אחת בכל ביקור (sessionStorage), '24h' = פעם ב-24 שעות לדפדפן (localStorage)
  var ADS_LARGE_FREQUENCY = 'session';
  var LARGE_SESSION_KEY = 'gm:ads-large-shown';
  var ROTATE_MS = 7000, DAY_MS = 24 * 60 * 60 * 1000, MARGIN = 12;
  var BUCKET_URL = G.bucket;
  var STATE_KEY = 'gm:ads-state', GEO_KEY = 'gm:ads-geo', RATIO = 510 / 272;   // יחס התמונה המקורית של המשבצת
  var FORM_PAGE = /\/(careers|contact|tenders)(\.html)?$/.test(location.pathname);
  var SLOT = document.body && document.body.getAttribute('data-page') === 'hero' ? document.querySelector('.hero-showroom-frame') : null;   // דף הבית: משבצת במקום תמונת האולם
  var INLINE = !!SLOT;
  // מיקום אמיתי בפריסה (בלי טרנספורם של אנימציות הכניסה): סכום offsetTop
  function layoutTop(el) { var t = 0; while (el) { t += el.offsetTop || 0; el = el.offsetParent; } return t; }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  // מצב הכרטיס לאורך הביקור (בין עמודים): { mode, adId, t, paused, x, y }
  function readState() { try { var o = JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null'); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
  function saveState(patch) {
    try { var o = readState() || {}; Object.keys(patch).forEach(function (k) { o[k] = patch[k]; }); sessionStorage.setItem(STATE_KEY, JSON.stringify(o)); } catch (e) { /* ignore */ }
  }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  try { localStorage.removeItem(POS_KEY); } catch (e) { /* ignore */ }   // מיקום ישן שנשמר בעבר — נמחק (המסך כבר לא נגרר)
  try { sessionStorage.removeItem(CLOSED_KEY); localStorage.removeItem(CLOSED_KEY); } catch (e) { /* ignore */ }   // סימון 'נסגר' ישן — מנוקה (✕ סוגר רק את העמוד הנוכחי)

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
  G.list
    .then(function (rows) {
      var ads = (Array.isArray(rows) ? rows : []).filter(function (a) { return a && a.media_path && (a.media_type === 'image' || a.media_type === 'video'); });
      if (!ads.length) { return; }                                  // אין פרסומות פעילות — לא מופיע כלום
      start(ads);
    })
    .catch(function (e) { if (window.console) { console.warn('promo window: לא נטענו פרסומות', e && e.message); } });

  // נפתח מיד (בלי השהיה). הסקריפט נטען ב-defer, אז ה-DOM כבר קיים; למקרה אחר — מחכים ל-DOMContentLoaded
  function start(ads) {
    var go = function () { cssReady(function () { init(ads); }); };
    if (document.body) { go(); } else { document.addEventListener('DOMContentLoaded', go); }
  }
  // קובץ העיצוב נטען בלי לחסום רינדור (media=print → all); לא פותחים את החלון לפני שהוא מוכן, כדי שלא יהיה הבהוב לא מעוצב
  function cssReady(cb) {
    var done = false, fire = function () { if (!done) { done = true; cb(); } };
    var l = document.querySelector('link[href*="promo.css"]');
    if (!l || l.media === 'all' || l.media === '') { fire(); return; }
    l.addEventListener('load', function () { setTimeout(fire, 0); });
    setTimeout(fire, 2500);
  }

  function init(ads) {

    var multi = ads.length > 1;
    var saved0 = readState() || {};
    var state = 'small', idx = 0, paused = calmNow() || !!saved0.paused, timer = null, root, card, backdrop, tab, media, ttl, adv, cta, btnPause, btnNext;
    var lastFocus = null, inertEls = [], firstVisit = false, resumeT = 0, gated = false;
    var geo = { w: 320, h: 200, b: 16 };                           // גודל ומרווח תחתון של מסך הפרסומות (אותו חישוב בכל העמודים)
    var pos = null;                                                  // { x, y } של הכרטיס הקטן (פיקסלים)

    /* ---------- בניית ה-DOM ---------- */
    root = document.createElement('div');
    root.className = 'gmpr-root';
    root.innerHTML =
      '<div class="gmpr-backdrop" hidden></div>' +
      '<div class="gmpr-card" data-state="small" tabindex="-1" hidden>' +
        '<div class="gmpr-bar">' +
          '<span class="gmpr-spacer"></span>' +
          '<span class="gmpr-label">פרסומת</span>' +
          '<button type="button" class="gmpr-btn gmpr-pause" aria-label="השהיית החלפת הפרסומות">⏸</button>' +
          (multi ? '<button type="button" class="gmpr-btn gmpr-next" aria-label="לפרסומת הבאה">›</button>' : '') +
          '<button type="button" class="gmpr-btn gmpr-shrink gmpr-only-large" aria-label="הקטנת החלון">הקטנה ⤡</button>' +
          '<button type="button" class="gmpr-btn gmpr-enlarge gmpr-only-small" aria-label="הגדלת החלון">הגדלה ⤢</button>' +
          '<button type="button" class="gmpr-btn gmpr-min gmpr-only-small" aria-label="מזעור החלון">–</button>' +
          '<button type="button" class="gmpr-btn gmpr-close" aria-label="סגירת הפרסומות">✕</button>' +
        '</div>' +
        '<div class="gmpr-media"></div>' +
        '<div class="gmpr-foot"><div class="gmpr-ttl"><strong></strong><span></span></div><a class="gmpr-cta" hidden></a></div>' +
      '</div>' +
      '<button type="button" class="gmpr-tab" hidden aria-label="פתיחת הפרסומות">פרסומות ▲</button>';
    document.body.appendChild(root);
    backdrop = root.querySelector('.gmpr-backdrop');
    card = root.querySelector('.gmpr-card');
    tab = root.querySelector('.gmpr-tab');
    media = root.querySelector('.gmpr-media');
    ttl = root.querySelector('.gmpr-ttl strong');
    adv = root.querySelector('.gmpr-ttl span');
    cta = root.querySelector('.gmpr-cta');
    btnPause = root.querySelector('.gmpr-pause');
    btnNext = root.querySelector('.gmpr-next');

    // שקופיות: תמונה/סרטון, עטופות בקישור אם יש link_url
    var slides = ads.map(function (a, i) {
      var el = document.createElement('div');
      el.className = 'gmpr-slide';
      el.setAttribute('aria-hidden', 'true');
      var href = safeHref(a.link_url);
      var inner;
      if (a.media_type === 'video') {
        inner = '<video muted playsinline preload="none" aria-label="' + esc(a.alt_text) + '"' + (a.poster_path ? ' poster="' + esc(BUCKET_URL + a.poster_path) + '"' : '') + (multi ? '' : ' loop') + '></video>';
      } else {
        inner = '<img alt="' + esc(a.alt_text) + '" decoding="async"' + (i === 0 ? ' fetchpriority="high"' : '') + ' draggable="false">';
      }
      // רקע: עותק מטושטש ומוחשך של אותה מדיה (לסרטון — תמונת הפתיחה), כדי שבמסך מלא לא יהיו פסים שחורים ושום דבר לא ייחתך
      inner = '<img class="gmpr-bg" alt="" aria-hidden="true" decoding="async" draggable="false">' + inner;
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

    /* ---------- דף הבית: "ערוץ טלוויזיה" — מסך ראשי, פס התקדמות, תמונות ממוזערות, שורת "הבא בתור" ---------- */
    var tv = null, tvDone = 0, tvStart = 0, tvByTimer = false, tvRaf = 0;   // זמן שעבר בפרסומת הנוכחית (לתמונה), לפס ההתקדמות
    function make(tag, cls, html) { var n = document.createElement(tag); n.className = cls; if (html) { n.innerHTML = html; } return n; }
    function buildTv() {
      card.classList.add('gmpr-tv');
      var bar = card.querySelector('.gmpr-bar'), screenBox = make('div', 'gmpr-screen');
      card.insertBefore(screenBox, card.firstChild);
      screenBox.appendChild(bar);
      screenBox.appendChild(media);
      screenBox.appendChild(card.querySelector('.gmpr-foot'));
      var live = make('span', 'gmpr-live', 'LIVE');
      live.setAttribute('aria-hidden', 'true');
      bar.appendChild(live);
      var progress = make('div', 'gmpr-progress', '<i></i>');
      progress.setAttribute('aria-hidden', 'true');
      var strip = make('div', 'gmpr-thumbs');
      strip.setAttribute('role', 'group');
      strip.setAttribute('aria-label', 'בחירת פרסומת');
      var thumbs = ads.map(function (a, i) {
        var b = make('button', 'gmpr-thumb'), src = a.media_type === 'video' ? a.poster_path : a.media_path;
        b.type = 'button';
        b.setAttribute('aria-label', 'מעבר לפרסומת: ' + a.title);
        b.innerHTML = src ? '<img src="' + esc(BUCKET_URL + src) + '" alt="' + esc(a.alt_text) + '" loading="lazy" decoding="async" draggable="false">' : '<span aria-hidden="true">▶</span>';
        b.addEventListener('click', function () {
          var v = slides[i].querySelector('video');
          if (v) { try { v.currentTime = 0; } catch (e) { /* ignore */ } }
          resumeT = 0;
          showAd(i);
        });
        strip.appendChild(b);
        return b;
      });
      var foot = make('div', 'gmpr-tvfoot', '<span class="gmpr-upnext"></span><span class="gmpr-tvctl"><button type="button" class="gmpr-tvpause"></button><bdi class="gmpr-count" dir="ltr"></bdi></span>');
      card.appendChild(progress);
      card.appendChild(strip);
      card.appendChild(foot);
      tv = { screen: screenBox, bar: progress.firstChild, strip: strip, thumbs: thumbs, upnext: foot.querySelector('.gmpr-upnext'), count: foot.querySelector('.gmpr-count'), pause: foot.querySelector('.gmpr-tvpause') };
      tv.pause.addEventListener('click', function () { paused = !paused; updatePauseBtn(); schedule(); });
    }
    // הממוזערת הנוכחית תמיד בתוך השורה — גוללים רק את השורה, לא את העמוד
    function tvReveal() {
      var r = tv.strip.getBoundingClientRect(), t = tv.thumbs[idx].getBoundingClientRect();
      if (!r.width || (t.left >= r.left && t.right <= r.right)) { return; }
      tv.strip.scrollBy({ left: (t.left + t.width / 2) - (r.left + r.width / 2), behavior: calmNow() ? 'auto' : 'smooth' });
    }
    function tvMark() {
      tv.thumbs.forEach(function (b, k) { if (k === idx) { b.setAttribute('aria-current', 'true'); } else { b.removeAttribute('aria-current'); } });
      tv.upnext.textContent = multi ? 'הבא בתור: ' + ads[(idx + 1) % ads.length].title : '';
      tv.count.textContent = (idx + 1) + ' / ' + ads.length;
      tvDone = 0; tvStart = 0; tvByTimer = false;
      tv.bar.style.transform = 'scaleX(0)';
      tvReveal();
    }
    function tvDraw() {
      var v = slides[idx].querySelector('video'), part;
      if (v && !tvByTimer) { part = v.duration > 0 && isFinite(v.duration) ? v.currentTime / v.duration : 0; }
      else {
        var ms = tvDone + (tvStart ? Date.now() - tvStart : 0);
        part = (multi ? Math.min(ms, ROTATE_MS) : ms % ROTATE_MS) / ROTATE_MS;
      }
      tv.bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, part)).toFixed(4) + ')';
    }
    function tvRun() {
      cancelAnimationFrame(tvRaf);
      (function frame() {
        tvDraw();
        if (state === 'inline' && !paused && !document.hidden) { tvRaf = requestAnimationFrame(frame); }
      })();
    }
    // גודל: ה-CSS מחשב (min/max עם dvh); כאן רק נמדדים ראש המסגרת, המקום שבין גלולות הצד וכפתור הנגישות
    function applyTv() {
      if (!tv || card.parentNode !== SLOT) { return; }
      var vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight, cx = vw / 2;
      var top = layoutTop(SLOT) + (parseFloat(getComputedStyle(SLOT).borderTopWidth) || 0);
      var set = function (k, v) { card.style.setProperty(k, Math.round(v) + 'px'); };
      card.classList.remove('is-tight');
      set('--tv-top', top);
      set('--tv-bottom', 16);
      var side = vw - 24;
      rectsOf(['.main-nav a', '.logo', '.nav-toggle', '#langBtn']).forEach(function (r) {
        if (r.b <= top || r.t >= vh - 16) { return; }                 // לא באותו גובה של המסגרת
        var half = (r.l + r.r) / 2 < cx ? cx - r.r - 12 : r.l - cx - 12;
        side = Math.min(side, half * 2);
      });
      set('--tv-side', Math.max(240, side));
      var fab = rectsOf(['#a11yFab'])[0], w = card.offsetWidth;
      if (fab && fab.l < cx + w / 2 + 8 && fab.r > cx - w / 2 - 8 && fab.b > top) { set('--tv-bottom', Math.max(16, vh - fab.t + 8)); }
      // מובייל נמוך: שורת "הבא בתור" מוסתרת (כפתור ההשהיה עובר לראש המסך), התמונות הממוזערות נשארות
      if (isMobile() && tv.screen.offsetHeight < tv.screen.offsetWidth * 9 / 16 * 0.9) { card.classList.add('is-tight'); }
      tvReveal();
    }
    if (INLINE) { buildTv(); }

    function mediaSrcOf(i) { return BUCKET_URL + ads[i].media_path; }
    function ensureLoaded(i, heavy) {
      var a = ads[i], el = slides[i];
      var bg = el.querySelector('.gmpr-bg');
      if (a.media_type === 'video') {
        var v = el.querySelector('video');
        if (bg && !bg.getAttribute('src') && a.poster_path) { bg.src = BUCKET_URL + a.poster_path; }
        if (v && !v.getAttribute('src')) { v.preload = heavy ? 'auto' : 'metadata'; v.src = mediaSrcOf(i); }
        else if (v && heavy) { v.preload = 'auto'; }
      } else {
        var im = el.querySelector('img:not(.gmpr-bg)');
        if (im && !im.getAttribute('src')) { im.src = mediaSrcOf(i); }
        if (bg && !bg.getAttribute('src')) { bg.src = mediaSrcOf(i); }
      }
    }

    /* ---------- הצגת פרסומת + סיבוב ---------- */
    function visibleNow() { return (state === 'large' || state === 'small' || state === 'inline') && !document.hidden && !gated; }
    function updatePauseBtn() {
      btnPause.textContent = paused ? '▶' : '⏸';
      btnPause.setAttribute('aria-label', paused ? 'הפעלת החלפת הפרסומות' : 'השהיית החלפת הפרסומות');
      btnPause.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (tv) {
        tv.pause.textContent = btnPause.textContent;
        tv.pause.setAttribute('aria-label', btnPause.getAttribute('aria-label'));
        tv.pause.setAttribute('aria-pressed', btnPause.getAttribute('aria-pressed'));
      }
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
      if (multi) { ensureLoaded((idx + 1) % ads.length, firstVisit); }        // טעינה כבדה מראש — רק בעמוד הראשון של הביקור
      if (resumeT > 0 && ads[idx].media_type === 'video') {                   // המשך מאותה שנייה אחרי מעבר עמוד
        var rv = slides[idx].querySelector('video'), rt = resumeT;
        resumeT = 0;
        var applyT = function () { try { rv.currentTime = Math.max(0, Math.min(rt, (rv.duration || rt + 1) - 0.5)); } catch (e) { /* ignore */ } };
        if (rv.readyState > 0) { applyT(); } else { rv.addEventListener('loadedmetadata', applyT, { once: true }); }
      }
      var a = ads[idx], href = safeHref(a.link_url);
      ttl.textContent = a.title;
      adv.textContent = a.advertiser || '';
      if (href) {
        cta.hidden = false;
        cta.href = href;
        cta.textContent = (state === 'inline' ? '' : '→ ') + (a.cta_text || 'לפרטים');
        if (isExternal(href)) { cta.target = '_blank'; cta.rel = 'noopener sponsored'; } else { cta.removeAttribute('target'); cta.rel = 'sponsored'; }
      } else { cta.hidden = true; cta.removeAttribute('href'); }
      if (tv) { tvMark(); }
      schedule();
    }
    function next() { showAd(idx + 1); }
    function schedule() {
      clearTimeout(timer);
      if (tv && tvStart) { tvDone += Date.now() - tvStart; tvStart = 0; }
      var v = slides[idx].querySelector('video');
      if (!visibleNow()) { if (v) { v.pause(); } return; }
      if (v) {
        if (paused) { v.pause(); if (tv) { tvRun(); } return; }
        var mine = idx, p = v.play();
        if (p && p.catch) {
          p.catch(function () {
            if (!multi || paused || idx !== mine) { return; }          // הופסק כי עברנו פרסומת / השהינו — לא כשל
            clearTimeout(timer);
            if (tv) { tvByTimer = true; tvStart = Date.now(); }
            timer = setTimeout(next, ROTATE_MS);
          });
        }
        if (tv) { if (tvByTimer) { tvStart = Date.now(); timer = setTimeout(next, Math.max(0, ROTATE_MS - tvDone)); } tvRun(); }
        return;                                                      // סרטון: עובר הלאה ב-ended
      }
      if (!paused) {
        if (tv) { tvStart = Date.now(); }
        if (multi) { timer = setTimeout(next, tv ? Math.max(0, ROTATE_MS - tvDone) : ROTATE_MS); }
      }
      if (tv) { tvRun(); }
    }
    btnPause.addEventListener('click', function () { paused = !paused; updatePauseBtn(); schedule(); });
    if (btnNext) { btnNext.addEventListener('click', function () { showAd(idx + 1); }); }
    document.addEventListener('visibilitychange', schedule);

    /* ---------- מיקום ---------- */
    /* ---------- גודל: הגדול ביותר שנכנס בין שורת "הרצליה ישראל" לתחתית המסך (דף הבית). בשאר העמודים — אותו גודל בדיוק ---------- */
    function computeGeo() {
      var vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight, cx = vw / 2;
      var cached = null;
      try { var cg = JSON.parse(lsGet(GEO_KEY) || 'null'); if (cg && cg.vw === vw && cg.vh === vh && cg.w > 0) { cached = cg; } } catch (e) { /* ignore */ }
      if (!INLINE && cached) { return cached; }                      // בדיוק מה שחושב בדף הבית לגודל מסך הזה
      var top = INLINE ? layoutTop(SLOT) + (parseFloat(getComputedStyle(SLOT).borderTopWidth) || 0) : Math.round(vh * 0.56);    // ראש הכרטיס = בתוך מסגרת המשבצת (אחרי הגבול); עד שדף הבית נמדד: הערכה
      var b = 16, w = Math.min(vw - 24, (vh - top - b) * RATIO);
      var chrome = chromeRects(), fab = rectsOf(['#a11yFab'])[0];
      // כפתור הנגישות: אם המסך היה מכסה אותו — מרימים את המסך מעליו (מובייל)
      if (fab && cx + w / 2 + 8 > fab.l && cx - w / 2 - 8 < fab.r && vh - b > fab.t - 8) {
        b = Math.max(b, Math.round(vh - fab.t + 10));
        w = Math.min(w, (vh - top - b) * RATIO);
      }
      // גלולות הניווט / לוגו / עיגול השפה: מצמצמים עד שאין חפיפה (שומרים יחס)
      for (var n = 0; n < 80 && w > 180 && hit(cx - w / 2, top, w, w / RATIO, chrome, 8); n++) { w -= 10; }
      w = Math.max(160, Math.floor(w));
      var g = { vw: vw, vh: vh, w: w, h: Math.floor(w / RATIO), b: b };
      if (INLINE) { lsSet(GEO_KEY, JSON.stringify(g)); }
      return g;
    }
    function applyGeo() {
      geo = computeGeo();                                           // הגודל של הכרטיס הקטן בשאר העמודים — ללא שינוי
      card.style.setProperty('--ads-w', geo.w + 'px');
      card.style.setProperty('--ads-h', geo.h + 'px');
      applyTv();
    }
    function sizeSmall() { return { w: geo.w, h: geo.h }; }
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
    function chromeRects() { return rectsOf(['.main-nav a', '.logo', '.nav-toggle', '#langBtn', '#a11yFab', '.back-top.is-visible', '.cookie-bar', '.cookie-banner', '#cookieBar', '#cookie-banner', '.info-bar', '[data-ads-avoid]']); }
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
      var b = bounds(w, h), vw = document.documentElement.clientWidth || window.innerWidth;
      return { x: clamp(Math.round(vw / 2 - w / 2), b.minX, b.maxX), y: clamp(Math.round(window.innerHeight - geo.b - h), b.minY, b.maxY) };   // באמצע, באותו מרחק מהתחתית כמו בדף הבית
    }
    function applyPos() {
      card.style.setProperty('--gm-x', Math.round(pos.x) + 'px');
      card.style.setProperty('--gm-y', Math.round(pos.y) + 'px');
    }
    function placeSmall(useSaved) {
      var s = sizeSmall();
      pos = defaultPos(s.w, s.h);                                  // המסך קבוע: אותו מקום בכל העמודים (לא נגרר, לא נשמר)
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
      var before = (state === 'small' || state === 'inline') && !card.hidden ? card.getBoundingClientRect() : null;
      if (card.parentNode !== root) { root.appendChild(card); }
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
      if (ADS_LARGE_FREQUENCY === 'session') { ssSet(LARGE_SESSION_KEY, '1'); } else { lsSet(LARGE_KEY, String(Date.now())); }
      showAd(idx);
      card.querySelector('.gmpr-shrink').focus();
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
        var f = card.querySelector('.gmpr-enlarge');
        if (f) { f.focus(); }
      }
    }
    // דף הבית: חזרה למסגרת (במקום תמונת האולם)
    function toInline(animate, focusIt) {
      var before = state === 'large' ? card.getBoundingClientRect() : null;
      state = 'inline';
      backdrop.classList.remove('is-on');
      backdrop.hidden = true;
      setInert(false);
      tab.hidden = true;
      SLOT.appendChild(card);
      SLOT.classList.add('has-ads');
      card.hidden = false;
      card.dataset.state = 'inline';
      setRole();
      applyTv();
      if (before && animate) { flip(before, card.getBoundingClientRect()); }
      showAd(idx);
      if (focusIt) { card.querySelector('.gmpr-enlarge').focus(); }
    }
    // יציאה ממסך מלא: בדף הבית — חזרה למסגרת; בשאר העמודים — הכרטיס הקטן
    function leaveLarge() {
      if (INLINE) { toInline(true, true); } else { toSmall(true, true); saveState({ mode: 'small' }); }
    }
    // האם המסך היה מכסה תוכן של העמוד (כותרות, טקסט, שדות, תמונות)? — אם כן, מתחילים ממוזער
    function coversContent() {
      var r = { l: pos.x, t: pos.y, r: pos.x + geo.w, b: pos.y + geo.h };
      var nodes = document.querySelectorAll('main h1, main h2, main h3, main p, main li, main label, main input, main textarea, main select, main button, main img, main video, main .card');
      for (var i = 0; i < nodes.length; i++) {
        if (root.contains(nodes[i]) || nodes[i].closest('.gmpr-card')) { continue; }
        var v = vis(nodes[i]);
        if (!v) { continue; }
        var w = Math.min(r.r, v.r) - Math.max(r.l, v.l), h = Math.min(r.b, v.b) - Math.max(r.t, v.t);
        if (w > 24 && h > 12) { return true; }
      }
      return false;
    }
    function toMin(quiet) {
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
      if (quiet !== true) { tab.focus(); }
    }
    function closeAll() {
      state = 'closed';
      clearTimeout(timer);
      slides.forEach(function (el) { var v = el.querySelector('video'); if (v) { v.pause(); } });
      setInert(false);
      root.remove();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKey, true);
      if (lastFocus && document.body.contains(lastFocus)) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
    }

    card.querySelector('.gmpr-shrink').addEventListener('click', leaveLarge);
    card.querySelector('.gmpr-enlarge').addEventListener('click', function () { toLarge(true); });
    card.querySelector('.gmpr-min').addEventListener('click', function () { toMin(); saveState({ mode: 'min' }); });
    // דף הבית: אין כפתור ✕ בכלל (המשבצת חלק מהעמוד; בצד מסך מלא — "הקטנה" / Esc). בשאר העמודים ✕ סוגר רק את תצוגת העמוד הנוכחי.
    var closeBtn = card.querySelector('.gmpr-close');
    if (INLINE) { closeBtn.remove(); } else { closeBtn.addEventListener('click', closeAll); }
    tab.addEventListener('click', function () { toSmall(false, true); saveState({ mode: 'small' }); });
    backdrop.addEventListener('click', function () { if (state === 'large') { leaveLarge(); } });

    function onKey(e) {
      if (state !== 'large') { return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); leaveLarge(); return; }
      if (e.key !== 'Tab') { return; }
      var f = Array.prototype.filter.call(card.querySelectorAll('button, a[href]'), function (el) { return el.offsetParent !== null && !el.disabled && el.tabIndex !== -1; });
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1], act = document.activeElement;
      if (!card.contains(act)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);

    /* ---------- שינוי גודל / סיבוב מסך / "עצירת אנימציות" ---------- */
    var resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        applyGeo();
        if (state === 'small') { var s = sizeSmall(); pos = defaultPos(s.w, s.h); applyPos(); }
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

    /* ---------- שמירת המצב בין עמודים + שער אזור החברים ---------- */
    function saveNow() {
      if (state === 'closed') { return; }
      var v = slides[idx] && slides[idx].querySelector('video');
      var patch = { adId: ads[idx].id, t: v ? Math.round(v.currentTime * 10) / 10 : 0 };
      if (!calmNow()) { patch.paused = paused; }
      saveState(patch);
    }
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { saveNow(); } });
    // tenders.html: אחרי כניסה (אזור החברים) — לא מוצג בכלל
    var members = document.getElementById('tnMembers');
    function applyGate() {
      gated = !!members && !members.hidden;
      root.hidden = gated;
      if (gated) {
        if (state === 'large') { setInert(false); }
        clearTimeout(timer);
        slides.forEach(function (el) { var v = el.querySelector('video'); if (v) { v.pause(); } });
      } else { schedule(); }
    }
    if (members && window.MutationObserver) { new MutationObserver(applyGate).observe(members, { attributes: true, attributeFilter: ['hidden'] }); }

    /* ---------- פתיחה ראשונה ---------- */
    var lastLarge = parseInt(lsGet(LARGE_KEY) || '0', 10) || 0;
    var wantLarge = ADS_LARGE_FREQUENCY === 'session'
      ? ssGet(LARGE_SESSION_KEY) !== '1'
      : (Date.now() - lastLarge >= DAY_MS || lastLarge > Date.now());                // מסך מלא גם במובייל — רק בעמוד הראשון של הביקור
    firstVisit = wantLarge;
    // ממשיכים מאותה פרסומת ושנייה שהיו בעמוד הקודם
    if (saved0.adId) {
      for (var k = 0; k < ads.length; k++) { if (ads[k].id === saved0.adId) { idx = k; resumeT = +saved0.t || 0; break; } }
    }
    updatePauseBtn();
    ensureLoaded(idx, wantLarge);
    if (wantLarge) { for (var fv = 0; fv < ads.length; fv++) { if (ads[fv].media_type === 'video') { ensureLoaded(fv, true); break; } } }   // הסרטון הראשון מתחיל להיטען בזמן שהתמונה מוצגת
    applyGeo();
    if (INLINE) {
      // המדידה מתעדכנת אחרי שהפריסה מתייצבת (פונטים / טעינה) ובשינוי גודל
      window.addEventListener('load', function () { applyGeo(); });
      window.addEventListener('gm:herofit', function () { if (state === 'inline') { applyGeo(); } });          // script.js הזיז את קבוצת האולם — מודדים מחדש
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { applyGeo(); }); }
      setTimeout(applyGeo, 1200);
    }
    if (INLINE) {
      ssSet(LARGE_SESSION_KEY, '1');                                // דף הבית = ההצגה הראשונה; בעמודים הבאים נפתח הכרטיס הקטן ישר
      toInline(false, false);
    } else if (wantLarge) {
      // ממקמים מראש את הקטן (המיקום שאליו ההקטנה תנוע), ואז פותחים את הגדול
      card.hidden = false; card.dataset.state = 'small'; placeSmall(true); card.hidden = true;
      toLarge(true);
    } else {
      card.hidden = false;
      toSmall(false, false);
      if (FORM_PAGE || saved0.mode === 'min' || (saved0.mode !== 'small' && coversContent())) {
        toMin(true);                                                // בעמודי טפסים / אחרי מזעור — לשונית "פרסומות ▲"; לא נשמר כבחירת משתמש
      } else if (!calmNow() && card.animate) {
        card.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
      }
    }
    applyGate();
  }
})();
