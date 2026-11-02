/* ==========================================================================
   GAD MIVNIM — פודקאסט "אנשים משתפים" (podcast-data.js) — המקור היחיד לכרטיסי הפרקים ולחלון הפרק.
   תוכן לדוגמה (placeholder) — יוחלף בפרקים האמיתיים. הסדר כאן = הסדר בפס. כל פרק:
     n       — מספר הפרק
     min     — אורך בדקות
     image   — תמונת האריח והחלון (תמונה קיימת מהאתר שמתאימה לנושא)
     video   — וידאו: קישור YouTube / Vimeo (מוטמע במצב פרטיות) או קובץ mp4; ריק = אין וידאו
     audio   — נתיב לקובץ שמע (למשל 'audio/ep1.mp3') — מתנגן כשאין video; שניהם ריקים = "הפרק יעלה בקרוב"
     title   — כותרת הפרק
     guest   — שורת האורח/ת המלאה (כרגע תפקיד בלבד, בלי שמות)
     desc    — פסקת תיאור קצרה
     points  — "בפרק:" (3 נקודות)
   כל טקסט לפי שפה: { he, en, ru, fr } — העברית היא המקור.
   ========================================================================== */
window.PODCAST_UI = {
  ep:    { he: 'פרק', en: 'Episode', ru: 'Эпизод', fr: 'Épisode' },
  min:   { he: "דק'", en: 'min', ru: 'мин', fr: 'min' },
  inEp:  { he: 'בפרק:', en: 'In this episode:', ru: 'В выпуске:', fr: 'Dans cet épisode :' },
  soon:  { he: 'הפרק יעלה בקרוב', en: 'Episode coming soon', ru: 'Выпуск скоро выйдет', fr: 'Épisode bientôt disponible' },
  play:  { he: 'השמעה', en: 'Play', ru: 'Воспроизвести', fr: 'Lecture' },
  pause: { he: 'השהיה', en: 'Pause', ru: 'Пауза', fr: 'Pause' },
  eyebrow: { he: 'פודקאסט | אנשים משתפים', en: 'Podcast | People Share', ru: 'Подкаст | Люди делятся', fr: 'Podcast | Les gens partagent' },
  watch:   { he: 'האזינו וצפו בפרק הראשון...', en: 'Listen and watch the first episode...', ru: 'Слушайте и смотрите первый выпуск...', fr: 'Écoutez et regardez le premier épisode...' },
  screen:  { he: 'נגן הפרק', en: 'Episode player', ru: 'Плеер выпуска', fr: 'Lecteur de l’épisode' },
  volume:  { he: 'עוצמת קול', en: 'Volume', ru: 'Громкость', fr: 'Volume' },
  full:    { he: 'מסך מלא', en: 'Fullscreen', ru: 'Во весь экран', fr: 'Plein écran' },
  strip: { he: 'פרקי הפודקאסט', en: 'Podcast episodes', ru: 'Выпуски подкаста', fr: 'Épisodes du podcast' },
  // כותרת התוכנית (hero)
  title:   { he: 'אנשים משתפים', en: 'People Share', ru: 'Люди делятся', fr: 'Les gens partagent' },
  tagline: { he: 'שיחות על בנייה, עיצוב והחיים שבין לבין – מפי אנשי המקצוע של GAD MIVNIM', en: 'Conversations about building, design and the life in between – from the professionals of GAD MIVNIM', ru: 'Разговоры о строительстве, дизайне и жизни между ними — от специалистов GAD MIVNIM', fr: 'Des conversations sur la construction, le design et la vie entre les deux – par les professionnels de GAD MIVNIM' },
  latest:  { he: 'האזינו לפרק האחרון', en: 'Listen to the latest episode', ru: 'Слушать последний выпуск', fr: 'Écouter le dernier épisode' },
  count:   { he: '{n} פרקים', en: '{n} episodes', ru: '{n} выпусков', fr: '{n} épisodes' },
  lang:    { he: 'עברית', en: 'Hebrew', ru: 'Иврит', fr: 'Hébreu' },
  speed:   { he: 'מהירות השמעה', en: 'Playback speed', ru: 'Скорость воспроизведения', fr: 'Vitesse de lecture' }
};

