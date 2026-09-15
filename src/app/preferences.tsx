import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'en' | 'ru' | 'ko' | 'ky'
export type ThemeMode = 'light' | 'dark'

export const languages: ReadonlyArray<{ value: Language; label: string; title: string }> = [
  { value: 'en', label: 'EN', title: 'English' },
  { value: 'ru', label: 'RU', title: 'Русский' },
  { value: 'ko', label: 'KO', title: '한국어' },
  { value: 'ky', label: 'KY', title: 'Кыргызча' },
]

/**
 * English is the reference dictionary: `CopyKey` is derived from it, so every
 * other language fails to compile until it covers the same keys.
 */
const en = {
  // Chrome
  siteName: 'Institut',
  learningSpace: 'your learning space',
  home: 'Home',
  schedule: 'Schedule',
  materials: 'Materials',
  news: 'News',
  courses: 'Courses',
  about: 'About',
  portal: 'Student portal',
  menu: 'Menu',
  navigation: 'Navigation',
  footer: 'Education for a confident future',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  language: 'Language',
  skipToContent: 'Skip to main content',

  // Session
  logout: 'Sign out',
  roleAdmin: 'Administrator',
  roleStudent: 'Student',
  adminPanel: 'Admin panel',
  studentPortal: 'Student portal',
  backToSite: 'Back to site',
  collapseMenu: 'Collapse menu',
  expandMenu: 'Expand menu',

  // Admin navigation
  navDashboard: 'Dashboard',
  navApplications: 'Applications',
  navCourses: 'Courses',
  navMaterials: 'Materials',
  navStudents: 'Students',

  // Student navigation
  navStudentHome: 'Overview',
  navProfile: 'My profile',
  navEnrollments: 'Enrollments',
  navExamResults: 'Exam results',
  navEvents: 'Events',

  // Login
  loginWelcome: 'Welcome back',
  loginSubtitle: 'Sign in to continue to your account.',
  loginIdLabel: 'Student ID / Admin ID',
  loginIdPlaceholder: 'e.g. admin or ST-1001',
  loginPasswordLabel: 'Password',
  loginPasswordPlaceholder: 'Enter your password',
  loginSubmit: 'Sign in',
  loginRemember: 'Remember me',
  loginNeedHelp: 'Need help?',
  loginDataProtected: 'Your data is protected',
  loginIdRequired: 'Enter your ID.',
  loginInvalidCredentials: 'The ID or password is incorrect.',
  loginError: 'Something went wrong while signing in.',
  loginHint:
    'Administrator: admin / admin123. Students sign in with the ID and password issued by the administrator; inactive students cannot sign in.',
  signedInAs: 'Signed in as',
  loginContinue: 'Continue',

  // Page copy
  scheduleTitle: 'Class schedule',
  scheduleSubtitle: 'Plan your day, find your room, and keep every class in view.',
  materialsTitle: 'Course materials',
  materialsSubtitle: 'Everything shared by your teachers, organized by subject.',
  newsTitle: 'News & announcements',
  newsSubtitle: 'Updates that matter for your studies and campus experience.',
  portalTitle: 'Your academic space.',
  portalSubtitle:
    'Review results, access personal information, and manage your studies in one secure place.',
} as const

type CopyKey = keyof typeof en
type Dictionary = Record<CopyKey, string>

