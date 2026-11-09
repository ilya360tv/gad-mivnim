#!/usr/bin/env node
/* ==========================================================================
   GAD MIVNIM — בניית העמודים הנפרדים (tools/build-pages.js)

   מקור יחיד: src/site.html — כל הסקשנים, ההדר (עמודות הצד), הפוטר, החלונות והסקריפטים.
   הרצה:  node tools/build-pages.js
   הפלט: 14 קבצי HTML סטטיים בשורש (index.html = Hero, about.html, services.html ...) — Vercel מגיש
   אותם כמו שהם, בלי שלב build. אותו הדר/פוטר בכל העמודים (נוצרים מאותו מקור — אין 14 עותקים שנפרדים),
   וגם עמודי המשנה הקיימים (planning.html, partners-*.html, project.html...) מקבלים את אותו הדר/פוטר.

   לשינוי תוכן: עורכים את src/site.html ומריצים שוב את הסקריפט. לא עורכים ידנית את הקבצים שנוצרו.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://gad-mivnim.vercel.app/';
// LF תמיד (גם אם git הוציא את הקבצים עם CRLF ב-Windows) — כל החיפושים בסקריפט מניחים \n
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s, 'utf8');

/* ---------- העמודים: קובץ ← סקשן ← גלולה ---------- */
const PAGES = [
  { id: 'hero',        file: 'index.html',       nav: 'nav_home',          data: [] },
  { id: 'about',       file: 'about.html',       nav: 'nav_about',         data: ['about'],
    desc: 'אודות GAD MIVNIM (גד מבנים) — מסורת משפחתית, איכות, מקצועיות ויחס אישי. מדוע נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד.' },
  { id: 'services',    file: 'services.html',    nav: 'nav_services',      data: [],
    desc: 'השירותים של GAD MIVNIM — תכנון והנדסה, בינוי ותשתיות, שותפויות נדל"ן ושירותי בנייה. רמת תכנון, ניהול וביצוע מהגבוהות ביותר.' },
  { id: 'projects',    file: 'projects.html',    nav: 'nav_projects',      data: ['projects-data'],
    desc: 'הפרויקטים של GAD MIVNIM — מבנים פרטיים ועסקיים, מלונות, קניונים, בתי אבות ומבני ציבור.' },
  { id: 'in-progress', file: 'in-progress.html', nav: 'nav_in_progress',   data: ['projects-data', 'in-progress-data'],
    desc: 'פרויקטים בביצוע של GAD MIVNIM — מה אנחנו בונים עכשיו. מתעדכן באופן שוטף.' },
  { id: 'teams',       file: 'teams.html',       nav: 'nav_teams',         data: [],
    desc: 'הצוותים של GAD MIVNIM — צוותי שטח ואנשי מקצוע. מצוינות ללא פשרות.' },
  { id: 'partners',    file: 'partners.html',    nav: 'nav_partners',      data: ['partners-data'],
    desc: 'השותפים של GAD MIVNIM — המותגים והחברות המובילים בישראל: מטבחים, נגרות, ריצוף, תאורה, דלתות ועוד.' },
  { id: 'info',        file: 'info.html',        nav: 'nav_info',          data: ['info-data'],
    desc: 'מידע לאזרח ולבונה — עם קצת ידע והכוונה נכונה כל אחד יכול לבנות את מבנה חייו. מדריכים וטיפים מ-GAD MIVNIM.' },
  { id: 'podcast',     file: 'podcast.html',     nav: 'nav_podcast',       data: ['podcast-data'],
    desc: 'הפודקאסט של GAD MIVNIM — אנשים משתפים. האזינו וצפו בפרקים.' },
  { id: 'gallery',     file: 'gallery.html',     nav: 'nav_gallery_short', data: ['projects-data'],
    desc: 'גלריית בנייה ועיצובים של GAD MIVNIM — לחלום ולהגשים. השראות מפרויקטים אמיתיים.' },
  { id: 'careers',     file: 'careers.html',     nav: 'nav_careers',       data: ['careers-data', 'tenders-data', 'demo-store'],
    desc: 'דרושים ב-GAD MIVNIM — בואו לבנות איתנו. משרות פתוחות והצטרפות כקבלן בית.' },
  { id: 'tenders',     file: 'tenders.html',     nav: 'nav_tenders',       data: ['tenders-data', 'demo-store', 'tenders'],
    desc: 'אזור קבלני הבית של GAD MIVNIM — כניסה למנויים פעילים עם קוד משתמש ורשימת מכרזים.' },
  { id: 'app',         file: 'app.html',         nav: 'nav_app',           data: [],
    desc: 'מנויי שירות ואחזקה של GAD MIVNIM — שקט נפשי גם אחרי המסירה. בחרו את מסלול השירות המתאים לכם.' },
  { id: 'contact',     file: 'contact.html',     nav: 'nav_contact',       data: [],
    desc: 'שירות לקוחות GAD MIVNIM — צרו קשר. הרצליה, ישראל.' }
];
const FILE_OF = Object.fromEntries(PAGES.map((p) => [p.id, p.file]));

