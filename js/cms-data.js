/* ==========================================================================
   GAD MIVNIM — cms-data.js: תוכן הרשימות מהמסד (שלב C1 של ה-CMS).
   נטען אחרי js/*-data.js ולפני js/script.js. התוכן המובנה (js/*-data.js) הוא הגיבוי: אם המסד ריק / לא נגיש /
   לא נערך — האתר מציג בדיוק מה שהוא מציג היום, בלי שום שינוי.
   איך זה עובד:
     1. מטמון (sessionStorage 'gm:cms', 10 דקות): אם קיים — התוכן מהמסד מוחלף ב-window.*_DATA מיד, לפני ש-script.js מתחיל (בלי הבהוב).
     2. אין מטמון: האתר נטען עם התוכן המובנה; בקשה אחת (rpc cms_public) מביאה את כל התוכן המפורסם; נשמר במטמון.
        אם התוכן במסד שונה מהמובנה (נערך / נוסף / נמחק בסטודיו) — העמוד נטען מחדש פעם אחת כדי שכל הרכיבים יוצגו מהתוכן החדש.
     3. "שונה" = מספר השורות או ה-slug-ים שונים, או שורה נערכה בסטודיו (edited). שורות שלא נערכו = התוכן המובנה, כמו שהוא.
   טקסט en / ru / fr: אם ריק במסד — נשאר התרגום המובנה; אם גם הוא חסר — עברית.
   ========================================================================== */
