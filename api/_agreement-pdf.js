/* ==========================================================================
   GAD MIVNIM — _agreement-pdf.js: הקובץ החתום "signed-agreement.pdf" (צד שרת בלבד).
   pdf-lib + גופן Rubik (עברית + לטינית, api/_fonts). pdf-lib מצייר משמאל לימין, לכן:
     1) שבירת שורות בסדר לוגי (מדידת רוחב), 2) כל שורה מסודרת לסדר חזותי RTL —
        מילים בעברית הפוכות, רצפים לטיניים/מספרים (GAD MIVNIM, 2.4, PDF / JPG / PNG) נשארים בסדרם, סוגריים מוחלפים.
   התוכן = אותו נוסח (js/agreement-data.js) עם פרטי הקבלן, החתימה (PNG), תאריך, גרסה, SHA-256 ו-IP.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const A = require('../js/agreement-data.js');

const PAGE_W = 595.28, PAGE_H = 841.89, M = 42;            // A4
const INK = rgb(0.1, 0.12, 0.15), MUTED = rgb(0.38, 0.42, 0.47), LINE = rgb(0.8, 0.83, 0.86);
const BRAND = rgb(0.13, 0.55, 0.85), WARN = rgb(0.72, 0.3, 0.05), FILL = rgb(0.05, 0.35, 0.6);

/* ---------- סדר חזותי (RTL) ---------- */
const HEB = /[֐-׿]/;
const LTR_RUN = /[A-Za-z0-9@]+(?:[.,:/@_-][A-Za-z0-9]+)*/g;
const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' };
const isLtrWord = (w) => !HEB.test(w) && /[A-Za-z0-9]/.test(w);
const isNeutral = (w) => !HEB.test(w) && !/[A-Za-z0-9]/.test(w);

// מילה אחת → סדר תווים חזותי
function visualWord(w) {
  if (isLtrWord(w) && !/[()[\]]/.test(w)) { return w; }
  const runs = [];
  let last = 0, m;
  LTR_RUN.lastIndex = 0;
  while ((m = LTR_RUN.exec(w))) {
    if (m.index > last) { runs.push({ ltr: false, s: w.slice(last, m.index) }); }
    runs.push({ ltr: true, s: m[0] });
    last = m.index + m[0].length;
  }
  if (last < w.length) { runs.push({ ltr: false, s: w.slice(last) }); }
  return runs.reverse().map((r) => r.ltr ? r.s : Array.from(r.s).reverse().map((c) => MIRROR[c] || c).join('')).join('');
}