// עמודי המשנה הקיימים — איזו גלולה מסומנת בהם
const SUBPAGES = {
  'planning.html': 'services', 'construction.html': 'services', 'real-estate.html': 'services',
  'home-services.html': 'services', 'special.html': 'services', 'infrastructure.html': 'services',
  'commercial.html': 'services', 'partners-kitchens.html': 'partners', 'partners-doors.html': 'partners',
  'partners-finishes.html': 'partners', 'partners-gates-frames.html': 'partners',
  'partners-bath-lighting.html': 'partners', 'project.html': 'projects'
};

/* ---------- עזרים ---------- */
const between = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i); if (i < 0 || j < 0) { throw new Error('missing ' + a); } return s.slice(i, j + b.length); };

// "#about" / "index.html#about" → "about.html";  "#hero" → "index.html"  (לא נוגע ב-"#", "#main")
function rewriteLinks(html) {
  return html.replace(/href="(?:index\.html)?#([a-z-]+)"/g, (m, id) => (FILE_OF[id] ? 'href="' + FILE_OF[id] + '"' : m));
}

// הגלולה של העמוד הנוכחי — מסומנת לפי הכתובת (לא לפי גלילה)
function markCurrent(header, id) {
  if (!id) { return header; }
  const file = FILE_OF[id];
  return header.replace(/(<nav class="main-nav"[\s\S]*?<\/nav>)/, (nav) =>
    nav.replace(new RegExp('<a href="' + file.replace('.', '\\.') + '"(\\s+)'), '<a href="' + file + '" class="is-current" aria-current="page"$1'));
}

// סימון "ביקור ראשון בסשן" — אנימציית הכניסה של עמודות הצד רק פעם אחת
const NAV_SEEN = "  <script>try{if(sessionStorage.getItem('gm:navSeen')){document.documentElement.classList.add('nav-seen');}else{sessionStorage.setItem('gm:navSeen','1');}}catch(e){}</script>\n";
const HAS_JS = "  <script>document.documentElement.classList.add('has-js');</script>\n";
function addNavSeen(head) {
  if (head.includes('gm:navSeen')) { return head; }
  if (!head.includes(HAS_JS)) { throw new Error('has-js script not found'); }
  return head.replace(HAS_JS, HAS_JS + NAV_SEEN);
}

// כתובות ישנות של העמוד האחד (/#projects) → העמוד החדש (projects.html), מיד בטעינה
const REDIRECT = '  <script>(function(){var m=' + JSON.stringify(Object.fromEntries(PAGES.filter((p) => p.id !== 'hero').map((p) => [p.id, p.file]))) +
  ',h=location.hash.slice(1);if(m[h]){location.replace(m[h]+location.search);}})();</script>\n';

/* ---------- פירוק המקור ---------- */
const master = read('src/site.html');
const headEnd = master.indexOf('</head>');
const HEAD = master.slice(0, headEnd);
const header = between(master, '<header class="site-header">', '</header>');
const footer = between(master, '<footer class="site-footer">', '</footer>');
const mainOpen = master.indexOf('<main id="main">');
const mainClose = master.indexOf('</main>');
const PRE_MAIN = master.slice(master.indexOf('<body>') + '<body>'.length, mainOpen + '<main id="main">'.length);
const scriptsStart = master.indexOf('  <script src="js/i18n.js');
const POST_MAIN = master.slice(mainClose, scriptsStart);   // </main> + פוטר + כפתורים + נגישות + טופס נטליפיי
const SCRIPT_TAGS = master.slice(scriptsStart, master.indexOf('</body>')).trim().split('\n').map((l) => l.trim()).filter(Boolean);

const SECTIONS = {};
const secRe = /(  <!--[^\n]*-->\n)?  <section id="([a-z-]+)"[\s\S]*?\n  <\/section>\n/g;
let mm;
while ((mm = secRe.exec(master))) { SECTIONS[mm[2]] = mm[0]; }
const lastSectionEnd = Math.max(...Object.values(SECTIONS).map((s) => master.indexOf(s) + s.length));
const MAIN_TAIL = master.slice(lastSectionEnd, mainClose);   // הלייטבוקס (משותף)
PAGES.forEach((p) => { if (!SECTIONS[p.id]) { throw new Error('section not found: ' + p.id); } });

