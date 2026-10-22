/* ==========================================================================
   GAD MIVNIM — דף פרויקט / לקוח (project.js)
   נטען ב-project.html?client=<slug> וממלא את הדף מתוך js/projects-data.js.
   slug לא מוכר -> חזרה ל-index.html#projects.
   עברית = המקור; en / ru / fr נלקחים מ-i18n של הלקוח ומתעדכנים בהחלפת שפה.
   ========================================================================== */

(function () {

  var DATA = window.PROJECTS_DATA || {};
  var slug = '';
  try { slug = new URLSearchParams(window.location.search).get('client') || ''; } catch (e) {}

  var d = Object.prototype.hasOwnProperty.call(DATA, slug) ? DATA[slug] : null;
  if (!d) {
    window.location.replace('index.html#projects');
    return;
  }

  // טקסט הלקוח בשפה הנוכחית (נפילה לעברית אם אין תרגום)
  function pick(lang) {
    var tr = d.i18n && d.i18n[lang];
    return {
      name:  (tr && tr.name)  || d.name || slug,
      title: (tr && tr.title != null) ? tr.title : (d.title || ''),
      items: (tr && tr.items) ? tr.items : (d.items || [])
    };
  }

  var CITY_KEYS = { 'תל אביב': 'city_tlv', 'ירושלים': 'city_jlm' };

  function render() {
    var lang = document.documentElement.getAttribute('lang') || 'he';
    var t = pick(lang);

    // כותרת הלשונית: i18n.js משחזר אותה בכל החלפת שפה, ולכן היא נשמרת במשתנה גלובלי
    window.GAD_PAGE_TITLE = t.name + ' | GAD MIVNIM';
    document.title = window.GAD_PAGE_TITLE;

    var meta = document.querySelector('meta[name="description"]');
    if (meta) { meta.setAttribute('content', t.name + (t.title ? ' - ' + t.title : '') + ' | GAD MIVNIM'); }

    var logo = document.getElementById('projLogo');
    var h1   = document.getElementById('projName');
    if (logo) { logo.setAttribute('alt', t.name); }
    if (h1) { h1.textContent = t.name; }

    var dt = document.getElementById('projDescTitle');
    var ul = document.getElementById('projItems');
    var ds = document.getElementById('projDesc');
    var hd = document.querySelector('.project-desc-heading');

    if (t.title) {
      if (hd) { hd.hidden = false; }
      dt.textContent = t.title; dt.hidden = false;
      ul.innerHTML = '';
      t.items.forEach(function (it) {
        var li = document.createElement('li');
        li.textContent = it;
        ul.appendChild(li);
      });
      ul.hidden = !t.items.length;
      if (d.description) {
        ds.classList.remove('is-placeholder');
        ds.removeAttribute('data-i18n');
        ds.textContent = d.description;
        ds.hidden = false;
      } else {
        ds.hidden = true;
      }
    } else {
      // אין כותרת — placeholder
      if (hd) { hd.hidden = true; }
      dt.hidden = true; ul.hidden = true;
      ds.hidden = false;
      if (!ds.classList.contains('is-placeholder')) {      // i18n.js מתרגם אותו בהמשך
        ds.classList.add('is-placeholder');
        ds.setAttribute('data-i18n', 'pm_soon');
        ds.textContent = 'תיאור הפרויקט יתווסף בקרוב';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var logo = document.getElementById('projLogo');
    if (logo && ('logo' in d) && !d.logo) { logo.hidden = true; }
    else if (logo) { logo.setAttribute('src', 'images/clients/' + (d.logo || slug) + '.png'); }

    var subEl = document.getElementById('projSubtitle');
    if (subEl && d.subtitle) { subEl.textContent = d.subtitle; subEl.hidden = false; }

    var cityEl = document.getElementById('projCity');
    if (cityEl && d.city) {
      var ct = document.getElementById('projCityText');
      ct.textContent = d.city;
      if (CITY_KEYS[d.city]) { ct.setAttribute('data-i18n', CITY_KEYS[d.city]); }
      cityEl.hidden = false;
    }

    render();

    // גלריה קלאסית — פריסה אוטומטית לפי מספר התמונות; לחיצה פותחת לייטבוקס עם כיתוב, מונה וחיצים
    var gal  = document.getElementById('projGallery');
    var grid = document.getElementById('pjGrid');
    var list = (d.images || []).map(function (it) {
      var o = typeof it === 'string' ? { src: it } : it;
      return { src: o.src, alt: o.alt || pick('he').name, width: o.width, height: o.height };
    });
    if (gal && grid && list.length) {
      var n = list.length;
      gal.classList.add(n === 1 ? 'pj-n1' : n === 2 ? 'pj-n2' : n === 3 ? 'pj-n3' : 'pj-n4');
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var figs = [];
      list.forEach(function (o, i) {
        var fig = document.createElement('figure');
        fig.className = 'pj-fig' + (n >= 3 && i === 0 ? ' pj-fig--lead' : '');
        fig.style.setProperty('--i', i);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pj-photo';
        btn.setAttribute('aria-label', 'הגדלת תמונה: ' + o.alt);
        var im = document.createElement('img');
        im.src = o.src; im.alt = o.alt;
        if (o.width)  { im.width  = o.width; }
        if (o.height) { im.height = o.height; }
        im.loading = 'lazy'; im.decoding = 'async';
        btn.appendChild(im);
        var cap = document.createElement('figcaption');
        cap.textContent = o.alt;
        fig.appendChild(btn); fig.appendChild(cap);
        grid.appendChild(fig);
        figs.push(fig);
        btn.addEventListener('click', function () { openLightbox(i, btn); });
      });
      gal.hidden = false;

      // כניסה עדינה אחת-אחת כשהתמונה נכנסת לתצוגה
      if (reduce || !('IntersectionObserver' in window)) {
        figs.forEach(function (f) { f.classList.add('is-in'); });
      } else {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
          });
        }, { threshold: 0.15 });
        figs.forEach(function (f) { io.observe(f); });
      }

      // ----- לייטבוקס -----
      var lb = document.createElement('div');
      lb.className = 'pj-lb';
      lb.hidden = true;
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'גלריית הפרויקט');
      lb.innerHTML =
        '<div class="pj-lb__backdrop" data-close></div>' +
        '<button type="button" class="pj-lb__x" data-close aria-label="סגירה">&times;</button>' +
        '<button type="button" class="pj-lb__nav pj-lb__prev" aria-label="הקודמת"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
        '<button type="button" class="pj-lb__nav pj-lb__next" aria-label="הבאה"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<figure class="pj-lb__fig"><img alt=""><figcaption></figcaption><div class="pj-lb__count" dir="ltr"></div></figure>';
      document.body.appendChild(lb);
      var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), lbCnt = lb.querySelector('.pj-lb__count');
      var cur = 0, from = null;

      function show(i) {
        cur = (i + n) % n;
        lbImg.src = list[cur].src;
        lbImg.alt = list[cur].alt;
        lbCap.textContent = list[cur].alt;
        lbCnt.textContent = (cur + 1) + ' / ' + n;
      }
      function openLightbox(i, trigger) {
        from = trigger;
        show(i);
        lb.hidden = false;
        document.documentElement.classList.add('pj-lb-open');
        var closeBtn = lb.querySelector('.pj-lb__x');
        closeBtn.focus();
        lb.querySelector('.pj-lb__prev').hidden = lb.querySelector('.pj-lb__next').hidden = n < 2;
      }
      function closeLightbox() {
        if (lb.hidden) { return; }
        lb.hidden = true;
        document.documentElement.classList.remove('pj-lb-open');
        if (from) { from.focus(); }
      }
      lb.addEventListener('click', function (e) {
        if (e.target.closest('[data-close]')) { closeLightbox(); }
        else if (e.target.closest('.pj-lb__prev')) { show(cur - 1); }
        else if (e.target.closest('.pj-lb__next')) { show(cur + 1); }
      });
      document.addEventListener('keydown', function (e) {
        if (lb.hidden) { return; }
        if (e.key === 'Escape') { closeLightbox(); }
        else if (e.key === 'ArrowLeft')  { show(cur + 1); }   // RTL: שמאל = הבאה
        else if (e.key === 'ArrowRight') { show(cur - 1); }
        else if (e.key === 'Tab') {                           // מלכודת פוקוס
          var f = lb.querySelectorAll('button:not([hidden])');
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
      // החלקה במגע: שמאלה = הבאה, ימינה = הקודמת
      var sx = null;
      lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (sx === null) { return; }
        var dx = e.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) > 50) { show(dx < 0 ? cur + 1 : cur - 1); }
      }, { passive: true });
    }

    // החלפת שפה: i18n.js מעדכן את lang על <html> — מציירים מחדש את תוכן הלקוח
    if ('MutationObserver' in window) {
      new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  });

})();
