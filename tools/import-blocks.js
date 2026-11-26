/* ==========================================================================
   tools/import-blocks.js — מייצר קובץ SQL אחד עם כל הטקסטים (מפתחות js/i18n.js) והתמונות הניתנות לעריכה (data-cms-img)
   לטבלת page_blocks (שלב C2): supabase/migrations/20261129100000_cms_c2_import.sql.
   בלי מפתח סודי ובלי רשת — מורץ ידנית ב-Supabase SQL editor אחרי 20261129090000_cms_c2_blocks.sql.
   הכל published, "on conflict (key) do nothing". הערכים כאן זהים לתוכן הקיים; הם נכנסים לתוקף באתר רק אחרי עריכה בסטודיו.
   הרצה:  node tools/import-blocks.js
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

// ---- מילון i18n ----
const T = {};
read('js/i18n.js').split('\n').forEach((line) => {
  const m = /^\s{4}([A-Za-z0-9_]+):\s*(\{.*\}),?\s*$/.exec(line);
  if (!m) { return; }
  try { T[m[1]] = vm.runInNewContext('(' + m[2] + ')'); } catch (e) { /* לא מילון */ }
});

// ---- העמודים ----
const SKIP = { 'admin.html': 1, 'content.html': 1, 'resubmit.html': 1, '_hostshot.html': 1 };
const files = fs.readdirSync(ROOT).filter((f) => /\.html$/.test(f) && !SKIP[f] && /js\/i18n\.js/.test(read(f)));
const pageOf = (f) => (f === 'index.html' ? 'home' : f.replace(/\.html$/, ''));
const SHARED_AT = 8;                                     // מפתח שמופיע ביותר מ-8 עמודים = הדר / פוטר / תפריט

const usage = {};                                        // key -> [{ file, pos }]
files.forEach((f) => {
  const html = read(f), re = /data-i18n="([A-Za-z0-9_]+)"/g;
  let m, pos = 0;
  while ((m = re.exec(html))) { (usage[m[1]] = usage[m[1]] || []).push({ file: f, pos: pos++ }); }
});
const distinctFiles = (u) => Array.from(new Set(u.map((x) => x.file)));

const skipped = [];
// אותו ניקוי כמו private.cms_clean_rich (ב-20261129090000_cms_c2_blocks.sql) — לבדיקה אם ערך מובנה היה משתנה
function cleanLikeServer(v) {
  let s = v || '';
  s = s.replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed)\b[^>]*>/gi, '');
  s = s.replace(/<a\s+[^>]*?href\s*=\s*"((?:https:\/\/|\/(?!\/)|mailto:|tel:)[^"<>]*)"[^>]*>/gi, '<a href="$1" rel="noopener">');
  s = s.replace(/<a(?! href="[^"<>]*" rel="noopener">)(\s[^>]*)?>/gi, '');
  s = s.replace(/<(?!\/?(?:b|strong|i|em|br|ul|ol|li|p|bdi|span|a)\b)[^>]*>/gi, '');
  s = s.replace(/<(b|strong|i|em|ul|ol|li|p|bdi|span)\s+[^>]*?class\s*=\s*"([A-Za-z0-9_ -]*)"[^>]*>/gi, '<$1 class="$2">');
  s = s.replace(/<(b|strong|i|em|ul|ol|li|p|bdi|span)(?! class="[A-Za-z0-9_ -]*">)\s[^>]*>/gi, '<$1>');
  s = s.replace(/<br\s[^>]*>/gi, '<br>');
  s = s.replace(/<\/(b|strong|i|em|ul|ol|li|p|bdi|span|a)\s[^>]*>/gi, '</$1>');
  return s.trim();
}
const rows = [];
const order = {};                                        // page -> counter
const next = (page) => (order[page] = (order[page] || 0) + 1);
const homeOrder = {};
(usage.__none || []);
Object.keys(T).sort((a, b) => {
  const ua = usage[a], ub = usage[b];
  const pa = ua ? ua[0].pos : 1e9, pb = ub ? ub[0].pos : 1e9;
  return pa - pb;
}).forEach((key) => {
  const u = usage[key];
  let page = 'shared';
  if (u) {
    const fl = distinctFiles(u);
    if (fl.length <= SHARED_AT) { page = pageOf(u.sort((x, y) => x.pos - y.pos)[0].file); }
  }
  const v = T[key];
  // מפתח שהניקוי בשרת היה משנה (תגיות/מאפיינים שאינם ברשימה: <img>, class=...) לא נכנס — כדי שעריכה בסטודיו לא תפגום בעיצוב
  if (['he', 'en', 'ru', 'fr'].some((l) => v[l] && cleanLikeServer(v[l]) !== v[l].trim())) { skipped.push(key); return; }
  const rich = ['he', 'en', 'ru', 'fr'].some((l) => /</.test(v[l] || ''));
  rows.push({ key: key, page: page, type: rich ? 'rich' : 'text', value_he: v.he || null, value_en: v.en || null, value_ru: v.ru || null, value_fr: v.fr || null,
    image_path: null, image_alt: null, sort_order: next(page) });
});