// ה-h1 של העמוד = הכותרת הראשית של הסקשן (h2.section-title, ואם אין — התווית section-eyebrow). אותן מחלקות בדיוק.
function promoteH1(sec, id) {
  if (id === 'hero') { return sec; }
  let m = /<h2 class="section-title[^"]*"[^>]*>/.exec(sec);
  if (m) {
    const close = sec.indexOf('</h2>', m.index);
    return sec.slice(0, m.index) + '<h1' + m[0].slice(3) + sec.slice(m.index + m[0].length, close) + '</h1>' + sec.slice(close + 5);
  }
  m = /<(h2|span) class="section-eyebrow[^"]*"[^>]*>/.exec(sec);
  if (!m) { throw new Error('no title in ' + id); }
  const tag = m[1];
  // הסגירה התואמת (גם אם יש span פנימי)
  let depth = 1, i = m.index + m[0].length;
  const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'g');
  re.lastIndex = i;
  let t;
  while ((t = re.exec(sec))) { depth += t[1] ? -1 : 1; if (!depth) { break; } }
  return sec.slice(0, m.index) + '<h1' + m[0].slice(1 + tag.length) + sec.slice(m.index + m[0].length, t.index) + '</h1>' + sec.slice(t.index + t[0].length);
}

function scriptsFor(page) {
  const want = new Set(['i18n', 'premium', 'script', 'a11y'].concat(page.data));
  return SCRIPT_TAGS.filter((tag) => {
    const m = /src="js\/([a-z0-9-]+)\.js/.exec(tag);
    return m && want.has(m[1]);
  }).map((t) => '  ' + t).join('\n');
}

const navTitle = (key) => {
  const m = new RegExp('data-i18n="' + key + '">([^<]+)<').exec(header);
  if (!m) { throw new Error('nav label not found: ' + key); }
  return m[1].trim();
};

/* ---------- 14 העמודים ---------- */
PAGES.forEach((page) => {
  const isHome = page.id === 'hero';
  let head = addNavSeen(HEAD);
  if (isHome) {
    head = head.replace('<head>\n', '<head>\n' + REDIRECT);
    head = head.replace(/(<meta name="description"[^>]*>)/, '$1\n  <link rel="canonical" href="' + SITE + '">');
  } else {
    const title = navTitle(page.nav) + ' | GAD MIVNIM';
    head = head.replace('<html lang="he" dir="rtl">', '<html lang="he" dir="rtl" data-title-key="' + page.nav + '" data-title-brand>')
      .replace(/<title>[^<]*<\/title>/, '<title>' + title + '</title>')
      .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + page.desc.replace(/"/g, '&quot;') + '">\n  <link rel="canonical" href="' + SITE + page.file + '">');
  }
  let post = POST_MAIN;
  if (page.id !== 'careers') { post = post.replace(/\n  <!--[^\n]*-->\n  <form name="careers-application"[\s\S]*?<\/form>\n/, '\n').replace(/  <form name="careers-application"[\s\S]*?<\/form>\n/, ''); }
  const body = PRE_MAIN.replace(header, markCurrent(rewriteLinks(header), page.id)) + '\n\n' + promoteH1(SECTIONS[page.id], page.id) + MAIN_TAIL + post;
  const html = head + '</head>\n<body class="page-split" data-page="' + page.id + '">' + rewriteLinks(body) + scriptsFor(page) + '\n</body>\n</html>\n';
  write(page.file, html);
  console.log('built', page.file);
});

/* ---------- עמודי המשנה הקיימים: אותו הדר/פוטר + קישורים לעמודים ---------- */
Object.keys(SUBPAGES).forEach((file) => {
  let s = read(file);
  const oldHeader = between(s, '<header class="site-header">', '</header>');
  const oldFooter = between(s, '<footer class="site-footer">', '</footer>');
  s = s.replace(oldHeader, markCurrent(rewriteLinks(header), SUBPAGES[file])).replace(oldFooter, rewriteLinks(footer));
  s = rewriteLinks(s);
  const h = s.indexOf('</head>');
  s = addNavSeen(s.slice(0, h)) + s.slice(h);
  write(file, s);
  console.log('updated', file);
});

/* ---------- sitemap.xml ---------- */
const urls = PAGES.map((p) => (p.id === 'hero' ? SITE : SITE + p.file)).concat(Object.keys(SUBPAGES).filter((f) => f !== 'project.html').map((f) => SITE + f));
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n</urlset>\n');
console.log('sitemap.xml:', urls.length, 'urls');
