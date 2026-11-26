/* ==========================================================================
   tools/import-content.js — ייבוא חד-פעמי של התוכן הנוכחי (js/*-data.js + i18n) לטבלאות ה-CMS (שלב C1).
   כל השורות נכנסות כ-published. לא מוחק ולא דורס: שורה שכבר קיימת (אותו slug) לא משתנה — אפשר להריץ שוב בבטחה.
   הקבצים המקוריים (js/*-data.js, i18n, HTML) נשארים כגיבוי של האתר.

   הרצה:   node tools/import-content.js --dry-run     (בודק ומדפיס כמויות, בלי רשת)
           node tools/import-content.js               (מייבא)
   המפתח הסודי נקרא רק מ-SUPABASE_SERVICE_ROLE_KEY (משתנה סביבה) או מ-.env.local / .env.seed.local / .env.
   לא נכתב ללוג ולא נשמר בשום קובץ. אם חסר — הסקריפט עוצר בלי לעשות דבר.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.indexOf('--dry-run') !== -1;

function readEnvFile(name) {
  try {
    const out = {};
    fs.readFileSync(path.join(ROOT, name), 'utf8').split(/\r?\n/).forEach((line) => {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) { out[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
    });
    return out;
  } catch (e) { return {}; }
}
const fileEnv = Object.assign({}, readEnvFile('.env.seed.local'), readEnvFile('.env.local'), readEnvFile('.env'));
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY || '';
let URL_ = (process.env.SUPABASE_URL || fileEnv.SUPABASE_URL || '').replace(/\/+$/, '');
if (!URL_) {
  const m = /url:\s*'(https:\/\/[^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'js', 'supabase-config.js'), 'utf8'));
  URL_ = m ? m[1].replace(/\/+$/, '') : '';
}

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
function loadData(file) {
  const w = {};
  vm.runInNewContext(read(file), { window: w });
  return w;
}
// i18n.js: כל המפתחות בשורה אחת  key: { he: '..', ru: '..', en: '..', fr: '..' }
function loadI18n() {
  const out = {};
  read('js/i18n.js').split('\n').forEach((line) => {
    const m = /^\s{4}([A-Za-z0-9_]+):\s*(\{.*\}),?\s*$/.exec(line);
    if (!m) { return; }
    try { out[m[1]] = vm.runInNewContext('(' + m[2] + ')'); } catch (e) { /* שורה שאינה מילון */ }
  });
  return out;
}
const T = loadI18n();
const tr = (key, lang) => (T[key] && T[key][lang]) || '';
// תרגומים לשדה: { en: {title}, ru: {title}, fr: {title} } — רק מה שקיים
function i18nOf(fields) {
  const out = {};
  ['en', 'ru', 'fr'].forEach((l) => {
    const o = {};
    Object.keys(fields).forEach((k) => { const v = fields[k](l); if (v && (!Array.isArray(v) || v.length)) { o[k] = v; } });
    if (Object.keys(o).length) { out[l] = o; }
  });
  return out;
}
const heList = (arr) => (arr || []).map((x) => (typeof x === 'string' ? x : x.he));
const langList = (arr, l) => (arr || []).map((x) => (typeof x === 'string' ? '' : x[l] || '')).filter(Boolean);
const normImg = (im, name, i) => (typeof im === 'string' ? { src: im, alt: name + ' - תמונה ' + (i + 1) } :
  { src: im.src, alt: im.alt || (name + ' - תמונה ' + (i + 1)), width: im.width || null, height: im.height || null });

const tables = {};

/* ---------- podcast ---------- */
tables.podcast_episodes = loadData('js/podcast-data.js').PODCAST_DATA.map((e, i) => ({
  slug: 'ep-' + e.n, number: e.n, minutes: e.min || null,
  title_he: e.title.he, guest_he: e.guest && e.guest.he || null, description_he: e.desc && e.desc.he || null,
  points_he: heList(e.points), cover_path: null, cover_alt: null,
  video_url: e.video || null, audio_path: e.audio || null, published_on: null,
  i18n: i18nOf({ title: (l) => e.title[l], guest: (l) => e.guest && e.guest[l], desc: (l) => e.desc && e.desc[l], points: (l) => langList(e.points, l) }),
  status: 'published', sort_order: i + 1
}));

/* ---------- projects + gallery ---------- */
const PROJ = loadData('js/projects-data.js').PROJECTS_DATA;
tables.projects = Object.keys(PROJ).map((slug, i) => {
  const c = PROJ[slug];
  return {
    slug: slug, sector: c.sector, client_name_he: c.name, subtitle_he: c.subtitle || null, city_he: c.city || null,
    logo: c.logo || slug, title_he: c.title || null, items_he: c.items || [], description_he: c.description || null,
    gallery: (c.images || []).map((im, j) => normImg(im, c.name, j)),
    i18n: c.i18n || {}, status: 'published', sort_order: i + 1
  };
});
// גלריית הבית: אותם כללים כמו js/script.js — בלי כפולות ובלי תמונות שהצד הקצר שלהן < 500
(function () {
  const seen = {}, rows = [];
  Object.keys(PROJ).forEach((slug) => {
    (PROJ[slug].images || []).forEach((im, i) => {
      const n = normImg(im, PROJ[slug].name, i);
      if (!n.src || seen[n.src]) { return; }
      if (n.width && n.height && Math.min(n.width, n.height) < 500) { return; }
      seen[n.src] = true;
      rows.push({ slug: 'g-' + slug + '-' + (i + 1), image_path: n.src, alt_text: n.alt, category: slug, width: n.width, height: n.height, i18n: {}, status: 'published', sort_order: rows.length + 1 });
    });
  });
  tables.gallery_items = rows;
})();

