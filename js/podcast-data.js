/* ==========================================================================
   GAD MIVNIM — פודקאסט "אנשים משתפים" (podcast-data.js) — המקור היחיד לכרטיסי הפרקים ולחלון הפרק.
   תוכן לדוגמה (placeholder) — יוחלף בפרקים האמיתיים. הסדר כאן = הסדר בפס. כל פרק:
     n       — מספר הפרק
     min     — אורך בדקות
     audio   — נתיב לקובץ השמע (למשל 'audio/ep1.mp3'); ריק = "הפרק יעלה בקרוב"
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
  { n: 1, min: 34, audio: '',
    title: { he: 'החלום הראשון: איך מתחילים לבנות בית', en: 'The first dream: how to start building a home', ru: 'Первая мечта: с чего начать строительство дома', fr: 'Le premier rêve : comment commencer à construire sa maison' },
    guest: { he: 'אורח: מנהל פרויקטים, GAD MIVNIM', en: 'Guest: Project manager, GAD MIVNIM', ru: 'Гость: руководитель проектов, GAD MIVNIM', fr: 'Invité : chef de projet, GAD MIVNIM' },
    desc: { he: 'שיחה פתוחה על הצעדים הראשונים – מהמגרש ועד התוכנית, ואיך לא ללכת לאיבוד בדרך.', en: 'An open conversation about the first steps – from the plot to the plan, and how not to get lost along the way.', ru: 'Откровенный разговор о первых шагах — от участка до проекта и о том, как не заблудиться в пути.', fr: 'Une conversation ouverte sur les premiers pas – du terrain au plan, et comment ne pas se perdre en route.' },
    points: [
      { he: 'בדיקת זכויות בנייה', en: 'Checking building rights', ru: 'Проверка прав на застройку', fr: 'Vérifier les droits à construire' },
      { he: 'בחירת צוות תכנון', en: 'Choosing a design team', ru: 'Выбор проектной команды', fr: 'Choisir l’équipe de conception' },
      { he: 'לוח זמנים ריאלי', en: 'A realistic timeline', ru: 'Реалистичный график', fr: 'Un calendrier réaliste' }
    ] },

  /* 2 */
  { n: 2, min: 28, audio: '',
    title: { he: 'שיפוץ בלי כאב ראש', en: 'Renovation without the headache', ru: 'Ремонт без головной боли', fr: 'Rénover sans prise de tête' },
    guest: { he: 'אורח: מנהל עבודה', en: 'Guest: Site manager', ru: 'Гость: прораб', fr: 'Invité : chef de chantier' },
    desc: { he: 'מה באמת קורה באתר שיפוץ, ואיך שומרים על לוח זמנים ותקציב.', en: 'What really happens on a renovation site, and how to stay on schedule and on budget.', ru: 'Что на самом деле происходит на ремонте и как уложиться в сроки и бюджет.', fr: 'Ce qui se passe vraiment sur un chantier de rénovation, et comment tenir les délais et le budget.' },
    points: [
      { he: 'הכנה לפני השיפוץ', en: 'Preparing before the renovation', ru: 'Подготовка до ремонта', fr: 'Se préparer avant les travaux' },
      { he: 'הפתעות נפוצות ואיך נמנעים', en: 'Common surprises and how to avoid them', ru: 'Частые сюрпризы и как их избежать', fr: 'Les surprises fréquentes et comment les éviter' },
      { he: 'עבודה מול השכנים', en: 'Working with the neighbors', ru: 'Отношения с соседями', fr: 'Composer avec les voisins' }
    ] },

  /* 3 */
  { n: 3, min: 41, audio: '',
    title: { he: 'תמ"א 38 ופינוי בינוי – מה הדיירים צריכים לדעת', en: 'TAMA 38 and urban renewal – what residents need to know', ru: 'ТАМА 38 и «снос-строительство» — что нужно знать жильцам', fr: 'TAMA 38 et renouvellement urbain – ce que les résidents doivent savoir' },
    guest: { he: 'אורחת: יועצת התחדשות עירונית', en: 'Guest: Urban renewal consultant', ru: 'Гостья: консультант по городскому обновлению', fr: 'Invitée : consultante en renouvellement urbain' },
    desc: { he: 'התחדשות עירונית מנקודת המבט של הדיירים – זכויות, תהליכים ושקיפות.', en: 'Urban renewal from the residents’ point of view – rights, processes and transparency.', ru: 'Городское обновление глазами жильцов — права, процессы и прозрачность.', fr: 'Le renouvellement urbain du point de vue des résidents – droits, démarches et transparence.' },
    points: [
      { he: 'שלבי הפרויקט', en: 'Project stages', ru: 'Этапы проекта', fr: 'Les étapes du projet' },
      { he: 'נציגות דיירים', en: 'Residents’ committee', ru: 'Представительство жильцов', fr: 'La représentation des résidents' },
      { he: 'ליווי משפטי', en: 'Legal guidance', ru: 'Юридическое сопровождение', fr: 'L’accompagnement juridique' }
    ] },

  /* 4 */
  { n: 4, min: 25, audio: '',
    title: { he: 'מטבח שהוא הלב של הבית', en: 'A kitchen that is the heart of the home', ru: 'Кухня — сердце дома', fr: 'Une cuisine au cœur de la maison' },
    guest: { he: 'אורחת: מעצבת פנים', en: 'Guest: Interior designer', ru: 'Гостья: дизайнер интерьера', fr: 'Invitée : architecte d’intérieur' },
    desc: { he: 'איך מתכננים מטבח יפה, נוח ופרקטי – מהסקיצה ועד ההתקנה.', en: 'How to plan a beautiful, comfortable and practical kitchen – from sketch to installation.', ru: 'Как спланировать красивую, удобную и практичную кухню — от эскиза до монтажа.', fr: 'Comment concevoir une cuisine belle, confortable et pratique – de l’esquisse à l’installation.' },
    points: [
      { he: 'תכנון משולש העבודה', en: 'Planning the work triangle', ru: 'Планирование рабочего треугольника', fr: 'Planifier le triangle d’activité' },
      { he: 'בחירת משטחים', en: 'Choosing countertops', ru: 'Выбор столешниц', fr: 'Choisir les plans de travail' },
      { he: 'תאורה במטבח', en: 'Kitchen lighting', ru: 'Освещение кухни', fr: 'L’éclairage de la cuisine' }
    ] },

  /* 5 */
  { n: 5, min: 30, audio: '',
    title: { he: 'רטיבות: האויב השקט של המבנה', en: 'Damp: the building’s silent enemy', ru: 'Сырость: тихий враг здания', fr: 'L’humidité : l’ennemi silencieux du bâtiment' },
    guest: { he: 'אורח: מומחה איטום', en: 'Guest: Waterproofing expert', ru: 'Гость: эксперт по гидроизоляции', fr: 'Invité : expert en étanchéité' },
    desc: { he: 'מאיפה מגיעה הרטיבות, איך מזהים אותה מוקדם ואיך מטפלים בה פעם אחת ולתמיד.', en: 'Where damp comes from, how to spot it early and how to deal with it once and for all.', ru: 'Откуда берётся сырость, как распознать её вовремя и устранить раз и навсегда.', fr: 'D’où vient l’humidité, comment la repérer tôt et la traiter une fois pour toutes.' },
    points: [
      { he: 'סימני אזהרה', en: 'Warning signs', ru: 'Тревожные признаки', fr: 'Les signes d’alerte' },
      { he: 'איטום גגות ומרפסות', en: 'Waterproofing roofs and balconies', ru: 'Гидроизоляция крыш и балконов', fr: 'L’étanchéité des toits et des balcons' },
      { he: 'בדיקת הצפה', en: 'Flood testing', ru: 'Проверка заливом', fr: 'Le test d’inondation' }
    ] },

  /* 6 */
  { n: 6, min: 37, audio: '',
    title: { he: 'שיקום מבנים ישנים – לשמור על הנשמה', en: 'Restoring old buildings – keeping their soul', ru: 'Реставрация старых зданий — сохранить душу', fr: 'Restaurer les bâtiments anciens – préserver leur âme' },
    guest: { he: 'אורח: מהנדס קונסטרוקציה', en: 'Guest: Structural engineer', ru: 'Гость: инженер-конструктор', fr: 'Invité : ingénieur en structure' },
    desc: { he: 'איך מחזירים חיים למבנה ותיק בלי לאבד את האופי שלו.', en: 'How to bring an old building back to life without losing its character.', ru: 'Как вернуть к жизни старое здание, не потеряв его характер.', fr: 'Comment redonner vie à un bâtiment ancien sans perdre son caractère.' },
    points: [
      { he: 'סקר הנדסי', en: 'Engineering survey', ru: 'Инженерное обследование', fr: 'L’expertise technique' },
      { he: 'חיזוק שלד', en: 'Structural reinforcement', ru: 'Усиление каркаса', fr: 'Le renforcement de la structure' },
      { he: 'מבנים לשימור', en: 'Heritage buildings', ru: 'Здания под охраной', fr: 'Les bâtiments classés' }
    ] },

  /* 7 */
  { n: 7, min: 22, audio: '',
    title: { he: 'בטיחות באתר – לפני הכל', en: 'Site safety – first of all', ru: 'Безопасность на площадке — прежде всего', fr: 'La sécurité sur le chantier – avant tout' },
    guest: { he: 'אורח: ממונה בטיחות', en: 'Guest: Safety officer', ru: 'Гость: специалист по охране труда', fr: 'Invité : responsable sécurité' },
    desc: { he: 'מה עושים כדי שכל יום עבודה באתר יסתיים בשלום.', en: 'What it takes for every working day on site to end safely.', ru: 'Что нужно, чтобы каждый рабочий день на площадке заканчивался благополучно.', fr: 'Ce qu’il faut pour que chaque journée de chantier se termine sans incident.' },
    points: [
      { he: 'עבודה בגובה', en: 'Working at height', ru: 'Работы на высоте', fr: 'Le travail en hauteur' },
      { he: 'גידור ושילוט', en: 'Fencing and signage', ru: 'Ограждение и знаки', fr: 'Clôtures et signalisation' },
      { he: 'מצלמות 24/7', en: '24/7 cameras', ru: 'Камеры 24/7', fr: 'Caméras 24h/24' }
    ] },

  /* 8 */
  { n: 8, min: 29, audio: '',
    title: { he: 'איך בוחרים קבלן שאפשר לסמוך עליו', en: 'How to choose a contractor you can trust', ru: 'Как выбрать подрядчика, которому можно доверять', fr: 'Comment choisir un entrepreneur de confiance' },
    guest: { he: 'אורח: מנהל פרויקטים, GAD MIVNIM', en: 'Guest: Project manager, GAD MIVNIM', ru: 'Гость: руководитель проектов, GAD MIVNIM', fr: 'Invité : chef de projet, GAD MIVNIM' },
    desc: { he: 'השאלות הנכונות, הבדיקות שחייבים לעשות והנורות האדומות.', en: 'The right questions, the must-do checks and the red flags.', ru: 'Правильные вопросы, обязательные проверки и тревожные сигналы.', fr: 'Les bonnes questions, les vérifications indispensables et les signaux d’alarme.' },
    points: [
      { he: 'רישיון וביטוח', en: 'License and insurance', ru: 'Лицензия и страховка', fr: 'Licence et assurance' },
      { he: 'חוזה ומפרט', en: 'Contract and specification', ru: 'Договор и спецификация', fr: 'Contrat et cahier des charges' },
      { he: 'תקשורת שוטפת', en: 'Ongoing communication', ru: 'Постоянная связь', fr: 'Une communication suivie' }
    ] },

  /* 9 */
  { n: 9, min: 24, audio: '',
    title: { he: 'תאורה שמשנה את הבית', en: 'Lighting that transforms the home', ru: 'Освещение, которое меняет дом', fr: 'Un éclairage qui transforme la maison' },
    guest: { he: 'אורחת: מעצבת תאורה', en: 'Guest: Lighting designer', ru: 'Гостья: дизайнер освещения', fr: 'Invitée : conceptrice lumière' },
    desc: { he: 'איך אור נכון יוצר אווירה, נוחות וחיסכון.', en: 'How the right light creates atmosphere, comfort and savings.', ru: 'Как правильный свет создаёт атмосферу, комфорт и экономию.', fr: 'Comment une bonne lumière crée ambiance, confort et économies.' },
    points: [
      { he: 'שכבות תאורה', en: 'Layers of lighting', ru: 'Слои освещения', fr: 'Les couches d’éclairage' },
      { he: 'גוונים וטמפרטורת צבע', en: 'Tones and color temperature', ru: 'Оттенки и цветовая температура', fr: 'Teintes et température de couleur' },
      { he: 'תאורת חוץ', en: 'Outdoor lighting', ru: 'Наружное освещение', fr: 'L’éclairage extérieur' }
    ] },

  /* 10 */
  { n: 10, min: 26, audio: '',
    title: { he: 'אחרי המסירה: בדק בית ואחריות', en: 'After handover: defects period and warranty', ru: 'После сдачи: гарантийный период и обязательства', fr: 'Après la livraison : garantie et parfait achèvement' },
    guest: { he: 'אורח: מנהל שירות לקוחות', en: 'Guest: Customer service manager', ru: 'Гость: руководитель клиентского сервиса', fr: 'Invité : responsable du service client' },
    desc: { he: 'מה קורה אחרי שמקבלים את המפתח, ולמה שירות טוב לא נגמר במסירה.', en: 'What happens after you get the key, and why good service doesn’t end at handover.', ru: 'Что происходит после получения ключей и почему хороший сервис не заканчивается сдачей.', fr: 'Ce qui se passe après la remise des clés, et pourquoi un bon service ne s’arrête pas à la livraison.' },
    points: [
      { he: 'תעודת אחריות', en: 'Warranty certificate', ru: 'Гарантийный сертификат', fr: 'Le certificat de garantie' },
      { he: 'בדק בית', en: 'Defects liability period', ru: 'Гарантийный период', fr: 'La garantie de parfait achèvement' },
      { he: 'מנויי אחזקה', en: 'Maintenance plans', ru: 'Абонементы на обслуживание', fr: 'Les contrats d’entretien' }
    ] }
];
