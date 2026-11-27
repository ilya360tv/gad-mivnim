/* ==========================================================================
   GAD MIVNIM — חלון הפרסומות בכל העמודים הציבוריים (קובץ משותף יחיד; הקבצים נקראים promo כדי שחוסמי פרסומות לא יחסמו אותם).
   נטען ב-defer (לא חוסם רינדור). הרשימה והטעינה המוקדמת — js/promo-boot.js (משובץ ב-<head> ע"י tools/build-pages.js).
   דף הבית (index.html): אין חלון קופץ — אותו נגן חי במקום תמונת האולם (.hero-showroom-frame, מצב inline), בסגנון YouTube
   (class gmpr-yt), בלי מסגרת: משמאל נגן 16:9 (הפרסומת במלואה מעל עותק מטושטש שלה, תג "פרסומת", פס התקדמות אדום ופקדים), מתחתיו כותרת
   ושורת "ערוץ" עם כפתור לקישור; מימין "הבא בתור" — כל הפרסומות הבאות, לחיצה מנגנת. במובייל הרשימה היא שורת תמונות נגללת לצדדים.
   'מסך מלא' (הגדלה) פותח את הפרסומת על כל המסך; Esc / ✕ / הקטנה חוזרים. בלי פרסומות פעילות — תמונת האולם המקורית נשארת.
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

    /* ---------- דף הבית: נגן בסגנון YouTube + רשימת "הבא בתור" (בלי מסגרת) ---------- */
    var yt = null;
    var LOGO = 'images/gad_mivnim_logo.svg', COMPANY = 'GAD MIVNIM';
    var shownIdx = -1, elapsed = 0, runStart = 0, stillMode = false;     // כמה זמן הפרסומת הנוכחית כבר נוגנה (תמונה)
    var icon = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>'; };
    var ICON = {
      play: icon('M7 4.5v15l12.5-7.5z'),
      pause: icon('M6 5h4.2v14H6zM13.8 5H18v14h-4.2z'),
      next: icon('M5 5.5l10 6.5-10 6.5zM16.2 5.5H19v13h-2.8z'),
      full: icon('M4 4h6v2.6H6.6V10H4zM14 4h6v6h-2.6V6.6H14zM4 14h2.6v3.4H10V20H4zM17.4 14H20v6h-6v-2.6h3.4z')
    };
    var fmt = function (s) { s = Math.max(0, s | 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
    function make(tag, cls, html) { var n = document.createElement(tag); n.className = cls; if (html) { n.innerHTML = html; } return n; }
    function togglePlay() { paused = !paused; updatePauseBtn(); schedule(); }
    function buildPlayer() {
      card.classList.add('gmpr-yt');
      card.classList.toggle('is-single', !multi);
      var btn = function (cls, label, glyph, tip) { return '<button type="button" class="gmpr-ib ' + cls + '" aria-label="' + label + '" title="' + (tip || label) + '">' + glyph + '</button>'; };
      var main = make('div', 'gmpr-main');
      var player = make('div', 'gmpr-player');
      player.tabIndex = 0;
      player.setAttribute('role', 'group');
      player.setAttribute('aria-label', 'נגן הפרסומות');
      player.appendChild(media);
      player.appendChild(make('span', 'gmpr-badge', 'פרסומת'));
      player.appendChild(make('div', 'gmpr-ctrl',
        '<div class="gmpr-prog" aria-hidden="true"><i></i><b></b></div><div class="gmpr-row">' +
          btn('gmpr-yplay', 'עצירה', ICON.pause) + (multi ? btn('gmpr-ynext', 'פרסומת הבאה', ICON.next) : '') +
          '<bdi class="gmpr-time" dir="ltr"></bdi><span class="gmpr-gap"></span><bdi class="gmpr-count" dir="ltr"></bdi>' +
          btn('gmpr-yfull', 'מסך מלא', ICON.full, 'הגדלה') + '</div>'));
      main.appendChild(player);
      main.appendChild(make('strong', 'gmpr-ytitle'));
      main.appendChild(make('div', 'gmpr-channel',
        '<img class="gmpr-avatar" src="' + LOGO + '" alt="" width="44" height="44" decoding="async"><span class="gmpr-who"><strong></strong><span>פרסומת · הרצליה</span></span><a class="gmpr-ycta" hidden></a>'));
      card.insertBefore(main, card.firstChild);
      var queue = make('div', 'gmpr-queue', '<div class="gmpr-qhead" id="gmprQueueHead">הבא בתור</div><div class="gmpr-qscroll"><ul aria-labelledby="gmprQueueHead"></ul></div>');
      card.appendChild(queue);
      var q = function (sel) { return card.querySelector(sel); };
      yt = { main: main, player: player, queue: queue, scroll: q('.gmpr-qscroll'), list: q('.gmpr-qscroll ul'), title: q('.gmpr-ytitle'), name: q('.gmpr-who strong'), cta: q('.gmpr-ycta'),
        play: q('.gmpr-yplay'), full: q('.gmpr-yfull'), time: q('.gmpr-time'), count: q('.gmpr-count'), fill: q('.gmpr-prog i'), dot: q('.gmpr-prog b'), order: -1 };

      // "הבא בתור": תמונה ממוזערת 16:9 (המדיה במלואה מעל עותק מטושטש שלה — בלי חיתוך), משך, כותרת ומפרסם
      yt.items = ads.map(function (a, k) {
        var li = document.createElement('li');
        var still = a.media_type === 'video' ? a.poster_path : a.media_path;
        var img = still ? '<img class="t-bg" src="' + esc(BUCKET_URL + still) + '" alt="" loading="lazy" decoding="async" draggable="false"><img class="t-fg" src="' + esc(BUCKET_URL + still) + '" alt="" loading="lazy" decoding="async" draggable="false">' : '';
        li.innerHTML = '<button type="button" class="gmpr-item" aria-label="' + esc('מעבר לפרסומת: ' + a.title) + '"><span class="gmpr-thumb">' + img +
          '<bdi class="gmpr-dur" dir="ltr"' + (a.media_type === 'video' ? ' hidden>' : '>' + fmt(ROTATE_MS / 1000)) + '</bdi></span>' +
          '<span class="gmpr-itxt"><strong>' + esc(a.title) + '</strong><span>' + esc(a.advertiser || COMPANY) + '</span></span></button>';
        li.firstChild.addEventListener('click', function () {
          resumeT = 0;
          if (!calmNow()) { paused = false; updatePauseBtn(); }
          showAd(k);
          yt.player.focus({ preventScroll: true });
        });
        var v = slides[k].querySelector('video');
        if (v) {                                                    // סרטון: האורך האמיתי, ברגע שהוא ידוע
          v.addEventListener('durationchange', function () {
            if (!isFinite(v.duration) || v.duration <= 0) { return; }
            var d = li.querySelector('.gmpr-dur'); d.textContent = fmt(Math.round(v.duration)); d.hidden = false;
          });
        }
        return { li: li };
      });

      yt.play.addEventListener('click', togglePlay);
      yt.full.addEventListener('click', function () { toLarge(true); });
      if (multi) { q('.gmpr-ynext').addEventListener('click', function () { resumeT = 0; showAd(idx + 1); }); }
      // מקלדת (כשהנגן בפוקוס): רווח = הפעלה/עצירה, חץ ימינה = הבאה, חץ שמאלה = הקודמת
      player.addEventListener('keydown', function (e) {
        if (state !== 'inline') { return; }
        if (e.key === ' ' && e.target === player) { e.preventDefault(); togglePlay(); }
        else if (multi && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); resumeT = 0; showAd(idx + (e.key === 'ArrowRight' ? 1 : -1)); }
      });
      // מחשב: הפקדים נעלמים אחרי 2.5 שניות בלי תנועת עכבר וחוזרים בריחוף. מגע / "עצירת אנימציות": תמיד מוצגים
      var idleT = 0, fine = window.matchMedia('(hover: hover) and (pointer: fine)');
      yt.wake = function () {
        clearTimeout(idleT);
        player.classList.remove('is-idle');
        if (fine.matches && !calmNow()) { idleT = setTimeout(function () { if (!calmNow()) { player.classList.add('is-idle'); } }, 2500); }
      };
      ['pointerenter', 'pointermove', 'pointerdown', 'focusin', 'keydown'].forEach(function (ev) { player.addEventListener(ev, yt.wake); });
      yt.wake();
      // אורכי הסרטונים לרשימה — רק אחרי שהדף נטען (מטא-דאטה בלבד)
      var meta = function () { setTimeout(function () { ads.forEach(function (a, k) { if (a.media_type === 'video') { ensureLoaded(k); } }); }, 800); };
      if (document.readyState === 'complete') { meta(); } else { window.addEventListener('load', meta); }
      var loop = function () { if (state === 'closed') { return; } if (state === 'inline' && !document.hidden) { paint(); } window.requestAnimationFrame(loop); };
      window.requestAnimationFrame(loop);
    }
    // פס ההתקדמות והשעון: תמונה — 7 שניות; סרטון — האורך האמיתי
    function paint() {
      var v = slides[idx].querySelector('video'), cur, total;
      if (v && !stillMode) { total = isFinite(v.duration) ? v.duration : 0; cur = v.currentTime || 0; }
      else { total = ROTATE_MS / 1000; cur = Math.min(total, (elapsed + (runStart ? Date.now() - runStart : 0)) / 1000); }
      var pct = (total > 0 ? Math.min(100, cur / total * 100) : 0).toFixed(2) + '%';
      if (yt.fill.style.width !== pct) { yt.fill.style.width = pct; yt.dot.style.right = pct; }
      var all = Math.round(total), text = fmt(Math.min(cur, all)) + ' / ' + fmt(all);
      if (yt.time.textContent !== text) { yt.time.textContent = text; }
    }
    function fillPlayer(a, href) {
      yt.title.textContent = a.title;
      yt.title.title = a.title;
      yt.name.textContent = a.advertiser || COMPANY;
      var c = yt.cta;
      if (href) {
        c.hidden = false;
        c.href = href;
        c.textContent = a.cta_text || 'לפרטים';
        if (isExternal(href)) { c.target = '_blank'; c.rel = 'noopener sponsored'; } else { c.removeAttribute('target'); c.rel = 'sponsored'; }
      } else { c.hidden = true; c.removeAttribute('href'); }
      yt.count.textContent = (idx + 1) + ' / ' + ads.length;
      if (yt.order !== idx) {                                       // הרשימה: מהפרסומת שאחרי הנוכחית, במעגל
        var had = yt.list.contains(document.activeElement) ? document.activeElement : null;
        yt.order = idx;
        for (var n = 1; n <= ads.length; n++) {
          var k = (idx + n) % ads.length;
          yt.items[k].li.hidden = k === idx;
          yt.list.appendChild(yt.items[k].li);
        }
        if (had && had.offsetParent !== null) { had.focus({ preventScroll: true }); }
        if (!yt.queue.matches(':hover')) { yt.scroll.scrollTop = 0; yt.scroll.scrollLeft = 0; }
      }
      paint();
    }
    // אין מקום לכל התוכן — מסתירים את שורת הערוץ; במובייל, אם עדיין צר, מקטינים מעט את הנגן (נשאר 16:9)
    function fitPlayer(avail) {
      card.classList.remove('is-tight');
      card.style.removeProperty('--yt-pw');
      if (!isMobile()) { if (avail < 300) { card.classList.add('is-tight'); } return; }
      if (card.offsetHeight <= avail) { return; }
      card.classList.add('is-tight');
      var over = card.offsetHeight - avail;
      if (over > 0) { card.style.setProperty('--yt-pw', Math.floor(Math.max(90, yt.player.offsetHeight - over) * 16 / 9) + 'px'); }
    }
    // גודל: ה-CSS מחשב (min עם dvh); כאן רק נמדדים ראש המסגרת, המקום שבין גלולות הצד וכפתור הנגישות
    function applyPlayer() {
      if (!yt || card.parentNode !== SLOT) { return; }
      var vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight, cx = vw / 2;
      var top = layoutTop(SLOT) + (parseFloat(getComputedStyle(SLOT).borderTopWidth) || 0);
      var set = function (k, v) { card.style.setProperty(k, Math.round(v) + 'px'); };
      var bottom = 17;                                              // 16px לפחות גם אחרי עיגול חצאי פיקסלים
      set('--yt-top', top);
      set('--yt-bottom', bottom);
      var side = vw - 24;
      rectsOf(['.main-nav a', '.logo', '.nav-toggle', '#langBtn']).forEach(function (r) {
        if (r.b <= top || r.t >= vh - 16) { return; }                 // לא באותו גובה של המסגרת
        var half = (r.l + r.r) / 2 < cx ? cx - r.r - 12 : r.l - cx - 12;
        side = Math.min(side, half * 2);
      });
      set('--yt-side', Math.max(280, side));
      fitPlayer(vh - top - bottom);
      var fab = rectsOf(['#a11yFab'])[0], w = card.offsetWidth;
      if (fab && fab.l < cx + w / 2 + 8 && fab.r > cx - w / 2 - 8 && fab.b > top && top + card.offsetHeight > fab.t - 8) {
        bottom = Math.max(17, vh - fab.t + 8);
        set('--yt-bottom', bottom);
        fitPlayer(vh - top - bottom);
      }
    }
    if (INLINE) { buildPlayer(); }

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
      if (yt) {
        yt.play.innerHTML = paused ? ICON.play : ICON.pause;
        yt.play.setAttribute('aria-label', paused ? 'הפעלה' : 'עצירה');
        yt.play.title = paused ? 'הפעלה' : 'עצירה';
      }
    }
    function showAd(i) {
      idx = (i + ads.length) % ads.length;
      if (idx !== shownIdx) { shownIdx = idx; elapsed = 0; runStart = 0; stillMode = false; }
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
        cta.textContent = '→ ' + (a.cta_text || 'לפרטים');
        if (isExternal(href)) { cta.target = '_blank'; cta.rel = 'noopener sponsored'; } else { cta.removeAttribute('target'); cta.rel = 'sponsored'; }
      } else { cta.hidden = true; cta.removeAttribute('href'); }
      schedule();
      if (yt) { fillPlayer(a, href); }
    }
    function next() { showAd(idx + 1); }
    // תמונה: 7 שניות. בדף הבית עצירה והמשך ממשיכים מאותה נקודה (כמו בנגן וידאו)
    function runStill() {
      var wait = INLINE ? Math.max(0, ROTATE_MS - elapsed) : ROTATE_MS;
      runStart = Date.now();
      timer = setTimeout(function () {
        if (multi) { next(); } else { elapsed = 0; runStart = 0; schedule(); }
      }, wait);
    }
    function schedule() {
      clearTimeout(timer);
      if (runStart) { elapsed = Math.min(ROTATE_MS, elapsed + Date.now() - runStart); runStart = 0; }
      var v = slides[idx].querySelector('video');
      if (!visibleNow()) { if (v) { v.pause(); } return; }
      if (v) {
        if (paused) { v.pause(); return; }
        var p = v.play();
        var mine = idx;
        if (p && p.catch) { p.catch(function () { if (multi && !paused && idx === mine) { clearTimeout(timer); stillMode = true; runStill(); } }); }
        return;                                                      // סרטון: עובר הלאה ב-ended
      }
      if (!paused && (multi || INLINE)) { runStill(); }
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
      applyPlayer();
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
      applyPlayer();
      if (before && animate) { flip(before, card.getBoundingClientRect()); }
      showAd(idx);
      applyPlayer();                                                // אחרי שהכותרת והרשימה מולאו
      if (focusIt) { yt.full.focus(); }
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
    // דף הבית: ✕ מופיע רק במסך מלא ומחזיר למסגרת (כמו "הקטנה" / Esc). בשאר העמודים ✕ סוגר רק את תצוגת העמוד הנוכחי.
    var closeBtn = card.querySelector('.gmpr-close');
    if (INLINE) { closeBtn.classList.add('gmpr-only-large'); closeBtn.setAttribute('aria-label', 'סגירה'); closeBtn.addEventListener('click', leaveLarge); }
    else { closeBtn.addEventListener('click', closeAll); }
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
      if (yt) { yt.wake(); }
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
