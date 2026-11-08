/* ==========================================================================
   GAD MIVNIM — about.js: עמוד "אודות הקבוצה" — חלון קריאה
   המסך: הפסקה הראשונה + 6 כפתורי נושא + "לקריאת הסיפור המלא". שאר הטקסט נשאר בדף (מוסתר ויזואלית, SEO)
   והחלון מציג עותקים של אותם אלמנטים בדיוק (cloneNode) — אף מילה לא מוקלדת מחדש. ה-data-i18n נשמר
   בעותקים, כך שהחלפת שפה (js/i18n.js) מתרגמת גם את החלון.
   נושאים: 0 = פתיחה (הפסקה הראשונה ועד הכותרת הראשונה) · 1–6 = לפי כותרות h3.about-sub, לפי הסדר.
   ========================================================================== */

(function () {
  var section = document.getElementById('about');
  var full = document.getElementById('aboutFull');
  if (!section || !full) { return; }

  var T = window.GAD_T || {};
  var lang = function () { return document.documentElement.getAttribute('lang') || 'he'; };
  var t = function (key, fb) { var e = T[key]; return (e && (e[lang()] || e.he)) || fb || ''; };
  var rtl = function () { return document.documentElement.getAttribute('dir') !== 'ltr'; };

  /* ---------- הנושאים — מתוך הטקסט שבדף ---------- */
  var lead = section.querySelector('.about-lead');
  var title = section.querySelector('.about-title');
  var quoteSrc = full.querySelector('.about-mq__src');
  var topics = [{ head: title, nodes: [lead] }];
  Array.prototype.forEach.call(full.children, function (el) {
    if (el.classList.contains('about-quote')) { return; }
    if (el.tagName === 'H3' && el.classList.contains('about-sub')) { topics.push({ head: el, nodes: [] }); return; }
    topics[topics.length - 1].nodes.push(el);
  });
  var COUNT = topics.length;                       // 7 = פתיחה + 6 נושאים

  // עותק נקי של אלמנט מהדף (בלי id / class של הדף / סגנון שחושב ב-JS); data-i18n נשמר
  function copy(el, tag, cls) {
    var n = document.createElement(tag || el.tagName.toLowerCase());
    n.innerHTML = el.innerHTML;
    var key = el.getAttribute('data-i18n');
    if (key) { n.setAttribute('data-i18n', key); }
    var c = cls || (el.classList.contains('about-sub--sm') ? 'ab-h4' : '');
    if (c) { n.className = c; }
    return n;
  }
  function topicBody(i, withHead) {
    var frag = document.createDocumentFragment();
    if (withHead && i > 0) { frag.appendChild(copy(topics[i].head, 'h3', 'ab-h3')); }
    topics[i].nodes.forEach(function (el) { frag.appendChild(copy(el)); });
    return frag;
  }

  /* ---------- החלון (אותה משפחה כמו חלונות האתר: .proj-modal) ---------- */
  var m = document.createElement('div');
  m.className = 'proj-modal ab-modal';
  m.hidden = true;
  m.innerHTML =
    '<div class="proj-modal__backdrop" data-abm-close></div>' +
    '<div class="proj-modal__box ab-modal__box" role="dialog" aria-modal="true" aria-labelledby="abmTitle" tabindex="-1">' +
      '<button type="button" class="proj-modal__x" data-abm-close>&times;</button>' +
      '<div class="ab-modal__scroll" tabindex="0">' +
        '<div class="ab-modal__text"><h2 class="ab-modal__title" id="abmTitle"></h2><div class="ab-modal__body"></div></div>' +
      '</div>' +
      '<div class="ab-modal__nav">' +
        '<button type="button" class="ab-modal__btn" data-abm-step="-1"><span data-i18n="ab_prev"></span></button>' +
        '<span class="ab-modal__count" aria-live="polite"></span>' +
        '<button type="button" class="ab-modal__btn" data-abm-step="1"><span data-i18n="ab_next"></span></button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(m);

  var box = m.querySelector('.ab-modal__box');
  var scroller = m.querySelector('.ab-modal__scroll');
  var titleEl = m.querySelector('.ab-modal__title');
  var body = m.querySelector('.ab-modal__body');
  var countEl = m.querySelector('.ab-modal__count');
  var prevBtn = m.querySelector('[data-abm-step="-1"]');
  var nextBtn = m.querySelector('[data-abm-step="1"]');
  var xBtn = m.querySelector('.proj-modal__x');
  var mode = 'topic', current = 0, opener = null;

  function labels() {
    prevBtn.firstChild.textContent = t('ab_prev', 'הנושא הקודם →');
    nextBtn.firstChild.textContent = t('ab_next', '← הנושא הבא');
    xBtn.setAttribute('aria-label', t('pm_close', 'סגירה'));
  }
  function setCount(i) {
    current = i;
    countEl.textContent = (i + 1) + ' / ' + COUNT;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === COUNT - 1;
  }

  function renderTopic(i) {
    mode = 'topic';
    m.classList.remove('is-full');
    var head = topics[i].head;
    titleEl.innerHTML = head.innerHTML;
    titleEl.setAttribute('data-i18n', head.getAttribute('data-i18n'));
    body.innerHTML = '';
    body.appendChild(topicBody(i, false));
    scroller.scrollTop = 0;
    setCount(i);
  }

  function renderFull() {
    mode = 'full';
    m.classList.add('is-full');
    titleEl.textContent = t('about_eyebrow', 'אודות הקבוצה');
    titleEl.setAttribute('data-i18n', 'about_eyebrow');
    body.innerHTML = '';
    topics.forEach(function (tp, i) {
      var s = document.createElement('section');
      s.className = 'ab-topic';
      s.setAttribute('data-n', i);
      s.appendChild(topicBody(i, true));
      body.appendChild(s);
    });
    if (quoteSrc) { body.appendChild(copy(quoteSrc, 'p', 'ab-close')); }   // שורת הסיום (הפס הנע) — כטקסט רגיל
    scroller.scrollTop = 0;
    setCount(0);
  }

  // מצב "הסיפור המלא": המונה עוקב אחרי הנושא שבמסך; הבא/הקודם גוללים אליו
  function topicInView() {
    var secs = body.querySelectorAll('.ab-topic'), top = scroller.getBoundingClientRect().top + 40, n = 0;
    for (var i = 0; i < secs.length; i++) { if (secs[i].getBoundingClientRect().top <= top) { n = i; } }
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) { n = secs.length - 1; }
    return n;
  }
  // בזמן גלילה שהתחילה מכפתור הבא/הקודם המונה לא "חוזר אחורה" — מסתנכרן רק כשהגלילה נגמרת
  var spyPausedUntil = 0, spyT;
  var resync = function () { spyPausedUntil = 0; if (mode === 'full') { setCount(topicInView()); } };
  scroller.addEventListener('scroll', function () {
    if (mode !== 'full') { return; }
    if (Date.now() < spyPausedUntil) { clearTimeout(spyT); spyT = setTimeout(resync, 150); return; }
    setCount(topicInView());
  }, { passive: true });

  function step(d) {
    var i = Math.max(0, Math.min(COUNT - 1, current + d));
    if (i === current) { return; }
    if (mode === 'topic') { renderTopic(i); return; }
    var sec = body.querySelector('.ab-topic[data-n="' + i + '"]');
    var reduce = document.documentElement.classList.contains('a11y-no-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    spyPausedUntil = Date.now() + 1200;
    scroller.scrollTo({ top: sec.offsetTop - 8, behavior: reduce ? 'auto' : 'smooth' });
    setCount(i);
  }

  function open(fn, from) {
    opener = from || document.activeElement;
    labels();
    fn();
    m.hidden = false;
    document.documentElement.classList.add('modal-open');
    box.focus({ preventScroll: true });
    void m.offsetWidth;
    m.classList.add('is-open');
  }
  function close() {
    if (m.hidden) { return; }
    m.classList.remove('is-open');
    m.hidden = true;
    document.documentElement.classList.remove('modal-open');
    if (opener && document.body.contains(opener)) { opener.focus({ preventScroll: true }); }
  }

  section.querySelectorAll('.about-topic[data-topic]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = parseInt(b.getAttribute('data-topic'), 10);
      open(function () { renderTopic(i); }, b);
    });
  });
  var more = document.getElementById('aboutMore');
  if (more) { more.addEventListener('click', function () { open(renderFull, more); }); }

  m.addEventListener('click', function (e) {
    if (e.target.closest('[data-abm-close]')) { close(); return; }
    var s = e.target.closest('[data-abm-step]');
    if (s) { step(parseInt(s.getAttribute('data-abm-step'), 10)); }
  });
  m.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (e.target.matches && e.target.matches('input, textarea')) { return; }
      e.preventDefault();
      var forward = (e.key === 'ArrowLeft') === rtl();     // RTL: שמאל = הבא; LTR: ימין = הבא
      step(forward ? 1 : -1);
      return;
    }
    if (e.key !== 'Tab') { return; }                       // מלכודת פוקוס
    var f = Array.prototype.filter.call(box.querySelectorAll('button, [tabindex="0"]'), function (x) { return !x.disabled; });
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // החלפת שפה כשהחלון פתוח: הטקסטים (data-i18n) מתורגמים ע"י i18n.js; כאן — התוויות שאינן data-i18n
  if ('MutationObserver' in window) {
    new MutationObserver(function () { if (!m.hidden) { labels(); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
})();