// ---- תמונות (data-cms-img) ----
const titleOf = (html) => { const m = /<title>([^<]*)<\/title>/.exec(html); return m ? m[1].replace(/\s*\|\s*GAD MIVNIM\s*$/, '').trim() : ''; };
const seen = {};
files.forEach((f) => {
  const html = read(f), title = titleOf(html);
  const re = /<img\b[^>]*\bdata-cms-img="([^"]+)"[^>]*>/g;
  let m, n = 0;
  while ((m = re.exec(html))) {
    const tag = m[0], key = m[1];
    if (seen[key]) { continue; }
    seen[key] = 1; n++;
    const src = (/\bsrc="([^"]+)"/.exec(tag) || [])[1];
    const alt = ((/\balt="([^"]*)"/.exec(tag) || [])[1] || '').replace(/&quot;/g, '"') || (title + ' – תמונה ' + n);
    const page = pageOf(f);
    rows.push({ key: key, page: page, type: 'image', value_he: null, value_en: null, value_ru: null, value_fr: null, image_path: src, image_alt: alt, sort_order: 1000 + next(page) });
  }
});

// ---- SQL ----
const q = (v) => (v === null || v === undefined ? 'null' : "'" + String(v).replace(/'/g, "''") + "'");
const NL = String.fromCharCode(10);
const cols = ['key', 'page', 'type', 'value_he', 'value_en', 'value_ru', 'value_fr', 'image_path', 'image_alt', 'status', 'sort_order'];
const lit = (r, c) => (c === 'status' ? "'published'" : c === 'sort_order' ? String(r.sort_order) : q(r[c]));
const head = [
  '-- CMS C2 import: every text key of js/i18n.js (he/en/ru/fr) + the editable images (data-cms-img) -> page_blocks.',
  '-- Generated by tools/import-blocks.js. Run AFTER 20261129090000_cms_c2_blocks.sql, in the Supabase SQL editor.',
  '-- status = published, "on conflict (key) do nothing". These rows equal the current built-in content (no visible change);',
  '-- a block starts overriding the site only after it is edited in the studio.',
  '', 'begin;', ''];
const body = [];
for (let i = 0; i < rows.length; i += 60) {
  const chunk = rows.slice(i, i + 60);
  body.push('insert into public.page_blocks (' + cols.join(', ') + ') values' + NL +
    chunk.map((r) => '  (' + cols.map((c) => lit(r, c)).join(', ') + ')').join(',' + NL) + NL + 'on conflict (key) do nothing;' + NL);
}
const sql = head.join(NL) + body.join(NL) + NL + 'commit;' + NL;
const out = path.join(ROOT, 'supabase', 'migrations', '20261129100000_cms_c2_import.sql');
if (require.main === module) {
  fs.writeFileSync(out, sql, 'utf8');
  const byPage = {};
  rows.forEach((r) => { byPage[r.page] = (byPage[r.page] || 0) + 1; });
  console.log('נכתב:', path.relative(ROOT, out), '(' + Math.round(sql.length / 1024) + ' KB), שורות:', rows.length);
  console.log('לא נכנסו (תגיות/מאפיינים שהניקוי היה משנה):', skipped.length, skipped.join(', '));
  console.log(Object.keys(byPage).map((p) => p + ':' + byPage[p]).join('  '));
}
module.exports = { rows: rows };