const ru: Dictionary = {
  siteName: 'Институт',
  learningSpace: 'ваше пространство для учёбы',
  home: 'Главная',
  schedule: 'Расписание',
  materials: 'Материалы',
  news: 'Новости',
  courses: 'Курсы',
  about: 'Об институте',
  portal: 'Личный кабинет',
  menu: 'Меню',
  navigation: 'Навигация',
  footer: 'Образование для уверенного будущего',
  theme: 'Тема',
  light: 'Светлая',
  dark: 'Тёмная',
  language: 'Язык',
  skipToContent: 'Перейти к основному содержанию',

  logout: 'Выйти',
  roleAdmin: 'Администратор',
  roleStudent: 'Студент',
  adminPanel: 'Панель администратора',
  studentPortal: 'Кабинет студента',
  backToSite: 'На сайт',
  collapseMenu: 'Свернуть меню',
  expandMenu: 'Развернуть меню',

  navDashboard: 'Сводка',
  navApplications: 'Заявки на курсы',
  navCourses: 'Курсы',
  navMaterials: 'Материалы',
  navStudents: 'Студенты',

  navStudentHome: 'Обзор',
  navProfile: 'Мои данные',
  navEnrollments: 'Зачисления',
  navExamResults: 'Результаты экзаменов',
  navEvents: 'События',

  loginWelcome: 'С возвращением',
  loginSubtitle: 'Войдите, чтобы продолжить работу в кабинете.',
  loginIdLabel: 'ID студента / администратора',
  loginIdPlaceholder: 'например, admin или ST-1001',
  loginPasswordLabel: 'Пароль',
  loginPasswordPlaceholder: 'Введите пароль',
  loginSubmit: 'Войти',
  loginRemember: 'Запомнить меня',
  loginNeedHelp: 'Нужна помощь?',
  loginDataProtected: 'Ваши данные защищены',
  loginIdRequired: 'Введите ID.',
  loginInvalidCredentials: 'Неверный ID или пароль.',
  loginError: 'При входе произошла ошибка.',
  loginHint:
    'Администратор: admin / admin123. Студенты входят по ID и паролю, выданным администратором; неактивные студенты войти не могут.',
  signedInAs: 'Вы вошли как',
  loginContinue: 'Продолжить',

  scheduleTitle: 'Расписание занятий',
  scheduleSubtitle: 'Планируйте день, находите аудиторию и держите все занятия перед глазами.',
  materialsTitle: 'Учебные материалы',
  materialsSubtitle: 'Всё, что открыли ваши преподаватели, — по предметам.',
  newsTitle: 'Новости и объявления',
  newsSubtitle: 'Важные обновления для учёбы и жизни института.',
  portalTitle: 'Ваше личное пространство.',
  portalSubtitle:
    'Результаты, персональные данные и управление учёбой — в одном защищённом месте.',
}

const ko: Dictionary = {
  siteName: '인스티투트',
  learningSpace: '내 학습 공간',
  home: '홈',
  schedule: '시간표',
  materials: '자료',
  news: '뉴스',
  courses: '과정',
  about: '학당 소개',
  portal: '학생 포털',
  menu: '메뉴',
  navigation: '내비게이션',
  footer: '더 나은 내일을 위한 교육',
  theme: '테마',
  light: '라이트',
  dark: '다크',
  language: '언어',
  skipToContent: '본문으로 건너뛰기',

  logout: '로그아웃',
  roleAdmin: '관리자',
  roleStudent: '학생',
  adminPanel: '관리자 페이지',
  studentPortal: '학생 포털',
  backToSite: '사이트로 이동',
  collapseMenu: '메뉴 접기',
  expandMenu: '메뉴 펼치기',

  navDashboard: '대시보드',
  navApplications: '수강 신청',
  navCourses: '수강',
  navMaterials: '자료실',
  navStudents: '학생 관리',

  navStudentHome: '학생 홈',
  navProfile: '내 정보',
  navEnrollments: '수강 등록',
  navExamResults: '시험 결과',
  navEvents: '행사',

  loginWelcome: '다시 오셨네요',
  loginSubtitle: '계속하려면 로그인하세요.',
  loginIdLabel: '학생 ID / 관리자 ID',
  loginIdPlaceholder: '예: admin 또는 ST-1001',
  loginPasswordLabel: '비밀번호',
  loginPasswordPlaceholder: '비밀번호를 입력하세요',
  loginSubmit: '로그인',
  loginRemember: '로그인 상태 유지',
  loginNeedHelp: '도움이 필요하세요?',
  loginDataProtected: '데이터는 안전하게 보호됩니다',
  loginIdRequired: '아이디를 입력하세요.',
  loginInvalidCredentials: '아이디 또는 비밀번호가 올바르지 않습니다.',
  loginError: '로그인 중 오류가 발생했습니다.',
  loginHint:
    '관리자: admin / admin123. 학생은 관리자가 등록한 학생 ID와 비밀번호로 로그인합니다. 비활동 상태 학생은 접속할 수 없습니다.',
  signedInAs: '로그인 계정',
  loginContinue: '계속하기',

  scheduleTitle: '수업 시간표',
  scheduleSubtitle: '하루를 계획하고 수업을 한눈에 확인하세요.',
  materialsTitle: '학습 자료',
  materialsSubtitle: '선생님이 공유한 모든 자료입니다.',
  newsTitle: '뉴스 및 공지',
  newsSubtitle: '학생 생활에 필요한 소식을 확인하세요.',
  portalTitle: '나의 학업 공간.',
  portalSubtitle: '성적, 개인 정보, 학업 관리를 한곳에서 하세요.',
}

