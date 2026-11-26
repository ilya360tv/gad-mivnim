/* ==========================================================================
   GAD MIVNIM — promo-boot.js: השלב המוקדם של חלון הפרסומות (מקור יחיד).
   tools/build-pages.js משבץ את הקובץ הזה כסקריפט inline ב-<head> של כל עמוד ציבורי (כדי שהבקשה תצא מיד, לפני שאר הדף),
   ו-js/promo-window.js (defer) משתמש בתוצאה דרך window.GMAds. אין בו מעקב, עוגיות או סטטיסטיקה.
   - רשימת הפרסומות הפעילות נשמרת ב-sessionStorage (gm:ads-list) לביקור: בקשה אחת לביקור, ורענון אחרי 10 דקות.
   - התמונה הראשונה נטענת מראש (preload) רק בעמוד הראשון של הביקור (כשהחלון הגדול עוד לא הוצג).
   - פרטי החיבור כאן הם הפרטים הציבוריים (כמו ב-js/supabase-config.js) — ההגנה על הנתונים היא ב-RLS.
   ========================================================================== */
(function () {
  var U = 'https://sihttuieondsukpjdsvv.supabase.co', K = 'sb_publishable_LHWYdDvkw_uK83ZE8RyxPQ_1G5vClXN';
  var TTL = 10 * 60 * 1000;
  var G = window.GMAds = { url: U, key: K, bucket: U + '/storage/v1/object/public/site-ads/', list: null };
  function ss(k, v) {
    try { if (v === undefined) { return sessionStorage.getItem(k); } sessionStorage.setItem(k, v); } catch (e) { /* ignore */ }
    return null;
  }
  try { sessionStorage.removeItem('gm:ads-closed'); localStorage.removeItem('gm:ads-closed'); } catch (e) { /* ignore */ }   // סימון 'נסגר' ישן — מנוקה
  if (!window.fetch) { G.list = Promise.resolve([]); return; }
  var firstPage = ss('gm:ads-large-shown') !== '1';
  function preload(rows) {
    var f = rows[0], p = f && (f.media_type === 'video' ? f.poster_path : f.media_path);
    if (!firstPage || !p) { return; }
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.href = G.bucket + p;
    document.head.appendChild(l);
  }
  var cached = null;
  try {
    var c = JSON.parse(ss('gm:ads-list') || 'null');
    if (c && Array.isArray(c.rows) && c.t <= Date.now() && Date.now() - c.t < TTL) { cached = c.rows; }
  } catch (e) { /* ignore */ }
  if (cached) { G.list = Promise.resolve(cached); preload(cached); return; }
  G.list = fetch(U + '/rest/v1/ads?select=id,title,advertiser,media_path,media_type,poster_path,alt_text,link_url,cta_text,bullets&order=sort_order.asc,created_at.asc&limit=30',
    { headers: { apikey: K, Authorization: 'Bearer ' + K } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http_' + r.status)); })
    .then(function (rows) {
      rows = Array.isArray(rows) ? rows : [];
      ss('gm:ads-list', JSON.stringify({ t: Date.now(), rows: rows }));
      preload(rows);
      return rows;
    });
  G.list.catch(function () { /* בלי פרסומות — האתר ממשיך כרגיל */ });
})();