// שורה (מערך מילים {s, bold}) → מערך חזותי משמאל לימין
function visualLine(words) {
  // קבוצות: רצף מילים לטיניות (כולל מפרידים ניטרליים ביניהן) נשאר בסדרו; השאר מתהפך
  const groups = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const ltr = isLtrWord(w.s);
    const prev = groups[groups.length - 1];
    if (ltr && prev && prev.ltr) { prev.items.push(w); continue; }
    if (isNeutral(w.s) && prev && prev.ltr && words[i + 1] && isLtrWord(words[i + 1].s)) { prev.items.push(w); continue; }
    groups.push({ ltr: ltr, items: [w] });
  }
  const out = [];
  const flip = (p) => Array.from(p).reverse().map((c) => MIRROR[c] || c).join('');
  groups.reverse().forEach((g) => {
    if (!g.ltr) {
      g.items.slice().reverse().forEach((w) => out.push({ s: visualWord(w.s), bold: w.bold, i: w.i, glue: w.glue }));
      return;
    }
    // רצף לטיני: פיסוק בקצוות ("(CVV)", "GAD MIVNIM:", "2.4).") עובר לצד ה-RTL — סוף לוגי משמאל, התחלה מימין (במראה)
    const items = g.items.map((w) => ({ s: w.s, bold: w.bold, i: w.i, glue: w.glue }));
    const first = items[0], last = items[items.length - 1];
    const lead = /^[(\[{"']+/.exec(first.s), trail = /[)\]}:;,.!?"']+$/.exec(last.s);
    if (lead && first.s.length > lead[0].length) { first.s = first.s.slice(lead[0].length); }
    if (trail && last.s.length > trail[0].length) { last.s = last.s.slice(0, -trail[0].length); }
    if (trail && last.s.length) { first.s = flip(trail[0]) + first.s; }
    if (lead && first.s.length) { last.s = last.s + flip(lead[0]); }
    items.forEach((w) => out.push(w));
  });
  return out;
}

// "**מודגש** רגיל" → מילים עם סימון bold; glue = צמוד למילה הקודמת בלי רווח (למשל "**החברה**")
function tokens(text) {
  const out = [];
  let prevEndsWithSpace = true;
  String(text).split(/(\*\*[\s\S]+?\*\*)/).forEach((part) => {
    if (!part) { return; }
    const bold = /^\*\*[\s\S]+\*\*$/.test(part);
    const t = bold ? part.slice(2, -2) : part;
    const pieces = t.split(/(\s+)/);
    let glueNext = !prevEndsWithSpace && !/^\s/.test(t);
    pieces.forEach((pc) => {
      if (!pc) { return; }
      if (/^\s+$/.test(pc)) { glueNext = false; return; }
      out.push({ s: pc, bold: bold, glue: glueNext && out.length > 0 });
      glueNext = false;
    });
    prevEndsWithSpace = /\s$/.test(t);
  });
  out.forEach((w, i) => { w.i = i; });
  return out;
}
// רווח לפני מילה בסדר החזותי — אלא אם שתי המילים צמודות בטקסט המקורי
function gapBefore(vis, k) {
  if (!k) { return false; }
  const a = vis[k - 1], b = vis[k];
  if (a.i == null || b.i == null || Math.abs(a.i - b.i) !== 1) { return true; }
  return !(a.i > b.i ? a.glue : b.glue);
}

async function buildAgreementPdf(d, meta) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const dir = path.join(__dirname, '_fonts');
  const reg = await doc.embedFont(fs.readFileSync(path.join(dir, 'Rubik-Regular.ttf')), { subset: true });
  const bold = await doc.embedFont(fs.readFileSync(path.join(dir, 'Rubik-Bold.ttf')), { subset: true });
  // fontkit הופך מעצמו מילים בעברית (זיהוי כתב) — כאן הסדר החזותי מחושב ידנית, לכן כפייה של פריסה משמאל לימין
  [reg, bold].forEach((f) => {
    const fk = f.embedder && f.embedder.font;
    if (fk && !fk.__gmLtr) { const orig = fk.layout.bind(fk); fk.layout = (s2, feat) => orig(s2, feat, 'latn', undefined, 'ltr'); fk.__gmLtr = true; }
  });
  doc.setTitle('הסכם קבלן בית – ' + (d.fullName || ''));
  doc.setAuthor('GAD MIVNIM');
  doc.setSubject('agreement ' + A.VERSION + ' sha256 ' + meta.sha256);
  doc.setCreationDate(new Date(meta.acceptedAt));

  let page, y, pageNo = 0;
  const pages = [];
  const newPage = () => { page = doc.addPage([PAGE_W, PAGE_H]); pages.push(page); pageNo++; y = PAGE_H - M; };
  const ensure = (h) => { if (y - h < M + 30) { newPage(); } };
  const space = (h) => { y -= h; };
  const fontOf = (w) => (w.bold ? bold : reg);
  const width = (ws, size) => ws.reduce((a, w, i) => a + fontOf(w).widthOfTextAtSize(w.s, size) + (gapBefore(ws, i) ? reg.widthOfTextAtSize(' ', size) : 0), 0);

  // פסקה מימין לשמאל, בתוך [left, right]
  function para(text, opt) {
    opt = opt || {};
    const size = opt.size || 10, lh = size * 1.55, color = opt.color || INK;
    const right = opt.right || PAGE_W - M, left = opt.left || M, maxW = right - left;
    const ws = tokens(opt.bold ? '**' + String(text).replace(/\*\*/g, '') + '**' : text);
    const lines = [];
    let cur = [];
    ws.forEach((w) => {
      if (cur.length && width(cur.concat([w]), size) > maxW) { lines.push(cur); cur = []; }
      cur.push(w);
    });
    if (cur.length) { lines.push(cur); }
    lines.forEach((ln) => {
      if (!opt.noBreak) { ensure(lh); }
      const vis = visualLine(ln);
      const total = width(vis, size);
      let x = opt.center ? left + (maxW - total) / 2 : right - total;
      const base = y - size;
      vis.forEach((w, i) => {
        if (gapBefore(vis, i)) { x += reg.widthOfTextAtSize(' ', size); }
        page.drawText(w.s, { x: x, y: base, size: size, font: fontOf(w), color: opt.colorOf ? opt.colorOf(w) : color });
        x += fontOf(w).widthOfTextAtSize(w.s, size);
      });
      y -= lh;
    });
    return lines.length * lh;
  }
  function hr(color) { page.drawLine({ start: { x: M, y: y }, end: { x: PAGE_W - M, y: y }, thickness: 0.8, color: color || LINE }); }
  function heading(text) {
    ensure(40);
    space(8);
    page.drawRectangle({ x: M, y: y - 20, width: PAGE_W - 2 * M, height: 22, color: rgb(0.06, 0.09, 0.16) });
    const vis = visualLine(tokens(text));
    const w = width(vis.map((v) => ({ s: v.s, bold: true })), 11);
    let x = PAGE_W - M - 8 - w;
    vis.forEach((v, i) => { if (gapBefore(vis, i)) { x += reg.widthOfTextAtSize(' ', 11); } page.drawText(v.s, { x: x, y: y - 14.5, size: 11, font: bold, color: rgb(1, 1, 1) }); x += bold.widthOfTextAtSize(v.s, 11); });
    y -= 30;
  }
  // טבלה דו-טורית: תווית (ימין) | ערך (שמאל)
  function row(label, value, opt) {
    opt = opt || {};
    const labW = opt.labW || 150, size = 9.5;
    const right = PAGE_W - M, mid = right - labW;
    const valLines = Math.max(1, Math.ceil(width(tokens(value || ' '), size) / (mid - M - 12)) + 0);
    ensure(valLines * size * 1.55 + 10);
    const top = y;
    y -= 5;
    const yLab = y;
    para(label, { size: size, bold: true, right: right - 6, left: mid + 4, noBreak: true });
    const hLab = yLab - y;
    y = yLab;
    para(value || ' ', { size: size, right: mid - 6, left: M + 6, noBreak: true, colorOf: opt.fillColor ? () => FILL : null });
    const hVal = yLab - y;
    y = yLab - Math.max(hLab, hVal) - 4;
    page.drawRectangle({ x: M, y: y, width: PAGE_W - 2 * M, height: top - y, borderColor: LINE, borderWidth: 0.7 });
    page.drawLine({ start: { x: mid, y: top }, end: { x: mid, y: y }, thickness: 0.7, color: LINE });
  }
  const fill = (s, v) => String(s).replace(/\{\{(\w+)\|([^}]*)\}\}/g, (m0, k, blank) => (v[k] ? v[k] : blank));

  newPage();
  const sigImg = meta.signaturePng ? await doc.embedPng(meta.signaturePng) : null;

  A.BLOCKS.forEach((b) => {
    switch (b.t) {
      case 'title': para(b.text, { size: 16, bold: true }); space(2); break;
      case 'sub': para(b.text, { size: 10, color: BRAND }); space(4); hr(BRAND); space(8); break;
      case 'warn': para(b.text, { size: 9, color: WARN }); space(4); break;
      case 'callout': space(2); para(b.text, { size: 10, bold: true, color: BRAND }); space(2); break;
      case 'p': para(fill(b.text, d), { size: 10, bold: !!b.strong }); space(2); break;
      case 'small': space(2); para(b.text, { size: 8.5, color: MUTED }); para(A.PAY_NOTE, { size: 8.5, bold: true, color: FILL }); break;
      case 'office': space(6); para(b.text, { size: 8, color: MUTED }); break;
      case 'h': heading(b.text); break;
      case 'parties': b.rows.forEach((r) => row(r.label, r.lines.join(' '), { labW: 70 })); space(4); break;
      case 'ol':
        b.items.forEach((it, i) => {
          const before = y;
          para(it, { size: 10, right: PAGE_W - M - 18 });
          const vis = (i + 1) + '.';
          // המספר מימין לשורה הראשונה של הפסקה (אם לא עבר עמוד)
          if (y < before) { page.drawText(vis, { x: PAGE_W - M - reg.widthOfTextAtSize(vis, 10), y: before - 10, size: 10, font: reg, color: INK }); }
          space(2);
        });
        break;
      case 'table':
        b.rows.forEach((r) => {
          const key = r[2];
          let v = r[1];
          let filled = false;
          if (key === 'payment') { v = (r[1] ? r[1] + ' — ' : '') + A.PAY_NOTE; }
          else if (key && d[key]) { v = d[key]; filled = true; }
          row(r[0], v, { fillColor: filled });
        });
        space(4);
        break;
      case 'docs':
        b.items.forEach((x) => {
          const up = d.docs && d.docs[x.n];
          row(x.n + ' ' + x.title, x.text + ' — ' + (up ? 'עומד/ת בתנאי: כן · שם הקובץ שצורף: ' + up : 'העלאת מסמך: ' + x.upload + ' PDF / JPG / PNG · עד 5MB'), { labW: 120 });
        });
        if (d.docs && d.docs[9]) { row('9 ' + d.extraDocTitle, 'עומד/ת בתנאי: כן · שם הקובץ שצורף: ' + d.docs[9], { labW: 120 }); }
        space(4);
        break;
      case 'sign': {
        ensure(160);
        const colW = (PAGE_W - 2 * M) / 2;
        const top = y;
        para(b.cols[0], { size: 10, bold: true, right: PAGE_W - M - 6, left: M + colW + 4, noBreak: true });
        y = top;
        para(b.cols[1], { size: 10, bold: true, right: M + colW - 6, left: M + 6, noBreak: true });
        y = top - 18;
        b.rows.forEach((r) => {
          const k = r[2], v = d[k];
          const rowTop = y;
          if (k === 'signature') {
            para(r[0] + ':', { size: 9.5, right: PAGE_W - M - 6, left: M + colW + 4, noBreak: true });
            if (sigImg) {
              const h = 48, w = Math.min(colW - 16, sigImg.width * h / sigImg.height);
              page.drawImage(sigImg, { x: PAGE_W - M - 8 - w, y: y - h, width: w, height: h });
              y -= h + 4;
            }
          } else {
            para(r[0] + ': ' + (v || ''), { size: 9.5, right: PAGE_W - M - 6, left: M + colW + 4, noBreak: true, colorOf: (w) => (v && String(v).indexOf(w.s) !== -1 ? FILL : INK) });
          }
          const hMine = rowTop - y;
          y = rowTop;
          para(r[1] + ':', { size: 9.5, right: M + colW - 6, left: M + 6, noBreak: true, color: MUTED });
          y = rowTop - Math.max(hMine, 16) - 6;
        });
        page.drawRectangle({ x: M, y: y, width: PAGE_W - 2 * M, height: top + 4 - y, borderColor: LINE, borderWidth: 0.7 });
        page.drawLine({ start: { x: M + colW, y: top + 4 }, end: { x: M + colW, y: y }, thickness: 0.7, color: LINE });
        space(4);
        break;
      }
    }
  });

  // תיעוד החתימה הדיגיטלית
  space(10);
  ensure(90);
  hr();
  space(8);
  para('**תיעוד חתימה דיגיטלית**', { size: 9.5 });
  [
    'גרסת ההסכם: ' + A.VERSION,
    'SHA-256 של נוסח ההסכם: ' + meta.sha256,
    'מועד החתימה (שעון השרת): ' + meta.acceptedLocal,
    'כתובת IP: ' + (meta.ip || '—'),
    'מזהה בקשה: ' + meta.applicantId
  ].forEach((l) => para(l, { size: 8.5, color: MUTED }));

  // שוליים בכל עמוד
  pages.forEach((p, i) => {
    const t = visualLine(tokens('טיוטה לבדיקת יועץ משפטי · עמוד ' + (i + 1) + ' מתוך ' + pages.length + ' · ' + A.VERSION));
    let x = PAGE_W - M - width(t, 8);
    t.forEach((w, k) => { if (gapBefore(t, k)) { x += reg.widthOfTextAtSize(' ', 8); } p.drawText(w.s, { x: x, y: M - 18, size: 8, font: reg, color: MUTED }); x += reg.widthOfTextAtSize(w.s, 8); });
  });

  return Buffer.from(await doc.save());
}

module.exports = { buildAgreementPdf, visualLine, tokens };
