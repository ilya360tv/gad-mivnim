/* GAD MIVNIM — Service Worker
   דפים, CSS ו-JS: קודם רשת (תמיד גרסה עדכנית), מטמון רק כשאין חיבור.
   תמונות, אייקונים ופונטים: מהמטמון מיד + רענון ברקע, עם הגבלת כמות.
   לא נוגעים בטפסים (POST), וידאו, iframes חיצוניים, אנליטיקס, /.netlify/ ו-/_vercel/.
   לעולם לא שומרים במטמון בקשות ל-Supabase (*.supabase.co), לספריית supabase-js (esm.sh) או ל-/api/* — נתונים אמיתיים ופרטיים. */

var VERSION = 'gad-v5-20261111c';
var SHELL_CACHE = VERSION + '-shell';
var PAGES_CACHE = VERSION + '-pages';
var ASSETS_CACHE = VERSION + '-assets';
var MAX_ASSETS = 150;
var MAX_PAGES = 60;

// מעטפת האפליקציה: דף הבית + הדף הלא-מקוון + הקוד המשותף לכל העמודים (שאר העמודים נשמרים במטמון בביקור)
var SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/style.css',
  '/js/i18n.js',
  '/js/premium.js',
  '/js/script.js',
  '/js/a11y.js',
  '/js/pwa.js',
  '/images/gad_mivnim_logo.svg',
  '/icons/icon-192.png'
];

var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key.indexOf(VERSION) !== 0) return caches.delete(key);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function trimCache(name, max) {
  return caches.open(name).then(function (cache) {
    return cache.keys().then(function (keys) {
      if (keys.length <= max) return;
      return cache.delete(keys[0]).then(function () { return trimCache(name, max); });
    });
  });
}

function networkFirst(event, isPage) {
  var req = event.request;
  return fetch(req)
    .then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        var copy = res.clone();
        event.waitUntil(caches.open(PAGES_CACHE)
          .then(function (cache) { return cache.put(req, copy); })
          .then(function () { return trimCache(PAGES_CACHE, MAX_PAGES); }));
      }
      return res;
    })
    .catch(function () {
      return caches.match(req)
        .then(function (hit) { return hit || caches.match(req, { ignoreSearch: true }); })
        .then(function (hit) {
          if (hit) return hit;
          if (isPage) return caches.match('/offline.html');
          return Response.error();
        });
    });
}

function staleWhileRevalidate(event) {
  var req = event.request;
  return caches.open(ASSETS_CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) {
      var update = fetch(req).then(function (res) {
        // opaque = תשובה "אטומה" של Google Fonts (רק שרתי הפונטים מגיעים לכאן)
        if (res && (res.ok || res.type === 'opaque')) {
          return cache.put(req, res.clone())
            .then(function () { return trimCache(ASSETS_CACHE, MAX_ASSETS); })
            .then(function () { return res; });
        }
        return res;
      });
      if (hit) {
        event.waitUntil(update.catch(function () {}));
        return hit;
      }
      return update.catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (h) { return h || Response.error(); });
      });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;            // טפסים / Netlify Forms
  if (req.headers.has('range')) return;        // וידאו — הדפדפן מנהל בעצמו

  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var path = url.pathname;

  if (/(^|\.)supabase\.co$/i.test(url.hostname) || url.hostname === 'esm.sh') return;   // נתונים / התחברות — תמיד רשת, בלי מטמון
  if (!sameOrigin) {
    if (FONT_HOSTS.indexOf(url.hostname) !== -1) event.respondWith(staleWhileRevalidate(event));
    return;                                    // YouTube / Vimeo / Maps / אנליטיקס — לא נוגעים
  }

  if (path.indexOf('/api/') === 0) return;   // פונקציות השרת (Vercel) — בלי מטמון
  if (path.indexOf('/.netlify/') === 0 || path.indexOf('/_vercel/') === 0) return;
  if (path === '/sw.js') return;
  if (/\.(mp4|webm|mov|m4v|ogg|mp3)$/i.test(path)) return;

  if (req.mode === 'navigate' || /\.html$/i.test(path)) {
    event.respondWith(networkFirst(event, req.mode === 'navigate'));
    return;
  }
  if (/\.(css|js|json|webmanifest)$/i.test(path)) {
    event.respondWith(networkFirst(event, false));
    return;
  }
  if (/\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i.test(path)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
