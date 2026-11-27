/* ==========================================================================
   tools/seed-demo-ads.js — סקריפט חד-פעמי: מעלה את 5 פרסומות ההדגמה (images/ads-demo/) לבאקט site-ads
   ומכניס 5 שורות ל-public.ads עם is_demo = true, active = true, sort_order 1–5, בלי תאריכים.
   אפשר להריץ שוב בבטחה: קודם מוחק את שורות ההדגמה הקיימות (והקבצים שלהן), ואז יוצר מחדש.

   הרצה (מהתיקייה הראשית):   node tools/seed-demo-ads.js
   המפתח הסודי (service_role) נקרא רק מ:  משתנה סביבה SUPABASE_SERVICE_ROLE_KEY  או מהקובץ .env.local
   (לא נכתב ללוג, לא נשמר בשום קובץ ולא עולה ל-git). כתובת הפרויקט: SUPABASE_URL או js/supabase-config.js.
   התמונות והסרטונים מועלים כמות שהם — בלי שינוי.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEMO_DIR = path.join(ROOT, 'images', 'ads-demo');
const BUCKET = 'site-ads';

function readEnvFile(name) {
  try {
    const txt = fs.readFileSync(path.join(ROOT, name), 'utf8');
    const out = {};
    txt.split(/\r?\n/).forEach((line) => {
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
if (!KEY) { console.error('חסר SUPABASE_SERVICE_ROLE_KEY (משתנה סביבה או .env.local). לא בוצע דבר.'); process.exit(1); }
if (!URL_) { console.error('חסרה כתובת הפרויקט (SUPABASE_URL). לא בוצע דבר.'); process.exit(1); }

const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const MIME = { jpg: 'image/jpeg', mp4: 'video/mp4' };

// הסדר בסיבוב: 1 אולם, 2 סרטון חברה, 3 קבלנים, 4 סרטון שותף, 5 מטבחים
const ADS = [
  { file: 'ad-showroom.jpg', type: 'image', title: 'אולם התצוגה – בקרוב', advertiser: 'GAD MIVNIM', alt: 'הדמיית אולם התצוגה של GAD MIVNIM בהרצליה – בקרוב', link: '/contact.html', cta: 'לתיאום ביקור' },
  { file: 'ad-video-company.mp4', poster: 'ad-video-company-poster.jpg', type: 'video', title: 'GAD MIVNIM – בכל מקום במפה', advertiser: 'GAD MIVNIM', alt: 'סרטון לדוגמה: עבודות תכנון ובנייה של GAD MIVNIM', link: '/contact.html', cta: 'לתיאום פגישה' },
  { file: 'ad-contractors.jpg', type: 'image', title: 'הצטרפות לקבלני הבית', advertiser: 'GAD MIVNIM', alt: 'הזמנה להצטרף למאגר קבלני הבית של GAD MIVNIM', link: '/careers.html#join-contractor', cta: 'להצטרפות' },
  { file: 'ad-video-partner.mp4', poster: 'ad-video-partner-poster.jpg', type: 'video', title: 'שותף לדוגמה – עיצוב הבית', advertiser: 'שותף לדוגמה', alt: 'סרטון לדוגמה של שותף בתחום עיצוב הבית', link: '/partners.html', cta: 'לפרטים' },
  { file: 'ad-partner.jpg', type: 'image', title: 'שותף לדוגמה – מטבחים', advertiser: 'שותף לדוגמה', alt: 'פרסומת לדוגמה של שותף בתחום המטבחים', link: '/partners-kitchens.html', cta: 'לפרטים' }
];

async function upload(localName) {
  const ext = localName.split('.').pop().toLowerCase();
  const remote = 'ads/demo-' + localName;
  const body = fs.readFileSync(path.join(DEMO_DIR, localName));
  const r = await fetch(URL_ + '/storage/v1/object/' + BUCKET + '/' + remote, {
    method: 'POST', headers: Object.assign({ 'Content-Type': MIME[ext], 'x-upsert': 'true', 'cache-control': 'public, max-age=31536000, immutable' }, H), body
  });
  if (!r.ok) { throw new Error('העלאה נכשלה: ' + localName + ' (' + r.status + ')'); }
  return remote;
}

async function main() {
  for (const a of ADS) {
    [a.file, a.poster].filter(Boolean).forEach((f) => { if (!fs.existsSync(path.join(DEMO_DIR, f))) { throw new Error('חסר קובץ: images/ads-demo/' + f); } });
  }
  // ניקוי הרצה קודמת
  const old = await (await fetch(URL_ + '/rest/v1/ads?select=id,media_path,poster_path&is_demo=eq.true', { headers: H })).json();
  if (Array.isArray(old) && old.length) {
    await fetch(URL_ + '/rest/v1/ads?is_demo=eq.true', { method: 'DELETE', headers: H });
    const files = [];
    old.forEach((r) => { files.push(r.media_path); if (r.poster_path) { files.push(r.poster_path); } });
    await fetch(URL_ + '/storage/v1/object/' + BUCKET, { method: 'DELETE', headers: Object.assign({ 'Content-Type': 'application/json' }, H), body: JSON.stringify({ prefixes: files }) });
  }
  const rows = [];
  for (let i = 0; i < ADS.length; i++) {
    const a = ADS[i];
    const media = await upload(a.file);
    const poster = a.poster ? await upload(a.poster) : null;
    rows.push({
      title: a.title, advertiser: a.advertiser, media_path: media, media_type: a.type, poster_path: poster, alt_text: a.alt,
      link_url: a.link, cta_text: a.cta, starts_at: null, ends_at: null, active: true, sort_order: i + 1, is_demo: true, text_in_media: true
    });
    console.log('הועלה:', a.file + (a.poster ? ' + ' + a.poster : ''));
  }
  const r = await fetch(URL_ + '/rest/v1/ads', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, H), body: JSON.stringify(rows) });
  if (!r.ok) { throw new Error('הכנסת השורות נכשלה (' + r.status + '): ' + (await r.text()).slice(0, 300)); }
  console.log('בוצע: 5 פרסומות הדגמה פעילות.');
}
main().catch((e) => { console.error(e.message); process.exit(1); });
