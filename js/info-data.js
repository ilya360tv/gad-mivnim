/* ==========================================================================
   GAD MIVNIM — תוכן חלונות "מידע לאזרח ולבונה" (info-data.js)
   כל כרטיס ב-#info (לפי data-slug של הכרטיס) מקבל sections — מקטע אחד או יותר. כל מקטע:
     title  — כותרת מקטע (רק כשיש בחלון יותר ממקטע אחד; אחרת ריק)
     intro  — פסקת פתיחה קצרה
     points — "מה חשוב לדעת" (3–4 נקודות)
     tip    — "טיפ GAD MIVNIM"
   כל טקסט לפי שפה: { he, en, ru, fr } — העברית היא המקור. בלי sections = "תוכן יתווסף בקרוב".
   ========================================================================== */
window.INFO_DATA = {

  /* 1. מתכננים שיפוץ? זה מה שחשוב לדעת */
  'renovation': { sections: [{
    intro: { he: 'שיפוץ טוב מתחיל הרבה לפני הפטיש הראשון – בתכנון נכון שחוסך כסף, זמן ועוגמת נפש.', en: 'A good renovation starts long before the first hammer – with proper planning that saves money, time and heartache.', ru: 'Хороший ремонт начинается задолго до первого удара молотка — с правильного планирования, которое экономит деньги, время и нервы.', fr: 'Une bonne rénovation commence bien avant le premier coup de marteau – par une bonne planification qui fait gagner de l’argent, du temps et évite bien des tracas.' },
    points: [
      { he: 'בדקו מראש אם השינוי דורש היתר בנייה או אישור מהרשות המקומית.', en: 'Check in advance whether the change requires a building permit or approval from the local authority.', ru: 'Заранее узнайте, требуется ли для изменений разрешение на строительство или согласование с местными властями.', fr: 'Vérifiez à l’avance si la modification nécessite un permis de construire ou l’accord de la municipalité.' },
      { he: 'קיר נושא, מערכות חשמל ואינסטלציה – לא נוגעים בלי מהנדס ובעלי מקצוע מוסמכים.', en: 'Load-bearing walls, electrical and plumbing systems – never touch them without an engineer and licensed professionals.', ru: 'Несущие стены, электрика и сантехника — не трогайте их без инженера и лицензированных специалистов.', fr: 'Murs porteurs, électricité et plomberie – on n’y touche pas sans ingénieur ni professionnels agréés.' },
      { he: 'הגדירו סדר עבודה ולוח זמנים ברור לפני שמתחילים.', en: 'Set a clear work order and timeline before you start.', ru: 'Определите чёткий порядок работ и график до начала.', fr: 'Fixez un ordre des travaux et un calendrier clairs avant de commencer.' },
      { he: 'השאירו 10%–15% מהתקציב לבלתי צפוי.', en: 'Keep 10%–15% of the budget for the unexpected.', ru: 'Оставьте 10–15% бюджета на непредвиденные расходы.', fr: 'Gardez 10 à 15 % du budget pour les imprévus.' }
    ],
    tip: { he: 'צלמו ותעדו את המצב הקיים לפני תחילת העבודות – זה שווה זהב בכל שלב.', en: 'Photograph and document the existing condition before work begins – it’s worth gold at every stage.', ru: 'Сфотографируйте и задокументируйте исходное состояние до начала работ — это бесценно на любом этапе.', fr: 'Photographiez et documentez l’état existant avant le début des travaux – cela vaut de l’or à chaque étape.' }
  }]},

  /* 2. בונים בית פרטי – חכם, יעיל ונכון */
  'private-home': { sections: [{
    intro: { he: 'בית פרטי הוא פרויקט חיים – וכשמנהלים אותו נכון, החלום הופך למפתח בלי לאבד את הדרך.', en: 'A private home is a life project – and when it’s managed right, the dream becomes a key without losing your way.', ru: 'Частный дом — проект всей жизни, и при правильном управлении мечта превращается в ключ, не сбившись с пути.', fr: 'Une maison individuelle est le projet d’une vie – bien gérée, le rêve devient une clé sans perdre le cap.' },
    points: [
      { he: 'התחילו בבדיקת זכויות הבנייה והתב"ע של המגרש.', en: 'Start by checking the plot’s building rights and zoning plan.', ru: 'Начните с проверки прав на застройку и градостроительного плана участка.', fr: 'Commencez par vérifier les droits à construire et le plan d’urbanisme du terrain.' },
      { he: 'צוות אחד שמתאם תכנון, הנדסה וביצוע חוסך פערים וטעויות יקרות.', en: 'One team coordinating design, engineering and execution saves gaps and costly mistakes.', ru: 'Одна команда, координирующая проектирование, инженерию и строительство, избавляет от нестыковок и дорогих ошибок.', fr: 'Une seule équipe qui coordonne conception, ingénierie et exécution évite les décalages et les erreurs coûteuses.' },
      { he: 'תוכניות מפורטות ומפרט טכני ברור = הצעות מחיר מדויקות.', en: 'Detailed plans and a clear technical specification = accurate quotes.', ru: 'Подробные чертежи и чёткая техническая спецификация = точные сметы.', fr: 'Des plans détaillés et un cahier des charges clair = des devis précis.' },
      { he: 'לוח זמנים עם אבני דרך מאפשר לכם לדעת בכל רגע איפה הפרויקט עומד.', en: 'A timeline with milestones lets you know at any moment where the project stands.', ru: 'График с контрольными точками позволяет в любой момент знать, на каком этапе проект.', fr: 'Un calendrier avec des jalons vous permet de savoir à tout moment où en est le projet.' }
    ],
    tip: { he: 'החלטות על מטבח, ריצוף ותאורה כדאי לקבל כבר בשלב התכנון – לא באמצע הבנייה.', en: 'Decisions on the kitchen, flooring and lighting are best made at the planning stage – not in the middle of construction.', ru: 'Решения о кухне, напольном покрытии и освещении лучше принимать на этапе проектирования, а не посреди стройки.', fr: 'Les choix de cuisine, de sols et d’éclairage se font dès la conception – pas en plein chantier.' }
  }]},

  /* 3. שומרים על המבנה מפני מזג האוויר */
  'weather': { sections: [{
    intro: { he: 'גשם, שמש ורוח עובדים על המבנה שלכם כל יום. מי שמקדים – חוסך.', en: 'Rain, sun and wind work on your building every day. Acting early saves money.', ru: 'Дождь, солнце и ветер воздействуют на ваше здание каждый день. Кто действует заранее — экономит.', fr: 'Pluie, soleil et vent agissent sur votre bâtiment chaque jour. Anticiper, c’est économiser.' },
    points: [
      { he: 'איטום גגות ומרפסות הוא קו ההגנה הראשון מפני רטיבות ועובש.', en: 'Waterproofing roofs and balconies is the first line of defense against damp and mold.', ru: 'Гидроизоляция крыш и балконов — первая линия защиты от сырости и плесени.', fr: 'L’étanchéité des toits et des balcons est la première ligne de défense contre l’humidité et les moisissures.' },
      { he: 'סדקים קטנים בחזית הם הזמנה לחדירת מים – מטפלים בהם מוקדם.', en: 'Small cracks in the facade invite water in – treat them early.', ru: 'Мелкие трещины на фасаде — приглашение для воды; устраняйте их вовремя.', fr: 'Les petites fissures en façade laissent entrer l’eau – traitez-les tôt.' },
      { he: 'בידוד נכון שומר על נוחות בבית ומוריד את חשבון החשמל.', en: 'Proper insulation keeps the home comfortable and lowers the electricity bill.', ru: 'Правильная теплоизоляция сохраняет комфорт в доме и снижает счета за электричество.', fr: 'Une bonne isolation garde la maison confortable et réduit la facture d’électricité.' },
      { he: 'בדיקה לפני החורף שווה יותר מתיקון אחריו.', en: 'An inspection before winter is worth more than a repair after it.', ru: 'Проверка перед зимой стоит больше, чем ремонт после неё.', fr: 'Une inspection avant l’hiver vaut mieux qu’une réparation après.' }
    ],
    tip: { he: 'קבעו בדיקת איטום תקופתית פעם בשנה, רגע לפני עונת הגשמים.', en: 'Schedule a waterproofing inspection once a year, just before the rainy season.', ru: 'Назначайте проверку гидроизоляции раз в год, прямо перед сезоном дождей.', fr: 'Programmez un contrôle d’étanchéité une fois par an, juste avant la saison des pluies.' }
  }]},

  /* 4. תכנון תקציב בלי הפתעות */
  'budget': { sections: [{
    intro: { he: 'תקציב טוב הוא לא רק מספר – הוא תוכנית שמשאירה אתכם בשליטה מההתחלה ועד המסירה.', en: 'A good budget isn’t just a number – it’s a plan that keeps you in control from start to handover.', ru: 'Хороший бюджет — это не просто число, а план, который держит всё под вашим контролем от начала до сдачи.', fr: 'Un bon budget n’est pas qu’un chiffre – c’est un plan qui vous garde maître du projet du début à la livraison.' },
    points: [
      { he: 'פרקו את התקציב לפי שלבים: תכנון, שלד, מערכות, גמר ומוצרים נלווים.', en: 'Break the budget into stages: planning, structure, systems, finishing and complementary products.', ru: 'Разбейте бюджет по этапам: проектирование, каркас, инженерные системы, отделка и сопутствующие товары.', fr: 'Découpez le budget par étapes : conception, gros œuvre, réseaux, finitions et produits complémentaires.' },
      { he: 'השוו הצעות מחיר לפי אותו מפרט בדיוק – אחרת משווים תפוחים לתפוזים.', en: 'Compare quotes against exactly the same specification – otherwise you’re comparing apples to oranges.', ru: 'Сравнивайте сметы строго по одной и той же спецификации — иначе вы сравниваете яблоки с апельсинами.', fr: 'Comparez les devis sur exactement le même cahier des charges – sinon on compare des pommes et des oranges.' },
      { he: 'הגדירו מראש רזרבה לבלתי צפוי.', en: 'Set a reserve for the unexpected in advance.', ru: 'Заранее заложите резерв на непредвиденное.', fr: 'Prévoyez d’avance une réserve pour les imprévus.' },
      { he: 'עקבו אחרי ההוצאות לאורך הדרך, לא רק בסוף.', en: 'Track expenses along the way, not just at the end.', ru: 'Отслеживайте расходы по ходу работ, а не только в конце.', fr: 'Suivez les dépenses tout au long du projet, pas seulement à la fin.' }
    ],
    tip: { he: '"הכי זול" בהתחלה יוצא לא פעם "הכי יקר" בסוף – בחרו לפי איכות ואחריות.', en: '"The cheapest" at the start often turns out "the most expensive" in the end – choose by quality and warranty.', ru: '«Самое дешёвое» в начале нередко оказывается «самым дорогим» в конце — выбирайте по качеству и гарантии.', fr: '« Le moins cher » au départ finit souvent « le plus cher » à l’arrivée – choisissez la qualité et la garantie.' }
  }]},

  /* 5. מבנה מסוכן ומבנה לשימור — שני מקטעים */
  'dangerous': { sections: [{
    title: { he: 'מבנה מסוכן', en: 'Dangerous buildings', ru: 'Опасное здание', fr: 'Bâtiment dangereux' },
    intro: { he: 'סדק, שקיעה או בטון מתפורר הם לא רק בעיה אסתטית – לפעמים הם סימן אזהרה.', en: 'A crack, subsidence or crumbling concrete isn’t just a cosmetic issue – sometimes it’s a warning sign.', ru: 'Трещина, просадка или крошащийся бетон — это не только эстетическая проблема, иногда это тревожный сигнал.', fr: 'Une fissure, un affaissement ou un béton qui s’effrite ne sont pas qu’un problème esthétique – c’est parfois un signal d’alerte.' },
    points: [
      { he: 'סדקים מתרחבים, ברזל חשוף או רצפה ששוקעת – דורשים בדיקת מהנדס בהקדם.', en: 'Widening cracks, exposed rebar or a sinking floor – require an engineer’s inspection as soon as possible.', ru: 'Расширяющиеся трещины, оголённая арматура или проседающий пол требуют скорейшей проверки инженера.', fr: 'Fissures qui s’élargissent, ferraillage apparent ou sol qui s’affaisse – exigent au plus vite l’avis d’un ingénieur.' },
      { he: 'לבעלי המבנה יש אחריות לתחזוקה ולבטיחות הדיירים והעוברים.', en: 'Building owners are responsible for maintenance and for the safety of residents and passers-by.', ru: 'Владельцы здания отвечают за его содержание и безопасность жильцов и прохожих.', fr: 'Les propriétaires sont responsables de l’entretien et de la sécurité des résidents et des passants.' },
      { he: 'טיפול מוקדם זול ובטוח בהרבה מתיקון אחרי נזק.', en: 'Early treatment is far cheaper and safer than repairs after damage.', ru: 'Ранний ремонт гораздо дешевле и безопаснее, чем исправление последствий.', fr: 'Agir tôt est bien moins cher et plus sûr que réparer après les dégâts.' },
      { he: 'חיזוק מבנה נעשה לפי תכנון הנדסי בלבד.', en: 'Structural reinforcement is done only according to an engineering design.', ru: 'Усиление конструкций выполняется только по инженерному проекту.', fr: 'Le renforcement d’une structure se fait uniquement selon une étude d’ingénierie.' }
    ],
    tip: { he: 'כשיש ספק – אין ספק. הזמינו בדיקה מקצועית לפני שמחכים לנזק.', en: 'When in doubt – there’s no doubt. Order a professional inspection before damage occurs.', ru: 'Если есть сомнения — сомнений нет. Закажите профессиональную проверку, не дожидаясь ущерба.', fr: 'Dans le doute, n’hésitez pas : faites faire une inspection professionnelle avant les dégâts.' }
  }, {
    title: { he: 'מבנה לשימור', en: 'Heritage buildings', ru: 'Здание под охраной', fr: 'Bâtiment classé' },
    intro: { he: 'למבנה לשימור יש היסטוריה ונשמה – והשדרוג שלו דורש רגישות, ידע ותכנון מדויק.', en: 'A heritage building has history and soul – and upgrading it takes sensitivity, knowledge and precise planning.', ru: 'У здания под охраной есть история и душа — и его модернизация требует деликатности, знаний и точного планирования.', fr: 'Un bâtiment classé a une histoire et une âme – sa rénovation exige délicatesse, savoir-faire et une planification précise.' },
    points: [
      { he: 'כל שינוי כפוף להנחיות השימור של הרשות המקומית.', en: 'Every change is subject to the local authority’s preservation guidelines.', ru: 'Любые изменения подчиняются требованиям местных властей по охране памятников.', fr: 'Toute modification est soumise aux directives de conservation de la municipalité.' },
      { he: 'חומרים ושיטות עבודה צריכים להתאים לאופי המקורי של המבנה.', en: 'Materials and work methods must suit the building’s original character.', ru: 'Материалы и методы работ должны соответствовать исходному характеру здания.', fr: 'Les matériaux et les méthodes doivent respecter le caractère d’origine du bâtiment.' },
      { he: 'תיעוד ותכנון מוקדם מקצרים את תהליך האישורים.', en: 'Early documentation and planning shorten the approval process.', ru: 'Ранняя документация и планирование сокращают процесс согласований.', fr: 'Une documentation et une planification précoces raccourcissent les autorisations.' },
      { he: 'אפשר לשלב מערכות מודרניות בלי לפגוע בערך ההיסטורי.', en: 'Modern systems can be integrated without harming the historic value.', ru: 'Современные системы можно встроить, не нарушая историческую ценность.', fr: 'On peut intégrer des équipements modernes sans nuire à la valeur historique.' }
    ],
    tip: { he: 'צוות שמכיר עבודות שיקום ושימור חוסך לכם חודשים של התכתבויות.', en: 'A team experienced in restoration and preservation saves you months of correspondence.', ru: 'Команда с опытом реставрации и сохранения зданий избавит вас от месяцев переписки.', fr: 'Une équipe rompue à la restauration et à la conservation vous épargne des mois de correspondance.' }
  }]},

  /* 6. תחזוקה שוטפת – ככה שומרים על הערך */
  'maintenance': { sections: [{
    intro: { he: 'מבנה מתוחזק שומר על הערך שלו – ועל השקט שלכם.', en: 'A well-maintained building keeps its value – and your peace of mind.', ru: 'Ухоженное здание сохраняет свою ценность — и ваше спокойствие.', fr: 'Un bâtiment bien entretenu garde sa valeur – et votre tranquillité.' },
    points: [
      { he: 'בדיקות תקופתיות למערכות חשמל, אינסטלציה, מיזוג ואיטום.', en: 'Periodic checks of electrical, plumbing, air-conditioning and waterproofing systems.', ru: 'Периодические проверки электрики, сантехники, кондиционирования и гидроизоляции.', fr: 'Contrôles réguliers de l’électricité, de la plomberie, de la climatisation et de l’étanchéité.' },
      { he: 'ניקוי מרזבים ונקזים לפני החורף מונע הצפות ורטיבות.', en: 'Cleaning gutters and drains before winter prevents flooding and damp.', ru: 'Чистка водостоков и сливов перед зимой предотвращает затопления и сырость.', fr: 'Nettoyer gouttières et évacuations avant l’hiver évite inondations et humidité.' },
      { he: 'טיפול מיידי בתקלות קטנות מונע תקלות גדולות.', en: 'Fixing small faults right away prevents big ones.', ru: 'Немедленное устранение мелких неисправностей предотвращает крупные.', fr: 'Régler tout de suite les petites pannes évite les grosses.' },
      { he: 'תיק מבנה מסודר עם כל המסמכים והאחריות חוסך זמן בכל פנייה.', en: 'An organized building file with all documents and warranties saves time on every request.', ru: 'Аккуратное досье здания со всеми документами и гарантиями экономит время при каждом обращении.', fr: 'Un dossier du bâtiment bien tenu, avec documents et garanties, fait gagner du temps à chaque démarche.' }
    ],
    tip: { he: 'מנוי שירות ואחזקה שומר על המבנה במצב מעולה – בלי שתצטרכו לזכור כלום.', en: 'A service and maintenance plan keeps the building in excellent shape – without you having to remember a thing.', ru: 'Абонемент на обслуживание держит здание в отличном состоянии — и вам не нужно ничего помнить.', fr: 'Un contrat d’entretien garde le bâtiment en excellent état – sans que vous ayez à y penser.' }
  }]},

  /* 7. בטיחות בעבודה – לפני הכל */
  'safety': { sections: [{
    intro: { he: 'באתר בנייה, בטיחות היא לא סעיף בחוזה – היא הבסיס לכל יום עבודה.', en: 'On a construction site, safety isn’t a clause in the contract – it’s the foundation of every working day.', ru: 'На стройке безопасность — не пункт договора, а основа каждого рабочего дня.', fr: 'Sur un chantier, la sécurité n’est pas une clause du contrat – c’est la base de chaque journée de travail.' },
    points: [
      { he: 'גידור ושילוט האתר מגנים על העובדים, על הדיירים ועל העוברים ושבים.', en: 'Fencing and signage protect the workers, the residents and passers-by.', ru: 'Ограждение и знаки на площадке защищают рабочих, жильцов и прохожих.', fr: 'Clôtures et signalisation protègent les ouvriers, les résidents et les passants.' },
      { he: 'עבודה בגובה רק עם ציוד מתאים ובעלי מקצוע מוסמכים.', en: 'Work at height only with proper equipment and certified professionals.', ru: 'Работы на высоте — только с подходящим снаряжением и сертифицированными специалистами.', fr: 'Travail en hauteur uniquement avec l’équipement adapté et des professionnels certifiés.' },
      { he: 'מנהל עבודה רשום אחראי על הבטיחות באתר.', en: 'A registered site manager is responsible for safety on site.', ru: 'Зарегистрированный прораб отвечает за безопасность на площадке.', fr: 'Un chef de chantier agréé est responsable de la sécurité sur le site.' },
      { he: 'מצלמות ובקרה באתר מוסיפות שכבת ביטחון ושקיפות.', en: 'Cameras and monitoring on site add a layer of security and transparency.', ru: 'Камеры и контроль на площадке добавляют безопасности и прозрачности.', fr: 'Caméras et surveillance sur le chantier ajoutent sécurité et transparence.' }
    ],
    tip: { he: 'אצלנו כל פרויקט מרושת במצלמות אבטחה 24/7 עוד לפני תחילת העבודות.', en: 'With us, every project is covered by 24/7 security cameras even before work begins.', ru: 'У нас каждый проект оснащается камерами наблюдения 24/7 ещё до начала работ.', fr: 'Chez nous, chaque projet est équipé de caméras de sécurité 24h/24 avant même le début des travaux.' }
  }]},

  /* 8. בחירת קבלן ובעלי מקצוע */
  'contractor': { sections: [{
    intro: { he: 'הבחירה הנכונה של קבלן היא ההחלטה החשובה ביותר בפרויקט.', en: 'Choosing the right contractor is the most important decision in the project.', ru: 'Правильный выбор подрядчика — самое важное решение в проекте.', fr: 'Bien choisir son entrepreneur est la décision la plus importante du projet.' },
    points: [
      { he: 'בדקו רישיון, ביטוח וניסיון בפרויקטים דומים.', en: 'Check licensing, insurance and experience with similar projects.', ru: 'Проверьте лицензию, страховку и опыт в похожих проектах.', fr: 'Vérifiez la licence, l’assurance et l’expérience sur des projets similaires.' },
      { he: 'בקשו לראות עבודות קודמות ולדבר עם לקוחות.', en: 'Ask to see previous work and talk to clients.', ru: 'Попросите показать прошлые работы и поговорите с клиентами.', fr: 'Demandez à voir des réalisations et à parler à d’anciens clients.' },
      { he: 'חוזה מפורט עם מפרט, לוחות זמנים ותנאי אחריות – חובה.', en: 'A detailed contract with specifications, timelines and warranty terms – a must.', ru: 'Подробный договор со спецификацией, сроками и условиями гарантии обязателен.', fr: 'Un contrat détaillé avec cahier des charges, délais et garanties – indispensable.' },
      { he: 'זמינות ותקשורת שוטפת חשובות לא פחות מהמחיר.', en: 'Availability and ongoing communication matter as much as the price.', ru: 'Доступность и постоянная связь важны не меньше цены.', fr: 'La disponibilité et une communication suivie comptent autant que le prix.' }
    ],
    tip: { he: 'עבודה מול גוף אחד שמתאם את כל בעלי המקצוע חוסכת לכם את "הריצות" בין קבלנים.', en: 'Working with one body that coordinates all the professionals saves you running around between contractors.', ru: 'Работа с одной компанией, координирующей всех специалистов, избавит вас от беготни между подрядчиками.', fr: 'Un interlocuteur unique qui coordonne tous les corps de métier vous évite de courir entre les entrepreneurs.' }
  }]},

  /* 9. בחירת מוצרים נלווים לפרויקט */
  'products': { sections: [{
    intro: { he: 'ריצוף, מטבח, תאורה ודלתות – הבחירות האלה הן מה שהופך מבנה לבית.', en: 'Flooring, kitchen, lighting and doors – these choices are what turn a building into a home.', ru: 'Плитка, кухня, освещение и двери — именно этот выбор превращает здание в дом.', fr: 'Sols, cuisine, éclairage et portes – ce sont ces choix qui font d’un bâtiment un foyer.' },
    points: [
      { he: 'בחרו מוצרים שמתאימים לסגנון, לשימוש היומיומי ולתקציב.', en: 'Choose products that suit your style, daily use and budget.', ru: 'Выбирайте товары, подходящие вашему стилю, повседневному использованию и бюджету.', fr: 'Choisissez des produits adaptés à votre style, à l’usage quotidien et au budget.' },
      { he: 'שימו לב לאחריות, לזמינות חלפים ולזמני אספקה.', en: 'Pay attention to warranty, spare-part availability and delivery times.', ru: 'Обращайте внимание на гарантию, наличие запчастей и сроки поставки.', fr: 'Faites attention à la garantie, à la disponibilité des pièces et aux délais de livraison.' },
      { he: 'קבלו החלטות מוקדם כדי לא לעכב את הביצוע.', en: 'Decide early so as not to delay the work.', ru: 'Принимайте решения заранее, чтобы не задерживать работы.', fr: 'Décidez tôt pour ne pas retarder les travaux.' },
      { he: 'ראו ומששו את המוצרים לפני שמזמינים – תמונה לא תמיד מספרת הכל.', en: 'See and touch the products before ordering – a picture doesn’t always tell the whole story.', ru: 'Посмотрите и потрогайте товары до заказа — фото не всегда говорит всё.', fr: 'Voyez et touchez les produits avant de commander – une photo ne dit pas tout.' }
    ],
    tip: { he: 'באולם התצוגה שלנו (בקרוב...) תוכלו לבחור הכל במקום אחד, עם ליווי אישי.', en: 'In our showroom (coming soon...) you’ll be able to choose everything in one place, with personal guidance.', ru: 'В нашем выставочном зале (скоро...) вы сможете выбрать всё в одном месте с личным сопровождением.', fr: 'Dans notre showroom (bientôt...) vous pourrez tout choisir au même endroit, avec un accompagnement personnalisé.' }
  }]},

  /* 10. ליקויי בנייה ותכנון נכון — שני מקטעים */
  'defects': { sections: [{
    title: { he: 'ליקויי בנייה וטיפול בהם', en: 'Construction defects and how to handle them', ru: 'Строительные дефекты и их устранение', fr: 'Les malfaçons et leur traitement' },
    intro: { he: 'רטיבות, סדקים או ריצוף שקוע – ליקוי בנייה מטפלים בו נכון, ולא מחכים שיחמיר.', en: 'Damp, cracks or sunken flooring – a construction defect should be handled properly, not left to get worse.', ru: 'Сырость, трещины или просевшая плитка — дефект нужно устранять правильно и не ждать, пока станет хуже.', fr: 'Humidité, fissures ou carrelage affaissé – une malfaçon se traite correctement, sans attendre qu’elle s’aggrave.' },
    points: [
      { he: 'תעדו את הליקוי בתמונות ובתאריכים.', en: 'Document the defect with photos and dates.', ru: 'Задокументируйте дефект фотографиями с датами.', fr: 'Documentez la malfaçon avec photos et dates.' },
      { he: 'בדיקת מהנדס או בודק מוסמך מגדירה את הבעיה והפתרון.', en: 'An inspection by an engineer or certified inspector defines the problem and the solution.', ru: 'Проверка инженера или сертифицированного эксперта определяет проблему и решение.', fr: 'L’expertise d’un ingénieur ou d’un inspecteur agréé définit le problème et la solution.' },
      { he: 'בדירה חדשה – בדקו את תקופת הבדק והאחריות שלכם.', en: 'In a new apartment – check your inspection and warranty period.', ru: 'В новой квартире проверьте гарантийный срок и период устранения дефектов.', fr: 'Dans un logement neuf – vérifiez votre période de garantie et de parfait achèvement.' },
      { he: 'תיקון שורש הבעיה חשוב יותר מ"איפור" מהיר.', en: 'Fixing the root of the problem matters more than a quick cosmetic fix.', ru: 'Устранить причину проблемы важнее, чем быстро «замаскировать» её.', fr: 'Traiter la cause compte plus qu’un « maquillage » rapide.' }
    ],
    tip: { he: 'אנחנו מאתרים את מקור הבעיה – ומתקנים אותה פעם אחת ולתמיד.', en: 'We find the source of the problem – and fix it once and for all.', ru: 'Мы находим источник проблемы — и устраняем его раз и навсегда.', fr: 'Nous trouvons la source du problème – et la réglons une fois pour toutes.' }
  }, {
    title: { he: 'למה לתכנן כל פרויקט נכון', en: 'Why plan every project properly', ru: 'Почему каждый проект нужно правильно планировать', fr: 'Pourquoi bien planifier chaque projet' },
    intro: { he: 'כל שעה של תכנון חוסכת ימים של תיקונים.', en: 'Every hour of planning saves days of repairs.', ru: 'Каждый час планирования экономит дни исправлений.', fr: 'Chaque heure de planification épargne des jours de réparations.' },
    points: [
      { he: 'בלי תכנון – שינויים באמצע הדרך מייקרים ומעכבים.', en: 'Without planning – changes midway raise costs and cause delays.', ru: 'Без планирования изменения по ходу работ удорожают и затягивают проект.', fr: 'Sans planification – les changements en cours de route coûtent cher et retardent.' },
      { he: 'תיאום בין אדריכל, מהנדס וקבלן מונע טעויות ביצוע.', en: 'Coordination between architect, engineer and contractor prevents execution errors.', ru: 'Согласованность архитектора, инженера и подрядчика предотвращает ошибки исполнения.', fr: 'La coordination entre architecte, ingénieur et entrepreneur évite les erreurs d’exécution.' },
      { he: 'תכנון נכון כולל גם עמידה בתקנים ובדרישות הרשויות.', en: 'Proper planning also means meeting standards and authority requirements.', ru: 'Правильное планирование включает и соответствие нормам и требованиям властей.', fr: 'Bien planifier, c’est aussi respecter les normes et les exigences des autorités.' },
      { he: 'לוח זמנים ותקציב מבוססים נותנים לכם ודאות.', en: 'A well-founded timeline and budget give you certainty.', ru: 'Обоснованные график и бюджет дают вам уверенность.', fr: 'Un calendrier et un budget solides vous apportent de la certitude.' }
    ],
    tip: { he: 'תכנון נכון, חיסכון מוכח – זה העיקרון שמנחה אותנו בכל פרויקט.', en: 'Right planning, proven savings – that’s the principle guiding us in every project.', ru: 'Правильное планирование — доказанная экономия: этот принцип ведёт нас в каждом проекте.', fr: 'Bonne planification, économies prouvées – c’est le principe qui nous guide dans chaque projet.' }
  }]}
};
