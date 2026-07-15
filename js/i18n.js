/* ==========================================================================
   GAD MIVNIM — רב-לשוני (i18n.js)
   עברית = מילה-במילה מתוך מסמך המקור "אתר אינטרנט GAD MIVNIM 02-03-23.docx".
   רוסית/אנגלית = תרגום נאמן. הבחירה נשמרת ב-localStorage.
   ========================================================================== */

(function () {

  var NATIVE = { he: 'עברית', ru: 'Русский', en: 'English', fr: 'Français' };
  var DIR    = { he: 'rtl',   ru: 'ltr',     en: 'ltr',     fr: 'ltr' };

  var DOC_TITLE = {
    he: 'GAD MIVNIM | גד מבנים — בכל מקום במפה',
    ru: 'GAD MIVNIM — везде на карте',
    en: 'GAD MIVNIM — Everywhere on the Map'
  };

  var T = {
    /* ----- מסך פתיחה ----- */
    welcome_title: { he: 'ברוכים הבאים לאתר הבית שלנו', ru: 'Добро пожаловать на наш домашний сайт', en: 'Welcome to Our Home Site', fr: 'Bienvenue sur notre site maison' },
    welcome_slogan: { he: 'בכל מקום במפה', ru: 'везде на карте', en: 'Everywhere on the Map', fr: 'Partout sur la carte' },
    welcome_enter: { he: 'כניסה לאתר', ru: 'Вход на сайт', en: 'Enter Site', fr: 'Entrer sur le site' },

    /* ----- ניווט ----- */
    nav_home:     { he: 'דף הבית', ru: 'Главная', en: 'Home', fr: 'Accueil' },
    nav_about:    { he: 'אודות הקבוצה', ru: 'О группе', en: 'About the Group', fr: 'À propos du groupe' },
    nav_services: { he: 'השירותים שלנו', ru: 'Наши услуги', en: 'Our Services', fr: 'Nos services' },
    nav_projects: { he: 'הפרויקטים שלנו', ru: 'Наши проекты', en: 'Our Projects', fr: 'Nos projets' },
    nav_partners: { he: 'השותפים שלנו', ru: 'Наши партнёры', en: 'Our Partners', fr: 'Nos partenaires' },
    nav_teams:    { he: 'הצוותים שלנו', ru: 'Наши команды', en: 'Our Teams', fr: 'Nos équipes' },
    nav_gallery:  { he: 'גלריה בנייה ועיצובים', ru: 'Галерея — строительство и дизайн', en: 'Gallery — Building & Design', fr: 'Galerie — construction & design' },
    nav_gallery_short: { he: 'גלריה', ru: 'Галерея', en: 'Gallery', fr: 'Galerie' },
    nav_info:     { he: 'מידע לאזרח', ru: 'Информация', en: 'Citizen Info', fr: 'Info citoyen' },
    nav_contact:  { he: 'צור קשר', ru: 'Связаться', en: 'Contact', fr: 'Contact' },
    nav_podcast:  { he: 'פודקאסט', ru: 'Подкаст', en: 'Podcast', fr: 'Podcast' },
    hero_soon:    { he: 'בקרוב', ru: 'Скоро', en: 'Coming Soon', fr: 'Bientôt' },

    /* ----- Hero ----- */
    hero_title:    { he: '<span class="hero-title__latin">GAD MIVNIM</span> בכל מקום במפה', ru: 'GAD MIVNIM везде на карте', en: 'GAD MIVNIM Everywhere on the Map', fr: 'GAD MIVNIM Partout sur la carte' },
    hero_subtitle: { he: 'משנים את הדרך לבנייה נכונה !', ru: 'Меняем подход к правильному строительству!', en: 'Changing the way to build right!', fr: 'Nous changeons la voie vers une construction juste !' },
    hero_showroom: { he: 'לרשותכם אולם תצוגה לתצוגות בנייה ועיצובים', ru: 'К вашим услугам шоурум строительства и дизайна', en: 'A construction & design showroom at your service', fr: 'Un showroom de construction et de design à votre disposition' },
    hero_location: { he: 'הרצליה ישראל | HERZLIYA ISRAEL', ru: 'הרצליה ישראל | HERZLIYA ISRAEL', en: 'הרצליה ישראל | HERZLIYA ISRAEL', fr: 'הרצליה ישראל | HERZLIYA ISRAEL' },
    hero_podcast:  { he: 'פודקאסט | קבלנים משתפים', ru: 'Подкаст | Подрядчики делятся', en: 'Podcast | Contractors Share', fr: 'Podcast | Les entrepreneurs partagent' },

    /* ----- אודות הקבוצה ----- */
    about_eyebrow: { he: 'אודות הקבוצה', ru: 'О группе', en: 'About the Group', fr: 'À propos du groupe' },
    about_title:   { he: 'מסורת משפחתית', ru: 'Семейная традиция', en: 'A Family Tradition', fr: 'Une tradition familiale' },
    about_p1: { he: 'מייסד הקבוצה והשותפים למלאכה', ru: 'Основатель группы и партнёры по ремеслу', en: 'The group founder and craft partners', fr: 'Le fondateur du groupe et les partenaires du métier' },
    about_p2: { he: 'מדוע נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד ולקבוצה שמנצחת על הכל !', ru: 'Почему родилась идея объединить строительство и дизайн в один дом и в команду, которая побеждает во всём!', en: 'Why the idea was born to unite building and design under one home — and into a group that wins at everything!', fr: 'Pourquoi est née l’idée d’unir la construction et le design sous un même toit, en un groupe qui gagne sur tout !' },
    about_since:   { he: 'מאז ועד היום', ru: 'С тех пор и по сей день', en: 'From then until today', fr: 'Depuis lors et jusqu’à aujourd’hui' },
    about_country: { he: 'המדינה שלנו', ru: 'Наша страна', en: 'Our country', fr: 'Notre pays' },
    about_p3: { he: 'את ערכי היסוד האיכות המקצועיות והיחס המשפחתי והאישי בחרנו כבחירה לאבני היסוד של הקבוצה', ru: 'Базовые ценности — качество, профессионализм, семейное и личное отношение — мы выбрали краеугольными камнями группы', en: 'We chose the core values — quality, professionalism and a personal, family approach — as the cornerstones of the group', fr: 'Les valeurs fondamentales — la qualité, le professionnalisme et la relation familiale et personnelle — nous les avons choisies comme pierres angulaires du groupe' },
    about_p4: { he: 'החברה דוגלת בעבודה שיתופית מלאה', ru: 'Компания привержена полному сотрудничеству', en: 'The company believes in full collaborative work', fr: 'L’entreprise prône un travail collaboratif complet' },
    about_p5: { he: 'ורק ככה נצליח לבנות את ביתנו בהצלחה רבה', ru: 'И только так мы сумеем построить наш дом с большим успехом', en: 'And only this way will we build our home with great success', fr: 'Et c’est seulement ainsi que nous réussirons à bâtir notre maison avec grand succès' },
    about_p6: { he: 'בחירתנו היא שותפות מלאה', ru: 'Наш выбор — полное партнёрство', en: 'Our choice is full partnership', fr: 'Notre choix est un partenariat complet' },
    about_p7: { he: 'לקבלת תוצאות שלא פחות ממצוינות', ru: 'Ради результатов не менее чем превосходных', en: 'For results that are nothing less than excellent', fr: 'Pour des résultats rien de moins qu’excellents' },
    about_p8: { he: 'אווירת שירות משפחתית ואישית לכל לקוח', ru: 'Семейная и личная атмосфера сервиса для каждого клиента', en: 'A family, personal service atmosphere for every client', fr: 'Une atmosphère de service familiale et personnelle pour chaque client' },

    /* ----- השירותים שלנו ----- */
    svc_eyebrow: { he: 'השירותים שלנו', ru: 'Наши услуги', en: 'Our Services', fr: 'Nos services' },
    svc_lead: { he: 'רמת תכנון תיאום ניהול פיקוח וביצוע מהגבוהות ביותר !', ru: 'Высочайший уровень проектирования, координации, управления, надзора и исполнения!', en: 'The highest level of planning, coordination, management, supervision and execution!', fr: 'Un niveau de planification, de coordination, de gestion, de supervision et d’exécution parmi les plus élevés !' },
    svc_b1: { he: 'אבטחה סגורה מעגל סגור 24/7', ru: 'Закрытая охрана, видеонаблюдение 24/7', en: 'Closed security, CCTV 24/7', fr: 'Sécurité fermée, circuit fermé 24/7' },
    svc_b2: { he: 'סובב פרויקטים', ru: 'Вокруг проектов', en: 'Around projects', fr: 'Autour des projets' },
    svc_b3: { he: 'מתאמים לכם פרויקט מושלם', ru: 'Координируем для вас идеальный проект', en: 'Coordinating a perfect project for you', fr: 'Nous coordonnons pour vous un projet parfait' },
    svc_b4: { he: 'חשיבה מחוץ לקופסא', ru: 'Мышление вне рамок', en: 'Thinking outside the box', fr: 'Penser hors du cadre' },

    d1_title:  { he: 'חטיבת תכנון והנדסת בנייה', ru: 'Подразделение проектирования и строительной инженерии', en: 'Planning & Construction Engineering Division', fr: 'Division planification et ingénierie de construction' },
    d1_slogan: { he: 'תכנון נכון , חיסכון מוכח', ru: 'Правильное проектирование — доказанная экономия', en: 'Right planning, proven savings', fr: 'Une bonne planification, une économie prouvée' },
    c11:  { he: 'תאום פרויקטים', ru: 'Координация проектов', en: 'Project Coordination', fr: 'Coordination de projets' },
    c11s: { he: 'מתאמים אתכם פרויקט מושלם', ru: 'Координируем с вами идеальный проект', en: 'Coordinating a perfect project with you', fr: 'Nous coordonnons avec vous un projet parfait' },
    c12:  { he: 'תכנון וליווי פרויקטים', ru: 'Планирование и сопровождение проектов', en: 'Project Planning & Guidance', fr: 'Planification et accompagnement de projets' },
    c12s: { he: 'מתכננים ומלווים אתכם בשותפות מלאה', ru: 'Планируем и сопровождаем вас в полном партнёрстве', en: 'Planning and guiding you in full partnership', fr: 'Nous planifions et vous accompagnons en partenariat complet' },
    c13:  { he: 'אדריכלות והנדסת מבנים', ru: 'Архитектура и инженерия зданий', en: 'Architecture & Structural Engineering', fr: 'Architecture et ingénierie des structures' },
    c13s: { he: 'נוגעים בפרטים הקטנים', ru: 'Внимательны к мелким деталям', en: 'Touching the smallest details', fr: 'Nous soignons les petits détails' },
    c14:  { he: 'עיצוב פנים והדמיות', ru: 'Дизайн интерьера и визуализации', en: 'Interior Design & Renderings', fr: 'Design d’intérieur et rendus' },
    c14s: { he: 'השלב הכי כיפי והמאתגר בפרויקט', ru: 'Самый приятный и сложный этап проекта', en: 'The most fun and challenging stage of the project', fr: 'L’étape la plus amusante et la plus stimulante du projet' },

    d2_title:  { he: 'חטיבת בינוי ותשתיות', ru: 'Подразделение строительства и инфраструктуры', en: 'Construction & Infrastructure Division', fr: 'Division construction et infrastructures' },
    d2_slogan: { he: 'בונים אתכם מבנה נכון', ru: 'Строим с вами правильное здание', en: 'Building the right structure with you', fr: 'Nous bâtissons avec vous une structure juste' },
    c21:  { he: 'בנייה והרחבות מבנים', ru: 'Строительство и расширение зданий', en: 'Construction & Building Extensions', fr: 'Construction et agrandissement de bâtiments' },
    c21s: { he: 'מבנה חדש נולד !', ru: 'Родилось новое здание!', en: 'A new building is born!', fr: 'Un nouveau bâtiment est né !' },
    c22:  { he: 'שיקום שחזור ושימור מבנים', ru: 'Реставрация, восстановление и сохранение зданий', en: 'Building Restoration & Preservation', fr: 'Réhabilitation, restauration et conservation de bâtiments' },
    c22s: { he: 'חובה לשמור על המבנה שלנו', ru: 'Обязаны беречь наше здание', en: 'We must preserve our building', fr: 'Il faut préserver notre bâtiment' },
    c23:  { he: 'שיפוצים והשבחת נכסים', ru: 'Ремонт и повышение стоимости недвижимости', en: 'Renovations & Property Upgrading', fr: 'Rénovations et valorisation de biens' },
    c23s: { he: 'נצייר לכם ציור חדש !', ru: 'Нарисуем вам новую картину!', en: 'We will paint you a new picture!', fr: 'Nous vous peindrons un nouveau tableau !' },
    c24:  { he: 'ליקויי בנייה', ru: 'Строительные дефекты', en: 'Construction Defects', fr: 'Défauts de construction' },
    c24s: { he: 'נתקן את זה !', ru: 'Мы это исправим!', en: 'We will fix it!', fr: 'Nous allons le réparer !' },
    c25:  { he: 'תשתיות ופיתוח', ru: 'Инфраструктура и благоустройство', en: 'Infrastructure & Development', fr: 'Infrastructures et aménagement' },
    c25s: { he: 'הכל מתחיל ביסודות טובים', ru: 'Всё начинается с хорошего фундамента', en: 'Everything starts with good foundations', fr: 'Tout commence par de bonnes fondations' },
    c26:  { he: 'אספלט וכבישים', ru: 'Асфальт и дороги', en: 'Asphalt & Roads', fr: 'Asphalte et routes' },
    c26s: { he: 'גם הכבשים צריכים להיות מושלמים', ru: 'Дороги тоже должны быть идеальными', en: 'The roads must be perfect too', fr: 'Les routes aussi doivent être parfaites' },
    c26s2:{ he: 'חובה לשמור על בטיחות בדרכים !', ru: 'Обязаны соблюдать безопасность на дорогах!', en: 'Road safety must be kept!', fr: 'Il faut préserver la sécurité routière !' },

    d3_title:  { he: 'חטיבת שותפויות נדל"ן', ru: 'Подразделение партнёрств в недвижимости', en: 'Real-Estate Partnerships Division', fr: 'Division partenariats immobiliers' },
    d3_slogan: { he: 'עושים שותפות מתוך כבוד הדדי וערכים משפחתיים', ru: 'Партнёрство на основе взаимного уважения и семейных ценностей', en: 'Partnering out of mutual respect and family values', fr: 'Nous nouons des partenariats dans le respect mutuel et les valeurs familiales' },
    d3_extra:  { he: 'אתם זה אנחנו !  ואנחנו זה אתם !  משפחה !', ru: 'Вы — это мы! А мы — это вы! Семья!', en: 'You are us! And we are you! Family!', fr: 'Vous, c’est nous ! Et nous, c’est vous ! Une famille !' },
    c31:  { he: 'תמ"א 38', ru: 'ТАМА 38', en: 'TAMA 38', fr: 'TAMA 38' },
    c31s: { he: 'נעשה את זה ביחד ובהצלחה גדולה', ru: 'Сделаем это вместе и с большим успехом', en: 'We will do it together, with great success', fr: 'Nous le ferons ensemble et avec un grand succès' },
    c32:  { he: 'פינוי בינוי', ru: 'Снос и новая застройка', en: 'Urban Renewal (Pinui-Binui)', fr: 'Rénovation urbaine (Pinui-Binui)' },
    c32s: { he: 'תמיד כיף לקבל חדש !', ru: 'Всегда приятно получать новое!', en: 'It is always fun to get something new!', fr: 'C’est toujours un plaisir de recevoir du neuf !' },

    d4_title:  { he: 'חטיבת השירותים שלנו', ru: 'Подразделение наших услуг', en: 'Our Services Division', fr: 'Division de nos services' },
    d4_slogan: { he: 'שירות מכל הלב', ru: 'Сервис от всего сердца', en: 'Service from the heart', fr: 'Un service de tout cœur' },
    d4_extra:  { he: 'ישראל שלנו  הארץ שלנו', ru: 'Наш Израиль — наша земля', en: 'Our Israel, our land', fr: 'Notre Israël, notre pays' },
    c41:  { he: 'מערכות בידוד ואיטום', ru: 'Системы изоляции и гидроизоляции', en: 'Insulation & Waterproofing Systems', fr: 'Systèmes d’isolation et d’étanchéité' },
    c41s: { he: 'תמיד חשוב מבנה יבש', ru: 'Сухое здание — всегда важно', en: 'A dry building always matters', fr: 'Un bâtiment sec, c’est toujours important' },
    c42:  { he: 'עבודות בגבהים', ru: 'Высотные работы', en: 'Work at Heights', fr: 'Travaux en hauteur' },
    c42s: { he: 'פותרים לכם את הגובה', ru: 'Решаем для вас вопрос высоты', en: 'Solving the height for you', fr: 'Nous résolvons pour vous la hauteur' },
    c43:  { he: 'ניקוי חול והתזות', ru: 'Пескоструйная очистка и напыление', en: 'Sandblasting & Spraying', fr: 'Sablage et projection' },
    c43s: { he: 'תנקו אותי כבר', ru: 'Очистите меня уже', en: 'Clean me already', fr: 'Nettoyez-moi enfin' },
    c44:  { he: 'גגות רעפים ופרגולות', ru: 'Черепичные крыши и перголы', en: 'Tiled Roofs & Pergolas', fr: 'Toitures en tuiles et pergolas' },
    c44s: { he: 'יצירות עץ מושלמות', ru: 'Идеальные изделия из дерева', en: 'Perfect wood creations', fr: 'Des créations en bois parfaites' },
    c45:  { he: 'גננות ופיתוח סבבתי', ru: 'Озеленение и благоустройство территории', en: 'Gardening & Environmental Development', fr: 'Jardinage et aménagement paysager' },
    c45s: { he: 'לכל גינה אופי משלה', ru: 'У каждого сада свой характер', en: 'Every garden has its own character', fr: 'Chaque jardin a son propre caractère' },
    c46:  { he: 'גבס ודקורציה', ru: 'Гипсокартон и декор', en: 'Drywall & Decoration', fr: 'Plâtre et décoration' },
    c46s: { he: 'מעצבים יצירות', ru: 'Создаём произведения', en: 'Designing works of art', fr: 'Nous concevons des créations' },
    c47:  { he: 'צבע וציפויים', ru: 'Краска и покрытия', en: 'Paint & Coatings', fr: 'Peinture et revêtements' },
    c47s: { he: 'לכם רק נשאר לבחור את הצבע', ru: 'Вам осталось лишь выбрать цвет', en: 'All you have left is to choose the color', fr: 'Il ne vous reste plus qu’à choisir la couleur' },
    c47s2:{ he: 'איזה ריח טוב', ru: 'Какой приятный запах', en: 'What a good smell', fr: 'Quelle bonne odeur' },
    c48:  { he: 'אינסטלציה וביוב', ru: 'Сантехника и канализация', en: 'Plumbing & Sewage', fr: 'Plomberie et assainissement' },
    c49:  { he: 'חשמל ותקשורת', ru: 'Электрика и связь', en: 'Electricity & Communications', fr: 'Électricité et communications' },

    d5_title:  { he: 'חטיבת המיוחדים שלנו', ru: 'Подразделение особых услуг', en: 'Our Specials Division', fr: 'Division de nos spécialités' },
    d5_slogan: { he: 'מובילים שינוי למבנה שלכם !', ru: 'Ведём перемены для вашего здания!', en: 'Leading change for your building!', fr: 'Nous menons le changement pour votre bâtiment !' },
    c51:  { he: 'ניהול ואחזקת מבני מגורים ומסחר', ru: 'Управление и обслуживание жилых и коммерческих зданий', en: 'Management & Maintenance of Residential and Commercial Buildings', fr: 'Gestion et entretien de bâtiments résidentiels et commerciaux' },
    c51s: { he: 'משנים אתכם דרך לתחזוקה נכונה', ru: 'Меняем с вами путь к правильному обслуживанию', en: 'Changing the way to proper maintenance with you', fr: 'Nous changeons avec vous la voie vers un entretien juste' },
    c52:  { he: 'תיווך נכסים', ru: 'Посредничество в недвижимости', en: 'Property Brokerage', fr: 'Courtage immobilier' },

    /* ----- הפרויקטים שלנו ----- */
    proj_eyebrow: { he: 'הפרויקטים שלנו', ru: 'Наши проекты', en: 'Our Projects', fr: 'Nos projets' },
    filter_all:      { he: 'הכל', ru: 'Все', en: 'All', fr: 'Tout' },
    filter_private:  { he: 'מגזר פרטי', ru: 'Частный сектор', en: 'Private Sector', fr: 'Secteur privé' },
    filter_business: { he: 'מגזר עסקי', ru: 'Коммерческий сектор', en: 'Business Sector', fr: 'Secteur commercial' },
    p1: { he: 'יזמות ונדל"ן', ru: 'Девелопмент и недвижимость', en: 'Development & Real Estate', fr: 'Promotion et immobilier' },
    p2: { he: 'שותפויות נדל"ן', ru: 'Партнёрства в недвижимости', en: 'Real-Estate Partnerships', fr: 'Partenariats immobiliers' },
    p3: { he: 'מבנים פרטיים', ru: 'Частные здания', en: 'Private Buildings', fr: 'Bâtiments privés' },
    p4: { he: 'מבנים ציבוריים', ru: 'Общественные здания', en: 'Public Buildings', fr: 'Bâtiments publics' },
    p5: { he: 'מבני מסחר וקניות', ru: 'Торговые здания', en: 'Commerce & Shopping Buildings', fr: 'Bâtiments de commerce et de shopping' },
    p6: { he: 'קניונים', ru: 'Торговые центры', en: 'Malls', fr: 'Centres commerciaux' },
    p7: { he: 'בתי מלונות', ru: 'Гостиницы', en: 'Hotels', fr: 'Hôtels' },
    p8: { he: 'בתי אב', ru: 'Дома для пожилых', en: 'Senior Homes', fr: 'Maisons de retraite' },
    p9: { he: 'מבנים מיוחדים', ru: 'Особые здания', en: 'Special Buildings', fr: 'Bâtiments spéciaux' },

    /* ----- השותפים שלנו ----- */
    partners_eyebrow: { he: 'השותפים שלנו', ru: 'Наши партнёры', en: 'Our Partners', fr: 'Nos partenaires' },
    partners_title: { he: 'חטיבת השותפים שלנו', ru: 'Подразделение наших партнёров', en: 'Our Partners Division', fr: 'Division de nos partenaires' },
    partners_sub:   { he: 'המותגים והחברות המובלים בישראל', ru: 'Ведущие бренды и компании Израиля', en: 'The leading brands and companies in Israel', fr: 'Les marques et entreprises leaders en Israël' },
    partners_badge: { he: 'המותגים המובלים', ru: 'Ведущие бренды', en: 'The leading brands', fr: 'Les marques leaders' },
    partners_lead:  { he: 'בית טוב זה משפחה', ru: 'Хороший дом — это семья', en: 'A good home is family', fr: 'Une bonne maison, c’est une famille' },
    pt1:  { he: 'מטבחים', ru: 'Кухни', en: 'Kitchens', fr: 'Cuisines' },
    pt1s: { he: 'המטבח זה הלב של הבית', ru: 'Кухня — сердце дома', en: 'The kitchen is the heart of the home', fr: 'La cuisine est le cœur de la maison' },
    pt2:  { he: 'נגרות בהתאמה אישית', ru: 'Столярные изделия на заказ', en: 'Custom Carpentry', fr: 'Menuiserie sur mesure' },
    pt2s: { he: 'יוצרים אתכם אומנות חדשה', ru: 'Создаём с вами новое искусство', en: 'Creating new art with you', fr: 'Nous créons avec vous un art nouveau' },
    pt3:  { he: 'רהיטים מעוצבים', ru: 'Дизайнерская мебель', en: 'Designer Furniture', fr: 'Meubles design' },
    pt3s: { he: 'מצאתי את הרהיט החדש שלי', ru: 'Я нашёл свою новую мебель', en: 'I found my new furniture', fr: 'J’ai trouvé mon nouveau meuble' },
    pt4:  { he: 'ריצוף וחיפויים', ru: 'Плитка и облицовка', en: 'Flooring & Cladding', fr: 'Revêtements de sol et parements' },
    pt4s: { he: 'בחירה נכונה משנה את סגנון הבית והמבנה שלנו', ru: 'Правильный выбор меняет стиль нашего дома и здания', en: 'The right choice changes the style of our home and building', fr: 'Un bon choix change le style de notre maison et de notre bâtiment' },
    pt5:  { he: 'משטחים', ru: 'Столешницы', en: 'Countertops', fr: 'Plans de travail' },
    pt6:  { he: 'פרקטיים', ru: 'Паркет', en: 'Parquet', fr: 'Parquets' },
    pt7:  { he: 'צבעיים וציפויים', ru: 'Краски и покрытия', en: 'Paints & Coatings', fr: 'Peintures et revêtements' },
    pt8:  { he: 'כלים סניטריים', ru: 'Сантехника', en: 'Sanitary Ware', fr: 'Sanitaires' },
    pt9:  { he: 'ריהוט ואבזרי אמבט', ru: 'Мебель и аксессуары для ванной', en: 'Bathroom Furniture & Accessories', fr: 'Mobilier et accessoires de salle de bain' },
    pt10: { he: 'תאורה', ru: 'Освещение', en: 'Lighting', fr: 'Éclairage' },
    pt10s:{ he: 'אור מביא אור', ru: 'Свет приносит свет', en: 'Light brings light', fr: 'La lumière apporte la lumière' },
    pt11: { he: 'דלתות פנים', ru: 'Межкомнатные двери', en: 'Interior Doors', fr: 'Portes intérieures' },
    pt12: { he: 'דלתות כניסה', ru: 'Входные двери', en: 'Entrance Doors', fr: 'Portes d’entrée' },
    pt13: { he: 'שערים וגדרות', ru: 'Ворота и заборы', en: 'Gates & Fences', fr: 'Portails et clôtures' },
    pt14: { he: 'זגגות בנייה', ru: 'Строительное остекление', en: 'Building Glazing', fr: 'Vitrage de construction' },
    pt15: { he: 'מסגרות בנייה', ru: 'Строительные металлоконструкции', en: 'Building Metalwork', fr: 'Serrurerie de construction' },
    pt16: { he: 'אלומיניום', ru: 'Алюминий', en: 'Aluminum', fr: 'Aluminium' },

    /* ----- הצוותים שלנו ----- */
    teams_title:  { he: 'חטיבת הצוותים שלנו', ru: 'Подразделение наших команд', en: 'Our Teams Division', fr: 'Division de nos équipes' },
    teams_slogan: { he: 'מצוינות ללא פשרות', ru: 'Совершенство без компромиссов', en: 'Excellence without compromise', fr: 'L’excellence sans compromis' },
    teams_l1: { he: 'קבלני בית משותפים', ru: 'Подрядчики многоквартирных домов', en: 'Shared-building contractors', fr: 'Entrepreneurs de copropriétés' },
    teams_l2: { he: 'אמינות ומקצועיות ללא פשרות', ru: 'Надёжность и профессионализм без компромиссов', en: 'Reliability and professionalism without compromise', fr: 'Fiabilité et professionnalisme sans compromis' },
    teams_l3: { he: 'קבלנים מוסמכים', ru: 'Сертифицированные подрядчики', en: 'Certified contractors', fr: 'Entrepreneurs agréés' },

    /* ----- גלריה ----- */
    gal_title:  { he: 'גלריה בנייה ועיצובים', ru: 'Галерея — строительство и дизайн', en: 'Gallery — Building & Design', fr: 'Galerie construction et design' },
    gal_slogan: { he: 'לחלום ולהגשים !', ru: 'Мечтать и воплощать!', en: 'To dream and to achieve!', fr: 'Rêver et réaliser !' },

    /* ----- מידע לאזרח ולבונה ----- */
    info_title: { he: 'מידע לאזרח ולבונה', ru: 'Информация для клиента и застройщика', en: 'Info for the Citizen & Builder', fr: 'Info pour le citoyen et le bâtisseur' },
    info_l1: { he: 'עם קצת ידע והכוונה נכונה', ru: 'Немного знаний и правильного наставления', en: 'With a little knowledge and the right guidance', fr: 'Avec un peu de savoir et un bon accompagnement' },
    info_l2: { he: 'כל אחד יכול לבנות את מבנה חיו', ru: 'Каждый может построить здание своей жизни', en: 'Anyone can build the building of their life', fr: 'Chacun peut bâtir le bâtiment de sa vie' },
    info_l3: { he: 'חשבנו בשבילכם על הכל', ru: 'Мы подумали для вас обо всём', en: 'We thought of everything for you', fr: 'Nous avons pensé à tout pour vous' },
    info_l4: { he: 'מומלץ לשמוע ברמקול וליהנות מחוויית צפייה אתגרית בידע והכוונה לצרכים שלכם.     שותפים למבנה שלכם !', ru: 'Рекомендуем слушать через динамик и наслаждаться познавательным просмотром с ориентацией на ваши потребности. Партнёры вашего здания!', en: 'We recommend listening on a speaker and enjoying a challenging viewing experience of knowledge and guidance for your needs. Partners of your building!', fr: 'Nous recommandons d’écouter au haut-parleur et de profiter d’une expérience de visionnage stimulante, riche en savoir et en conseils adaptés à vos besoins. Partenaires de votre bâtiment !' },
    info_l5: { he: 'האתר מושמע בקריינות והסברה לבונה ולמשפץ', ru: 'Сайт озвучен дикторским сопровождением и пояснениями для строящего и ремонтирующего', en: 'The site is narrated with voice-over and explanations for the builder and renovator', fr: 'Le site est commenté en voix off avec des explications pour le bâtisseur et le rénovateur' },
    media_label: { he: 'מסך פרסום', ru: 'Рекламный экран', en: 'Advertising screen', fr: 'Écran publicitaire' },
    media_1: { he: 'סרטון - משמעות הצבע הירוק', ru: 'Видео — значение зелёного цвета', en: 'Video — the meaning of the green color', fr: 'Vidéo — la signification de la couleur verte' },
    media_2: { he: 'תמונות רצות', ru: 'Бегущие фотографии', en: 'Running photos', fr: 'Photos défilantes' },
    media_3: { he: 'סרטונים של שלבי בניה', ru: 'Видео этапов строительства', en: 'Videos of construction stages', fr: 'Vidéos des étapes de construction' },

    /* ----- צור קשר / קוד משתמש ----- */
    ct_code: { he: 'קוד משתמש', ru: 'Код пользователя', en: 'User Code', fr: 'Code utilisateur' },
    ct_t1:   { he: 'המבנה שלכם שווה הרבה !', ru: 'Ваше здание стоит многого!', en: 'Your building is worth a lot!', fr: 'Votre bâtiment vaut beaucoup !' },
    ct_t2:   { he: 'והוא רק שלכם !', ru: 'И оно только ваше!', en: 'And it is only yours!', fr: 'Et il n’est qu’à vous !' },
    ct_dear: { he: 'לקוחות יקרים', ru: 'Дорогие клиенты', en: 'Dear clients', fr: 'Chers clients' },
    ct_lead: { he: 'לצורך הבטחה על האתר והמשתמשים בו עליכם להירשם באמצעות מספרכם ושמכם וישלח אליכם קוד משתמש', ru: 'Для защиты сайта и его пользователей вам необходимо зарегистрироваться, указав ваш номер и имя, и вам будет отправлен код пользователя', en: 'To secure the site and its users, you must register with your number and name, and a user code will be sent to you', fr: 'Afin de sécuriser le site et ses utilisateurs, vous devez vous inscrire avec votre numéro et votre nom, et un code utilisateur vous sera envoyé' },
    f_first:  { he: 'שם', ru: 'Имя', en: 'First name', fr: 'Prénom' },
    f_last:   { he: 'משפחה', ru: 'Фамилия', en: 'Last name', fr: 'Nom' },
    f_phone:  { he: 'טלפון', ru: 'Телефон', en: 'Phone', fr: 'Téléphone' },
    f_submit: { he: 'שלח', ru: 'Отправить', en: 'Send', fr: 'Envoyer' },
    f_success:{ he: 'קוד המשתמש בדרך אליכם..     תודה שבחרתם לצפות באתר הבית שלנו', ru: 'Код пользователя уже в пути.. спасибо, что выбрали наш домашний сайт', en: 'Your user code is on its way.. thank you for choosing to view our home site', fr: 'Votre code utilisateur est en route.. merci d’avoir choisi de visiter notre site maison' },

    /* ----- Footer ----- */
    footer_l1:  { he: 'מקווים שהנהנתם לצפות באתר הבית שלנו', ru: 'Надеемся, вам понравился наш домашний сайт', en: 'We hope you enjoyed viewing our home site', fr: 'Nous espérons que vous avez apprécié la visite de notre site maison' },
    footer_l2:  { he: 'נשמח לראותם בין קהל לקוחותינו וממשפחת <bdi>G A D MIVNIM</bdi> בכל מקום במפה', ru: 'Будем рады видеть вас среди наших клиентов и семьи G A D MIVNIM — везде на карте', en: 'We would be glad to see you among our clients and the G A D MIVNIM family — everywhere on the map', fr: 'Nous serons ravis de vous compter parmi nos clients et la famille <bdi>G A D MIVNIM</bdi> — partout sur la carte' },
    footer_copy:{ he: '*** כל הזכויות שמורת לחברת גד מבנים בע"מ ואין לאף אדם או גוף כלשהו לעשות שום שימוש במוצג באתר לשום עניין ודבר.', ru: '*** Все права принадлежат компании «Гад Мивним» Лтд. Никто не вправе использовать представленное на сайте в каких-либо целях.', en: '*** All rights reserved to Gad Mivnim Ltd. No person or entity may make any use of what is presented on this site for any matter.', fr: '*** Tous droits réservés à la société Gad Mivnim Ltd. Aucune personne ni entité n’est autorisée à faire quelque usage que ce soit de ce qui est présenté sur le site, à quelque fin que ce soit.' }
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
    var flag = document.getElementById('langFlag');
    if (flag) { flag.className = 'flag flag-' + lang; }
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
