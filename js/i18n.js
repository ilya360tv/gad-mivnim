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
    nav_info:     { he: 'מידע לאזרח ולבונה', ru: 'Инфо гражданам', en: 'Citizen & Builder Info', fr: 'Info citoyen' },
    nav_contact:  { he: 'צור קשר', ru: 'Связаться', en: 'Contact', fr: 'Contact' },
    nav_podcast:  { he: 'פודקאסט', ru: 'Подкаст', en: 'Podcast', fr: 'Podcast' },
    nav_in_progress:   { he: 'פרויקטים בביצוע', ru: 'Текущие проекты', en: 'Projects in Progress', fr: 'Projets en cours' },
    nav_careers:       { he: 'דרושים', ru: 'Вакансии', en: 'Careers', fr: 'Recrutement' },
    /* ----- פרויקטים בביצוע ----- */
    ip_lead:     { he: 'פרויקטים שנמצאים כעת בעבודה - מתעדכן באופן שוטף', ru: 'Проекты, над которыми мы работаем сейчас — обновляется регулярно', en: 'Projects currently under construction — updated regularly', fr: 'Projets actuellement en cours de réalisation — mis à jour régulièrement' },
    ip_status:   { he: 'בביצוע', ru: 'В работе', en: 'In Progress', fr: 'En cours' },
    ip_name:     { he: 'שם הפרויקט', ru: 'Название проекта', en: 'Project name', fr: 'Nom du projet' },
    ip_loc:      { he: 'מיקום', ru: 'Местоположение', en: 'Location', fr: 'Emplacement' },
    ip_progress: { he: 'התקדמות', ru: 'Ход работ', en: 'Progress', fr: 'Avancement' },

    /* ----- דרושים ----- */
    car_title:  { he: 'בואו לבנות איתנו', ru: 'Стройте вместе с нами', en: 'Come Build With Us', fr: 'Venez construire avec nous' },
    car_lead:   { he: 'אנחנו תמיד מחפשים אנשי מקצוע איכותיים להצטרף למשפחת GAD MIVNIM', ru: 'Мы всегда ищем качественных профессионалов в семью GAD MIVNIM', en: 'We are always looking for quality professionals to join the GAD MIVNIM family', fr: 'Nous recherchons toujours des professionnels de qualité pour rejoindre la famille GAD MIVNIM' },
    car_r1:     { he: 'מנהלי עבודה', ru: 'Прорабы', en: 'Site Managers', fr: 'Chefs de chantier' },
    car_r1s:    { he: 'אחראים על השטח, על לוח הזמנים ועל האיכות', ru: 'Отвечают за площадку, сроки и качество', en: 'In charge of the site, the schedule and the quality', fr: 'Responsables du chantier, du planning et de la qualité' },
    car_r2:     { he: 'קבלני משנה ובעלי מקצוע', ru: 'Субподрядчики и мастера', en: 'Subcontractors & Tradespeople', fr: 'Sous-traitants et artisans' },
    car_r2s:    { he: 'בעלי מקצוע מנוסים לעבודה משותפת לאורך זמן', ru: 'Опытные мастера для долгосрочного сотрудничества', en: 'Experienced professionals for long-term cooperation', fr: 'Des professionnels expérimentés pour une collaboration durable' },
    car_r3:     { he: 'מהנדסים ואדריכלים', ru: 'Инженеры и архитекторы', en: 'Engineers & Architects', fr: 'Ingénieurs et architectes' },
    car_r3s:    { he: 'תכנון והנדסה ברמה הגבוהה ביותר', ru: 'Проектирование и инженерия высочайшего уровня', en: 'Planning and engineering at the highest level', fr: 'Conception et ingénierie au plus haut niveau' },
    car_r4:     { he: 'אנשי משרד ושירות', ru: 'Офис и сервис', en: 'Office & Service Staff', fr: 'Personnel de bureau et de service' },
    car_r4s:    { he: 'שירות אישי וחם לכל לקוח', ru: 'Личный и тёплый сервис для каждого клиента', en: 'Personal, warm service for every client', fr: 'Un service personnel et chaleureux pour chaque client' },
    car_btn:    { he: 'שלחו קורות חיים', ru: 'Отправить резюме', en: 'Send Your CV', fr: 'Envoyer votre CV' },
    car_f_name: { he: 'שם מלא', ru: 'Полное имя', en: 'Full name', fr: 'Nom complet' },
    car_f_field:{ he: 'תחום', ru: 'Направление', en: 'Field', fr: 'Domaine' },
    car_f_pick: { he: 'בחרו תחום', ru: 'Выберите направление', en: 'Choose a field', fr: 'Choisissez un domaine' },
    car_submit: { he: 'שליחה', ru: 'Отправить', en: 'Submit', fr: 'Envoyer' },
    car_success:{ he: 'תודה! קיבלנו את הפרטים ונחזור אליכם בהקדם', ru: 'Спасибо! Мы получили ваши данные и скоро свяжемся с вами', en: 'Thank you! We received your details and will get back to you soon', fr: 'Merci ! Nous avons bien reçu vos informations et vous recontacterons rapidement' },

    hero_soon:    { he: 'בקרוב', ru: 'Скоро', en: 'Coming Soon', fr: 'Bientôt' },

    /* ----- Hero ----- */
    hero_title:    { he: '<img class="hero-title__logo" src="images/logo55.svg" alt="GAD MIVNIM גד מבנים" width="256" height="256" decoding="async"> בכל מקום במפה', ru: '<img class="hero-title__logo" src="images/logo55.svg" alt="GAD MIVNIM גד מבנים" width="256" height="256" decoding="async"> везде на карте', en: '<img class="hero-title__logo" src="images/logo55.svg" alt="GAD MIVNIM גד מבנים" width="256" height="256" decoding="async"> Everywhere on the Map', fr: '<img class="hero-title__logo" src="images/logo55.svg" alt="GAD MIVNIM גד מבנים" width="256" height="256" decoding="async"> Partout sur la carte' },
    hero_subtitle: { he: 'משנים את הדרך לבנייה נכונה !', ru: 'Меняем подход к правильному строительству!', en: 'Changing the way to build right!', fr: 'Nous changeons la voie vers une construction juste !' },
    hero_showroom: { he: 'לרשותכם אולם תצוגה לתצוגות בנייה ועיצובים', ru: 'К вашим услугам шоурум строительства и дизайна', en: 'A construction & design showroom at your service', fr: 'Un showroom de construction et de design à votre disposition' },
    hero_location: { he: 'הרצליה ישראל | HERZLIYA ISRAEL', ru: 'הרצליה ישראל | HERZLIYA ISRAEL', en: 'הרצליה ישראל | HERZLIYA ISRAEL', fr: 'הרצליה ישראל | HERZLIYA ISRAEL' },
    hero_podcast:  { he: 'פודקאסט | אנשים משתפים', ru: 'Подкаст | Люди делятся', en: 'Podcast | People Share', fr: 'Podcast | Les gens partagent' },

    /* ----- אודות הקבוצה ----- */
    about_eyebrow: { he: 'אודות הקבוצה', ru: 'О группе', en: 'About the Group', fr: 'À propos du groupe' },
    about_title: { he: 'מדוע נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד ולקבוצה אחת שמנצחת על הכל !', ru: 'Почему родилась идея объединить строительство и дизайн в одном доме и в одной группе, которая ведёт всё!', en: 'Why the idea was born to unite construction and design under one roof, in one group that leads it all!', fr: 'Pourquoi l\'idée est née d\'unir construction et design sous un même toit, dans un seul groupe qui mène le tout !' },
    ab_p1: { he: '<bdi>GAD MIVNIM</bdi> היא קבוצת בנייה ועיצובים מבית "קבוצת בנהר בע"מ - יזמות והשקעות" המשמשת כחברת בת ליזמות ביצוע ניהול פיקוח ותאום פרויקטים בבניה. <bdi>GAD MIVNIM</bdi> מלווה בעלי בתים, ועדי בתים, מוסדות ציבוריים ויזמים מהרעיון הראשוני ועד מסירת המפתח. משהו שהתחיל כחזון פשוט הפך לשיטת עבודה ומהפכה בענף הבניה. כל מה שבית צריך תחת קורת גג אחת.', ru: '<bdi>GAD MIVNIM</bdi> — это строительно-дизайнерская группа компании «Бнехар Лтд — предпринимательство и инвестиции», выступающая дочерней компанией по предпринимательству, исполнению, управлению, надзору и координации строительных проектов. <bdi>GAD MIVNIM</bdi> сопровождает домовладельцев, домовые комитеты, общественные учреждения и застройщиков от первоначальной идеи до передачи ключей. То, что начиналось как простое видение, стало методом работы и революцией в строительной отрасли. Всё, что нужно дому, — под одной крышей.', en: '<bdi>GAD MIVNIM</bdi> is a construction and design group from "Bnehar Group Ltd. – Entrepreneurship and Investments", serving as a subsidiary for project development, execution, management, supervision and coordination in construction. <bdi>GAD MIVNIM</bdi> accompanies homeowners, building committees, public institutions and developers from the initial idea to the handover of the keys. Something that began as a simple vision became a working method and a revolution in the construction industry. Everything a home needs, under one roof.', fr: '<bdi>GAD MIVNIM</bdi> est un groupe de construction et de design issu de « Bnehar Group Ltd – Entrepreneuriat et Investissements », qui fait office de filiale pour la promotion, l\'exécution, la gestion, la supervision et la coordination de projets de construction. <bdi>GAD MIVNIM</bdi> accompagne propriétaires, comités d\'immeubles, institutions publiques et promoteurs, de l\'idée initiale à la remise des clés. Ce qui a commencé comme une vision simple est devenu une méthode de travail et une révolution dans le secteur de la construction. Tout ce dont une maison a besoin, sous un même toit.' },
    ab_p2: { he: 'מייסד הקבוצה והשותפים למלאכה מביאים איתם ניסיון רב שנים מאז 1995 ועד היום שנבנה מתוך עשייה אמיתית בשטח, הכישורים והיכולות אשר אותם צברו. מתוך הניסיון הזה נולד חזון אחד לאחד את שירותי הבנייה והעיצובים תחת קורת גג אחת שמלווה את כל שלבי הפרויקט משלב הרעיון, דרך התכנון ההנדסי הבנייה ועד לשלב המפתח.', ru: 'Основатель группы и партнёры по ремеслу привносят многолетний опыт с 1995 года по сей день, выстроенный на реальной работе в полях, а также навыки и способности, которые они накопили. Из этого опыта родилось одно видение — объединить строительные и дизайнерские услуги под одной крышей, сопровождающей все этапы проекта: от идеи через инженерное проектирование и строительство до выдачи ключей.', en: 'The group\'s founder and partners in the craft bring many years of experience, from 1995 to this day, built on real hands-on work in the field, along with the skills and abilities they have accumulated. From this experience one vision was born: to unite construction and design services under one roof that accompanies every stage of the project, from the initial idea, through engineering planning and construction, to the handover of the keys.', fr: 'Le fondateur du groupe et ses partenaires apportent de nombreuses années d\'expérience, de 1995 à aujourd\'hui, construite sur un véritable travail de terrain, ainsi que les compétences et capacités qu\'ils ont acquises. De cette expérience est née une vision : réunir les services de construction et de design sous un même toit, qui accompagne toutes les étapes du projet, de l\'idée, en passant par la conception technique et la construction, jusqu\'à la remise des clés.' },
    ab_p3: { he: 'כך נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד, שנותן מענה מלא לכל פרויקט.', ru: 'Так родилась идея объединить строительство и дизайн в одном доме, который даёт полный ответ для каждого проекта.', en: 'This is how the idea was born to unite construction and design in one house, giving a complete answer to every project.', fr: 'C\'est ainsi qu\'est née l\'idée d\'unir construction et design dans une seule maison, qui apporte une réponse complète à chaque projet.' },
    ab_h1: { he: 'הערכים שלנו', ru: 'Наши ценности', en: 'Our values', fr: 'Nos valeurs' },
    ab_p4: { he: 'את ערכי היסוד, האיכות, המקצועיות והיחס המשפחתי והאישי, בחרנו כאבני היסוד של הקבוצה.', ru: 'Основные ценности — качество, профессионализм, семейное и личное отношение — мы выбрали краеугольными камнями группы.', en: 'We chose the core values — quality, professionalism, and a family-like, personal approach — as the cornerstones of the group.', fr: 'Nous avons choisi les valeurs fondamentales — la qualité, le professionnalisme et une approche familiale et personnelle — comme pierres angulaires du groupe.' },
    ab_p5: { he: 'בחירתנו היא שותפות מלאה לקבלת תוצאות שלא פחות ממצוינות.', ru: 'Наш выбор — полное партнёрство ради результатов не ниже отличных.', en: 'Our choice is full partnership, to achieve results that are nothing less than excellent.', fr: 'Notre choix est un partenariat total, pour obtenir des résultats tout simplement excellents.' },
    ab_h5: { he: 'חטיבות הקבוצה', ru: 'Подразделения группы', en: 'The Group\'s Divisions', fr: 'Les divisions du groupe' },
    ab_p10: { he: '<bdi>GAD MIVNIM</bdi> מחלקת את שלבי הפרויקט בין חטיבות הקבוצה ע"מ לתת מענה יעיל ומקצועי לביצוע ניהול פיקוח ותאום הפרויקט בצורה הכי טובה עבור הלקוח ומהות הפרויקט.', ru: '<bdi>GAD MIVNIM</bdi> распределяет этапы проекта между подразделениями группы, чтобы обеспечить эффективное и профессиональное исполнение, управление, надзор и координацию проекта наилучшим образом для клиента и с учётом сути проекта.', en: '<bdi>GAD MIVNIM</bdi> divides the project stages among the group\'s divisions in order to provide an efficient and professional response for the execution, management, supervision and coordination of the project, in the best way for the client and the nature of the project.', fr: '<bdi>GAD MIVNIM</bdi> répartit les étapes du projet entre les divisions du groupe afin d\'apporter une réponse efficace et professionnelle à l\'exécution, à la gestion, à la supervision et à la coordination du projet, de la meilleure manière pour le client et selon la nature du projet.' },
    ab_h2: { he: 'אנשי מקצוע מהשורה הראשונה', ru: 'Профессионалы высшего уровня', en: 'First-rate professionals', fr: 'Des professionnels de premier plan' },
    ab_p6: { he: 'לרשות הקבוצה עומדים בעלי מקצוע וקבלנים משותפים מהשורה הראשונה ובעלי הסמכה כל אחד בתחמו אשר נבחרים בקפידה רבה וללא פשרות על שירות מסור, מקצועי אדיב ומשפחתי לכל לקוח.', ru: 'В распоряжении группы — партнёрские специалисты и подрядчики высшего уровня, сертифицированные каждый в своей области, тщательно отобранные без компромиссов ради преданного, профессионального, вежливого и семейного обслуживания каждого клиента.', en: 'The group has first-rate professionals and partner contractors, each certified in their field, carefully selected without compromise for dedicated, professional, courteous and family-style service to every client.', fr: 'Le groupe dispose de professionnels et d\'entrepreneurs partenaires de premier plan, certifiés chacun dans son domaine, sélectionnés avec le plus grand soin et sans compromis pour un service dévoué, professionnel, courtois et familial auprès de chaque client.' },
    ab_p7: { he: 'כחברה וכקבוצה אנחנו תמיד לומדים ומיישמים תהליכים בענף הבנייה והעיצובים בארץ ובעולם', ru: 'Как компания и как группа мы всегда учимся и внедряем процессы в строительной и дизайнерской отрасли в Израиле и в мире', en: 'As a company and as a group, we are always learning and implementing processes in the construction and design industry in Israel and around the world', fr: 'En tant qu\'entreprise et en tant que groupe, nous apprenons et mettons toujours en œuvre des processus dans le secteur de la construction et du design en Israël et dans le monde' },
    ab_h3: { he: 'אולם תצוגה – הכל במקום אחד ! (בקרוב ...)', ru: 'Шоурум — всё в одном месте! (скоро ...)', en: 'Showroom – everything in one place! (coming soon ...)', fr: 'Showroom – tout en un seul endroit ! (bientôt ...)' },
    ab_p8: { he: 'לרשות לקוחות <bdi>GAD MIVNIM</bdi> עומד אולם תצוגה לתצוגות בנייה ועיצובים הנותן את כל השירותים הרלוונטיים והשלבים אותם אתם הלקוחות צריכים. באולם התצוגה אתם תקבלו יחס אישי ומשפחתי, עמדת אירוח ותהנו מחוויית תצוגות וחידושים בענף הבנייה והעיצובים וממיטב המותגים המבולים בישראל ובעולם. תפגשו את מיטב בעלי המקצוע הנותן לכם הלקוחות את היוחלט להחליט מה הכי טוב עבורכם. שכך אין צורך להתרוצץ בין בעלי מקצוע, קבלנים, נותני שירותים וספקים שונים.', ru: 'В распоряжении клиентов <bdi>GAD MIVNIM</bdi> — шоурум строительных и дизайнерских экспозиций, предоставляющий все необходимые услуги и этапы, которые нужны вам, клиентам. В шоуруме вас ждут личное и семейное отношение, зона гостеприимства, вы насладитесь экспозициями и новинками строительной и дизайнерской отрасли и лучшими ведущими брендами Израиля и мира. Вы встретите лучших специалистов, которые дадут вам, клиентам, возможность решить, что лучше всего для вас. Так что не нужно бегать между специалистами, подрядчиками, поставщиками услуг и разными поставщиками.', en: '<bdi>GAD MIVNIM</bdi> clients have a showroom for construction and design displays that provides all the relevant services and stages you, the clients, need. In the showroom you will receive personal, family-style attention and a hosting area, and enjoy the experience of displays and innovations in the construction and design industry and the best leading brands in Israel and around the world. You will meet the finest professionals, who give you, the clients, the ability to decide what is best for you. This way there is no need to run between different professionals, contractors, service providers and suppliers.', fr: 'Les clients de <bdi>GAD MIVNIM</bdi> disposent d\'un showroom d\'expositions de construction et de design, qui offre tous les services et toutes les étapes pertinents dont vous, les clients, avez besoin. Dans le showroom, vous recevrez une attention personnelle et familiale, un espace d\'accueil, et profiterez de l\'expérience des expositions et des nouveautés du secteur de la construction et du design, ainsi que des meilleures marques de premier plan en Israël et dans le monde. Vous rencontrerez les meilleurs professionnels, qui vous donnent, à vous les clients, la possibilité de décider ce qui est le mieux pour vous. Ainsi, plus besoin de courir entre différents professionnels, entrepreneurs, prestataires et fournisseurs.' },
    ab_p9: { he: 'באולם התצוגה אתם תוכלו לבחור את המוצרים הנלווים והנדרשים לפרויקט שלכם.', ru: 'В шоуруме вы сможете выбрать сопутствующие материалы и изделия, необходимые для вашего проекта.', en: 'In the showroom you will be able to choose the accompanying products required for your project.', fr: 'Dans le showroom, vous pourrez choisir les produits complémentaires nécessaires à votre projet.' },
    ab_h4: { he: 'שקט נפשי לאורך כל הדרך', ru: 'Спокойствие на всём пути', en: 'Peace of mind all the way', fr: 'La tranquillité d\'esprit tout au long du parcours' },
    ab_l1: { he: 'מחלקה משפטית שמלווה כל פרויקט ודואגת להסכמים ברורים ולהגנה על הלקוח.', ru: 'Юридический отдел, который сопровождает каждый проект и обеспечивает чёткие договоры и защиту клиента.', en: 'A legal department that accompanies every project and ensures clear agreements and protection of the client.', fr: 'Un service juridique qui accompagne chaque projet et veille à des accords clairs et à la protection du client.' },
    ab_l2: { he: 'מערכות ניהול מתקדמות לביצוע ניהול פיקוח ותאום בין הלקוח ולאנשי הקשר המלווים את הפרויקט מתחילתו ועד סופו. אנשי הניהול, בעלי המקצוע וקבלני הביצוע, הספקים, וכל שאר השירותים להשלמת הפרויקט שלכם.', ru: 'Современные системы управления для исполнения, управления, надзора и координации между клиентом и контактными лицами, сопровождающими проект от начала до конца: управленческий персонал, специалисты и подрядчики, поставщики и все остальные услуги для завершения вашего проекта.', en: 'Advanced management systems for execution, management, supervision and coordination between the client and the contacts who accompany the project from start to finish: the management staff, professionals and execution contractors, suppliers, and all other services needed to complete your project.', fr: 'Des systèmes de gestion avancés pour l\'exécution, la gestion, la supervision et la coordination entre le client et les interlocuteurs qui accompagnent le projet du début à la fin : l\'équipe de direction, les professionnels et entrepreneurs d\'exécution, les fournisseurs et tous les autres services nécessaires à l\'achèvement de votre projet.' },
    ab_l3: { he: 'בסיום כל פרויקט הלקוח מקבל תעודת אחריות ובדק בית בהתאם לתקנון הפרויקט שנבנה עבורו.', ru: 'По завершении каждого проекта клиент получает гарантийный сертификат и техническую инспекцию дома в соответствии с регламентом проекта, построенного для него.', en: 'At the end of every project, the client receives a warranty certificate and a home inspection in accordance with the regulations of the project built for them.', fr: 'À la fin de chaque projet, le client reçoit un certificat de garantie et un contrôle de la maison conformément au règlement du projet construit pour lui.' },
    ab_close: { he: '<bdi>GAD MIVNIM</bdi> משנים את הדרך לבניה נכונה.', ru: '<bdi>GAD MIVNIM</bdi> меняет путь к правильному строительству.', en: '<bdi>GAD MIVNIM</bdi> is changing the way to proper construction.', fr: '<bdi>GAD MIVNIM</bdi> change la façon de bien construire.' },

    /* ----- השירותים שלנו ----- */
    svc_eyebrow: { he: 'השירותים שלנו', ru: 'Наши услуги', en: 'Our Services', fr: 'Nos services' },
    svc_lead: { he: 'רמת תכנון תיאום ניהול פיקוח וביצוע מהגבוהות ביותר !', ru: 'Высочайший уровень проектирования, координации, управления, надзора и исполнения!', en: 'The highest level of planning, coordination, management, supervision and execution!', fr: 'Un niveau de planification, de coordination, de gestion, de supervision et d’exécution parmi les plus élevés !' },
    svc_b1: { he: 'אבטחה סגורה במעגל סגור 24/7', ru: 'Закрытая охрана, видеонаблюдение 24/7', en: 'Closed security, CCTV 24/7', fr: 'Sécurité fermée, circuit fermé 24/7' },
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
    ip_title2:    { he: 'מה אנחנו בונים עכשיו', ru: 'Что мы строим сейчас', en: 'What We Are Building Now', fr: 'Ce que nous construisons maintenant' },
    partners_eyebrow: { he: 'השותפים שלנו', ru: 'Наши партнёры', en: 'Our Partners', fr: 'Nos partenaires' },
    filter_all:      { he: 'הכל', ru: 'Все', en: 'All', fr: 'Tout' },
    filter_private:  { he: 'מגזר פרטי', ru: 'Частный сектор', en: 'Private Sector', fr: 'Secteur privé' },
    filter_business: { he: 'מגזר עסקי', ru: 'Коммерческий сектор', en: 'Business Sector', fr: 'Secteur commercial' },
    p1: { he: 'יזמות ונדל"ן', ru: 'Девелопмент и недвижимость', en: 'Development & Real Estate', fr: 'Promotion et immobilier' },
    p3: { he: 'מבנים פרטיים', ru: 'Частные здания', en: 'Private Buildings', fr: 'Bâtiments privés' },
    p4: { he: 'מבנים ציבוריים', ru: 'Общественные здания', en: 'Public Buildings', fr: 'Bâtiments publics' },
    p5: { he: 'מבני מסחר וקניות', ru: 'Торговые здания', en: 'Commerce & Shopping Buildings', fr: 'Bâtiments de commerce et de shopping' },
    p6: { he: 'קניונים', ru: 'Торговые центры', en: 'Malls', fr: 'Centres commerciaux' },
    p7: { he: 'בתי מלונות', ru: 'Гостиницы', en: 'Hotels', fr: 'Hôtels' },
    p8: { he: 'בתי אב', ru: 'Дома для пожилых', en: 'Senior Homes', fr: 'Maisons de retraite' },
    p9: { he: 'מבנים מיוחדים', ru: 'Особые здания', en: 'Special Buildings', fr: 'Bâtiments spéciaux' },

    /* ----- השותפים שלנו ----- */
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
    ct_t1:   { he: 'המבנה שלכם שווה הרבה !', ru: 'Ваше здание стоит многого!', en: 'Your building is worth a lot!', fr: 'Votre bâtiment vaut beaucoup !' },
    ct_t2:   { he: 'והוא רק שלכם !', ru: 'И оно только ваше!', en: 'And it is only yours!', fr: 'Et il n’est qu’à vous !' },
    ct_dear: { he: 'לקוחות יקרים', ru: 'Дорогие клиенты', en: 'Dear clients', fr: 'Chers clients' },
    ct_lead: { he: 'לצורך הבטחה על האתר והמשתמשים בו עליכם להירשם באמצעות מספרכם ושמכם וישלח אליכם קוד משתמש', ru: 'Для защиты сайта и его пользователей вам необходимо зарегистрироваться, указав ваш номер и имя, и вам будет отправлен код пользователя', en: 'To secure the site and its users, you must register with your number and name, and a user code will be sent to you', fr: 'Afin de sécuriser le site et ses utilisateurs, vous devez vous inscrire avec votre numéro et votre nom, et un code utilisateur vous sera envoyé' },
    f_first:  { he: 'שם', ru: 'Имя', en: 'First name', fr: 'Prénom' },
    f_last:   { he: 'משפחה', ru: 'Фамилия', en: 'Last name', fr: 'Nom' },
    f_phone:  { he: 'טלפון', ru: 'Телефон', en: 'Phone', fr: 'Téléphone' },
    f_submit: { he: 'שלח', ru: 'Отправить', en: 'Send', fr: 'Envoyer' },
    f_success:{ he: 'קוד המשתמש בדרך אליכם..     תודה שבחרתם לצפות באתר הבית שלנו', ru: 'Код пользователя уже в пути.. спасибо, что выбрали наш домашний сайт', en: 'Your user code is on its way.. thank you for choosing to view our home site', fr: 'Votre code utilisateur est en route.. merci d’avoir choisi de visiter notre site maison' },

    /* ----- דפי חטיבות ----- */
    svc_back:     { he: 'חזרה לכל השירותים', ru: 'Назад ко всем услугам', en: 'Back to all services', fr: 'Retour à tous les services' },
    pg_d1: { he: 'חטיבת תכנון והנדסת בנייה | GAD MIVNIM', ru: 'Подразделение проектирования и строительной инженерии | GAD MIVNIM', en: 'Planning & Construction Engineering Division | GAD MIVNIM', fr: 'Division planification et ingénierie de construction | GAD MIVNIM' },
    pg_d2: { he: 'חטיבת בינוי ותשתיות | GAD MIVNIM', ru: 'Подразделение строительства и инфраструктуры | GAD MIVNIM', en: 'Construction & Infrastructure Division | GAD MIVNIM', fr: 'Division construction et infrastructures | GAD MIVNIM' },
    pg_d3: { he: 'חטיבת שותפויות נדל"ן | GAD MIVNIM', ru: 'Подразделение партнёрств в недвижимости | GAD MIVNIM', en: 'Real-Estate Partnerships Division | GAD MIVNIM', fr: 'Division partenariats immobiliers | GAD MIVNIM' },
    pg_d4: { he: 'חטיבת השירותים שלנו | GAD MIVNIM', ru: 'Подразделение наших услуг | GAD MIVNIM', en: 'Our Services Division | GAD MIVNIM', fr: 'Division de nos services | GAD MIVNIM' },
    pg_d5: { he: 'חטיבת המיוחדים שלנו | GAD MIVNIM', ru: 'Подразделение особых услуг | GAD MIVNIM', en: 'Our Specials Division | GAD MIVNIM', fr: 'Division de nos spécialités | GAD MIVNIM' },

    /* ----- שותפים: קבוצות ודפים ----- */
    pgrp_back: { he: 'חזרה לכל השותפים', ru: 'Назад ко всем партнёрам', en: 'Back to all partners', fr: 'Retour à tous les partenaires' },
    pgrp1: { he: 'מטבחים, נגרות ורהיטים', ru: 'Кухни, столярные изделия и мебель', en: 'Kitchens, Carpentry & Furniture', fr: 'Cuisines, menuiserie et mobilier' },
    pgrp2: { he: 'ריצוף, חיפויים וצבעים', ru: 'Полы, облицовка и краски', en: 'Flooring, Cladding & Paints', fr: 'Revêtements de sol, parements et peintures' },
    pgrp3: { he: 'כלים סניטריים ותאורה', ru: 'Сантехника и освещение', en: 'Sanitary Ware & Lighting', fr: 'Sanitaires et éclairage' },
    pgrp4: { he: 'דלתות פנים וכניסה', ru: 'Межкомнатные и входные двери', en: 'Interior & Entrance Doors', fr: 'Portes intérieures et d’entrée' },
    pgrp5: { he: 'שערים, זגגות ומסגרות', ru: 'Ворота, остекление и рамы', en: 'Gates, Glazing & Frames', fr: 'Portails, vitrage et cadres' },
    pg_pgrp1: { he: 'מטבחים, נגרות ורהיטים | GAD MIVNIM', ru: 'Кухни, столярные изделия и мебель | GAD MIVNIM', en: 'Kitchens, Carpentry & Furniture | GAD MIVNIM', fr: 'Cuisines, menuiserie et mobilier | GAD MIVNIM' },
    pg_pgrp2: { he: 'ריצוף, חיפויים וצבעים | GAD MIVNIM', ru: 'Полы, облицовка и краски | GAD MIVNIM', en: 'Flooring, Cladding & Paints | GAD MIVNIM', fr: 'Revêtements de sol, parements et peintures | GAD MIVNIM' },
    pg_pgrp3: { he: 'כלים סניטריים ותאורה | GAD MIVNIM', ru: 'Сантехника и освещение | GAD MIVNIM', en: 'Sanitary Ware & Lighting | GAD MIVNIM', fr: 'Sanitaires et éclairage | GAD MIVNIM' },
    pg_pgrp4: { he: 'דלתות פנים וכניסה | GAD MIVNIM', ru: 'Межкомнатные и входные двери | GAD MIVNIM', en: 'Interior & Entrance Doors | GAD MIVNIM', fr: 'Portes intérieures et d’entrée | GAD MIVNIM' },
    pg_pgrp5: { he: 'שערים, זגגות ומסגרות | GAD MIVNIM', ru: 'Ворота, остекление и рамы | GAD MIVNIM', en: 'Gates, Glazing & Frames | GAD MIVNIM', fr: 'Portails, vitrage et cadres | GAD MIVNIM' },

    pg_infra: { he: 'תשתיות ופיתוח | GAD MIVNIM', ru: 'Инфраструктура и благоустройство | GAD MIVNIM', en: 'Infrastructure & Development | GAD MIVNIM', fr: 'Infrastructures et aménagement | GAD MIVNIM' },

    proj_back: { he: 'חזרה לכל הפרויקטים', ru: 'Назад ко всем проектам', en: 'Back to all projects', fr: 'Retour à tous les projets' },
    pg_commercial: { he: 'מבני מסחר וקניות | GAD MIVNIM', ru: 'Торговые здания | GAD MIVNIM', en: 'Commerce & Shopping | GAD MIVNIM', fr: 'Commerce et centres commerciaux | GAD MIVNIM' },

    pm_soon:  { he: 'תיאור הפרויקט יתווסף בקרוב', ru: 'Описание проекта скоро появится', en: 'Project description coming soon', fr: 'La description du projet sera bientôt ajoutée' },

    city_tlv: { he: 'תל אביב', ru: 'Тель-Авив', en: 'Tel Aviv', fr: 'Tel Aviv' },
    city_jlm: { he: 'ירושלים', ru: 'Иерусалим', en: 'Jerusalem', fr: 'Jérusalem' },

    pm_heading: { he: 'תיאור הפרויקט', ru: 'Описание проекта', en: 'Project description', fr: 'Description du projet' },

    proj_private_soon: { he: 'פרויקטים במגזר הפרטי יתווספו בקרוב', ru: 'Проекты в частном секторе скоро появятся', en: 'Private sector projects coming soon', fr: 'Les projets du secteur privé seront bientôt ajoutés' },

    pm_gallery: { he: 'גלריית הפרויקט', ru: 'Галерея проекта', en: 'Project gallery', fr: 'Galerie du projet' },

    map_tap: { he: 'הקישו להפעלת המפה', ru: 'Нажмите, чтобы включить карту', en: 'Tap to activate the map', fr: 'Touchez pour activer la carte' },
    pm_close: { he: 'סגירה', ru: 'Закрыть', en: 'Close', fr: 'Fermer' },

    sector_all: { he: 'כל המגזרים', ru: 'Все секторы', en: 'All Sectors', fr: 'Tous les secteurs' },

    pm_photos_soon: { he: 'תמונות הפרויקט יתווספו בקרוב', ru: 'Фотографии проекта скоро появятся', en: 'Project photos coming soon', fr: 'Les photos du projet seront bientôt ajoutées' },

    /* ----- Footer ----- */
    footer_l1:  { he: 'מקווים שהנהנתם לצפות באתר הבית שלנו', ru: 'Надеемся, вам понравился наш домашний сайт', en: 'We hope you enjoyed viewing our home site', fr: 'Nous espérons que vous avez apprécié la visite de notre site maison' },
    footer_l2:  { he: 'נשמח לראותם בין קהל לקוחותינו וממשפחת <bdi>G A D MIVNIM</bdi> בכל מקום במפה', ru: 'Будем рады видеть вас среди наших клиентов и семьи G A D MIVNIM — везде на карте', en: 'We would be glad to see you among our clients and the G A D MIVNIM family — everywhere on the map', fr: 'Nous serons ravis de vous compter parmi nos clients et la famille <bdi>G A D MIVNIM</bdi> — partout sur la carte' },
    footer_copy:{ he: '*** כל הזכויות שמורת לחברת גד מבנים בע"מ ואין לאף אדם או גוף כלשהו לעשות שום שימוש במוצג באתר לשום עניין ודבר.', ru: '*** Все права принадлежат компании «Гад Мивним» Лтд. Никто не вправе использовать представленное на сайте в каких-либо целях.', en: '*** All rights reserved to Gad Mivnim Ltd. No person or entity may make any use of what is presented on this site for any matter.', fr: '*** Tous droits réservés à la société Gad Mivnim Ltd. Aucune personne ni entité n’est autorisée à faire quelque usage que ce soit de ce qui est présenté sur le site, à quelque fin que ce soit.' }
  };

  window.GAD_T = T;   // לשימוש חלון הפרויקט (script.js)

  var STORAGE_KEY = 'gad_lang';

  function applyLanguage(lang) {
    if (!NATIVE[lang]) { lang = 'he'; }

    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', DIR[lang]);
    var titleKey = html.getAttribute('data-title-key');
    document.title = (titleKey && T[titleKey] && T[titleKey][lang]) || DOC_TITLE[lang];
    if (window.GAD_PAGE_TITLE) { document.title = window.GAD_PAGE_TITLE; }

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