const ky: Dictionary = {
  siteName: 'Институт',
  learningSpace: 'сиздин окуу мейкиндигиңиз',
  home: 'Башкы бет',
  schedule: 'Сабак жадыбалы',
  materials: 'Материалдар',
  news: 'Жаңылыктар',
  courses: 'Курстар',
  about: 'Институт жөнүндө',
  portal: 'Студент кабинети',
  menu: 'Меню',
  navigation: 'Навигация',
  footer: 'Ишенимдүү келечек үчүн билим',
  theme: 'Тема',
  light: 'Жарык',
  dark: 'Караңгы',
  language: 'Тил',
  skipToContent: 'Негизги мазмунга өтүү',

  logout: 'Чыгуу',
  roleAdmin: 'Администратор',
  roleStudent: 'Студент',
  adminPanel: 'Администратор панели',
  studentPortal: 'Студент кабинети',
  backToSite: 'Сайтка кайтуу',
  collapseMenu: 'Менюну жыйноо',
  expandMenu: 'Менюну ачуу',

  navDashboard: 'Жалпы көрүнүш',
  navApplications: 'Арыздар',
  navCourses: 'Курстар',
  navMaterials: 'Материалдар',
  navStudents: 'Студенттер',

  navStudentHome: 'Башкы',
  navProfile: 'Менин маалыматым',
  navEnrollments: 'Каттоо',
  navExamResults: 'Сынак жыйынтыктары',
  navEvents: 'Иш-чаралар',

  loginWelcome: 'Кайра кош келиңиз',
  loginSubtitle: 'Улантуу үчүн кабинетке кириңиз.',
  loginIdLabel: 'Студенттин / администратордун ID',
  loginIdPlaceholder: 'мисалы: admin же ST-1001',
  loginPasswordLabel: 'Сырсөз',
  loginPasswordPlaceholder: 'Сырсөздү киргизиңиз',
  loginSubmit: 'Кирүү',
  loginRemember: 'Мени эстеп кал',
  loginNeedHelp: 'Жардам керекпи?',
  loginDataProtected: 'Маалыматыңыз корголгон',
  loginIdRequired: 'ID киргизиңиз.',
  loginInvalidCredentials: 'ID же сырсөз туура эмес.',
  loginError: 'Кирүү учурунда ката кетти.',
  loginHint:
    'Администратор: admin / admin123. Студенттер администратор берген ID жана сырсөз менен кирет; активдүү эмес студенттер кире албайт.',
  signedInAs: 'Кирген колдонуучу',
  loginContinue: 'Улантуу',

  scheduleTitle: 'Сабак жадыбалы',
  scheduleSubtitle: 'Күнүңүздү пландаштырып, бардык сабактарды көрүңүз.',
  materialsTitle: 'Окуу материалдары',
  materialsSubtitle: 'Мугалимдер бөлүшкөн бардык материалдар.',
  newsTitle: 'Жаңылыктар жана билдирүүлөр',
  newsSubtitle: 'Окуу жана кампус үчүн маанилүү жаңылыктар.',
  portalTitle: 'Сиздин окуу мейкиндигиңиз.',
  portalSubtitle: 'Баалоолорду, жеке маалыматты жана окууну бир жерден башкарыңыз.',
}

const copy: Record<Language, Dictionary> = { en, ru, ko, ky }

const LANGUAGE_STORAGE_KEY = 'institut-language'
const THEME_STORAGE_KEY = 'institut-theme'

/** Legacy keys written by earlier builds; read once, then migrated. */
const LEGACY_LANGUAGE_KEY = 'language'
const LEGACY_THEME_KEY = 'theme'

function isLanguage(value: unknown): value is Language {
  return languages.some((item) => item.value === value)
}

function readLanguage(): Language {
  const stored =
    localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? localStorage.getItem(LEGACY_LANGUAGE_KEY)

  if (isLanguage(stored)) {
    return stored
  }

  // Fall back to the browser's preferred language before defaulting to English.
  const browserLanguage = navigator.language.slice(0, 2).toLowerCase()
  return isLanguage(browserLanguage) ? browserLanguage : 'en'
}

function readTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

type Preferences = {
  language: Language
  theme: ThemeMode
  setLanguage: (value: Language) => void
  toggleTheme: () => void
  t: (key: CopyKey) => string
}

const PreferencesContext = createContext<Preferences | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readLanguage)
  const [theme, setTheme] = useState<ThemeMode>(readTheme)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme

    // Keep the browser UI (address bar, form controls) in step with the theme.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0d1420' : '#ffffff')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const t = useCallback((key: CopyKey) => copy[language][key], [language])

  const value = useMemo<Preferences>(
    () => ({ language, theme, setLanguage, toggleTheme, t }),
    [language, theme, toggleTheme, t],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)

  if (!context) {
    throw new Error('usePreferences must be used inside a <PreferencesProvider>')
  }

  return context
}
