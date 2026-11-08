/* PWA — רישום ה-Service Worker (רק ב-https או localhost, אחרי טעינת הדף).
   כשיש גרסה חדשה היא נכנסת לתוקף בשקט; הניווט הבא כבר מקבל את התוכן העדכני — בלי חלונות קופצים. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (location.protocol !== 'https:' && !local) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
      reg.addEventListener('updatefound', function () {
        var sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', function () {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) sw.postMessage('SKIP_WAITING');
        });
      });
    }).catch(function () {});
  });
})();
