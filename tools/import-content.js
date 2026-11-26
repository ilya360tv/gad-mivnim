/* ==========================================================================
   tools/import-content.js — מייצר קובץ SQL אחד עם כל התוכן הנוכחי (js/*-data.js + i18n + src/site.html)
   לטבלאות ה-CMS (שלב C1): supabase/migrations/20261128100000_cms_c1_import.sql.
   אין שום מפתח סודי ואין גישת רשת — הקובץ מורץ ידנית ב-Supabase SQL editor (אחרי 20261128090000_cms_c1_lists.sql).
   כל השורות published; "on conflict (slug) do nothing" — אפשר להריץ שוב בבטחה ושינויים שנעשו בסטודיו לא נדרסים.
   הקבצים המקוריים (js/*-data.js, i18n, HTML) נשארים כגיבוי של האתר.
   הרצה:  node tools/import-content.js   (דורש Node בלבד)
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
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

/* ---------- יצירת ה-SQL ---------- */
const ARRAY_COLS = { points_he: 1, items_he: 1, bullets_he: 1, requirements_he: 1, advantages_he: 1, offer_he: 1 };
const JSON_COLS = { gallery: 1, photos: 1, i18n: 1 };
const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";
function lit(col, v) {
  if (v === null || v === undefined) { return 'null'; }
  if (ARRAY_COLS[col]) { return v.length ? 'array[' + v.map(q).join(', ') + ']::text[]' : "'{}'::text[]"; }
  if (JSON_COLS[col]) { return q(JSON.stringify(v)) + '::jsonb'; }
  if (typeof v === 'number') { return String(v); }
  if (typeof v === 'boolean') { return v ? 'true' : 'false'; }
  return q(v);
}
const NL = String.fromCharCode(10);
const head = [
  '-- CMS C1 import: the CURRENT site content (podcast, projects, in-progress, partners, info, careers, gallery) -> database.',
  '-- Generated by tools/import-content.js. Run AFTER 20261128090000_cms_c1_lists.sql, in the Supabase SQL editor.',
  '-- status = published. Idempotent: "on conflict (slug) do nothing" (re-running never overwrites edits made in the studio).',
  '-- The built-in js/*-data.js files stay in the site as the fallback.',
  '', 'begin;'
];
const parts = [head.join(NL)];
ORDER.forEach((t) => {
  const rows = tables[t];
  const cols = Object.keys(rows[0]);
  parts.push(['', '-- ' + t + ' (' + rows.length + ')',
    'insert into public.' + t + ' (' + cols.join(', ') + ') values',
    rows.map((r) => '  (' + cols.map((c) => lit(c, r[c])).join(', ') + ')').join(',' + NL),
    'on conflict (slug) do nothing;'].join(NL));
});
parts.push(NL + 'commit;' + NL);
const sql = parts.join(NL);
const out = path.join(ROOT, 'supabase', 'migrations', '20261128100000_cms_c1_import.sql');
fs.writeFileSync(out, sql, 'utf8');
console.log('נכתב:', path.relative(ROOT, out), '(' + Math.round(sql.length / 1024) + ' KB)');
