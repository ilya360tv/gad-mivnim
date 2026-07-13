/* ==========================================================================
   GAD MIVNIM — רב-לשוני (i18n.js)
   עברית = מילה-במילה מתוך מסמך המקור "אתר אינטרנט GAD MIVNIM 02-03-23.docx".
   רוסית/אנגלית = תרגום נאמן. הבחירה נשמרת ב-localStorage.
   ========================================================================== */

(function () {

  var NATIVE = { he: 'עברית', ru: 'Русский', en: 'English' };
  var DIR    = { he: 'rtl',   ru: 'ltr',     en: 'ltr' };

  var DOC_TITLE = {
    he: 'GAD MIVNIM | גד מבנים — בכל מקום במפה',
    ru: 'GAD MIVNIM — везде на карте',
    en: 'GAD MIVNIM — Everywhere on the Map'
  };

  var T = {
    /* ----- מסך פתיחה ----- */
    welcome_title: { he: 'ברוכים הבאים לאתר הבית שלנו', ru: 'Добро пожаловать на наш домашний сайт', en: 'Welcome to Our Home Site' },
    welcome_slogan: { he: 'בכל מקום במפה', ru: 'везде на карте', en: 'Everywhere on the Map' },
    welcome_soon: { he: 'בקרוב', ru: 'Скоро', en: 'Soon' },
    welcome_enter: { he: 'כניסה לאתר', ru: 'Вход на сайт', en: 'Enter Site' },

    /* ----- ניווט ----- */
    nav_home:     { he: 'דף הבית', ru: 'Главная', en: 'Home' },
    nav_about:    { he: 'אודות הקבוצה — מסורת משפחתית', ru: 'О группе — семейная традиция', en: 'About — A Family Tradition' },
    nav_services: { he: 'השירותים שלנו', ru: 'Наши услуги', en: 'Our Services' },
    nav_projects: { he: 'הפרויקטים שלנו', ru: 'Наши проекты', en: 'Our Projects' },
    nav_partners: { he: 'השותפים שלנו', ru: 'Наши партнёры', en: 'Our Partners' },
    nav_teams:    { he: 'הצוותים שלנו', ru: 'Наши команды', en: 'Our Teams' },
    nav_gallery:  { he: 'גלריה בנייה ועיצובים', ru: 'Галерея — строительство и дизайн', en: 'Gallery — Building & Design' },
    nav_info:     { he: 'מידע לאזרח ולבונה', ru: 'Информация для клиента и застройщика', en: 'Info for the Citizen & Builder' },
    nav_contact:  { he: 'צור קשר', ru: 'Связаться', en: 'Contact' },

    /* ----- Hero ----- */
    hero_title:    { he: 'GAD MIVNIM — בכל מקום במפה', ru: 'GAD MIVNIM — везде на карте', en: 'GAD MIVNIM — Everywhere on the Map' },
    hero_subtitle: { he: 'משנים את הדרך לבנייה נכונה !', ru: 'Меняем подход к правильному строительству!', en: 'Changing the way to build right!' },
    hero_showroom: { he: 'לרשותכם אולם תצוגה לתצוגות בנייה ועיצובים', ru: 'К вашим услугам шоурум строительства и дизайна', en: 'A construction & design showroom at your service' },
    hero_location: { he: 'הרצליה ישראל | HERZLIYA ISRAEL', ru: 'הרצליה ישראל | HERZLIYA ISRAEL', en: 'הרצליה ישראל | HERZLIYA ISRAEL' },
    hero_podcast:  { he: 'פודקאסט | קבלנים משתפים', ru: 'Подкаст | Подрядчики делятся', en: 'Podcast | Contractors Share' },
    podcast_soon:  { he: 'בקרוב', ru: 'Скоро', en: 'Coming Soon' },

    /* ----- אודות הקבוצה ----- */
    about_eyebrow: { he: 'אודות הקבוצה', ru: 'О группе', en: 'About the Group' },
    about_title:   { he: 'מסורת משפחתית', ru: 'Семейная традиция', en: 'A Family Tradition' },
    about_p1: { he: 'מייסד הקבוצה והשותפים למלאכה', ru: 'Основатель группы и партнёры по ремеслу', en: 'The group founder and craft partners' },
    about_p2: { he: 'מדוע נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד ולקבוצה שמנצחת על הכל !', ru: 'Почему родилась идея объединить строительство и дизайн в один дом и в команду, которая побеждает во всём!', en: 'Why the idea was born to unite building and design under one home — and into a group that wins at everything!' },
    about_since:   { he: 'מאז ועד היום', ru: 'С тех пор и по сей день', en: 'From then until today' },
    about_country: { he: 'המדינה שלנו', ru: 'Наша страна', en: 'Our country' },
    about_p3: { he: 'את ערכי היסוד האיכות המקצועיות והיחס המשפחתי והאישי בחרנו כבחירה לאבני היסוד של הקבוצה', ru: 'Базовые ценности — качество, профессионализм, семейное и личное отношение — мы выбрали краеугольными камнями группы', en: 'We chose the core values — quality, professionalism and a personal, family approach — as the cornerstones of the group' },
    about_p4: { he: 'החברה דוגלת בעבודה שיתופית מלאה', ru: 'Компания привержена полному сотрудничеству', en: 'The company believes in full collaborative work' },
    about_p5: { he: 'ורק ככה נצליח לבנות את ביתנו בהצלחה רבה', ru: 'И только так мы сумеем построить наш дом с большим успехом', en: 'And only this way will we build our home with great success' },
    about_p6: { he: 'בחירתנו היא שותפות מלאה', ru: 'Наш выбор — полное партнёрство', en: 'Our choice is full partnership' },
    about_p7: { he: 'לקבלת תוצאות שלא פחות ממצוינות', ru: 'Ради результатов не менее чем превосходных', en: 'For results that are nothing less than excellent' },
    about_p8: { he: 'אווירת שירות משפחתית ואישית לכל לקוח', ru: 'Семейная и личная атмосфера сервиса для каждого клиента', en: 'A family, personal service atmosphere for every client' },

    /* ----- השירותים שלנו ----- */
    svc_eyebrow: { he: 'השירותים שלנו', ru: 'Наши услуги', en: 'Our Services' },
    svc_lead: { he: 'רמת תכנון תיאום ניהול פיקוח וביצוע מהגבוהות ביותר !', ru: 'Высочайший уровень проектирования, координации, управления, надзора и исполнения!', en: 'The highest level of planning, coordination, management, supervision and execution!' },
    svc_b1: { he: 'אבטחה סגורה מעגל סגור 24/7', ru: 'Закрытая охрана, видеонаблюдение 24/7', en: 'Closed security, CCTV 24/7' },
    svc_b2: { he: 'סובב פרויקטים', ru: 'Вокруг проектов', en: 'Around projects' },
    svc_b3: { he: 'מתאמים לכם פרויקט מושלם', ru: 'Координируем для вас идеальный проект', en: 'Coordinating a perfect project for you' },
    svc_b4: { he: 'חשיבה מחוץ לקופסא', ru: 'Мышление вне рамок', en: 'Thinking outside the box' },

    d1_title:  { he: 'חטיבת תכנון והנדסת בנייה', ru: 'Подразделение проектирования и строительной инженерии', en: 'Planning & Construction Engineering Division' },
    d1_slogan: { he: 'תכנון נכון , חיסכון מוכח', ru: 'Правильное проектирование — доказанная экономия', en: 'Right planning, proven savings' },
    c11:  { he: 'תאום פרויקטים', ru: 'Координация проектов', en: 'Project Coordination' },
    c11s: { he: 'מתאמים אתכם פרויקט מושלם', ru: 'Координируем с вами идеальный проект', en: 'Coordinating a perfect project with you' },
    c12:  { he: 'תכנון וליווי פרויקטים', ru: 'Планирование и сопровождение проектов', en: 'Project Planning & Guidance' },
    c12s: { he: 'מתכננים ומלווים אתכם בשותפות מלאה', ru: 'Планируем и сопровождаем вас в полном партнёрстве', en: 'Planning and guiding you in full partnership' },
    c13:  { he: 'אדריכלות והנדסת מבנים', ru: 'Архитектура и инженерия зданий', en: 'Architecture & Structural Engineering' },
    c13s: { he: 'נוגעים בפרטים הקטנים', ru: 'Внимательны к мелким деталям', en: 'Touching the smallest details' },
    c14:  { he: 'עיצוב פנים והדמיות', ru: 'Дизайн интерьера и визуализации', en: 'Interior Design & Renderings' },
    c14s: { he: 'השלב הכי כיפי והמאתגר בפרויקט', ru: 'Самый приятный и сложный этап проекта', en: 'The most fun and challenging stage of the project' },

    d2_title:  { he: 'חטיבת בינוי ותשתיות', ru: 'Подразделение строительства и инфраструктуры', en: 'Construction & Infrastructure Division' },
    d2_slogan: { he: 'בונים אתכם מבנה נכון', ru: 'Строим с вами правильное здание', en: 'Building the right structure with you' },
    c21:  { he: 'בנייה והרחבות מבנים', ru: 'Строительство и расширение зданий', en: 'Construction & Building Extensions' },
    c21s: { he: 'מבנה חדש נולד !', ru: 'Родилось новое здание!', en: 'A new building is born!' },
    c22:  { he: 'שיקום שחזור ושימור מבנים', ru: 'Реставрация, восстановление и сохранение зданий', en: 'Building Restoration & Preservation' },
    c22s: { he: 'חובה לשמור על המבנה שלנו', ru: 'Обязаны беречь наше здание', en: 'We must preserve our building' },
    c23:  { he: 'שיפוצים והשבחת נכסים', ru: 'Ремонт и повышение стоимости недвижимости', en: 'Renovations & Property Upgrading' },
    c23s: { he: 'נצייר לכם ציור חדש !', ru: 'Нарисуем вам новую картину!', en: 'We will paint you a new picture!' },
    c24:  { he: 'ליקויי בנייה', ru: 'Строительные дефекты', en: 'Construction Defects' },
    c24s: { he: 'נתקן את זה !', ru: 'Мы это исправим!', en: 'We will fix it!' },
    c25:  { he: 'תשתיות ופיתוח', ru: 'Инфраструктура и благоустройство', en: 'Infrastructure & Development' },
    c25s: { he: 'הכל מתחיל ביסודות טובים', ru: 'Всё начинается с хорошего фундамента', en: 'Everything starts with good foundations' },
    c26:  { he: 'אספלט וכבישים', ru: 'Асфальт и дороги', en: 'Asphalt & Roads' },
    c26s: { he: 'גם הכבשים צריכים להיות מושלמים', ru: 'Дороги тоже должны быть идеальными', en: 'The roads must be perfect too' },
    c26s2:{ he: 'חובה לשמור על בטיחות בדרכים !', ru: 'Обязаны соблюдать безопасность на дорогах!', en: 'Road safety must be kept!' },

    d3_title:  { he: 'חטיבת שותפויות נדל"ן', ru: 'Подразделение партнёрств в недвижимости', en: 'Real-Estate Partnerships Division' },
    d3_slogan: { he: 'עושים שותפות מתוך כבוד הדדי וערכים משפחתיים', ru: 'Партнёрство на основе взаимного уважения и семейных ценностей', en: 'Partnering out of mutual respect and family values' },
    d3_extra:  { he: 'אתם זה אנחנו !  ואנחנו זה אתם !  משפחה !', ru: 'Вы — это мы! А мы — это вы! Семья!', en: 'You are us! And we are you! Family!' },
    c31:  { he: 'תמ"א 38', ru: 'ТАМА 38', en: 'TAMA 38' },
    c31s: { he: 'נעשה את זה ביחד ובהצלחה גדולה', ru: 'Сделаем это вместе и с большим успехом', en: 'We will do it together, with great success' },
    c32:  { he: 'פינוי בינוי', ru: 'Снос и новая застройка', en: 'Urban Renewal (Pinui-Binui)' },
    c32s: { he: 'תמיד כיף לקבל חדש !', ru: 'Всегда приятно получать новое!', en: 'It is always fun to get something new!' },

    d4_title:  { he: 'חטיבת השירותים שלנו', ru: 'Подразделение наших услуг', en: 'Our Services Division' },
    d4_slogan: { he: 'שירות מכל הלב', ru: 'Сервис от всего сердца', en: 'Service from the heart' },
    d4_extra:  { he: 'ישראל שלנו  הארץ שלנו', ru: 'Наш Израиль — наша земля', en: 'Our Israel, our land' },
    c41:  { he: 'מערכות בידוד ואיטום', ru: 'Системы изоляции и гидроизоляции', en: 'Insulation & Waterproofing Systems' },
    c41s: { he: 'תמיד חשוב מבנה יבש', ru: 'Сухое здание — всегда важно', en: 'A dry building always matters' },
    c42:  { he: 'עבודות בגבהים', ru: 'Высотные работы', en: 'Work at Heights' },
    c42s: { he: 'פותרים לכם את הגובה', ru: 'Решаем для вас вопрос высоты', en: 'Solving the height for you' },
    c43:  { he: 'ניקוי חול והתזות', ru: 'Пескоструйная очистка и напыление', en: 'Sandblasting & Spraying' },
    c43s: { he: 'תנקו אותי כבר', ru: 'Очистите меня уже', en: 'Clean me already' },
    c44:  { he: 'גגות רעפים ופרגולות', ru: 'Черепичные крыши и перголы', en: 'Tiled Roofs & Pergolas' },
    c44s: { he: 'יצירות עץ מושלמות', ru: 'Идеальные изделия из дерева', en: 'Perfect wood creations' },
    c45:  { he: 'גננות ופיתוח סבבתי', ru: 'Озеленение и благоустройство территории', en: 'Gardening & Environmental Development' },
    c45s: { he: 'לכל גינה אופי משלה', ru: 'У каждого сада свой характер', en: 'Every garden has its own character' },
    c46:  { he: 'גבס ודקורציה', ru: 'Гипсокартон и декор', en: 'Drywall & Decoration' },
    c46s: { he: 'מעצבים יצירות', ru: 'Создаём произведения', en: 'Designing works of art' },
    c47:  { he: 'צבע וציפויים', ru: 'Краска и покрытия', en: 'Paint & Coatings' },
    c47s: { he: 'לכם רק נשאר לבחור את הצבע', ru: 'Вам осталось лишь выбрать цвет', en: 'All you have left is to choose the color' },
    c47s2:{ he: 'איזה ריח טוב', ru: 'Какой приятный запах', en: 'What a good smell' },
    c48:  { he: 'אינסטלציה וביוב', ru: 'Сантехника и канализация', en: 'Plumbing & Sewage' },
    c49:  { he: 'חשמל ותקשורת', ru: 'Электрика и связь', en: 'Electricity & Communications' },

    d5_title:  { he: 'חטיבת המיוחדים שלנו', ru: 'Подразделение особых услуг', en: 'Our Specials Division' },
    d5_slogan: { he: 'מובילים שינוי למבנה שלכם !', ru: 'Ведём перемены для вашего здания!', en: 'Leading change for your building!' },
    c51:  { he: 'ניהול ואחזקת מבני מגורים ומסחר', ru: 'Управление и обслуживание жилых и коммерческих зданий', en: 'Management & Maintenance of Residential and Commercial Buildings' },
    c51s: { he: 'משנים אתכם דרך לתחזוקה נכונה', ru: 'Меняем с вами путь к правильному обслуживанию', en: 'Changing the way to proper maintenance with you' },
    c52:  { he: 'תיווך נכסים', ru: 'Посредничество в недвижимости', en: 'Property Brokerage' },

    /* ----- הפרויקטים שלנו ----- */
    proj_eyebrow: { he: 'הפרויקטים שלנו', ru: 'Наши проекты', en: 'Our Projects' },
    filter_all:      { he: 'הכל', ru: 'Все', en: 'All' },
    filter_private:  { he: 'מגזר פרטי', ru: 'Частный сектор', en: 'Private Sector' },
    filter_business: { he: 'מגזר עסקי', ru: 'Коммерческий сектор', en: 'Business Sector' },
    p1: { he: 'יזמות ונדל"ן', ru: 'Девелопмент и недвижимость', en: 'Development & Real Estate' },
    p2: { he: 'שותפויות נדל"ן', ru: 'Партнёрства в недвижимости', en: 'Real-Estate Partnerships' },
    p3: { he: 'מבנים פרטיים', ru: 'Частные здания', en: 'Private Buildings' },
    p4: { he: 'מבנים ציבוריים', ru: 'Общественные здания', en: 'Public Buildings' },
    p5: { he: 'מבני מסחר וקניות', ru: 'Торговые здания', en: 'Commerce & Shopping Buildings' },
    p6: { he: 'קניונים', ru: 'Торговые центры', en: 'Malls' },
    p7: { he: 'בתי מלונות', ru: 'Гостиницы', en: 'Hotels' },
    p8: { he: 'בתי אב', ru: 'Дома для пожилых', en: 'Senior Homes' },
    p9: { he: 'מבנים מיוחדים', ru: 'Особые здания', en: 'Special Buildings' },

    /* ----- השותפים שלנו ----- */
    partners_eyebrow: { he: 'השותפים שלנו', ru: 'Наши партнёры', en: 'Our Partners' },
    partners_title: { he: 'חטיבת השותפים שלנו', ru: 'Подразделение наших партнёров', en: 'Our Partners Division' },
    partners_sub:   { he: 'המותגים והחברות המובלים בישראל', ru: 'Ведущие бренды и компании Израиля', en: 'The leading brands and companies in Israel' },
    partners_badge: { he: 'המותגים המובלים', ru: 'Ведущие бренды', en: 'The leading brands' },
    partners_lead:  { he: 'בית טוב זה משפחה', ru: 'Хороший дом — это семья', en: 'A good home is family' },
    pt1:  { he: 'מטבחים', ru: 'Кухни', en: 'Kitchens' },
    pt1s: { he: 'המטבח זה הלב של הבית', ru: 'Кухня — сердце дома', en: 'The kitchen is the heart of the home' },
    pt2:  { he: 'נגרות בהתאמה אישית', ru: 'Столярные изделия на заказ', en: 'Custom Carpentry' },
    pt2s: { he: 'יוצרים אתכם אומנות חדשה', ru: 'Создаём с вами новое искусство', en: 'Creating new art with you' },
    pt3:  { he: 'רהיטים מעוצבים', ru: 'Дизайнерская мебель', en: 'Designer Furniture' },
    pt3s: { he: 'מצאתי את הרהיט החדש שלי', ru: 'Я нашёл свою новую мебель', en: 'I found my new furniture' },
    pt4:  { he: 'ריצוף וחיפויים', ru: 'Плитка и облицовка', en: 'Flooring & Cladding' },
    pt4s: { he: 'בחירה נכונה משנה את סגנון הבית והמבנה שלנו', ru: 'Правильный выбор меняет стиль нашего дома и здания', en: 'The right choice changes the style of our home and building' },
    pt5:  { he: 'משטחים', ru: 'Столешницы', en: 'Countertops' },
    pt6:  { he: 'פרקטיים', ru: 'Паркет', en: 'Parquet' },
    pt7:  { he: 'צבעיים וציפויים', ru: 'Краски и покрытия', en: 'Paints & Coatings' },
    pt8:  { he: 'כלים סניטריים', ru: 'Сантехника', en: 'Sanitary Ware' },
    pt9:  { he: 'ריהוט ואבזרי אמבט', ru: 'Мебель и аксессуары для ванной', en: 'Bathroom Furniture & Accessories' },
    pt10: { he: 'תאורה', ru: 'Освещение', en: 'Lighting' },
    pt10s:{ he: 'אור מביא אור', ru: 'Свет приносит свет', en: 'Light brings light' },
    pt11: { he: 'דלתות פנים', ru: 'Межкомнатные двери', en: 'Interior Doors' },
    pt12: { he: 'דלתות כניסה', ru: 'Входные двери', en: 'Entrance Doors' },
    pt13: { he: 'שערים וגדרות', ru: 'Ворота и заборы', en: 'Gates & Fences' },
    pt14: { he: 'זגגות בנייה', ru: 'Строительное остекление', en: 'Building Glazing' },
    pt15: { he: 'מסגרות בנייה', ru: 'Строительные металлоконструкции', en: 'Building Metalwork' },
    pt16: { he: 'אלומיניום', ru: 'Алюминий', en: 'Aluminum' },

    /* ----- הצוותים שלנו ----- */
    teams_title:  { he: 'חטיבת הצוותים שלנו', ru: 'Подразделение наших команд', en: 'Our Teams Division' },
    teams_slogan: { he: 'מצוינות ללא פשרות', ru: 'Совершенство без компромиссов', en: 'Excellence without compromise' },
    teams_l1: { he: 'קבלני בית משותפים', ru: 'Подрядчики многоквартирных домов', en: 'Shared-building contractors' },
    teams_l2: { he: 'אמינות ומקצועיות ללא פשרות', ru: 'Надёжность и профессионализм без компромиссов', en: 'Reliability and professionalism without compromise' },
    teams_l3: { he: 'קבלנים מוסמכים', ru: 'Сертифицированные подрядчики', en: 'Certified contractors' },

    /* ----- גלריה ----- */
    gal_title:  { he: 'גלריה בנייה ועיצובים', ru: 'Галерея — строительство и дизайн', en: 'Gallery — Building & Design' },
    gal_slogan: { he: 'לחלום ולהגשים !', ru: 'Мечтать и воплощать!', en: 'To dream and to achieve!' },

    /* ----- מידע לאזרח ולבונה ----- */
    info_title: { he: 'מידע לאזרח ולבונה', ru: 'Информация для клиента и застройщика', en: 'Info for the Citizen & Builder' },
    info_l1: { he: 'עם קצת ידע והכוונה נכונה', ru: 'Немного знаний и правильного наставления', en: 'With a little knowledge and the right guidance' },
    info_l2: { he: 'כל אחד יכול לבנות את מבנה חיו', ru: 'Каждый может построить здание своей жизни', en: 'Anyone can build the building of their life' },
    info_l3: { he: 'חשבנו בשבילכם על הכל', ru: 'Мы подумали для вас обо всём', en: 'We thought of everything for you' },
    info_l4: { he: 'מומלץ לשמוע ברמקול וליהנות מחוויית צפייה אתגרית בידע והכוונה לצרכים שלכם.     שותפים למבנה שלכם !', ru: 'Рекомендуем слушать через динамик и наслаждаться познавательным просмотром с ориентацией на ваши потребности. Партнёры вашего здания!', en: 'We recommend listening on a speaker and enjoying a challenging viewing experience of knowledge and guidance for your needs. Partners of your building!' },
    info_l5: { he: 'האתר מושמע בקריינות והסברה לבונה ולמשפץ', ru: 'Сайт озвучен дикторским сопровождением и пояснениями для строящего и ремонтирующего', en: 'The site is narrated with voice-over and explanations for the builder and renovator' },
    media_label: { he: 'מסך פרסום', ru: 'Рекламный экран', en: 'Advertising screen' },
    media_1: { he: 'סרטון - משמעות הצבע הירוק', ru: 'Видео — значение зелёного цвета', en: 'Video — the meaning of the green color' },
    media_2: { he: 'תמונות רצות', ru: 'Бегущие фотографии', en: 'Running photos' },
    media_3: { he: 'סרטונים של שלבי בניה', ru: 'Видео этапов строительства', en: 'Videos of construction stages' },

    /* ----- צור קשר / קוד משתמש ----- */
    ct_code: { he: 'קוד משתמש', ru: 'Код пользователя', en: 'User Code' },
    ct_t1:   { he: 'המבנה שלכם שווה הרבה !', ru: 'Ваше здание стоит многого!', en: 'Your building is worth a lot!' },
    ct_t2:   { he: 'והוא רק שלכם !', ru: 'И оно только ваше!', en: 'And it is only yours!' },
    ct_dear: { he: 'לקוחות יקרים', ru: 'Дорогие клиенты', en: 'Dear clients' },
    ct_lead: { he: 'לצורך הבטחה על האתר והמשתמשים בו עליכם להירשם באמצעות מספרכם ושמכם וישלח אליכם קוד משתמש', ru: 'Для защиты сайта и его пользователей вам необходимо зарегистрироваться, указав ваш номер и имя, и вам будет отправлен код пользователя', en: 'To secure the site and its users, you must register with your number and name, and a user code will be sent to you' },
    f_first:  { he: 'שם', ru: 'Имя', en: 'First name' },
    f_last:   { he: 'משפחה', ru: 'Фамилия', en: 'Last name' },
    f_phone:  { he: 'טלפון', ru: 'Телефон', en: 'Phone' },
    f_submit: { he: 'שלח', ru: 'Отправить', en: 'Send' },
    f_success:{ he: 'קוד המשתמש בדרך אליכם..     תודה שבחרתם לצפות באתר הבית שלנו', ru: 'Код пользователя уже в пути.. спасибо, что выбрали наш домашний сайт', en: 'Your user code is on its way.. thank you for choosing to view our home site' },

    /* ----- Footer ----- */
    footer_l1:  { he: 'מקווים שהנהנתם לצפות באתר הבית שלנו', ru: 'Надеемся, вам понравился наш домашний сайт', en: 'We hope you enjoyed viewing our home site' },
    footer_l2:  { he: 'נשמח לראותם בין קהל לקוחותינו וממשפחת <bdi>G A D MIVNIM</bdi> בכל מקום במפה', ru: 'Будем рады видеть вас среди наших клиентов и семьи G A D MIVNIM — везде на карте', en: 'We would be glad to see you among our clients and the G A D MIVNIM family — everywhere on the map' },
    footer_copy:{ he: '*** כל הזכויות שמורת לחברת גד מבנים בע"מ ואין לאף אדם או גוף כלשהו לעשות שום שימוש במוצג באתר לשום עניין ודבר.', ru: '*** Все права принадлежат компании «Гад Мивним» Лтд. Никто не вправе использовать представленное на сайте в каких-либо целях.', en: '*** All rights reserved to Gad Mivnim Ltd. No person or entity may make any use of what is presented on this site for any matter.' }
  };

  var STORAGE_KEY = 'gad_lang';

  function applyLanguage(lang) {
    if (!NATIVE[lang]) { lang = 'he'; }

    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', DIR[lang]);
    document.title = DOC_TITLE[lang];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = T[el.getAttribute('data-i18n')];
      if (entry && entry[lang] != null) {
        // רווח קשיח לפני "!" — שהסימן לא יישבר לשורה נפרדת במסך צר
        el.innerHTML = entry[lang].replace(/ !/g, ' !');
      }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var entry = T[el.getAttribute('data-i18n-ph')];
      if (entry && entry[lang] != null) { el.setAttribute('placeholder', entry[lang]); }
    });

    var label = document.getElementById('langLabel');
    if (label) { label.textContent = NATIVE[lang]; }
    document.querySelectorAll('#langMenu [data-lang]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === lang);
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  window.setLanguage = applyLanguage;

  document.addEventListener('DOMContentLoaded', function () {
    var saved = 'he';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'he'; } catch (e) {}
    applyLanguage(saved);

    var switchEl = document.getElementById('langSwitch');
    var btn      = document.getElementById('langBtn');
    var menu     = document.getElementById('langMenu');

    function openMenu()  { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { menu.hidden = true;  btn.setAttribute('aria-expanded', 'false'); }

    if (btn && menu) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (menu.hidden) { openMenu(); } else { closeMenu(); }
      });

      menu.querySelectorAll('[data-lang]').forEach(function (opt) {
        opt.addEventListener('click', function () {
          applyLanguage(opt.getAttribute('data-lang'));
          closeMenu();
        });
      });

      document.addEventListener('click', function (e) {
        if (!switchEl.contains(e.target)) { closeMenu(); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeMenu(); }
      });
    }
  });

})();
