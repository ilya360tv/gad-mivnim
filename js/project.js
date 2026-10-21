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
    if (logo) { logo.setAttribute('src', 'images/clients/' + (d.logo || slug) + '.png'); }

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

    // גלריה — אותם אריחים כמו בגלריה הראשית (נפתחים בלייטבוקס של script.js)
    var gal  = document.getElementById('projGallery');
    var list = d.images || [];
    if (gal && list.length) {
      list.forEach(function (src) {
        var b = document.createElement('button');
        b.className = 'gallery-item';
        b.type = 'button';
        b.setAttribute('aria-label', 'הגדלת תמונה');
        var im = document.createElement('img');
        im.src = src;
        im.alt = pick('he').name;
        im.loading = 'lazy';
        im.decoding = 'async';
        b.appendChild(im);
        gal.appendChild(b);
      });
      gal.hidden = false;
    }

    // החלפת שפה: i18n.js מעדכן את lang על <html> — מציירים מחדש את תוכן הלקוח
    if ('MutationObserver' in window) {
      new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  });

})();
