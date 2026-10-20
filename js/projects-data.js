/* ==========================================================================
   GAD MIVNIM — תוכן חלונות הפרויקטים (projects-data.js)
   כאן ממלאים את התוכן שנפתח בלחיצה על לוגו לקוח בפס #projects.
   לכל לקוח (לפי ה-slug): { name, title, description, images }
     name        — שם הלקוח (מוצג כשאין title)
     subtitle    — כותרת משנה מתחת לשם (אופציונלי), למשל סלוגן המותג
     city        — עיר (אופציונלי): מוצגת כתגית באריח ובדף הפרויקט
     logo        — שם קובץ הלוגו ב-images/clients (אופציונלי; ברירת מחדל: ה-slug)
     title       — כותרת הפרויקט (מחרוזת ריקה = מוצג שם הלקוח)
     description — תיאור הפרויקט (מחרוזת ריקה = "תיאור הפרויקט יתווסף בקרוב")
     images      — מערך נתיבי תמונות, למשל ['images/project1.jpg'] (ריק = לא מוצג)
   ========================================================================== */
window.PROJECTS_DATA = {
  'crowne-plaza-tel-aviv':  { name: 'קראון פלאזה תל אביב', city: 'תל אביב', title: '', description: '', images: [], logo: 'crowne-plaza' },
  'crowne-plaza-jerusalem': { name: 'קראון פלאזה ירושלים', city: 'ירושלים', title: '', description: '', images: [], logo: 'crowne-plaza' },
  'shalom-hotel':       { name: 'מלון שלום ירושלים',           title: '', description: '', images: [] },
  'dana-david':         { name: 'דנה דוד',                      subtitle: 'COSMETICS · CARE & BEAUTY', title: '', description: '', images: [] },
  'nofei-yerushalayim': { name: 'נופי ירושלים',                 title: '', description: '', images: [] },
  'agnon-house':        { name: 'בית עגנון בירושלים',           title: '', description: '', images: [] },
  'yahad':              { name: 'יחד - מועדון צרכנות לרופאים', title: '', description: '', images: [] },
  'africa-israel':      { name: 'אפריקה ישראל',                 title: '', description: '', images: [] },
  'matnasim':           { name: 'החברה למתנ"סים',               title: '', description: '', images: [] },
  'neve-ilan':          { name: 'נווה אילן',                    title: '', description: '', images: [] },
  'justice-ministry':   { name: 'משרד המשפטים',                 title: '', description: '', images: [] },
  'jerusalem':          { name: 'ירושלים',                      title: '', description: '', images: [] },
  'sweet-home':         { name: 'Sweet Home',                   title: '', description: '', images: [] }
};