window.PODCAST_DATA = [

  /* 1 */
  { n: 1, min: 34, image: 'images/projects/tzur-hadassah-house-2.jpg', video: '', audio: '',
    title: { he: 'החלום הראשון: איך מתחילים לבנות בית', en: 'The first dream: how to start building a home', ru: 'Первая мечта: с чего начать строительство дома', fr: 'Le premier rêve : comment commencer à construire sa maison' },
    guest: { he: 'אורח: מנהל פרויקטים, GAD MIVNIM', en: 'Guest: Project manager, GAD MIVNIM', ru: 'Гость: руководитель проектов, GAD MIVNIM', fr: 'Invité : chef de projet, GAD MIVNIM' },
    desc: { he: 'שיחה פתוחה על הצעדים הראשונים – מהמגרש ועד התוכנית, ואיך לא ללכת לאיבוד בדרך.', en: 'An open conversation about the first steps – from the plot to the plan, and how not to get lost along the way.', ru: 'Откровенный разговор о первых шагах — от участка до проекта и о том, как не заблудиться в пути.', fr: 'Une conversation ouverte sur les premiers pas – du terrain au plan, et comment ne pas se perdre en route.' },
    points: [
      { he: 'בדיקת זכויות בנייה', en: 'Checking building rights', ru: 'Проверка прав на застройку', fr: 'Vérifier les droits à construire' },
      { he: 'בחירת צוות תכנון', en: 'Choosing a design team', ru: 'Выбор проектной команды', fr: 'Choisir l’équipe de conception' },
      { he: 'לוח זמנים ריאלי', en: 'A realistic timeline', ru: 'Реалистичный график', fr: 'Un calendrier réaliste' }
    ] },

  /* 2 */
  { n: 2, min: 28, image: 'images/projects/crowne-plaza-tel-aviv-2.jpg', video: '', audio: '',
    title: { he: 'שיפוץ בלי כאב ראש', en: 'Renovation without the headache', ru: 'Ремонт без головной боли', fr: 'Rénover sans prise de tête' },
    guest: { he: 'אורח: מנהל עבודה', en: 'Guest: Site manager', ru: 'Гость: прораб', fr: 'Invité : chef de chantier' },
    desc: { he: 'מה באמת קורה באתר שיפוץ, ואיך שומרים על לוח זמנים ותקציב.', en: 'What really happens on a renovation site, and how to stay on schedule and on budget.', ru: 'Что на самом деле происходит на ремонте и как уложиться в сроки и бюджет.', fr: 'Ce qui se passe vraiment sur un chantier de rénovation, et comment tenir les délais et le budget.' },
    points: [
      { he: 'הכנה לפני השיפוץ', en: 'Preparing before the renovation', ru: 'Подготовка до ремонта', fr: 'Se préparer avant les travaux' },
      { he: 'הפתעות נפוצות ואיך נמנעים', en: 'Common surprises and how to avoid them', ru: 'Частые сюрпризы и как их избежать', fr: 'Les surprises fréquentes et comment les éviter' },
      { he: 'עבודה מול השכנים', en: 'Working with the neighbors', ru: 'Отношения с соседями', fr: 'Composer avec les voisins' }
    ] },

  /* 3 */
  { n: 3, min: 41, image: 'images/projects/nofei-yerushalayim-3.jpg', video: '', audio: '',
    title: { he: 'תמ"א 38 ופינוי בינוי – מה הדיירים צריכים לדעת', en: 'TAMA 38 and urban renewal – what residents need to know', ru: 'ТАМА 38 и «снос-строительство» — что нужно знать жильцам', fr: 'TAMA 38 et renouvellement urbain – ce que les résidents doivent savoir' },
    guest: { he: 'אורחת: יועצת התחדשות עירונית', en: 'Guest: Urban renewal consultant', ru: 'Гостья: консультант по городскому обновлению', fr: 'Invitée : consultante en renouvellement urbain' },
    desc: { he: 'התחדשות עירונית מנקודת המבט של הדיירים – זכויות, תהליכים ושקיפות.', en: 'Urban renewal from the residents’ point of view – rights, processes and transparency.', ru: 'Городское обновление глазами жильцов — права, процессы и прозрачность.', fr: 'Le renouvellement urbain du point de vue des résidents – droits, démarches et transparence.' },
    points: [
      { he: 'שלבי הפרויקט', en: 'Project stages', ru: 'Этапы проекта', fr: 'Les étapes du projet' },
      { he: 'נציגות דיירים', en: 'Residents’ committee', ru: 'Представительство жильцов', fr: 'La représentation des résidents' },
      { he: 'ליווי משפטי', en: 'Legal guidance', ru: 'Юридическое сопровождение', fr: 'L’accompagnement juridique' }
    ] },

  /* 4 */
  { n: 4, min: 25, image: 'images/partners/kitchens.jpg', video: '', audio: '',
    title: { he: 'מטבח שהוא הלב של הבית', en: 'A kitchen that is the heart of the home', ru: 'Кухня — сердце дома', fr: 'Une cuisine au cœur de la maison' },
    guest: { he: 'אורחת: מעצבת פנים', en: 'Guest: Interior designer', ru: 'Гостья: дизайнер интерьера', fr: 'Invitée : architecte d’intérieur' },
    desc: { he: 'איך מתכננים מטבח יפה, נוח ופרקטי – מהסקיצה ועד ההתקנה.', en: 'How to plan a beautiful, comfortable and practical kitchen – from sketch to installation.', ru: 'Как спланировать красивую, удобную и практичную кухню — от эскиза до монтажа.', fr: 'Comment concevoir une cuisine belle, confortable et pratique – de l’esquisse à l’installation.' },
    points: [
      { he: 'תכנון משולש העבודה', en: 'Planning the work triangle', ru: 'Планирование рабочего треугольника', fr: 'Planifier le triangle d’activité' },
      { he: 'בחירת משטחים', en: 'Choosing countertops', ru: 'Выбор столешниц', fr: 'Choisir les plans de travail' },
      { he: 'תאורה במטבח', en: 'Kitchen lighting', ru: 'Освещение кухни', fr: 'L’éclairage de la cuisine' }
    ] },

  /* 5 */
  { n: 5, min: 30, image: 'images/projects/harel-3.jpg', video: '', audio: '',
    title: { he: 'רטיבות: האויב השקט של המבנה', en: 'Damp: the building’s silent enemy', ru: 'Сырость: тихий враг здания', fr: 'L’humidité : l’ennemi silencieux du bâtiment' },
    guest: { he: 'אורח: מומחה איטום', en: 'Guest: Waterproofing expert', ru: 'Гость: эксперт по гидроизоляции', fr: 'Invité : expert en étanchéité' },
    desc: { he: 'מאיפה מגיעה הרטיבות, איך מזהים אותה מוקדם ואיך מטפלים בה פעם אחת ולתמיד.', en: 'Where damp comes from, how to spot it early and how to deal with it once and for all.', ru: 'Откуда берётся сырость, как распознать её вовремя и устранить раз и навсегда.', fr: 'D’où vient l’humidité, comment la repérer tôt et la traiter une fois pour toutes.' },
    points: [
      { he: 'סימני אזהרה', en: 'Warning signs', ru: 'Тревожные признаки', fr: 'Les signes d’alerte' },
      { he: 'איטום גגות ומרפסות', en: 'Waterproofing roofs and balconies', ru: 'Гидроизоляция крыш и балконов', fr: 'L’étanchéité des toits et des balcons' },
      { he: 'בדיקת הצפה', en: 'Flood testing', ru: 'Проверка заливом', fr: 'Le test d’inondation' }
    ] },

  /* 6 */
  { n: 6, min: 37, image: 'images/projects/crowne-plaza-tel-aviv-6.jpg', video: '', audio: '',
    title: { he: 'שיקום מבנים ישנים – לשמור על הנשמה', en: 'Restoring old buildings – keeping their soul', ru: 'Реставрация старых зданий — сохранить душу', fr: 'Restaurer les bâtiments anciens – préserver leur âme' },
    guest: { he: 'אורח: מהנדס קונסטרוקציה', en: 'Guest: Structural engineer', ru: 'Гость: инженер-конструктор', fr: 'Invité : ingénieur en structure' },
    desc: { he: 'איך מחזירים חיים למבנה ותיק בלי לאבד את האופי שלו.', en: 'How to bring an old building back to life without losing its character.', ru: 'Как вернуть к жизни старое здание, не потеряв его характер.', fr: 'Comment redonner vie à un bâtiment ancien sans perdre son caractère.' },
    points: [
      { he: 'סקר הנדסי', en: 'Engineering survey', ru: 'Инженерное обследование', fr: 'L’expertise technique' },
      { he: 'חיזוק שלד', en: 'Structural reinforcement', ru: 'Усиление каркаса', fr: 'Le renforcement de la structure' },
      { he: 'מבנים לשימור', en: 'Heritage buildings', ru: 'Здания под охраной', fr: 'Les bâtiments classés' }
    ] },

  /* 7 */
  { n: 7, min: 22, image: 'images/projects/tzur-hadassah-house-4.jpg', video: '', audio: '',
    title: { he: 'בטיחות באתר – לפני הכל', en: 'Site safety – first of all', ru: 'Безопасность на площадке — прежде всего', fr: 'La sécurité sur le chantier – avant tout' },
    guest: { he: 'אורח: ממונה בטיחות', en: 'Guest: Safety officer', ru: 'Гость: специалист по охране труда', fr: 'Invité : responsable sécurité' },
    desc: { he: 'מה עושים כדי שכל יום עבודה באתר יסתיים בשלום.', en: 'What it takes for every working day on site to end safely.', ru: 'Что нужно, чтобы каждый рабочий день на площадке заканчивался благополучно.', fr: 'Ce qu’il faut pour que chaque journée de chantier se termine sans incident.' },
    points: [
      { he: 'עבודה בגובה', en: 'Working at height', ru: 'Работы на высоте', fr: 'Le travail en hauteur' },
      { he: 'גידור ושילוט', en: 'Fencing and signage', ru: 'Ограждение и знаки', fr: 'Clôtures et signalisation' },
      { he: 'מצלמות 24/7', en: '24/7 cameras', ru: 'Камеры 24/7', fr: 'Caméras 24h/24' }
    ] },

  /* 8 */
  { n: 8, min: 29, image: 'images/projects/harel-2.jpg', video: '', audio: '',
    title: { he: 'איך בוחרים קבלן שאפשר לסמוך עליו', en: 'How to choose a contractor you can trust', ru: 'Как выбрать подрядчика, которому можно доверять', fr: 'Comment choisir un entrepreneur de confiance' },
    guest: { he: 'אורח: מנהל פרויקטים, GAD MIVNIM', en: 'Guest: Project manager, GAD MIVNIM', ru: 'Гость: руководитель проектов, GAD MIVNIM', fr: 'Invité : chef de projet, GAD MIVNIM' },
    desc: { he: 'השאלות הנכונות, הבדיקות שחייבים לעשות והנורות האדומות.', en: 'The right questions, the must-do checks and the red flags.', ru: 'Правильные вопросы, обязательные проверки и тревожные сигналы.', fr: 'Les bonnes questions, les vérifications indispensables et les signaux d’alarme.' },
    points: [
      { he: 'רישיון וביטוח', en: 'License and insurance', ru: 'Лицензия и страховка', fr: 'Licence et assurance' },
      { he: 'חוזה ומפרט', en: 'Contract and specification', ru: 'Договор и спецификация', fr: 'Contrat et cahier des charges' },
      { he: 'תקשורת שוטפת', en: 'Ongoing communication', ru: 'Постоянная связь', fr: 'Une communication suivie' }
    ] },

  /* 9 */
  { n: 9, min: 24, image: 'images/partners/lighting.jpg', video: '', audio: '',
    title: { he: 'תאורה שמשנה את הבית', en: 'Lighting that transforms the home', ru: 'Освещение, которое меняет дом', fr: 'Un éclairage qui transforme la maison' },
    guest: { he: 'אורחת: מעצבת תאורה', en: 'Guest: Lighting designer', ru: 'Гостья: дизайнер освещения', fr: 'Invitée : conceptrice lumière' },
    desc: { he: 'איך אור נכון יוצר אווירה, נוחות וחיסכון.', en: 'How the right light creates atmosphere, comfort and savings.', ru: 'Как правильный свет создаёт атмосферу, комфорт и экономию.', fr: 'Comment une bonne lumière crée ambiance, confort et économies.' },
    points: [
      { he: 'שכבות תאורה', en: 'Layers of lighting', ru: 'Слои освещения', fr: 'Les couches d’éclairage' },
      { he: 'גוונים וטמפרטורת צבע', en: 'Tones and color temperature', ru: 'Оттенки и цветовая температура', fr: 'Teintes et température de couleur' },
      { he: 'תאורת חוץ', en: 'Outdoor lighting', ru: 'Наружное освещение', fr: 'L’éclairage extérieur' }
    ] },

  /* 10 */
  { n: 10, min: 26, image: 'images/projects/malha-house-1.jpg', video: '', audio: '',
    title: { he: 'אחרי המסירה: בדק בית ואחריות', en: 'After handover: defects period and warranty', ru: 'После сдачи: гарантийный период и обязательства', fr: 'Après la livraison : garantie et parfait achèvement' },
    guest: { he: 'אורח: מנהל שירות לקוחות', en: 'Guest: Customer service manager', ru: 'Гость: руководитель клиентского сервиса', fr: 'Invité : responsable du service client' },
    desc: { he: 'מה קורה אחרי שמקבלים את המפתח, ולמה שירות טוב לא נגמר במסירה.', en: 'What happens after you get the key, and why good service doesn’t end at handover.', ru: 'Что происходит после получения ключей и почему хороший сервис не заканчивается сдачей.', fr: 'Ce qui se passe après la remise des clés, et pourquoi un bon service ne s’arrête pas à la livraison.' },
    points: [
      { he: 'תעודת אחריות', en: 'Warranty certificate', ru: 'Гарантийный сертификат', fr: 'Le certificat de garantie' },
      { he: 'בדק בית', en: 'Defects liability period', ru: 'Гарантийный период', fr: 'La garantie de parfait achèvement' },
      { he: 'מנויי אחזקה', en: 'Maintenance plans', ru: 'Абонементы на обслуживание', fr: 'Les contrats d’entretien' }
    ] },

  /* 11 */
  { n: 11, min: 31, image: 'images/projects/crowne-plaza-tel-aviv-1.jpg', video: '', audio: '',
    title: { he: 'תכנון נכון, חיסכון מוכח', en: 'Right planning, proven savings', ru: 'Правильное планирование — доказанная экономия', fr: 'Bonne planification, économies prouvées' },
    guest: { he: 'אורח: אדריכל', en: 'Guest: Architect', ru: 'Гость: архитектор', fr: 'Invité : architecte' },
    desc: { he: 'למה שעה של תכנון חוסכת שבוע של תיקונים – ואיך עושים את זה נכון.', en: 'Why an hour of planning saves a week of repairs – and how to do it right.', ru: 'Почему час планирования экономит неделю исправлений — и как сделать это правильно.', fr: 'Pourquoi une heure de planification épargne une semaine de réparations – et comment bien s’y prendre.' },
    points: [
      { he: 'תיאום בין אנשי המקצוע', en: 'Coordination between professionals', ru: 'Координация специалистов', fr: 'La coordination entre les professionnels' },
      { he: 'תוכניות עבודה מפורטות', en: 'Detailed working drawings', ru: 'Подробные рабочие чертежи', fr: 'Des plans d’exécution détaillés' },
      { he: 'ניהול שינויים', en: 'Managing changes', ru: 'Управление изменениями', fr: 'La gestion des modifications' }
    ] },

  /* 12 */
  { n: 12, min: 27, image: 'images/partners/furniture.jpg', video: '', audio: '',
    title: { he: 'עיצוב פנים: מהחלום להדמיה', en: 'Interior design: from dream to visualization', ru: 'Дизайн интерьера: от мечты к визуализации', fr: 'Architecture d’intérieur : du rêve à la visualisation' },
    guest: { he: 'אורחת: מעצבת פנים', en: 'Guest: Interior designer', ru: 'Гостья: дизайнер интерьера', fr: 'Invitée : architecte d’intérieur' },
    desc: { he: 'איך הופכים רעיון לעיצוב מדויק – ורואים אותו לפני שמשקיעים.', en: 'How to turn an idea into a precise design – and see it before you invest.', ru: 'Как превратить идею в точный дизайн — и увидеть его до вложений.', fr: 'Comment transformer une idée en un design précis – et le voir avant d’investir.' },
    points: [
      { he: 'קונספט וסגנון', en: 'Concept and style', ru: 'Концепция и стиль', fr: 'Concept et style' },
      { he: 'הדמיות תלת-ממד', en: '3D visualizations', ru: '3D-визуализации', fr: 'Les visualisations 3D' },
      { he: 'בחירת חומרים וצבעים', en: 'Choosing materials and colors', ru: 'Выбор материалов и цветов', fr: 'Le choix des matériaux et des couleurs' }
    ] },

  /* 13 */
  { n: 13, min: 29, image: 'images/projects/dana-david-1.jpg', video: '', audio: '',
    title: { he: 'בית חכם: הטכנולוגיה שנכנסת לקירות', en: 'Smart home: the technology inside the walls', ru: 'Умный дом: технологии в стенах', fr: 'Maison connectée : la technologie dans les murs' },
    guest: { he: 'אורח: מתכנן מערכות חשמל ותקשורת', en: 'Guest: Electrical and communications designer', ru: 'Гость: проектировщик электрики и слаботочных систем', fr: 'Invité : concepteur en électricité et réseaux' },
    desc: { he: 'אילו מערכות חכמות שווה לתכנן כבר היום, ואיך מכינים תשתית לעתיד.', en: 'Which smart systems are worth planning today, and how to prepare infrastructure for the future.', ru: 'Какие умные системы стоит заложить уже сегодня и как подготовить инфраструктуру на будущее.', fr: 'Quels systèmes intelligents prévoir dès aujourd’hui, et comment préparer l’infrastructure pour l’avenir.' },
    points: [
      { he: 'תאורה ותריסים חכמים', en: 'Smart lighting and shutters', ru: 'Умное освещение и жалюзи', fr: 'Éclairage et volets connectés' },
      { he: 'מצלמות ואבטחה', en: 'Cameras and security', ru: 'Камеры и охрана', fr: 'Caméras et sécurité' },
      { he: 'עמדת טעינה לרכב', en: 'EV charging point', ru: 'Зарядная станция для автомобиля', fr: 'Borne de recharge pour véhicule' }
    ] },

  /* 14 */
  { n: 14, min: 23, image: 'images/partners/sanitary.jpg', video: '', audio: '',
    title: { he: 'אינסטלציה: מה שמתחת לרצפה', en: 'Plumbing: what lies beneath the floor', ru: 'Сантехника: что скрыто под полом', fr: 'Plomberie : ce qui se cache sous le sol' },
    guest: { he: 'אורח: אינסטלטור מוסמך', en: 'Guest: Licensed plumber', ru: 'Гость: лицензированный сантехник', fr: 'Invité : plombier agréé' },
    desc: { he: 'צנרת, ביוב וניקוז – החלק שלא רואים אבל מרגישים כשהוא לא עובד.', en: 'Pipes, sewage and drainage – the part you don’t see but feel when it fails.', ru: 'Трубы, канализация и дренаж — то, чего не видно, но что сразу чувствуется, когда не работает.', fr: 'Tuyauterie, égouts et drainage – la partie qu’on ne voit pas mais qu’on ressent quand elle lâche.' },
    points: [
      { he: 'החלפת צנרת ישנה', en: 'Replacing old pipes', ru: 'Замена старых труб', fr: 'Remplacer les anciennes canalisations' },
      { he: 'שיפועים וניקוז', en: 'Slopes and drainage', ru: 'Уклоны и дренаж', fr: 'Pentes et drainage' },
      { he: 'איתור נזילות', en: 'Leak detection', ru: 'Поиск протечек', fr: 'La détection des fuites' }
    ] },

  /* 15 */
  { n: 15, min: 25, image: 'images/projects/neve-ilan-10.jpg', video: '', audio: '',
    title: { he: 'גינה שמזמינה הביתה', en: 'A garden that welcomes you home', ru: 'Сад, который зовёт домой', fr: 'Un jardin qui invite à rentrer' },
    guest: { he: 'אורחת: מתכננת נוף', en: 'Guest: Landscape designer', ru: 'Гостья: ландшафтный дизайнер', fr: 'Invitée : paysagiste' },
    desc: { he: 'איך מתכננים חוץ ירוק, חסכוני במים ונעים לאורך כל השנה.', en: 'How to plan a green, water-saving outdoor space that’s pleasant all year round.', ru: 'Как спланировать зелёную территорию, экономную в поливе и приятную круглый год.', fr: 'Comment concevoir un extérieur vert, économe en eau et agréable toute l’année.' },
    points: [
      { he: 'בחירת צמחייה', en: 'Choosing plants', ru: 'Выбор растений', fr: 'Le choix des plantes' },
      { he: 'מערכת השקיה חכמה', en: 'Smart irrigation system', ru: 'Умная система полива', fr: 'Un arrosage intelligent' },
      { he: 'תאורת גן', en: 'Garden lighting', ru: 'Садовое освещение', fr: 'L’éclairage du jardin' }
    ] },

  /* 16 */
  { n: 16, min: 26, image: 'images/partners/parquet.jpg', video: '', audio: '',
    title: { he: 'ריצוף וחיפויים: לבחור פעם אחת ונכון', en: 'Flooring and cladding: choose once, choose right', ru: 'Напольные покрытия и облицовка: выбрать один раз и правильно', fr: 'Sols et revêtements : choisir une fois, et bien' },
    guest: { he: 'אורח: מומחה ריצוף', en: 'Guest: Flooring expert', ru: 'Гость: эксперт по напольным покрытиям', fr: 'Invité : expert en revêtements de sol' },
    desc: { he: 'אריחים, פרקט וחיפויים – מה מתאים לכל חלל ואיך לא להתחרט.', en: 'Tiles, parquet and cladding – what suits each space and how not to regret it.', ru: 'Плитка, паркет и облицовка — что подходит для каждого помещения и как не пожалеть о выборе.', fr: 'Carrelage, parquet et revêtements – ce qui convient à chaque pièce et comment ne pas le regretter.' },
    points: [
      { he: 'סוגי חומרים', en: 'Types of materials', ru: 'Виды материалов', fr: 'Les types de matériaux' },
      { he: 'עמידות ותחזוקה', en: 'Durability and maintenance', ru: 'Износостойкость и уход', fr: 'Résistance et entretien' },
      { he: 'התאמה לסגנון', en: 'Matching the style', ru: 'Соответствие стилю', fr: 'L’accord avec le style' }
    ] },

  /* 17 */
  { n: 17, min: 38, image: 'images/projects/nofei-yerushalayim-5.jpg', video: '', audio: '',
    title: { he: 'התחדשות עירונית מבפנים', en: 'Urban renewal from the inside', ru: 'Городское обновление изнутри', fr: 'Le renouvellement urbain de l’intérieur' },
    guest: { he: 'אורח: מנהל פרויקטי התחדשות', en: 'Guest: Urban renewal project manager', ru: 'Гость: руководитель проектов обновления', fr: 'Invité : chef de projets de renouvellement' },
    desc: { he: 'מה באמת קורה מאחורי הקלעים של פרויקט תמ"א ופינוי בינוי.', en: 'What really happens behind the scenes of a TAMA 38 or urban renewal project.', ru: 'Что на самом деле происходит за кулисами проектов ТАМА 38 и «снос-строительство».', fr: 'Ce qui se passe vraiment en coulisses d’un projet TAMA 38 ou de renouvellement urbain.' },
    points: [
      { he: 'מול הרשויות', en: 'Working with the authorities', ru: 'Работа с властями', fr: 'Face aux autorités' },
      { he: 'ניהול הדיירים', en: 'Managing the residents', ru: 'Работа с жильцами', fr: 'La gestion des résidents' },
      { he: 'לוחות זמנים', en: 'Timelines', ru: 'Сроки', fr: 'Les calendriers' }
    ] },

  /* 18 */
  { n: 18, min: 24, image: 'images/projects/nofei-yerushalayim-2.jpg', video: '', audio: '',
    title: { he: 'ניהול ואחזקת מבנים', en: 'Building management and maintenance', ru: 'Управление и обслуживание зданий', fr: 'Gestion et entretien des bâtiments' },
    guest: { he: 'אורח: מנהל אחזקה', en: 'Guest: Maintenance manager', ru: 'Гость: руководитель службы эксплуатации', fr: 'Invité : responsable de l’entretien' },
    desc: { he: 'איך שומרים על בניין מגורים או מסחר במצב מעולה לאורך שנים.', en: 'How to keep a residential or commercial building in excellent shape for years.', ru: 'Как годами поддерживать жилое или коммерческое здание в отличном состоянии.', fr: 'Comment garder un immeuble résidentiel ou commercial en excellent état pendant des années.' },
    points: [
      { he: 'תחזוקה מונעת', en: 'Preventive maintenance', ru: 'Профилактическое обслуживание', fr: 'L’entretien préventif' },
      { he: 'מוקד שירות', en: 'Service center', ru: 'Сервисный центр', fr: 'Le centre de service' },
      { he: 'תקציב ועד הבית', en: 'Building committee budget', ru: 'Бюджет домового комитета', fr: 'Le budget de la copropriété' }
    ] },

  /* 19 */
  { n: 19, min: 30, image: 'images/projects/sweet-home-2.jpg', video: '', audio: '',
    title: { he: 'שותפים למבנה שלכם', en: 'Partners in your building', ru: 'Партнёры вашего здания', fr: 'Partenaires de votre bâtiment' },
    guest: { he: 'אורח: מנהל שותפים וספקים', en: 'Guest: Partners and suppliers manager', ru: 'Гость: менеджер по партнёрам и поставщикам', fr: 'Invité : responsable partenaires et fournisseurs' },
    desc: { he: 'איך עובדים עם המותגים והספקים המובילים כדי לתת ללקוח את הטוב ביותר.', en: 'How we work with the leading brands and suppliers to give the client the very best.', ru: 'Как мы работаем с ведущими брендами и поставщиками, чтобы дать клиенту лучшее.', fr: 'Comment nous travaillons avec les marques et fournisseurs leaders pour offrir le meilleur au client.' },
    points: [
      { he: 'בחירת ספקים', en: 'Choosing suppliers', ru: 'Выбор поставщиков', fr: 'Le choix des fournisseurs' },
      { he: 'אולם התצוגה', en: 'The showroom', ru: 'Выставочный зал', fr: 'Le showroom' },
      { he: 'התאמה אישית ללקוח', en: 'Personal tailoring for the client', ru: 'Индивидуальный подход к клиенту', fr: 'Le sur-mesure pour le client' }
    ] },

  /* 20 */
  { n: 20, min: 35, image: 'images/projects/shalom-hotel-1.jpg', video: '', audio: '',
    title: { he: 'מסורת משפחתית מאז 1995', en: 'A family tradition since 1995', ru: 'Семейная традиция с 1995 года', fr: 'Une tradition familiale depuis 1995' },
    guest: { he: 'אורח: מייסד הקבוצה', en: 'Guest: Founder of the group', ru: 'Гость: основатель группы', fr: 'Invité : fondateur du groupe' },
    desc: { he: 'הסיפור של GAD MIVNIM – איך נולד הרעיון לאחד את הבנייה והעיצובים לבית אחד.', en: 'The story of GAD MIVNIM – how the idea was born to bring construction and design under one roof.', ru: 'История GAD MIVNIM — как родилась идея объединить строительство и дизайн под одной крышей.', fr: 'L’histoire de GAD MIVNIM – comment est née l’idée de réunir construction et design sous un même toit.' },
    points: [
      { he: 'הדרך מאז 1995', en: 'The journey since 1995', ru: 'Путь с 1995 года', fr: 'Le chemin depuis 1995' },
      { he: 'ערכי היסוד', en: 'Core values', ru: 'Основные ценности', fr: 'Les valeurs fondamentales' },
      { he: 'החזון לעתיד', en: 'The vision for the future', ru: 'Видение будущего', fr: 'La vision pour l’avenir' }
    ] }
];