/* ---------- in progress ---------- */
const IP = loadData('js/in-progress-data.js').IN_PROGRESS_DATA;
tables.in_progress = Object.keys(IP).map((slug, i) => {
  const c = IP[slug];
  return {
    slug: slug, name_he: c.name, location_he: c.city || null, progress: c.progress || 0, image_path: c.photo || null, image_alt: c.photo ? c.name : null,
    title_he: c.title || null, items_he: c.items || [], gallery: (c.images || []).map((im, j) => normImg(im, c.name, j)),
    i18n: {}, status: 'published', sort_order: i + 1
  };
});

/* ---------- partners (כרטיסים מ-src/site.html + שמות מ-i18n + גלריה מ-partners-data.js) ---------- */
const PA = loadData('js/partners-data.js').PARTNERS_DATA;
(function () {
  const html = read('src/site.html');
  const re = /<div class="partner-chip" data-slug="([\w-]+)"[^>]*><strong data-i18n="(pt\d+)">[^<]*<\/strong><div class="partner-photo"><img src="([^"]+)" alt="([^"]*)"[^>]*><\/div><span class="partner-slogan[^"]*" data-i18n="([\w]+)"/g;
  const rows = [];
  let m;
  while ((m = re.exec(html))) {
    const slug = m[1], tk = m[2], sk = m[5], d = PA[slug] || { photos: [], content: '' };
    const hasSlogan = /^pt\d+s$/.test(sk);
    const title = tr(tk, 'he');
    rows.push({
      slug: slug, title_he: title, slogan_he: hasSlogan ? tr(sk, 'he') : null,
      image_path: m[3], image_alt: m[4] || title, link_page: null,
      photos: (d.photos || []).map((p) => ({ src: p, alt: title })), content_he: d.content || null,
      i18n: i18nOf({ title: (l) => tr(tk, l), slogan: (l) => (hasSlogan ? tr(sk, l) : '') }),
      status: 'published', sort_order: rows.length + 1
    });
  }
  tables.partners = rows;
})();

/* ---------- info articles ---------- */
tables.info_articles = loadData('js/info-data.js').INFO_DATA.map((a, i) => ({
  slug: a.slug, icon_svg: a.icon || null, title_he: a.title.he, card_text_he: a.teaser && a.teaser.he || null,
  intro_he: a.intro && a.intro.he || null, bullets_he: heList(a.bullets), tip_he: a.tip && a.tip.he || null,
  image_path: null, image_alt: null,
  i18n: i18nOf({ title: (l) => a.title[l], teaser: (l) => a.teaser && a.teaser[l], intro: (l) => a.intro && a.intro[l], bullets: (l) => langList(a.bullets, l), tip: (l) => a.tip && a.tip[l] }),
  status: 'published', sort_order: i + 1
}));

/* ---------- careers ---------- */
(function () {
  const C = loadData('js/careers-data.js').CAREERS_DATA;
  const order = ['r4', 'r1', 'r3', 'r2'];                 // סדר הכרטיסים בדף (r2 קיים בנתונים אך אין לו כרטיס כרגע)
  tables.job_roles = order.filter((r) => C.roles[r]).map((r, i) => {
    const d = C.roles[r];
    return {
      slug: r, title_he: tr('car_' + r, 'he'), subtitle_he: tr('car_' + r + 's', 'he') || null,
      intro_he: d.he.intro || null, requirements_he: d.he.req || [], advantages_he: d.he.adv || [], offer_he: (C.offer && C.offer.he) || [],
      active: true,
      i18n: i18nOf({ title: (l) => tr('car_' + r, l), subtitle: (l) => tr('car_' + r + 's', l), intro: (l) => d[l] && d[l].intro, req: (l) => d[l] && d[l].req, adv: (l) => d[l] && d[l].adv, offer: (l) => C.offer && C.offer[l] }),
      status: 'published', sort_order: i + 1
    };
  });
})();

/* ---------- הרצה ---------- */
const ORDER = ['podcast_episodes', 'projects', 'in_progress', 'partners', 'info_articles', 'job_roles', 'gallery_items'];
ORDER.forEach((t) => console.log(t.padEnd(18), String(tables[t].length).padStart(3), 'שורות'));
const bad = [];
tables.partners.forEach((p) => { if (!p.title_he) { bad.push('partners:' + p.slug + ' ללא שם'); } });
tables.job_roles.forEach((r) => { if (!r.title_he) { bad.push('job_roles:' + r.slug + ' ללא שם'); } });
if (bad.length) { console.error('בעיות בנתונים:', bad.join(' | ')); process.exit(1); }
if (DRY) { console.log('dry-run: לא נשלח דבר.'); process.exit(0); }
if (!KEY) { console.error('חסר SUPABASE_SERVICE_ROLE_KEY (משתנה סביבה או .env.local). לא בוצע דבר.'); process.exit(1); }
if (!URL_) { console.error('חסרה כתובת הפרויקט (SUPABASE_URL). לא בוצע דבר.'); process.exit(1); }

(async () => {
  for (const t of ORDER) {
    // ignore-duplicates: שורה שכבר קיימת (אותו slug) לא נדרסת — אפשר להריץ שוב בבטחה
    const r = await fetch(URL_ + '/rest/v1/' + t + '?on_conflict=slug', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(tables[t])
    });
    if (!r.ok) { console.error(t, 'נכשל:', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
    console.log(t, 'נשלח');
  }
  console.log('הייבוא הסתיים.');
})().catch((e) => { console.error('נכשל:', e.message); process.exit(1); });
