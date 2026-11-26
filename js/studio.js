/* ==========================================================================
   GAD MIVNIM — studio.js: הסטודיו (CMS) — ניהול כל תוכן האתר ממקום אחד (content.html, מנהל ומנהל תוכן).
   מקבל מ-content.js את ה-ctx (store, FE, toast, חלונות...). כל הכתיבה דרך Supabase + RLS (מנהל / מנהל תוכן); מחיקה = סל מחזור;
   כל שמירה שומרת גרסה קודמת (content_versions) → "שחזור גרסה". הפרסומות (חלון הפרסומות) נשארות במסך הקיים — "פרסומות".
   סעיפים: רשימות (פרקים / פרויקטים / בביצוע / שותפים / מאמרים / תפקידים / גלריה), טקסטים ותמונות של כל עמוד (page_blocks),
   ספריית מדיה, סל מחזור, תצוגה מקדימה של טיוטות באתר האמיתי.
   ========================================================================== */
(function () {
  'use strict';
  var S = window.Studio = {};
  var ctx, store, FE, panel;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var chip = function (cls, text) { return '<span class="adm-chip adm-chip-' + cls + '">' + esc(text) + '</span>'; };
  var extOf = function (n) { var m = /\.([a-z0-9]+)$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; };
  var LANGS = [['en', 'אנגלית'], ['ru', 'רוסית'], ['fr', 'צרפתית']];

  /* ---------- התפריט: העמודים והקטגוריות לפי סדר התפריט באתר ---------- */
  S.MENU = [
    { id: 'home', label: 'דף הבית', page: 'home', file: 'index.html' },
    { id: 'about', label: 'אודות', page: 'about', file: 'about.html' },
    { id: 'services', label: 'השירותים שלנו', page: 'services', file: 'services.html', children: [
      { id: 'planning', label: 'חטיבת תכנון והנדסה', page: 'planning', file: 'planning.html' },
      { id: 'construction', label: 'חטיבת בינוי ותשתיות', page: 'construction', file: 'construction.html' },
      { id: 'real-estate', label: 'חטיבת שותפויות נדל"ן', page: 'real-estate', file: 'real-estate.html' },
      { id: 'special', label: 'חטיבת אחזקה וניהול מבנים', page: 'special', file: 'special.html' },
      { id: 'infrastructure', label: 'תשתיות ופיתוח', page: 'infrastructure', file: 'infrastructure.html' },
      { id: 'commercial', label: 'מבני מסחר וקניות', page: 'commercial', file: 'commercial.html' } ] },
    { id: 'projects', label: 'הפרויקטים שלנו', page: 'projects', file: 'projects.html', table: 'projects', extra: ['project'] },
    { id: 'in-progress', label: 'פרויקטים בביצוע', page: 'in-progress', file: 'in-progress.html', table: 'in_progress' },
    { id: 'teams', label: 'הצוותים', page: 'teams', file: 'teams.html' },
    { id: 'partners', label: 'השותפים', page: 'partners', file: 'partners.html', table: 'partners', children: [
      { id: 'partners-kitchens', label: 'מטבחים, נגרות ורהיטים', page: 'partners-kitchens', file: 'partners-kitchens.html' },
      { id: 'partners-doors', label: 'דלתות פנים וכניסה', page: 'partners-doors', file: 'partners-doors.html' },
      { id: 'partners-finishes', label: 'ריצוף, חיפויים וצבעים', page: 'partners-finishes', file: 'partners-finishes.html' },
      { id: 'partners-gates-frames', label: 'שערים, זגגות ומסגרות', page: 'partners-gates-frames', file: 'partners-gates-frames.html' },
      { id: 'partners-bath-lighting', label: 'כלים סניטריים ותאורה', page: 'partners-bath-lighting', file: 'partners-bath-lighting.html' } ] },
    { id: 'info', label: 'מידע לאזרח ולבונה', page: 'info', file: 'info.html', table: 'info_articles' },
    { id: 'podcast', label: 'פודקאסט', page: 'podcast', file: 'podcast.html', table: 'podcast_episodes' },
    { id: 'gallery', label: 'גלריה', page: 'gallery', file: 'gallery.html', table: 'gallery_items' },
    { id: 'careers', label: 'דרושים', page: 'careers', file: 'careers.html', table: 'job_roles' },
    { id: 'ads', label: 'פרסומות', special: 'ads' },
    { id: 'more', label: 'עמודים נוספים', group: true, children: [
      { id: 'tenders', label: 'מכרזים / מנויים', page: 'tenders', file: 'tenders.html' },
      { id: 'app', label: 'אפליקציה / מנויים', page: 'app', file: 'app.html' },
      { id: 'contact', label: 'שירות לקוחות', page: 'contact', file: 'contact.html' },
      { id: 'shared', label: 'תפריט, פוטר וטקסטים כלליים', page: 'shared', file: 'index.html' } ] },
    { id: 'media', label: 'ספריית מדיה', special: 'media' },
    { id: 'bin', label: 'סל מחזור', special: 'bin' }
  ];
  var FLAT = [];
  (function walk(list) { list.forEach(function (m) { FLAT.push(m); if (m.children) { walk(m.children); } }); })(S.MENU);
  var byId = function (id) { return FLAT.filter(function (m) { return m.id === id; })[0] || null; };
  S.item = byId;

  S.menuHtml = function () {
    var one = function (m, sub) {
      if (m.group) { return '<li><p class="ct-side-h">' + esc(m.label) + '</p><ul>' + m.children.map(function (c) { return one(c, true); }).join('') + '</ul></li>'; }
      return '<li class="' + (sub ? 'is-sub' : '') + '"><button type="button" data-sec="' + esc(m.id) + '">' + esc(m.label) + '</button>' +
        (m.children && !m.group ? '<ul>' + m.children.map(function (c) { return one(c, true); }).join('') + '</ul>' : '') + '</li>';
    };
    return '<ul>' + S.MENU.map(function (m) { return one(m, false); }).join('') + '</ul>';
  };

  S.init = function (c) {
    ctx = c; store = c.store; FE = c.FE;
    // תמונות שנכשלו לטעון (למשל תמונה ממוזערת שאין לה) — חוזרות לקובץ הראשי
    document.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && t.getAttribute('data-fb') && !t.getAttribute('data-fbd')) { t.setAttribute('data-fbd', '1'); t.src = t.getAttribute('data-fb'); }
    }, true);
    refreshToken();
    setInterval(refreshToken, 25 * 60 * 1000);
  };

  /* ---------- תצוגה מקדימה: האסימון נשמר מראש כדי שהפתיחה תהיה בלחיצה אחת (בלי חסימת חלונות קופצים) ---------- */
  var pvToken = '';
  function refreshToken() { store.cms.previewToken().then(function (t) { pvToken = t || ''; }, function () {}); }
  function preview(file) {
    if (!pvToken) { ctx.toast('התצוגה המקדימה עוד לא מוכנה, נסו שוב בעוד רגע'); refreshToken(); return; }
    try { localStorage.setItem('gm:cms-pv-token', JSON.stringify({ token: pvToken, exp: Date.now() + 55 * 60 * 1000 })); } catch (e) { ctx.toast('הדפדפן חוסם שמירה מקומית — אי אפשר לפתוח תצוגה מקדימה'); return; }
    window.open('/' + file + '?cmsPreview=1', '_blank');
  }

  /* ---------- העלאת מדיה: הקטנה בדפדפן (2000px + ממוזערת 600px) → העלאה חתומה → בדיקת MAGIC BYTES בשרת ---------- */
  var IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'];
  var MB = 1024 * 1024;
  function toBlob(canvas, mime, q) { return new Promise(function (res) { canvas.toBlob(res, mime, q); }); }
  function draw(bmp, max) {
    var w = bmp.width, h = bmp.height, k = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  }
  function prepareImage(file) {
    var ext = extOf(file.name), mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    if (!window.createImageBitmap) { return Promise.resolve({ main: file, ext: ext === 'jpeg' ? 'jpg' : ext, mime: file.type, thumb: null, w: 0, h: 0 }); }
    return createImageBitmap(file).then(function (bmp) {
      var big = Math.max(bmp.width, bmp.height) > 2000, mainP;
      if (!big && file.size <= 3 * MB) { mainP = Promise.resolve({ blob: file, ext: ext === 'jpeg' ? 'jpg' : ext, mime: file.type, w: bmp.width, h: bmp.height }); }
      else {
        var c = draw(bmp, 2000);
        mainP = toBlob(c, mime, 0.86).then(function (b) {
          if (b.size > 3 * MB && mime !== 'image/jpeg') { return toBlob(c, 'image/jpeg', 0.8).then(function (j) { return { blob: j, ext: 'jpg', mime: 'image/jpeg', w: c.width, h: c.height }; }); }
          return { blob: b, ext: ext === 'jpeg' ? 'jpg' : ext, mime: mime, w: c.width, h: c.height };
        });
      }
      return mainP.then(function (m) {
        return toBlob(draw(bmp, 600), 'image/jpeg', 0.8).then(function (t) { return { main: m.blob, ext: m.ext, mime: m.mime, thumb: t, w: m.w, h: m.h }; });
      });
    }, function () { throw Object.assign(new Error('bad_image'), { he: 'הקובץ אינו תמונה תקינה' }); });
  }
  // מחזיר { url, path, width, height }
  function uploadImage(file) {
    var ext = extOf(file.name);
    if (IMG_EXT.indexOf(ext) === -1) { return Promise.reject(Object.assign(new Error('type'), { he: 'יש לבחור תמונה JPG, PNG או WEBP' })); }
    return prepareImage(file).then(function (p) {
      var main = new File([p.main], 'img.' + p.ext, { type: p.mime });
      if (main.size > 3 * MB) { throw Object.assign(new Error('size'), { he: 'התמונה גדולה מדי גם אחרי ההקטנה — המקסימום 3MB' }); }
      return store.cms.upload(main, 'image').then(function (r) {
        var base = r.path.replace(/^media\//, '').replace(/\.[a-z0-9]+$/, '');
        var tail = { url: store.cms.publicUrl(r.path), path: r.path, width: p.w, height: p.h };
        if (!p.thumb) { return tail; }
        return store.cms.upload(new File([p.thumb], 'thumb.jpg', { type: 'image/jpeg' }), 'thumb', base).then(function () { return tail; }, function () { return tail; });
      });
    });
  }
  function uploadOther(file, kind) {
    var ext = extOf(file.name), ok = kind === 'audio' ? ext === 'mp3' : ext === 'mp4';
    if (!ok) { return Promise.reject(Object.assign(new Error('type'), { he: kind === 'audio' ? 'יש לבחור קובץ MP3' : 'יש לבחור קובץ MP4' })); }
    if (file.size > 40 * MB) { return Promise.reject(Object.assign(new Error('size'), { he: 'הקובץ גדול מדי — המקסימום 40MB' })); }
    return store.cms.upload(file, kind).then(function (r) { return { url: store.cms.publicUrl(r.path), path: r.path }; });
  }
  var thumbOf = function (url) {
    return /\/site-media\/media\/[^/]+\.(jpg|png|webp)$/.test(url || '') && !/-t\.jpg$/.test(url) ? url.replace(/\.[a-z0-9]+$/, '-t.jpg') : url;
  };
  var imgTag = function (url, alt, cls) {
    if (!url) { return '<span class="adm-muted">—</span>'; }
    var t = thumbOf(url);
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(t) + '"' + (t !== url ? ' data-fb="' + esc(url) + '"' : '') + ' alt="' + esc(alt || '') + '" loading="lazy">';
  };
  var errMsg = function (e, d) { return (e && e.he) ? e.he : d; };

  /* ---------- ניקוי טקסט עשיר (כמו ב-cms-data.js; בנוסף לניקוי בשרת) ---------- */
  var ALLOWED = { B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, UL: 1, OL: 1, LI: 1, P: 1, BDI: 1, SPAN: 1, A: 1 };
  var SAFE_HREF = /^(https:\/\/|\/(?!\/)|mailto:|tel:)/i;
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
  var plain = function (html) { var d = document.createElement('div'); d.innerHTML = cleanRich(String(html || '')); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };

  /* ======================= ניתוב ======================= */
  var curSec = null, curTab = 'list';
  S.render = function (id, container) {
    panel = container;
    var m = byId(id);
    curSec = m;
    if (!m) { panel.innerHTML = ''; return; }
    if (m.special === 'media') { return renderMedia(); }
    if (m.special === 'bin') { return renderBin(); }
    curTab = m.table ? 'list' : 'texts';
    renderSection();
  };
  function renderSection() {
    var m = curSec;
    panel.innerHTML =
      '<div class="ct-bar"><h2 class="adm-h2" id="stTitle" tabindex="-1">' + esc(m.label) + '</h2>' +
        '<button type="button" class="adm-btn ct-big" id="stPreview">תצוגה מקדימה של העמוד ↗</button></div>' +
      (m.table ? '<div class="ct-seg" role="group" aria-label="תצוגה"><button type="button" data-tab="list" aria-pressed="' + (curTab === 'list') + '">' + esc(CFG[m.table].label) + '</button>' +
        '<button type="button" data-tab="texts" aria-pressed="' + (curTab === 'texts') + '">טקסטים ותמונות של העמוד</button></div>' : '') +
      '<div id="stBody"></div>';
    $('stPreview').addEventListener('click', function () { preview(m.file); });
    Array.prototype.forEach.call(panel.querySelectorAll('[data-tab]'), function (b) {
      b.addEventListener('click', function () { curTab = b.getAttribute('data-tab'); renderSection(); var f = panel.querySelector('[data-tab="' + curTab + '"]'); if (f) { f.focus(); } });
    });
    if (curTab === 'list') { renderList(m.table); } else { renderBlocks(m); }
  }
  var bodyEl = function () { return $('stBody'); };

  /* ======================= טקסטים ותמונות של עמוד (page_blocks) ======================= */
  function renderBlocks(m) {
    var pages = [m.page].concat(m.extra || []);
    bodyEl().innerHTML = '<p class="adm-empty adm-card">טוען…</p>';
    Promise.all(pages.map(function (p) { return store.cms.blocks(p); })).then(function (all) {
      var rows = [].concat.apply([], all);
      if (curTab !== 'texts' || !bodyEl()) { return; }
      bodyEl().innerHTML = '<p class="adm-note">הבלוקים לפי הסדר שבו הם מופיעים בעמוד. טקסט שלא נערך נשאר כמו שהוא באתר. שפות אחרות שנשארות ריקות מציגות את התרגום הקיים (ואם אין — עברית).</p>' +
        (rows.length ? '<div class="st-blocks">' + rows.map(blockHtml).join('') + '</div>' : '<p class="adm-empty adm-card">אין בלוקים לעמוד הזה.</p>');
      rows.forEach(function (r) { wireBlock(r); });
    }, function () { bodyEl().innerHTML = '<p class="adm-error">טעינת הבלוקים נכשלה, נסו שוב.</p>'; });
  }
  var blockSnip = function (r) { return r.type === 'image' || r.type === 'video' ? (r.image_alt || r.image_path) : plain(r.value_he); };
  function blockHtml(r) {
    var st = r.status === 'published' ? (r.updated_by ? chip('active', 'נערך ופורסם') : chip('draft', 'מקורי')) : chip('pending', 'טיוטה');
    return '<details class="st-block adm-card" data-id="' + esc(r.id) + '"><summary><span class="st-bk"><bdi>' + esc(r.key) + '</bdi></span>' +
      '<span class="st-bt">' + esc((blockSnip(r) || '—').slice(0, 90)) + '</span>' + st + '</summary><div class="st-bbody" id="bb-' + esc(r.id) + '"></div></details>';
  }
  function wireBlock(r) {
    var d = panel.querySelector('details[data-id="' + r.id + '"]');
    d.addEventListener('toggle', function () { if (d.open && !d.getAttribute('data-init')) { d.setAttribute('data-init', '1'); blockEditor(r, d.querySelector('.st-bbody')); } });
  }
  function toolbar() {
    return '<div class="st-tools" role="toolbar" aria-label="עיצוב טקסט">' +
      '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-cmd="bold" aria-label="מודגש"><b>B</b></button>' +
      '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-cmd="italic" aria-label="נטוי"><i>I</i></button>' +
      '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-cmd="insertUnorderedList" aria-label="רשימה">• רשימה</button>' +
      '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-cmd="link" aria-label="קישור">קישור</button>' +
      '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-cmd="insertLineBreak" aria-label="שורה חדשה">↵ שורה חדשה</button></div>';
  }
  function bindTools(root, area) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-cmd]'), function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        area.focus();
        var cmd = b.getAttribute('data-cmd');
        if (cmd === 'link') {
          var u = window.prompt('כתובת הקישור (https://… או /עמוד.html)', 'https://');
          if (u && SAFE_HREF.test(u)) { document.execCommand('createLink', false, u); } else if (u) { ctx.toast('הקישור חייב להתחיל ב-https:// או / או mailto: או tel:'); }
        } else { document.execCommand(cmd, false, null); }
        area.dispatchEvent(new Event('input'));
      });
    });
  }
  function blockEditor(r, box) {
    var isImg = r.type === 'image' || r.type === 'video', rich = r.type === 'rich';
    var fid = 'bk' + r.id.slice(0, 8);
    var fieldFor = function (lang, label, val) {
      var id = fid + '_' + lang;
      return '<div class="adm-field" data-fe-host><label for="' + id + '">' + label + '</label>' +
        (rich ? '<div id="' + id + '" class="st-rich adm-input" contenteditable="true" role="textbox" aria-multiline="true" dir="' + (lang === 'he' ? 'rtl' : 'ltr') + '">' + cleanRich(val || '') + '</div>'
          : '<textarea id="' + id + '" class="adm-input" rows="3" dir="' + (lang === 'he' ? 'rtl' : 'ltr') + '">' + esc(plainText(val)) + '</textarea>') + '</div>';
    };
    var html;
    if (isImg) {
      html = '<div class="st-img" id="' + fid + '_img" data-src="' + esc(r.image_path || '') + '">' + imgField(r.image_path, r.image_alt, fid) + '</div>';
    } else {
      html = (rich ? toolbar() : '') + fieldFor('he', 'עברית *', r.value_he) +
        '<details class="st-tr"><summary>תרגומים (לא חובה)</summary>' + LANGS.map(function (l) { return fieldFor(l[0], l[1], r['value_' + l[0]]); }).join('') + '</details>' +
        '<div class="st-prev"><p class="adm-note">תצוגה מקדימה</p><div class="st-prev-box" id="' + fid + '_pv"></div></div>';
    }
    box.innerHTML = '<form class="adm-form" novalidate>' + html + '<p class="adm-error" role="alert" hidden></p>' +
      '<div class="adm-form-actions"><button type="submit" class="adm-btn adm-btn-primary" data-mode="published">פרסום</button>' +
      '<button type="submit" class="adm-btn" data-mode="draft">שמירה כטיוטה</button>' +
      '<button type="button" class="adm-btn adm-btn-ghost" data-ver>גרסאות</button></div></form>';
    var form = box.querySelector('form'), err = form.querySelector('.adm-error'), get = {};
    if (isImg) { get.img = wireImg($(fid + '_img'), fid); }
    else {
      ['he', 'en', 'ru', 'fr'].forEach(function (l) {
        var el = $(fid + '_' + l);
        get[l] = function () { return rich ? cleanRich(el.innerHTML).replace(/^(<br>)+|(<br>)+$/g, '').trim() : el.value.trim(); };
      });
      var pv = function () { var v = get.he(); $(fid + '_pv').innerHTML = rich ? cleanRich(v) : esc(v).replace(/\n/g, '<br>'); };
      $(fid + '_he').addEventListener('input', pv); pv();
      if (rich) { bindTools(box, $(fid + '_he')); }
    }
    box.querySelector('[data-ver]').addEventListener('click', function () { versionsDialog('page_blocks', r.id, r.key, function (row) { r = row; box.innerHTML = ''; d_reopen(r, box); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mode = (e.submitter && e.submitter.getAttribute('data-mode')) || 'published';
      err.hidden = true;
      var patch = { status: mode };
      if (isImg) {
        var v = get.img();
        if (!v.src) { FE.set($(fid + '_img').querySelector('input[type=file]'), 'יש לבחור תמונה'); return; }
        if (!v.alt) { FE.set($(fid + '_alt'), 'יש למלא תיאור לתמונה (alt)'); FE.jump($(fid + '_alt')); return; }
        patch.image_path = v.src; patch.image_alt = v.alt;
      } else {
        if (!get.he()) { FE.set($(fid + '_he'), 'יש למלא את הטקסט בעברית'); FE.jump($(fid + '_he')); return; }
        patch.value_he = get.he(); ['en', 'ru', 'fr'].forEach(function (l) { patch['value_' + l] = get[l]() || null; });
      }
      var btns = form.querySelectorAll('button[type=submit]');
      btns.forEach(function (b) { b.disabled = true; });
      store.cms.update('page_blocks', r.id, patch).then(function (row) {
        Object.assign(r, row);
        ctx.toast(mode === 'published' ? 'פורסם ✓ (יופיע באתר תוך עד 10 דקות לגולשים שכבר גלשו)' : 'נשמר כטיוטה ✓');
        var sm = panel.querySelector('details[data-id="' + r.id + '"] summary');
        if (sm) { sm.querySelector('.st-bt').textContent = (blockSnip(r) || '—').slice(0, 90); var c = sm.querySelector('.adm-chip'); if (c) { c.outerHTML = r.status === 'published' ? chip('active', 'נערך ופורסם') : chip('pending', 'טיוטה'); } }
      }, function (er) { err.textContent = errMsg(er, 'השמירה נכשלה, נסו שוב'); err.hidden = false; })
        .then(function () { btns.forEach(function (b) { b.disabled = false; }); });
    });
  }
  function d_reopen(r, box) { blockEditor(r, box); }
  // DOMParser: מסמך מנותק — שום תג לא נטען ולא רץ
  function plainText(v) { return new DOMParser().parseFromString(String(v || '').replace(/<br\s*\/?>/gi, '\n'), 'text/html').body.textContent || ''; }

  /* ======================= שדה תמונה (העלאה + alt חובה) ======================= */
  function imgField(src, alt, id) {
    return '<div class="st-img-prev" id="' + id + '_pv">' + (src ? imgTag(src, alt) : '<span class="adm-muted">אין תמונה</span>') + '</div>' +
      '<div class="adm-field" data-fe-host><label class="ct-drop" id="' + id + '_drop"><strong>גררו תמונה לכאן, או לחצו לבחירה</strong><span>JPG, PNG או WEBP — תוקטן אוטומטית</span><span class="ct-drop-name" id="' + id + '_nm"></span>' +
      '<input type="file" id="' + id + '_file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"></label></div>' +
      '<div class="adm-field" data-fe-host><label for="' + id + '_alt">תיאור התמונה לקוראי מסך (alt) *</label><input id="' + id + '_alt" class="adm-input" maxlength="200" value="' + esc(alt || '') + '"></div>';
  }
  // מחבר את שדה התמונה (העלאה מיידית עם בחירה); מחזיר get() → { src, alt, width, height }
  function wireImg(box, id) {
    var st = { src: box.getAttribute('data-src') || '', width: null, height: null };
    var file = $(id + '_file'), drop = $(id + '_drop');
    function pick(f) {
      if (!f) { return; }
      $(id + '_nm').textContent = 'מעלה…';
      uploadImage(f).then(function (r) {
        st.src = r.url; st.width = r.width; st.height = r.height;
        $(id + '_pv').innerHTML = imgTag(r.url, '');
        $(id + '_nm').textContent = '✓ ' + f.name;
        FE.clear(file);
      }, function (e) { $(id + '_nm').textContent = ''; FE.set(file, errMsg(e, 'ההעלאה נכשלה, נסו שוב')); });
    }
    file.addEventListener('change', function () { pick(this.files[0]); this.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { pick(e.dataTransfer && e.dataTransfer.files[0]); });
    return function () { return { src: st.src, alt: $(id + '_alt').value.trim(), width: st.width, height: st.height }; };
  }

  /* ======================= רשימות (טבלאות) ======================= */
  // t: text | textarea | number | lines | select | url | date | bool | image | gallery | media | slug
  // tr: מפתח התרגום ב-i18n (אותם מפתחות כמו ב-js/cms-data.js)
  var SECTORS = [['private', 'מגזר פרטי'], ['business-private', 'עסקי — פרטי'], ['business-public', 'עסקי — ציבורי']];
  var CFG = {
    podcast_episodes: { label: 'פרקי פודקאסט', one: 'פרק', title: function (r) { return r.title_he; }, sub: function (r) { return 'פרק ' + r.number + (r.minutes ? ' · ' + r.minutes + ' דק׳' : ''); }, img: function (r) { return r.cover_path; },
      slug: function (v) { return 'ep-' + v.number; },
      fields: [
        { k: 'number', t: 'number', label: 'מספר פרק', req: 1, min: 1 }, { k: 'minutes', t: 'number', label: 'אורך בדקות', min: 0 },
        { k: 'title_he', t: 'text', label: 'כותרת הפרק', req: 1, max: 200, tr: 'title' }, { k: 'guest_he', t: 'text', label: 'האורח/ת', tr: 'guest' },
        { k: 'description_he', t: 'textarea', label: 'תיאור קצר', tr: 'desc' }, { k: 'points_he', t: 'lines', label: '"בפרק:" — נקודה בכל שורה', tr: 'points' },
        { k: 'cover_path', t: 'image', alt: 'cover_alt', label: 'תמונת שער' }, { k: 'video_url', t: 'url', label: 'קישור וידאו (YouTube / Vimeo / mp4)', hint: 'חייב להתחיל ב-https://' },
        { k: 'audio_path', t: 'media', kind: 'audio', label: 'קובץ שמע (mp3)' }, { k: 'published_on', t: 'date', label: 'תאריך פרסום' }] },
    projects: { label: 'פרויקטים ולקוחות', one: 'פרויקט', title: function (r) { return r.client_name_he; }, sub: function (r) { return (SECTORS.filter(function (s) { return s[0] === r.sector; })[0] || ['', ''])[1] + (r.city_he ? ' · ' + r.city_he : ''); },
      img: function (r) { var g = r.gallery && r.gallery[0]; return g ? g.src : ''; },
      fields: [
        { k: 'slug', t: 'slug', label: 'מזהה באנגלית (לכתובת הדף)', req: 1 },
        { k: 'client_name_he', t: 'text', label: 'שם הלקוח', req: 1, max: 200, tr: 'name' }, { k: 'sector', t: 'select', label: 'מגזר', req: 1, options: SECTORS },
        { k: 'city_he', t: 'text', label: 'עיר' }, { k: 'subtitle_he', t: 'text', label: 'כותרת משנה' },
        { k: 'title_he', t: 'text', label: 'שורת הפרויקט הראשית', tr: 'title' }, { k: 'items_he', t: 'lines', label: 'רשימת עבודות — נקודה בכל שורה', tr: 'items' },
        { k: 'description_he', t: 'textarea', label: 'תיאור חופשי' }, { k: 'gallery', t: 'gallery', label: 'גלריית תמונות', alt: 'alt' }] },
    in_progress: { label: 'פרויקטים בביצוע', one: 'פרויקט', title: function (r) { return r.name_he; }, sub: function (r) { return r.progress + '% · ' + (r.location_he || ''); }, img: function (r) { return r.image_path; },
      slug: function () { return 'in-progress-' + Date.now().toString(36); },
      fields: [
        { k: 'name_he', t: 'text', label: 'שם הפרויקט', req: 1, max: 200 }, { k: 'location_he', t: 'text', label: 'מיקום' },
        { k: 'progress', t: 'number', label: 'אחוז התקדמות', req: 1, min: 0, max: 100 }, { k: 'image_path', t: 'image', alt: 'image_alt', label: 'תמונת הכרטיס' },
        { k: 'title_he', t: 'text', label: 'שורת הפרויקט הראשית' }, { k: 'items_he', t: 'lines', label: 'רשימת עבודות — נקודה בכל שורה' },
        { k: 'gallery', t: 'gallery', label: 'גלריית תמונות', alt: 'alt' }] },
    partners: { label: 'שותפים', one: 'שותף / קטגוריה', title: function (r) { return r.title_he; }, sub: function (r) { return r.slogan_he || ''; }, img: function (r) { return r.image_path; },
      fields: [
        { k: 'slug', t: 'slug', label: 'מזהה באנגלית (data-slug)', req: 1 },
        { k: 'title_he', t: 'text', label: 'שם הקטגוריה / השותף', req: 1, max: 200, tr: 'title' }, { k: 'slogan_he', t: 'text', label: 'סלוגן', tr: 'slogan' },
        { k: 'image_path', t: 'image', alt: 'image_alt', label: 'תמונת הכרטיס' }, { k: 'link_page', t: 'text', label: 'עמוד קישור (למשל partners-kitchens.html)' },
        { k: 'photos', t: 'gallery', label: 'תמונות בחלון הכרטיס', alt: 'alt' }, { k: 'content_he', t: 'textarea', label: 'טקסט בחלון הכרטיס' }] },
    info_articles: { label: 'מאמרי "מידע לאזרח"', one: 'מאמר', title: function (r) { return r.title_he; }, sub: function (r) { return plain(r.card_text_he).slice(0, 60); }, img: function (r) { return r.image_path; },
      slug: function () { return 'info-' + Date.now().toString(36); },
      fields: [
        { k: 'title_he', t: 'text', label: 'כותרת', req: 1, max: 300, tr: 'title' }, { k: 'card_text_he', t: 'textarea', label: 'טקסט הכרטיס (משפט אחד)', tr: 'teaser' },
        { k: 'intro_he', t: 'textarea', label: 'פסקת פתיחה', tr: 'intro' }, { k: 'bullets_he', t: 'lines', label: '"מה חשוב לדעת" — נקודה בכל שורה', tr: 'bullets' },
        { k: 'tip_he', t: 'textarea', label: 'טיפ GAD MIVNIM', tr: 'tip' }, { k: 'image_path', t: 'image', alt: 'image_alt', label: 'תמונה (לא חובה)' }] },
    job_roles: { label: 'משרות ותפקידים', one: 'תפקיד', title: function (r) { return r.title_he; }, sub: function (r) { return r.active ? 'פעיל' : 'כבוי'; }, img: function () { return ''; },
      fields: [
        { k: 'slug', t: 'slug', label: 'מזהה (r5, r6 ...)', req: 1 },
        { k: 'title_he', t: 'text', label: 'שם התפקיד', req: 1, max: 200, tr: 'title' }, { k: 'subtitle_he', t: 'text', label: 'משפט בכרטיס', tr: 'subtitle' },
        { k: 'intro_he', t: 'textarea', label: 'שורת פתיחה', tr: 'intro' }, { k: 'requirements_he', t: 'lines', label: 'דרישות התפקיד — שורה לכל דרישה', tr: 'req' },
        { k: 'advantages_he', t: 'lines', label: 'יתרון — שורה לכל יתרון', tr: 'adv' }, { k: 'offer_he', t: 'lines', label: 'מה אנחנו מציעים — שורה לכל נקודה', tr: 'offer' },
        { k: 'active', t: 'bool', label: 'התפקיד פעיל (מוצג באתר)' }] },
    gallery_items: { label: 'תמונות הגלריה', one: 'תמונה', title: function (r) { return r.alt_text; }, sub: function (r) { return r.category || ''; }, img: function (r) { return r.image_path; },
      slug: function () { return 'g-' + Date.now().toString(36); },
      fields: [{ k: 'image_path', t: 'image', alt: 'alt_text', label: 'תמונה', req: 1 }, { k: 'category', t: 'text', label: 'שייכת לפרויקט (מזהה, לא חובה)' }] }
  };
  S.CFG = CFG;

  var rowsCache = [];
  function renderList(table) {
    var cfg = CFG[table];
    bodyEl().innerHTML = '<p class="adm-empty adm-card">טוען…</p>';
    store.cms.list(table).then(function (rows) {
      rowsCache = rows;
      if (curTab !== 'list' || !bodyEl()) { return; }
      drawList(table);
    }, function () { bodyEl().innerHTML = '<p class="adm-error">טעינת הרשימה נכשלה, נסו שוב.</p>'; });
    function drawList(t) {
      var rows = rowsCache;
      bodyEl().innerHTML =
        '<div class="ct-bar"><p class="adm-note">גרירה (⠿) או החצים ↑↓ משנים את הסדר באתר. "ביטול פרסום" מסתיר את הפריט מהגולשים בלי למחוק.</p>' +
        '<button type="button" class="adm-btn adm-btn-primary ct-big" id="stAdd">+ הוספת ' + esc(cfg.one) + '</button></div>' +
        (rows.length ? '<ul class="st-list" id="stList">' + rows.map(function (r, i) {
          return '<li class="st-row adm-card" data-id="' + esc(r.id) + '" draggable="true"><span class="st-grip" aria-hidden="true" title="גרירה">⠿</span>' +
            '<span class="st-thumb">' + imgTag(cfg.img(r), '') + '</span>' +
            '<span class="st-main"><strong>' + esc(cfg.title(r) || '—') + '</strong><span class="adm-muted">' + esc(cfg.sub(r) || '') + '</span></span>' +
            '<span class="st-stat">' + (r.status === 'published' ? chip('active', 'פורסם') : chip('pending', 'טיוטה')) + '</span>' +
            '<span class="adm-acts">' +
              '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-act="up" aria-label="העלאה למעלה"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
              '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-act="down" aria-label="הורדה למטה"' + (i === rows.length - 1 ? ' disabled' : '') + '>↓</button>' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="edit">עריכה</button>' +
              '<button type="button" class="adm-btn adm-btn-sm" data-act="toggle">' + (r.status === 'published' ? 'ביטול פרסום' : 'פרסום') + '</button>' +
              '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-act="delete">מחיקה</button></span></li>';
        }).join('') + '</ul>' : '<p class="adm-empty adm-card">אין פריטים עדיין. לחצו על "הוספה".</p>');
      $('stAdd').addEventListener('click', function () { itemForm(table, null); });
    }
    bodyEl().onclick = function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) { return; }
      var li = b.closest('.st-row'), id = li.getAttribute('data-id'), r = rowsCache.filter(function (x) { return x.id === id; })[0];
      var act = b.getAttribute('data-act');
      if (act === 'edit') { itemForm(table, r); }
      else if (act === 'toggle') {
        b.disabled = true;
        store.cms.update(table, id, { status: r.status === 'published' ? 'draft' : 'published' }).then(function (row) { Object.assign(r, row); ctx.toast(r.status === 'published' ? 'פורסם ✓' : 'הפרסום בוטל'); drawList(table); }, function () { b.disabled = false; ctx.toast('הפעולה נכשלה, נסו שוב'); });
      } else if (act === 'delete') {
        ctx.confirmBox('מחיקה', 'להעביר את "' + (cfg.title(r) || '') + '" לסל המחזור? אפשר לשחזר אותו במשך 30 יום.', 'העברה לסל', true).then(function (yes) {
          if (!yes) { return; }
          store.cms.trash(table, id).then(function () { rowsCache = rowsCache.filter(function (x) { return x.id !== id; }); ctx.toast('הועבר לסל המחזור'); drawList(table); }, function () { ctx.toast('המחיקה נכשלה, נסו שוב'); });
        });
      } else if (act === 'up' || act === 'down') {
        var i = rowsCache.indexOf(r), j = act === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= rowsCache.length) { return; }
        rowsCache.splice(j, 0, rowsCache.splice(i, 1)[0]);
        saveOrder(table, drawList, id, act);
      }
    };
    var dragId = null;
    bodyEl().ondragstart = function (e) { var li = e.target.closest && e.target.closest('.st-row'); if (!li) { return; } dragId = li.getAttribute('data-id'); li.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) { /* ignore */ } };
    bodyEl().ondragover = function (e) { if (dragId && e.target.closest('.st-row')) { e.preventDefault(); } };
    bodyEl().ondrop = function (e) {
      var li = e.target.closest && e.target.closest('.st-row');
      if (!dragId || !li) { return; }
      e.preventDefault();
      var ids = rowsCache.map(function (x) { return x.id; }), from = ids.indexOf(dragId), to = ids.indexOf(li.getAttribute('data-id'));
      dragId = null;
      if (from < 0 || to < 0 || from === to) { drawList(table); return; }
      rowsCache.splice(to, 0, rowsCache.splice(from, 1)[0]);
      saveOrder(table, drawList);
    };
    bodyEl().ondragend = function () { dragId = null; var d = bodyEl().querySelector('.is-dragging'); if (d) { d.classList.remove('is-dragging'); } };
  }
  function saveOrder(table, draw, focusId, act) {
    draw(table);
    if (focusId) { var nb = bodyEl().querySelector('[data-id="' + focusId + '"] [data-act="' + act + '"]'); if (nb && !nb.disabled) { nb.focus(); } else { var o = bodyEl().querySelector('[data-id="' + focusId + '"] [data-act="edit"]'); if (o) { o.focus(); } } }
    store.cms.reorder(table, rowsCache.map(function (x) { return x.id; })).then(function () { ctx.toast('הסדר נשמר'); }, function () { ctx.toast('שמירת הסדר נכשלה'); renderList(table); });
  }

  /* ---------- טופס פריט ---------- */
  var slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  function itemForm(table, row) {
    var cfg = CFG[table], isNew = !row, v = row || {}, fid = 'it', tr = (v.i18n || {});
    var fields = cfg.fields.filter(function (f) { return f.t !== 'slug' || isNew; });
    var html = '<form id="itForm" class="adm-form ct-form" novalidate><h3 class="adm-h2">' + (isNew ? 'הוספת ' : 'עריכת ') + esc(cfg.one) + '</h3>';
    var trFields = [];
    fields.forEach(function (f) {
      var id = fid + '_' + f.k, val = v[f.k];
      if (f.t === 'text' || f.t === 'url' || f.t === 'slug') {
        html += '<div class="adm-field" data-fe-host><label for="' + id + '">' + esc(f.label) + (f.req ? ' *' : '') + '</label><input id="' + id + '" class="adm-input" ' + (f.t !== 'text' ? 'dir="ltr" ' : '') + 'maxlength="' + (f.max || 500) + '" value="' + esc(val == null ? '' : val) + '">' + (f.hint ? '<span class="adm-note">' + esc(f.hint) + '</span>' : '') + '</div>';
      } else if (f.t === 'textarea') {
        html += '<div class="adm-field" data-fe-host><label for="' + id + '">' + esc(f.label) + '</label><textarea id="' + id + '" class="adm-input" rows="4">' + esc(val || '') + '</textarea></div>';
      } else if (f.t === 'lines') {
        html += '<div class="adm-field" data-fe-host><label for="' + id + '">' + esc(f.label) + '</label><textarea id="' + id + '" class="adm-input" rows="4">' + esc((val || []).join('\n')) + '</textarea></div>';
      } else if (f.t === 'number') {
        html += '<div class="adm-field" data-fe-host><label for="' + id + '">' + esc(f.label) + (f.req ? ' *' : '') + '</label><input type="number" id="' + id + '" class="adm-input" ' + (f.min != null ? 'min="' + f.min + '" ' : '') + (f.max != null ? 'max="' + f.max + '" ' : '') + 'value="' + esc(val == null ? '' : val) + '"></div>';
      } else if (f.t === 'date') {
        html += '<div class="adm-field" data-fe-host><label for="' + id + '">' + esc(f.label) + '</label><input type="date" id="' + id + '" class="adm-input" value="' + esc(val || '') + '"></div>';
      } else if (f.t === 'select') {
        html += '<div class="adm-field" data-fe-host><label for="' + id + '">' + esc(f.label) + (f.req ? ' *' : '') + '</label><select id="' + id + '" class="adm-input"><option value="">בחרו…</option>' +
          f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
      } else if (f.t === 'bool') {
        html += '<label class="adm-switch adm-switch-lg"><input type="checkbox" id="' + id + '"' + (val === false ? '' : ' checked') + '><span>' + esc(f.label) + '</span></label>';
      } else if (f.t === 'image') {
        html += '<fieldset class="st-fs"><legend>' + esc(f.label) + (f.req ? ' *' : '') + '</legend><div class="st-img" id="' + id + '_box" data-src="' + esc(val || '') + '">' + imgField(val, v[f.alt], id) + '</div></fieldset>';
      } else if (f.t === 'media') {
        html += '<div class="adm-field" data-fe-host><label for="' + id + '_file">' + esc(f.label) + '</label><div class="st-media" id="' + id + '_box" data-src="' + esc(val || '') + '">' +
          '<span class="adm-muted" id="' + id + '_cur">' + (val ? 'קובץ נוכחי: ' + esc(val.split('/').pop()) : 'אין קובץ') + '</span>' +
          '<input type="file" id="' + id + '_file" accept=".mp3,audio/mpeg"><button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" id="' + id + '_rm"' + (val ? '' : ' hidden') + '>הסרה</button></div></div>';
      } else if (f.t === 'gallery') {
        html += '<fieldset class="st-fs"><legend>' + esc(f.label) + '</legend><div id="' + id + '_box"><ul class="st-gal" id="' + id + '_list"></ul>' +
          '<label class="adm-btn adm-btn-sm" for="' + id + '_add" tabindex="0" id="' + id + '_addl">+ הוספת תמונות</label><input type="file" id="' + id + '_add" multiple hidden accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"></div></fieldset>';
      }
      if (f.tr) { trFields.push(f); }
    });
    if (trFields.length) {
      html += '<details class="st-tr"><summary>תרגומים (לא חובה) — אם נשאר ריק יוצג התרגום הקיים, ואם אין — עברית</summary>' +
        LANGS.map(function (l) {
          return '<fieldset class="st-fs"><legend>' + l[1] + '</legend>' + trFields.map(function (f) {
            var cur = (tr[l[0]] || {})[f.tr], multi = f.t === 'lines';
            return '<div class="adm-field"><label for="tr_' + l[0] + '_' + f.k + '">' + esc(f.label.replace(/ — .*$/, '')) + '</label>' +
              (f.t === 'textarea' || multi ? '<textarea id="tr_' + l[0] + '_' + f.k + '" class="adm-input" dir="ltr" rows="3">' + esc(multi ? (cur || []).join('\n') : (cur || '')) + '</textarea>'
                : '<input id="tr_' + l[0] + '_' + f.k + '" class="adm-input" dir="ltr" value="' + esc(cur || '') + '">') + '</div>';
          }).join('') + '</fieldset>';
        }).join('') + '</details>';
    }
    html += '<p class="adm-error" id="itErr" role="alert" hidden></p><div class="ct-sticky">' +
      '<button type="submit" class="adm-btn adm-btn-primary ct-big" data-mode="published">פרסום</button>' +
      '<button type="submit" class="adm-btn ct-big" data-mode="draft">שמירה כטיוטה</button>' +
      '<button type="button" class="adm-btn ct-big" id="itPrev">שמירה כטיוטה ותצוגה מקדימה ↗</button>' +
      (isNew ? '' : '<button type="button" class="adm-btn adm-btn-ghost ct-big" id="itVer">גרסאות</button>') +
      '<button type="button" class="adm-btn adm-btn-ghost ct-big" id="itCancel">ביטול</button></div></form>';
    bodyEl().innerHTML = html;

    // --- חיבור שדות מורכבים ---
    var getters = {};
    fields.forEach(function (f) {
      var id = fid + '_' + f.k;
      if (f.t === 'image') { getters[f.k] = wireImg($(id + '_box'), id); }
      else if (f.t === 'media') {
        var box = $(id + '_box'), st = { src: box.getAttribute('data-src') || '' };
        $(id + '_file').addEventListener('change', function () {
          var file = this.files[0]; this.value = '';
          if (!file) { return; }
          $(id + '_cur').textContent = 'מעלה…';
          uploadOther(file, f.kind).then(function (r) { st.src = r.url; $(id + '_cur').textContent = '✓ ' + file.name; $(id + '_rm').hidden = false; FE.clear($(id + '_file')); },
            function (e) { $(id + '_cur').textContent = st.src ? 'קובץ נוכחי: ' + st.src.split('/').pop() : 'אין קובץ'; FE.set($(id + '_file'), errMsg(e, 'ההעלאה נכשלה, נסו שוב')); });
        });
        $(id + '_rm').addEventListener('click', function () { st.src = ''; $(id + '_cur').textContent = 'אין קובץ'; this.hidden = true; });
        getters[f.k] = function () { return st.src; };
      } else if (f.t === 'gallery') { getters[f.k] = wireGallery(id, v[f.k] || []); }
    });
    var go = function (mode, thenPreview) { submit(mode, thenPreview); };
    $('itCancel').addEventListener('click', function () { renderList(table); });
    if ($('itVer')) { $('itVer').addEventListener('click', function () { versionsDialog(table, row.id, cfg.title(row), function (rest) { Object.assign(row, rest); itemForm(table, row); }); }); }
    $('itPrev').addEventListener('click', function () { go('draft', true); });
    $('itForm').addEventListener('submit', function (e) { e.preventDefault(); go((e.submitter && e.submitter.getAttribute('data-mode')) || 'published'); });

    // --- בדיקות ---
    var rules = [];
    fields.forEach(function (f) {
      var id = fid + '_' + f.k;
      if (f.t === 'slug') { rules.push({ el: $(id), check: function () { var s = $(id).value.trim().toLowerCase(); return !s ? 'יש למלא מזהה' : (slugOk.test(s) ? '' : 'באנגלית קטנה, ספרות ומקפים בלבד'); } }); }
      else if (f.t === 'text' && f.req) { rules.push({ el: $(id), check: function () { return $(id).value.trim() ? '' : 'יש למלא ' + f.label; } }); }
      else if (f.t === 'number') { rules.push({ el: $(id), check: function () {
        var s = $(id).value; if (s === '') { return f.req ? 'יש למלא ' + f.label : ''; }
        var n = Number(s); return (isNaN(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) ? f.label + ' לא תקין' : ''; } }); }
      else if (f.t === 'select' && f.req) { rules.push({ el: $(id), check: function () { return $(id).value ? '' : 'יש לבחור ' + f.label; } }); }
      else if (f.t === 'url') { rules.push({ el: $(id), check: function () { var s = $(id).value.trim(); return !s || /^https:\/\/[^\s]+$/i.test(s) || /^(images|video)\/[^\s]+$/.test(s) ? '' : 'הקישור חייב להתחיל ב-https://'; } }); }
      else if (f.t === 'image') { rules.push({ el: $(id + '_file'), check: function () { var g = getters[f.k](); return f.req && !g.src ? 'יש לבחור תמונה' : ''; } },
        { el: $(id + '_alt'), check: function () { var g = getters[f.k](); return g.src && !g.alt ? 'יש למלא תיאור לתמונה (alt)' : ''; } }); }
    });
    var fe = FE.attach($('itForm'), rules);

    function readTr() {
      var out = JSON.parse(JSON.stringify(row ? (row.i18n || {}) : {}));
      LANGS.forEach(function (l) {
        out[l[0]] = out[l[0]] || {};
        trFields.forEach(function (f) {
          var el = $('tr_' + l[0] + '_' + f.k), raw = el ? el.value.trim() : '';
          if (f.t === 'lines') { var arr = raw.split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); if (arr.length) { out[l[0]][f.tr] = arr; } else { delete out[l[0]][f.tr]; } }
          else if (raw) { out[l[0]][f.tr] = raw; } else { delete out[l[0]][f.tr]; }
        });
        if (!Object.keys(out[l[0]]).length) { delete out[l[0]]; }
      });
      return out;
    }
    function submit(mode, thenPreview) {
      $('itErr').hidden = true;
      if (!fe.check()) { return; }
      var patch = { status: mode };
      try {
      fields.forEach(function (f) {
        var id = fid + '_' + f.k;
        if (f.t === 'text' || f.t === 'url' || f.t === 'textarea') { patch[f.k] = $(id).value.trim() || null; }
        else if (f.t === 'slug') { patch.slug = $(id).value.trim().toLowerCase(); }
        else if (f.t === 'lines') { patch[f.k] = $(id).value.split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
        else if (f.t === 'number') { patch[f.k] = $(id).value === '' ? null : Number($(id).value); }
        else if (f.t === 'date') { patch[f.k] = $(id).value || null; }
        else if (f.t === 'select') { patch[f.k] = $(id).value; }
        else if (f.t === 'bool') { patch[f.k] = $(id).checked; }
        else if (f.t === 'image') { var g = getters[f.k](); patch[f.k] = g.src || null; patch[f.alt] = g.src ? g.alt : null; if (table === 'gallery_items') { patch.width = g.width; patch.height = g.height; } }
        else if (f.t === 'media') { patch[f.k] = getters[f.k]() || null; }
        else if (f.t === 'gallery') { patch[f.k] = getters[f.k](); }
      });
      } catch (er) { if (er && er.message === 'alt') { return; } throw er; }
      if (trFields.length) { patch.i18n = readTr(); }
      if (table === 'gallery_items' && patch.alt_text == null) { patch.alt_text = ''; }
      var btns = $('itForm').querySelectorAll('button[type=submit], #itPrev');
      btns.forEach(function (b) { b.disabled = true; });
      var req;
      if (isNew) {
        patch.slug = patch.slug || cfg.slug(patch);
        if (table === 'projects') { patch.logo = ''; }                  // פרויקט חדש: בלי קובץ לוגו (כמו שיש בפרויקטים בלי לוגו)
        patch.sort_order = rowsCache.reduce(function (m, x) { return Math.max(m, x.sort_order || 0); }, 0) + 1;
        patch.updated_by = ctx.me.id;
        req = store.cms.insert(table, patch);
      } else { req = store.cms.update(table, row.id, patch); }
      req.then(function (saved) {
        ctx.toast(mode === 'published' ? 'פורסם ✓' : 'נשמר כטיוטה ✓');
        if (thenPreview) { row = saved; isNew = false; preview(curSec.file); btns.forEach(function (b) { b.disabled = false; }); return; }
        return store.cms.list(table).then(function (rows) { rowsCache = rows; renderList(table); });
      }, function (er) {
        btns.forEach(function (b) { b.disabled = false; });
        var dup = er && (er.code === '23505' || /duplicate/i.test(er.message || ''));
        if (dup && $(fid + '_slug')) { FE.set($(fid + '_slug'), 'המזהה הזה כבר קיים — בחרו אחר'); FE.jump($(fid + '_slug')); return; }
        $('itErr').textContent = dup ? 'פריט עם אותו מספר/מזהה כבר קיים' : errMsg(er, 'השמירה נכשלה, נסו שוב'); $('itErr').hidden = false;
      });
    }
  }

  // גלריה: רשימת תמונות עם alt לכל אחת, סידור, הסרה, והוספה מרובה
  function wireGallery(id, initial) {
    var items = initial.map(function (g) { return { src: g.src, alt: g.alt || '', width: g.width || null, height: g.height || null }; });
    var list = $(id + '_list');
    function draw() {
      list.innerHTML = items.map(function (g, i) {
        return '<li class="st-gi" data-i="' + i + '"><span class="st-gi-t">' + imgTag(g.src, '') + '</span>' +
          '<div class="adm-field" data-fe-host><label for="' + id + '_a' + i + '">תיאור (alt) *</label><input id="' + id + '_a' + i + '" class="adm-input" maxlength="200" value="' + esc(g.alt) + '"></div>' +
          '<span class="adm-acts"><button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-g="up" aria-label="למעלה"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" data-g="down" aria-label="למטה"' + (i === items.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-g="rm" aria-label="הסרה">הסרה</button></span></li>';
      }).join('');
      items.forEach(function (g, i) { $(id + '_a' + i).addEventListener('input', function () { g.alt = this.value.trim(); FE.clear(this); }); });
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]');
      if (!b) { return; }
      var i = parseInt(b.closest('.st-gi').getAttribute('data-i'), 10), a = b.getAttribute('data-g');
      if (a === 'rm') { items.splice(i, 1); } else { var j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= items.length) { return; } items.splice(j, 0, items.splice(i, 1)[0]); }
      draw();
    });
    $(id + '_addl').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(id + '_add').click(); } });
    $(id + '_add').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files); this.value = '';
      files.reduce(function (p, f) {
        return p.then(function () {
          ctx.toast('מעלה ' + f.name + '…');
          return uploadImage(f).then(function (r) { items.push({ src: r.url, alt: '', width: r.width, height: r.height }); draw(); },
            function (e) { ctx.toast(f.name + ': ' + errMsg(e, 'ההעלאה נכשלה')); });
        });
      }, Promise.resolve());
    });
    draw();
    // הערה: שדה alt ריק בגלריה נבדק בשמירה
    return function () {
      var bad = -1;
      items.forEach(function (g, i) { if (!g.alt && bad < 0) { bad = i; } });
      if (bad >= 0) { var el = $(id + '_a' + bad); FE.set(el, 'יש למלא תיאור לתמונה (alt)'); FE.jump(el); throw new Error('alt'); }
      return items.map(function (g) { var o = { src: g.src, alt: g.alt }; if (g.width) { o.width = g.width; } if (g.height) { o.height = g.height; } return o; });
    };
  }

  /* ======================= היסטוריית גרסאות ======================= */
  var SKIP = ['id', 'created_at', 'updated_at', 'updated_by', 'deleted_at'];
  function versionsDialog(table, id, name, onRestore) {
    ctx.openModal('גרסאות — ' + name, '<p class="adm-empty">טוען…</p>');
    store.cms.versions(table, id).then(function (vs) {
      var box = $('ctModalBody');
      if (!vs.length) { box.innerHTML = '<p class="adm-empty">אין גרסאות קודמות עדיין. כל שמירה תישמר כאן.</p>'; return; }
      box.innerHTML = '<p class="adm-note">כל שמירה שומרת את המצב הקודם. "שחזור גרסה" מחזיר אותו (והמצב הנוכחי נשמר גם הוא כגרסה).</p><ul class="st-vers">' + vs.map(function (v, i) {
        var s = v.snapshot || {}, label = s.title_he || s.client_name_he || s.name_he || s.value_he || s.image_alt || s.alt_text || s.key || '';
        return '<li class="adm-card"><div><strong>' + esc(new Date(v.saved_at).toLocaleString('he-IL')) + '</strong><span class="adm-muted">' + esc(plain(label).slice(0, 80)) + '</span></div>' +
          '<button type="button" class="adm-btn adm-btn-sm" data-v="' + i + '">שחזור גרסה</button></li>';
      }).join('') + '</ul>';
      box.onclick = function (e) {
        var b = e.target.closest('[data-v]');
        if (!b) { return; }
        var snap = JSON.parse(JSON.stringify(vs[parseInt(b.getAttribute('data-v'), 10)].snapshot)), patch = {};
        Object.keys(snap).forEach(function (k) { if (SKIP.indexOf(k) === -1) { patch[k] = snap[k]; } });
        b.disabled = true;
        store.cms.update(table, id, patch).then(function (row) { ctx.closeModal(); ctx.toast('הגרסה שוחזרה ✓'); if (onRestore) { onRestore(row); } },
          function () { b.disabled = false; ctx.toast('השחזור נכשל, נסו שוב'); });
      };
    }, function () { $('ctModalBody').innerHTML = '<p class="adm-error">טעינת הגרסאות נכשלה.</p>'; });
  }

  /* ======================= סל מחזור ======================= */
  var TABLE_NAME = { podcast_episodes: 'פרקי פודקאסט', projects: 'פרויקטים', in_progress: 'פרויקטים בביצוע', partners: 'שותפים', info_articles: 'מאמרי מידע', job_roles: 'תפקידים', gallery_items: 'גלריה', page_blocks: 'טקסטים ותמונות' };
  function renderBin() {
    panel.innerHTML = '<div class="ct-bar"><h2 class="adm-h2" tabindex="-1" id="stTitle">סל מחזור</h2></div><p class="adm-note">פריטים שנמחקו נשמרים כאן 30 יום ואפשר לשחזר אותם. אחרי 30 יום הם נמחקים לצמיתות.</p><div id="stBody"><p class="adm-empty adm-card">טוען…</p></div>';
    store.cms.purgeBin().catch(function () {}).then(function () { return Promise.all(store.cms.TABLES.map(function (t) { return store.cms.bin(t).then(function (r) { return { t: t, rows: r }; }, function () { return { t: t, rows: [] }; }); })); }).then(function (all) {
      var any = all.some(function (x) { return x.rows.length; });
      bodyEl().innerHTML = any ? all.filter(function (x) { return x.rows.length; }).map(function (x) {
        return '<h3 class="adm-h2">' + esc(TABLE_NAME[x.t]) + '</h3><ul class="st-list">' + x.rows.map(function (r) {
          var cfg = CFG[x.t], name = cfg ? cfg.title(r) : (r.key + ' — ' + plain(r.value_he || r.image_alt));
          return '<li class="st-row adm-card st-bin" data-t="' + x.t + '" data-id="' + esc(r.id) + '"><span class="st-main"><strong>' + esc(name || '—') + '</strong><span class="adm-muted">נמחק ב-' + esc(new Date(r.deleted_at).toLocaleDateString('he-IL')) + '</span></span>' +
            '<span class="adm-acts"><button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-b="restore">שחזור</button>' +
            '<button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-b="destroy">מחיקה לצמיתות</button></span></li>';
        }).join('') + '</ul>';
      }).join('') : '<p class="adm-empty adm-card">סל המחזור ריק.</p>';
    });
    panel.onclick = function (e) {
      var b = e.target.closest('[data-b]');
      if (!b) { return; }
      var li = b.closest('.st-bin'), t = li.getAttribute('data-t'), id = li.getAttribute('data-id');
      if (b.getAttribute('data-b') === 'restore') {
        b.disabled = true;
        store.cms.restore(t, id).then(function () { ctx.toast('שוחזר ✓'); li.remove(); }, function () { b.disabled = false; ctx.toast('השחזור נכשל, נסו שוב'); });
      } else {
        ctx.confirmBox('מחיקה לצמיתות', 'למחוק לצמיתות? לא ניתן לבטל.', 'מחיקה', true).then(function (yes) {
          if (yes) { store.cms.destroy(t, id).then(function () { ctx.toast('נמחק'); li.remove(); }, function () { ctx.toast('המחיקה נכשלה'); }); }
        });
      }
    };
  }

  /* ======================= ספריית מדיה ======================= */
  function renderMedia() {
    panel.onclick = null;
    panel.innerHTML = '<div class="ct-bar"><h2 class="adm-h2" tabindex="-1" id="stTitle">ספריית מדיה</h2>' +
      '<label class="adm-btn adm-btn-primary ct-big" for="mdUp" tabindex="0" id="mdUpL">+ העלאת קובץ</label><input type="file" id="mdUp" hidden accept=".jpg,.jpeg,.png,.webp,.mp4,.mp3"></div>' +
      '<div class="adm-field"><label for="mdQ">חיפוש לפי שם קובץ או פריט</label><input id="mdQ" class="adm-input" type="search"></div>' +
      '<p class="adm-error" id="mdErr" role="alert" hidden></p><div id="mdBody"><p class="adm-empty adm-card">טוען…</p></div>';
    $('mdUpL').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('mdUp').click(); } });
    var files = [], usage = '';
    function draw() {
      var q = $('mdQ').value.trim().toLowerCase();
      var list = files.filter(function (f) { return !/-t\.[a-z]+$/.test(f.name); }).filter(function (f) { return !q || f.name.toLowerCase().indexOf(q) !== -1 || (usageOf(f).join(' ').toLowerCase().indexOf(q) !== -1); });
      $('mdBody').innerHTML = list.length ? '<ul class="ct-lib">' + list.map(function (f) {
        var path = 'media/' + f.name, url = store.cms.publicUrl(path), ext = extOf(f.name), us = usageOf(f);
        return '<li class="adm-card" data-path="' + esc(path) + '"><div class="ct-thumb">' + (ext === 'mp4' ? '<video src="' + esc(url) + '#t=0.5" muted playsinline preload="metadata"></video><span class="ct-vid">סרטון</span>' :
          ext === 'mp3' ? '<span class="ct-vid">שמע</span>' : imgTag(url, '')) + '</div>' +
          '<div class="ct-meta"><span>' + esc(ctx.fmtSize((f.metadata && f.metadata.size) || 0)) + '</span><span>' + esc(ctx.fmtDate(f.created_at)) + '</span></div>' +
          '<div class="ct-meta">' + (us.length ? 'בשימוש: ' + us.map(esc).join(', ') : chip('draft', 'לא בשימוש')) + '</div>' +
          (us.length ? '' : '<button type="button" class="adm-btn adm-btn-danger adm-btn-sm" data-del>מחיקת הקובץ</button>') + '</li>';
      }).join('') + '</ul>' : '<p class="adm-empty adm-card">אין קבצים.</p>';
    }
    var usageRows = [];
    function usageOf(f) {
      var stem = f.name.replace(/\.[a-z0-9]+$/, '');
      return usageRows.filter(function (u) { return u.blob.indexOf(stem) !== -1; }).map(function (u) { return u.name; });
    }
    function load() {
      Promise.all([store.cms.files(), Promise.all(store.cms.TABLES.map(function (t) {
        return Promise.all([store.cms.list(t), store.cms.bin(t)]).then(function (r) { return { t: t, rows: r[0].concat(r[1]) }; }, function () { return { t: t, rows: [] }; });
      }))]).then(function (r) {
        files = (r[0] || []).filter(function (f) { return f && f.name && f.metadata; });
        usageRows = [];
        r[1].forEach(function (x) { x.rows.forEach(function (row) {
          var cfg = CFG[x.t];
          usageRows.push({ name: (TABLE_NAME[x.t] + ': ' + (cfg ? cfg.title(row) : row.key)).slice(0, 60), blob: JSON.stringify(row) });
        }); });
        draw();
      }, function () { $('mdBody').innerHTML = '<p class="adm-error">טעינת הספרייה נכשלה (האם הורצה ההגדרה של הבאקט?).</p>'; });
    }
    $('mdQ').addEventListener('input', draw);
    $('mdUp').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (!f) { return; }
      var ext = extOf(f.name), p = (ext === 'mp4' || ext === 'mp3') ? uploadOther(f, ext === 'mp4' ? 'video' : 'audio') : uploadImage(f);
      $('mdErr').hidden = true; ctx.toast('מעלה…');
      p.then(function () { ctx.toast('הקובץ הועלה ✓'); load(); }, function (e) { $('mdErr').textContent = errMsg(e, 'ההעלאה נכשלה, נסו שוב'); $('mdErr').hidden = false; });
    });
    $('mdBody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]');
      if (!b) { return; }
      var path = b.closest('li').getAttribute('data-path');
      ctx.confirmBox('מחיקת קובץ', 'למחוק את הקובץ מהספרייה? לא ניתן לבטל.', 'מחיקה', true).then(function (yes) {
        if (!yes) { return; }
        store.cms.removeFiles([path]).then(function (r) { ctx.toast(r && r.removed ? 'הקובץ נמחק' : 'הקובץ בשימוש — לא נמחק'); load(); }, function () { ctx.toast('המחיקה נכשלה, נסו שוב'); });
      });
    });
    load();
  }
})();
