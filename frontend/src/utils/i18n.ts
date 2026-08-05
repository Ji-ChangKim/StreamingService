export type Language = 'ko' | 'ja' | 'en';

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
}

export const SEO_DATA: Record<Language, SeoMetadata> = {
  ko: {
    title: 'VDébut | 신입 버튜버 데뷔 일정 통합 캘린더 - 버츄얼 스트리머 첫 방송',
    description: '신입 버튜버의 첫 방송 무대를 가장 먼저 만나보세요. 치지직·SOOP·유튜브·트위치 버튜버(VTuber) 데뷔 일정을 실시간 통합 캘린더로 제공합니다.',
    keywords: 'VDébut, 버튜버, 버튜버 데뷔, 신입 버튜버, 버튜버 데뷔 일정, VTuber, 데뷔 캘린더, 치지직, SOOP, 아프리카TV, 유튜브, 버츄얼 스트리머, 初配信, デビュー, Debut Calendar',
    ogTitle: 'VDébut | 신입 버튜버 데뷔 일정 통합 캘린더',
    ogDescription: '신입 버튜버의 첫 무대를 가장 먼저 만나보세요! 치지직·SOOP·유튜브 버튜버 라이브 데뷔 일정 라이브 집계 중.'
  },
  ja: {
    title: 'VDébut | 新人VTuber デビューカレンダー - 初配信・移籍・ライブ日程',
    description: '新しいVTuberの初舞台を一番最初にチェックしよう。世界中のVTuber(YouTube・CHZZK・SOOP)のデビュー日程をタイムゾーンに合わせて提供。',
    keywords: 'VDébut, VTuber, デビュー, 初配信, スケジュール, カレンダー, バーチャルYouTuber, 移籍, YouTube, CHZZK, SOOP',
    ogTitle: 'VDébut | グローバル VTuber デビューカレンダー',
    ogDescription: '新しいVTuberの初舞台を一番最初にチェックしよう！YouTube・CHZZK・SOOPの新人VTuber初配信日程を一目でチェック。'
  },
  en: {
    title: 'VDébut | VTuber Debut Calendar - Upcoming Debut Stream Schedule',
    description: 'Every debut deserves an audience. Track upcoming VTuber debuts, first streams, and platform transfers worldwide in your local timezone.',
    keywords: 'VDébut, VTuber, VTuber Debut, Debut Calendar, First Stream, Virtual YouTuber, Schedule, YouTube, CHZZK, SOOP',
    ogTitle: 'VDébut | Global VTuber Debut Schedule Calendar',
    ogDescription: 'Every debut deserves an audience. Check upcoming debuts worldwide converted into your local timezone.'
  }
};