(function () {
  'use strict';
  var CFG = window.GM_SUPABASE || {
    url: 'https://sihttuieondsukpjdsvv.supabase.co',
    key: 'sb_publishable_LHWYdDvkw_uK83ZE8RyxPQ_1G5vClXN'
  };
  var KEY = 'gm:cms', RL = 'gm:cms-rl', TTL = 10 * 60 * 1000, LANGS = ['en', 'ru', 'fr'];
  var ss = null;
  try { ss = window.sessionStorage; ss.getItem('x'); } catch (e) { ss = null; }
  var get = function (k) { try { return ss && ss.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { if (ss) { ss.setItem(k, v); } } catch (e) { /* ignore */ } };
  var del = function (k) { try { if (ss) { ss.removeItem(k); } } catch (e) { /* ignore */ } };

  /* ---------- תצוגה מקדימה של טיוטות (רק למנהל מחובר): content.html פותח עמוד באתר עם ?cmsPreview=1 ומעביר אסימון לשעה ----------
     האסימון עובר דרך localStorage לרגע אחד בלבד ונשמר ב-sessionStorage של הלשונית הזו. cms_preview() בודקת במסד שהמשתמש מנהל. */
  var PV = null;
  try {
    if (/[?&]cmsPreview=1(&|$)/.test(location.search)) {
      var raw = window.localStorage.getItem('gm:cms-pv-token');
      if (raw) { set('gm:cms-pv', raw); window.localStorage.removeItem('gm:cms-pv-token'); }
      var qs = location.search.replace(/([?&])cmsPreview=1(&|$)/, function (m, a, b) { return b ? a : ''; }).replace(/[?&]$/, '');
      if (window.history && history.replaceState) { history.replaceState(null, '', location.pathname + qs + location.hash); }
    }
    var pvRaw = get('gm:cms-pv');
    PV = pvRaw ? JSON.parse(pvRaw) : null;
    if (PV && (!PV.token || !PV.exp || PV.exp < Date.now())) { PV = null; del('gm:cms-pv'); }
  } catch (e) { PV = null; }
  if (PV) { KEY = 'gm:cms-pv-data'; TTL = 2 * 60 * 1000; RL = 'gm:cms-pv-rl'; }

  /* ---------- עזרים ---------- */
  function i18nOf(row, lang) { return (row.i18n && row.i18n[lang]) || {}; }
  // { he, en, ru, fr } לשדה: עברית מהמסד; שפות — מהמסד, אחרת מהתרגום המובנה (אם יש)
  function L(row, heVal, field, builtin) {
    var out = { he: heVal == null ? '' : heVal };
    LANGS.forEach(function (l) {
      var v = i18nOf(row, l)[field];
      if (!v && builtin && builtin[l]) { v = builtin[l]; }
      if (v) { out[l] = v; }
    });
    return out;
  }
  function Llist(row, heList, field, builtinList) {
    return (heList || []).map(function (he, i) {
      var o = { he: he };
      LANGS.forEach(function (l) {
        var arr = i18nOf(row, l)[field], v = arr && arr[i];
        if (!v && builtinList && builtinList[i] && builtinList[i][l]) { v = builtinList[i][l]; }
        if (v) { o[l] = v; }
      });
      return o;
    });
  }
  function keyed(list, keyFn) { var m = {}; (list || []).forEach(function (x) { m[keyFn(x)] = x; }); return m; }
  var imgObj = function (g) {
    var o = { src: g.src, alt: g.alt || '' };
    if (g.width) { o.width = g.width; }
    if (g.height) { o.height = g.height; }
    return o;
  };

  /* ---------- המרה: שורות מהמסד -> מבנה window.*_DATA ---------- */
  var CONVERT = {
    podcast_episodes: function (rows) {
      var b = keyed(window.PODCAST_DATA, function (e) { return 'ep-' + e.n; });
      return rows.map(function (r) {
        var o = b[r.slug] || {};
        return {
          n: r.number, min: r.minutes || 0, video: r.video_url || '', audio: r.audio_path || '',
          title: L(r, r.title_he, 'title', o.title), guest: L(r, r.guest_he, 'guest', o.guest), desc: L(r, r.description_he, 'desc', o.desc),
          points: Llist(r, r.points_he, 'points', o.points), cover: r.cover_path || '', coverAlt: r.cover_alt || ''
        };
      });
    },
    projects: function (rows) {
      var b = window.PROJECTS_DATA || {}, out = {};
      rows.forEach(function (r) {
        var o = b[r.slug] || {}, tr = {};
        LANGS.forEach(function (l) {
          var m = {}, ob = (o.i18n && o.i18n[l]) || {}, nb = i18nOf(r, l);
          Object.keys(ob).forEach(function (k) { m[k] = ob[k]; });
          Object.keys(nb).forEach(function (k) { if (nb[k] && (!Array.isArray(nb[k]) || nb[k].length)) { m[k] = nb[k]; } });
          if (Object.keys(m).length) { tr[l] = m; }
        });
        var c = { sector: r.sector, name: r.client_name_he, title: r.title_he || '', items: r.items_he || [],
          description: r.description_he || '', images: (r.gallery || []).map(imgObj), i18n: tr };
        if (r.logo !== null && r.logo !== undefined && r.logo !== r.slug) { c.logo = r.logo; }       // '' = בלי לוגו (כמו במובנה)
        if (r.subtitle_he) { c.subtitle = r.subtitle_he; }
        if (r.city_he) { c.city = r.city_he; }
        out[r.slug] = c;
      });
      return out;
    },
    in_progress: function (rows) {
      var out = {};
      rows.forEach(function (r) {
        out[r.slug] = { inProgress: true, name: r.name_he, city: r.location_he || '', progress: r.progress || 0, photo: r.image_path || '',
          title: r.title_he || '', items: r.items_he || [], images: (r.gallery || []).map(imgObj) };
      });
      return out;
    },
    partners: function (rows) {
      var out = {};
      rows.forEach(function (r) {
        out[r.slug] = { photos: (r.photos || []).map(function (p) { return p.src; }), content: r.content_he || '' };
      });
      return out;
    },
    info_articles: function (rows) {
      var b = keyed(window.INFO_DATA, function (a) { return a.slug; });
      return rows.map(function (r) {
        var o = b[r.slug] || {};
        return { slug: r.slug, icon: r.icon_svg || '', title: L(r, r.title_he, 'title', o.title), teaser: L(r, r.card_text_he, 'teaser', o.teaser),
          intro: L(r, r.intro_he, 'intro', o.intro), bullets: Llist(r, r.bullets_he, 'bullets', o.bullets), tip: L(r, r.tip_he, 'tip', o.tip) };
      });
    },
    job_roles: function (rows) {
      var b = window.CAREERS_DATA || { roles: {}, offer: {} }, roles = {}, offer = { he: [] };
      rows.forEach(function (r, i) {
        if (r.active === false) { return; }
        var o = (b.roles || {})[r.slug] || {}, d = { he: { intro: r.intro_he || '', req: r.requirements_he || [], adv: r.advantages_he || [] } };
        LANGS.forEach(function (l) {
          var t = i18nOf(r, l), ob = o[l] || {};
          if (t.intro || t.req || t.adv || ob.intro) { d[l] = { intro: t.intro || ob.intro || '', req: (t.req && t.req.length) ? t.req : (ob.req || []), adv: (t.adv && t.adv.length) ? t.adv : (ob.adv || []) }; }
        });
        roles[r.slug] = d;
        if (i === 0 || !offer.he.length) {
          offer.he = r.offer_he || [];
          LANGS.forEach(function (l) { var t = i18nOf(r, l).offer; offer[l] = (t && t.length) ? t : ((b.offer || {})[l] || []); });
        }
      });
      return { roles: roles, offer: offer };
    },
    gallery_items: function (rows) {
      return rows.map(function (r) { return { src: r.image_path, slug: r.category || '', alt: r.alt_text, width: r.width || null, height: r.height || null }; });
    }
  };

  /* ---------- האם התוכן במסד שונה מהמובנה? ---------- */
  function builtinSlugs(table) {
    var d;
    if (table === 'podcast_episodes') { return (window.PODCAST_DATA || []).map(function (e) { return 'ep-' + e.n; }); }
    if (table === 'projects') { return Object.keys(window.PROJECTS_DATA || {}); }
    if (table === 'in_progress') { return Object.keys(window.IN_PROGRESS_DATA || {}); }
    if (table === 'partners') { return Object.keys(window.PARTNERS_DATA || {}); }
    if (table === 'info_articles') { return (window.INFO_DATA || []).map(function (a) { return a.slug; }); }
    if (table === 'job_roles') { d = window.CAREERS_DATA; return d && d.roles ? Object.keys(d.roles) : []; }
    return null;                                   // gallery_items: אין "מובנה" לפי slug — משווים לפי edited / ספירה
  }
  // כמה תמונות הגלריה מציגה היום מתמונות הפרויקטים (אותם כללים כמו ב-script.js: בלי כפולות, בלי תמונות קטנות מ-500)
  function builtinGalCount() {
    var seen = {}, n = 0, P = window.PROJECTS_DATA || {};
    Object.keys(P).forEach(function (s) {
      (P[s].images || []).forEach(function (im) {
        var src = typeof im === 'string' ? im : im.src;
        if (!src || seen[src]) { return; }
        if (im.width && im.height && Math.min(im.width, im.height) < 500) { return; }
        seen[src] = 1; n++;
      });
    });
    return n;
  }
  // הטבלה רלוונטית רק בעמוד שבו הנתונים המובנים שלה קיימים (בעמוד אחר אין מה להחליף ואין סיבה לטעון מחדש)
  var PRESENT = { podcast_episodes: 'PODCAST_DATA', projects: 'PROJECTS_DATA', in_progress: 'IN_PROGRESS_DATA', partners: 'PARTNERS_DATA', info_articles: 'INFO_DATA', job_roles: 'CAREERS_DATA' };
  function present(t) {
    if (t === 'gallery_items') { return !!window.PROJECTS_DATA && !!document.getElementById('gallery'); }
    return !!window[PRESENT[t]];
  }
  function differs(table, rows) {
    if (!present(table) || !rows || !rows.length) { return false; }
    for (var i = 0; i < rows.length; i++) { if (rows[i].edited) { return true; } }
    var have = builtinSlugs(table);
    if (!have) { return table === 'gallery_items' && rows.length !== builtinGalCount(); }
    if (have.length !== rows.length) { return true; }
    var set = {};
    have.forEach(function (s) { set[s] = 1; });
    return rows.some(function (r) { return !set[r.slug]; });
  }

  /* ---------- החלה ---------- */
  var applied = {};
  // כרטיסי השותפים הם HTML סטטי עם מפתחות i18n (pt1 / pt1s ...): הכותרת והסלוגן מהמסד נכנסים למילון, כדי שיישמרו גם בהחלפת שפה
  function partnerKeys(rows) {
    var T = window.GAD_T;
    if (!T || !document.querySelectorAll) { return; }
    var by = {};
    rows.forEach(function (r) { by[r.slug] = r; });
    Array.prototype.forEach.call(document.querySelectorAll('.partner-chip[data-slug]'), function (c) {
      var r = by[c.getAttribute('data-slug')], st = c.querySelector('strong[data-i18n]'), sl = c.querySelector('.partner-slogan[data-i18n]');
      if (!r) { return; }
      var put = function (el, field) {
        var k = el && el.getAttribute('data-i18n');
        if (!k || !/^pt\d+s?$/.test(k)) { return; }
        var he = field === 'title' ? r.title_he : r.slogan_he;
        if (!he) { return; }
        T[k] = T[k] || {};
        T[k].he = esc(he);
        LANGS.forEach(function (l) { var v = i18nOf(r, l)[field]; if (v) { T[k][l] = esc(v); } });
      };
      put(st, 'title'); put(sl, 'slogan');
    });
  }
  function apply(content) {
    // קודם מחשבים הכל מול התוכן המובנה, ורק אחר כך מחליפים (כדי שהמרה אחת לא תשפיע על ההשוואה של אחרת)
    var plan = [];
    Object.keys(CONVERT).forEach(function (t) {
      var rows = content && content[t];
      if (differs(t, rows)) { plan.push({ t: t, rows: rows, data: CONVERT[t](rows) }); }
    });
    plan.forEach(function (p) {
      var t = p.t;
      if (t === 'podcast_episodes') { window.PODCAST_DATA = p.data; }
      else if (t === 'projects') { window.PROJECTS_DATA = p.data; }
      else if (t === 'in_progress') { window.IN_PROGRESS_DATA = p.data; }
      else if (t === 'partners') { window.PARTNERS_DATA = p.data; window.GM_CMS_PARTNERS = p.rows; partnerKeys(p.rows); }
      else if (t === 'info_articles') { window.INFO_DATA = p.data; }
      else if (t === 'job_roles') { window.CAREERS_DATA = p.data; window.GM_CMS_ROLES = p.rows; }
      else if (t === 'gallery_items') { window.GALLERY_ITEMS = p.data; }
      applied[t] = true;
    });
    return plan.length > 0;
  }

  /* ---------- טקסטים ותמונות של העמוד (page_blocks, C2) ----------
     רק בלוקים שנערכו בסטודיו מגיעים לכאן. טקסט: מחליף את הערך ב-window.GAD_T (המילון של js/i18n.js) — אותו מפתח, אותו מנגנון.
     שפה שהשדה שלה ריק במסד נשארת עם התרגום המובנה. הכל מנוקה גם בדפדפן (בנוסף לניקוי בשרת): בלי סקריפטים ובלי HTML לא מותר. */
  var ALLOWED = { B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, UL: 1, OL: 1, LI: 1, P: 1, BDI: 1, SPAN: 1, A: 1 };
  var SAFE_HREF = /^(https:\/\/|\/(?!\/)|mailto:|tel:)/i;
  var SAFE_IMG = /^(images\/|video\/|https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/site-media\/)[A-Za-z0-9_.\/-]+$/;
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cleanRich(html) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) { return; }
        if (ch.nodeType !== 1) { node.removeChild(ch); return; }
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(ch.tagName)) { node.removeChild(ch); return; }
        walk(ch);
        var keep = !!ALLOWED[ch.tagName], href = ch.tagName === 'A' ? ch.getAttribute('href') : null;
        if (keep && ch.tagName === 'A' && !(href && SAFE_HREF.test(href))) { keep = false; }
        if (!keep) { while (ch.firstChild) { node.insertBefore(ch.firstChild, ch); } node.removeChild(ch); return; }
        var cls = ch.tagName !== 'A' ? ch.getAttribute('class') : null;
        Array.prototype.slice.call(ch.attributes).forEach(function (a) { ch.removeAttribute(a.name); });
        if (cls && /^[A-Za-z0-9_ -]+$/.test(cls)) { ch.setAttribute('class', cls); }
        if (ch.tagName === 'A') { ch.setAttribute('href', href); ch.setAttribute('rel', 'noopener'); }
      });
    })(doc.body);
    return doc.body.innerHTML;
  }
  var blockImgs = {};
  function applyBlocks(blocks) {
    var T = window.GAD_T, changed = false;
    (blocks || []).forEach(function (b) {
      if (b.type === 'image' || b.type === 'video') { if (b.image_path && SAFE_IMG.test(b.image_path)) { blockImgs[b.key] = b; changed = true; } return; }
      if (!T) { return; }
      ['he', 'en', 'ru', 'fr'].forEach(function (l) {
        var v = b['value_' + l];
        if (!v) { return; }
        (T[b.key] = T[b.key] || {})[l] = b.type === 'rich' ? cleanRich(v) : esc(v);
        changed = true;
      });
    });
    return changed;
  }
  function applyImgs() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-cms-img]'), function (el) {
      var b = blockImgs[el.getAttribute('data-cms-img')];
      if (!b) { return; }
      el.src = b.image_path;
      el.removeAttribute('srcset');
      if (b.image_alt) { el.alt = b.image_alt; }
    });
  }

  var cached = null;
  try { cached = JSON.parse(get(KEY) || 'null'); } catch (e) { cached = null; }
  var fresh = cached && cached.t && (Date.now() - cached.t) < TTL && cached.data;
  if (fresh) { apply(cached.data); applyBlocks(cached.data.page_blocks); del(RL); }

  if (!fresh) {
    if (window.fetch) {
      fetch(CFG.url + '/rest/v1/rpc/' + (PV ? 'cms_preview' : 'cms_public'), {
        method: 'POST',
        headers: { apikey: CFG.key, Authorization: 'Bearer ' + (PV ? PV.token : CFG.key), 'Content-Type': 'application/json' },
        body: '{}'
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        if (!data || typeof data !== 'object') { return; }
        set(KEY, JSON.stringify({ t: Date.now(), data: data }));
        // טקסטים ותמונות: מוחלים מיד בלי טעינה מחדש (אותה החלפת שפה שהאתר כבר מכיר)
        if (applyBlocks(data.page_blocks)) {
          applyImgs();
          if (window.setLanguage) { window.setLanguage(document.documentElement.getAttribute('lang') || 'he'); }
        }
        // בדיקה על הנתונים המובנים (לפני שהוחלפו): אם יש הבדל — טעינה מחדש אחת
        var needs = false;
        Object.keys(CONVERT).forEach(function (t) { if (differs(t, data[t])) { needs = true; } });
        if (needs && !get(RL)) { set(RL, '1'); window.location.reload(); }
      }).catch(function () { /* אין רשת / המסד לא נגיש: נשארים עם התוכן המובנה */ });
    }
  }

  /* ---------- שותפים ותפקידים: הכרטיסים עצמם הם HTML סטטי — מתאימים אותם לתוכן מהמסד ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (PV) {
      var bar = document.createElement('div');
      bar.setAttribute('role', 'status');
      bar.style.cssText = 'position:fixed;inset-inline:0;bottom:0;z-index:2147483000;display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 16px;background:#fbbf24;color:#1a1400;font:700 14px Rubik,Arial,sans-serif;text-align:center;direction:rtl';
      bar.innerHTML = '<span>תצוגה מקדימה של טיוטה — מוצג רק לך, לא לגולשים</span><button type="button" style="font:inherit;padding:4px 14px;border:2px solid #1a1400;border-radius:999px;background:transparent;color:inherit;cursor:pointer">יציאה מהתצוגה המקדימה</button>';
      bar.querySelector('button').addEventListener('click', function () { del('gm:cms-pv'); del('gm:cms-pv-data'); del('gm:cms-pv-rl'); window.location.reload(); });
      document.body.appendChild(bar);
    }
    applyImgs();
    var prow = window.GM_CMS_PARTNERS;
    if (prow && applied.partners) {
      var chips = document.querySelectorAll('.partner-chip[data-slug]'), by = {};
      prow.forEach(function (r) { by[r.slug] = r; });
      Array.prototype.forEach.call(chips, function (c) {
        var r = by[c.getAttribute('data-slug')];
        if (!r) { c.hidden = true; return; }
        var strong = c.querySelector('strong'), img = c.querySelector('.partner-photo img'), sl = c.querySelector('.partner-slogan');
        var lang = document.documentElement.getAttribute('lang') || 'he';
        if (lang === 'he') {
          if (strong && r.title_he) { strong.textContent = r.title_he; }
          if (sl && r.slogan_he) { sl.textContent = r.slogan_he; }
        }
        if (img && r.image_path) { img.src = r.image_path; img.alt = r.image_alt || r.title_he || ''; }
      });
    }
    var rrow = window.GM_CMS_ROLES;
    if (rrow && applied.job_roles) {
      var have = {};
      rrow.forEach(function (r) { if (r.active !== false) { have[r.slug] = 1; } });
      Array.prototype.forEach.call(document.querySelectorAll('.role-card[data-role]'), function (c) {
        if (!have[c.getAttribute('data-role')]) { c.hidden = true; }
      });
    }
  });
})();
