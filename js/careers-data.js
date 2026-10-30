/* ==========================================================================
   GAD MIVNIM — פרטי התפקידים ב"דרושים" (careers-data.js)
   נפתח בחלון בלחיצה על כרטיס תפקיד ב-#careers. עברית = המקור; en / ru / fr תרגום.
     roles.rN — מפתח התפקיד (זהה ל-data-role של הכרטיס ולערך בשדה "תחום" בטופס)
       intro — שורת פתיחה קצרה
       req   — "דרישות התפקיד"
       adv   — "יתרון"
     offer — "מה אנחנו מציעים" (זהה לכל התפקידים)
   שם התפקיד והאייקון נלקחים מהכרטיס עצמו (car_r1..car_r4 ב-i18n.js).
   * תוכן לדוגמה — הלקוח יחליף בהמשך.
   ========================================================================== */
window.CAREERS_DATA = {
  roles: {
    r1: {
      he: {
        intro: 'מנהל/ת עבודה לפרויקטי בנייה, שיפוץ ותשתיות באזור המרכז וירושלים.',
        req: ['תעודת מנהל עבודה רשום', 'ניסיון של 3 שנים לפחות בניהול אתר בנייה', 'היכרות עם תקנות הבטיחות בעבודה', 'יכולת ניהול צוותים וקבלני משנה', 'רישיון נהיגה בתוקף'],
        adv: ['ניסיון בפרויקטי תמ"א 38 / פינוי בינוי', 'היכרות עם תוכנות לניהול פרויקטים']
      },
      en: {
        intro: 'Site manager for construction, renovation and infrastructure projects in central Israel and Jerusalem.',
        req: ['Registered site manager certificate', 'At least 3 years of experience managing a construction site', 'Knowledge of occupational safety regulations', 'Ability to manage teams and subcontractors', 'Valid driving licence'],
        adv: ['Experience in TAMA 38 / urban renewal projects', 'Familiarity with project management software']
      },
      ru: {
        intro: 'Прораб для строительных, ремонтных и инфраструктурных проектов в центре страны и Иерусалиме.',
        req: ['Удостоверение зарегистрированного прораба', 'Опыт управления стройплощадкой не менее 3 лет', 'Знание правил техники безопасности', 'Умение руководить бригадами и субподрядчиками', 'Действующие водительские права'],
        adv: ['Опыт в проектах ТАМА 38 / «снос и застройка»', 'Знание программ управления проектами']
      },
      fr: {
        intro: 'Chef de chantier pour des projets de construction, de rénovation et d’infrastructures dans le centre du pays et à Jérusalem.',
        req: ['Certificat de chef de chantier agréé', 'Au moins 3 ans d’expérience en gestion de chantier', 'Connaissance des règles de sécurité au travail', 'Capacité à gérer des équipes et des sous-traitants', 'Permis de conduire valide'],
        adv: ['Expérience dans des projets TAMA 38 / rénovation urbaine', 'Maîtrise de logiciels de gestion de projet']
      }
    },
    r2: {
      he: {
        intro: 'מחפשים קבלני משנה ובעלי מקצוע לשיתוף פעולה לאורך זמן בפרויקטים של הקבוצה.',
        req: ['רישיון / הסמכה בתחום המקצועי', 'ניסיון מוכח ותיק עבודות', 'עבודה לפי תקנים ולוחות זמנים', 'ביטוח צד ג\' ואחריות מקצועית בתוקף'],
        adv: ['צוות עובדים קבוע', 'ניסיון בעבודה מול חברות בנייה גדולות']
      },
      en: {
        intro: 'We are looking for subcontractors and tradespeople for long-term cooperation on the group’s projects.',
        req: ['Licence / certification in your trade', 'Proven experience and a portfolio of work', 'Working to standards and schedules', 'Valid third-party and professional liability insurance'],
        adv: ['A permanent team of workers', 'Experience working with large construction companies']
      },
      ru: {
        intro: 'Ищем субподрядчиков и мастеров для долгосрочного сотрудничества в проектах группы.',
        req: ['Лицензия / сертификат по специальности', 'Подтверждённый опыт и портфолио работ', 'Работа по стандартам и в срок', 'Действующая страховка гражданской и профессиональной ответственности'],
        adv: ['Постоянная бригада', 'Опыт работы с крупными строительными компаниями']
      },
      fr: {
        intro: 'Nous recherchons des sous-traitants et des artisans pour une collaboration durable sur les projets du groupe.',
        req: ['Licence / certification dans votre métier', 'Expérience prouvée et portfolio de réalisations', 'Respect des normes et des délais', 'Assurance responsabilité civile et professionnelle en cours de validité'],
        adv: ['Une équipe de travail permanente', 'Expérience avec de grandes entreprises de construction']
      }
    },
    r3: {
      he: {
        intro: 'מהנדס/ת ואדריכל/ית לתכנון, ליווי ופיקוח על פרויקטים בתחומי המגורים, המסחר והציבור.',
        req: ['תואר בהנדסה אזרחית / אדריכלות', 'רישוי בפנקס המהנדסים והאדריכלים', 'ניסיון של 2 שנים לפחות', 'שליטה ב-AutoCAD ו-Revit'],
        adv: ['ניסיון בהגשת היתרי בנייה', 'ניסיון בפיקוח עליון באתר']
      },
      en: {
        intro: 'Engineer and architect for planning, managing and supervising residential, commercial and public projects.',
        req: ['Degree in civil engineering / architecture', 'Listed in the Register of Engineers and Architects', 'At least 2 years of experience', 'Proficiency in AutoCAD and Revit'],
        adv: ['Experience submitting building permits', 'Experience in on-site design supervision']
      },
      ru: {
        intro: 'Инженер и архитектор для проектирования, сопровождения и надзора за жилыми, коммерческими и общественными проектами.',
        req: ['Диплом инженера-строителя / архитектора', 'Регистрация в реестре инженеров и архитекторов', 'Опыт работы не менее 2 лет', 'Владение AutoCAD и Revit'],
        adv: ['Опыт подачи заявок на разрешение на строительство', 'Опыт авторского надзора на объекте']
      },
      fr: {
        intro: 'Ingénieur et architecte pour la conception, le suivi et la supervision de projets résidentiels, commerciaux et publics.',
        req: ['Diplôme en génie civil / architecture', 'Inscription au registre des ingénieurs et architectes', 'Au moins 2 ans d’expérience', 'Maîtrise d’AutoCAD et de Revit'],
        adv: ['Expérience dans le dépôt de permis de construire', 'Expérience en supervision de chantier']
      }
    },
    r4: {
      he: {
        intro: 'איש/אשת משרד ושירות לקוחות לצוות המטה של הקבוצה בהרצליה.',
        req: ['ניסיון בעבודה משרדית / שירות לקוחות', 'שליטה בתוכנות Office', 'יחסי אנוש מצוינים ואדיבות', 'יכולת עבודה בסביבה דינמית'],
        adv: ['ניסיון בחברת בנייה / נדל"ן', 'אנגלית ברמה טובה']
      },
      en: {
        intro: 'Office and customer service staff member for the group’s headquarters team in Herzliya.',
        req: ['Experience in office work / customer service', 'Proficiency in Office software', 'Excellent interpersonal skills and courtesy', 'Ability to work in a dynamic environment'],
        adv: ['Experience at a construction / real estate company', 'Good level of English']
      },
      ru: {
        intro: 'Сотрудник офиса и службы клиентов в команду штаб-квартиры группы в Герцлии.',
        req: ['Опыт офисной работы / обслуживания клиентов', 'Владение программами Office', 'Отличные коммуникативные навыки и вежливость', 'Умение работать в динамичной среде'],
        adv: ['Опыт работы в строительной компании / сфере недвижимости', 'Хороший уровень английского']
      },
      fr: {
        intro: 'Employé(e) de bureau et service client pour l’équipe du siège du groupe à Herzliya.',
        req: ['Expérience en travail de bureau / service client', 'Maîtrise des logiciels Office', 'Excellent relationnel et courtoisie', 'Capacité à travailler dans un environnement dynamique'],
        adv: ['Expérience dans une entreprise de construction / immobilier', 'Bon niveau d’anglais']
      }
    }
  },
  offer: {
    he: ['עבודה בקבוצה משפחתית ומקצועית', 'פרויקטים מגוונים ומאתגרים', 'תנאים הוגנים ויציבות', 'אפשרויות קידום והתפתחות'],
    en: ['Working in a professional, family-run group', 'Diverse and challenging projects', 'Fair conditions and stability', 'Opportunities for promotion and growth'],
    ru: ['Работа в семейной и профессиональной группе', 'Разнообразные и интересные проекты', 'Честные условия и стабильность', 'Возможности карьерного роста и развития'],
    fr: ['Travailler au sein d’un groupe familial et professionnel', 'Des projets variés et stimulants', 'Des conditions équitables et de la stabilité', 'Des possibilités d’évolution et de développement']
  }
};