export const UI_TRANSLATIONS: Record<Language, Record<string, string>> = {
  ko: {
    heroTitle: '신입 버튜버 데뷔 일정 통합 캘린더',
    heroSubtitle: '치지직 · SOOP · 유튜브 · 트위치 버츄얼 스트리머(VTuber)의 첫 방송 데뷔 일정을 내 시간대에 맞춰 한눈에 확인하세요.',
    scheduleTab: '데뷔 일정',
    submitButton: '버튜버 데뷔 일정 등록',
    editButton: '수정',
    liveNow: 'LIVE NOW',
    agency: '소속',
    indie: '개인세',
    watchStream: '방송 보러가기',
    saveIcs: '알림 저장',
    tzLabel: '내 타임존',
    searchPlaceholder: '버튜버 이름, 플랫폼, 소속사 검색...',
    allPlatforms: '전체 플랫폼',
    forCreators: 'FOR NEW VTUBERS & CREATORS',
    bannerTitle: '곧 신입 버튜버 데뷔를 준비하고 있나요?',
    bannerDesc: '데뷔 날짜, 치지직·SOOP·유튜브 방송 채널, X(트위터) 공지 링크를 등록하시면 검토 후 VDébut 데뷔 캘린더에 정식 소개됩니다.',
    copyright: '© 2026 VDebut. All rights reserved.',
    footerDesc: '새로운 버튜버의 첫 무대를 가장 먼저 만나보는 글로벌 캘린더 플랫폼입니다.',

    // 히어로 카드 통계 다국어
    unitCreators: '명',
    chzzkMonth: '금월 치지직 데뷔',
    soopMonth: '금월 SOOP 데뷔',
    youtubeMonth: '금월 유튜브 데뷔',
    twitchMonth: '금월 트위치 데뷔',
    
    // 버튼 & 타이틀 다국어 확충
    modalTitle: '버튜버 데뷔 일정 등록',
    close: '닫기',
    cancel: '취소',
    submit: '등록',
    submitting: '등록 중...',
    calendarDisplayTime: '캘린더 표시 시간:',
    profileTitle: '버튜버 프로필',
    visitChannel: '채널 방문',
    firstDebutSchedule: '첫 방송 데뷔 일정',
    profileIntro: '프로필 소개',
    officialChannels: '공식 활동 채널',
    backToCalendar: '메인 캘린더로 돌아가기',
    debutDaysPassed: '데뷔일로부터 D +',
    debutDaysLeft: '데뷔까지',
    debutSoon: '곧 데뷔!',
    recommendation: '추천 데뷔 일정 & 관련 소식',
  },
  ja: {
    heroTitle: '新人VTuber デビューカレンダー',
    heroSubtitle: '世界中のVTuberのデビュー日程を、あなたのタイムゾーンに合わせて一目で確認しましょう。',
    scheduleTab: 'デビュー日程',
    submitButton: 'デビュー日程を登録',
    editButton: '編集',
    liveNow: 'LIVE NOW',
    agency: '所属',
    indie: '個人勢',
    watchStream: '配信を見る',
    saveIcs: 'カレンダー保存',
    tzLabel: 'タイムゾーン',
    searchPlaceholder: 'VTuber名、プラットフォーム、事務所を検索...',
    allPlatforms: '全プラットフォーム',
    forCreators: 'FOR NEW VTUBERS & CREATORS',
    bannerTitle: 'まもなく新人VTuberとしてデビュー予定ですか？',
    bannerDesc: '日時、配信プラットフォーム、告知リンクを登録すると検証後VDébutに掲載されます。',
    copyright: '© 2026 VDebut. All rights reserved.',
    footerDesc: '新しいVTuberの初舞台を一番最初にチェックするグローバルカレンダープラットフォームです。',

    // 히어로 카드 통계 다국어
    unitCreators: '名',
    chzzkMonth: '今月 CHZZK デビュー',
    soopMonth: '今月 SOOP デビュー',
    youtubeMonth: '今月 YouTube デビュー',
    twitchMonth: '今月 Twitch デビュー',

    // 버튼 & 타이틀 多言語
    modalTitle: 'デビュー日程を登録',
    close: '閉じる',
    cancel: 'キャンセル',
    submit: '登録',
    submitting: '登録中...',
    calendarDisplayTime: 'カレンダー表示時間:',
    profileTitle: 'VTuber プロフィール',
    visitChannel: 'チャンネル訪問',
    firstDebutSchedule: '初配信デビュー日程',
    profileIntro: 'プロフィール紹介',
    officialChannels: '公式活動チャンネル',
    backToCalendar: 'メインカレンダーに戻る',
    debutDaysPassed: 'デビュー日から D +',
    debutDaysLeft: 'デビューまで',
    debutSoon: 'まもなくデビュー!',
    recommendation: 'おすすめデビュー日程 & 関連ニュース',
  },
  en: {
    heroTitle: 'Global VTuber Debut Schedule Calendar',
    heroSubtitle: 'Check global VTuber debut schedules at a glance, aligned to your timezone.',
    scheduleTab: 'Debut Schedule',
    submitButton: 'Register Debut Schedule',
    editButton: 'Edit',
    liveNow: 'LIVE NOW',
    agency: 'Agency',
    indie: 'Indie',
    watchStream: 'Watch Stream',
    saveIcs: 'Add to Calendar',
    tzLabel: 'Timezone',
    searchPlaceholder: 'Search VTuber, platform, agency...',
    allPlatforms: 'All Platforms',
    forCreators: 'FOR NEW CREATORS',
    bannerTitle: 'Preparing for your debut?',
    bannerDesc: 'Submit your debut date, platform, and link to be featured on our calendar.',
    copyright: '© 2026 VDebut. All rights reserved.',

    // Buttons & Titles i18n
    modalTitle: 'Register Debut Schedule',
    close: 'Close',
    cancel: 'Cancel',
    submit: 'Submit',
    submitting: 'Submitting...',
    calendarDisplayTime: 'Calendar Display Time:',
    profileTitle: 'VTuber Profile',
    visitChannel: 'Visit Channel',
    firstDebutSchedule: 'First Debut Stream Schedule',
    profileIntro: 'Profile Overview',
    officialChannels: 'Official Channels',
    backToCalendar: 'Back to Calendar',
    debutDaysPassed: 'D + ',
    debutDaysLeft: 'Debuts in ',
    debutSoon: 'Debuting Soon!',
    recommendation: 'Recommended Debuts & Related News',
  }
};
