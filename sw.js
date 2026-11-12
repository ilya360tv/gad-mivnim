/* ==========================================================================
   KILL-SWITCH SERVICE WORKER — האתר כבר לא PWA (הוסר ב-2026-11-12).
   מי שעדיין מותקן אצלו ה-Service Worker הישן מקבל את הקובץ הזה בבדיקת העדכון הבאה:
   הוא מוחק את כל ה-Cache, מבטל את הרישום של עצמו וטוען מחדש את הלשוניות הפתוחות פעם אחת.
   אין כאן fetch handler — הדפדפן תמיד הולך לרשת.
   להשאיר בפרויקט (באותו נתיב /sw.js) לפחות עד 2027-02-12, ורק אז אפשר למחוק.
   ========================================================================== */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) {
        clients.forEach(function (client) {
          if ('navigate' in client) { client.navigate(client.url); }
        });
      })
  );
});
