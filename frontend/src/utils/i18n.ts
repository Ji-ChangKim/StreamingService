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
    title: 'VDébut | 버튜버 데뷔 캘린더 - 버츄얼 스트리머 첫 무대 방송 일정',
    description: '새로운 버튜버의 첫 무대를 가장 먼저 만나보세요. 치지직·SOOP·유튜브 신입 버튜버 데뷔 일정을 실시간 통합 제공합니다.',
    keywords: 'VDébut, 버튜버, VTuber, 데뷔 캘린더, 치지직, SOOP, 아프리카TV, 유튜브, 버츄얼 스트리머, 이적, 캘린더',
    ogTitle: 'VDébut | 버튜버 데뷔 캘린더',
    ogDescription: '새로운 버튜버의 첫 무대를 가장 먼저 만나보세요! 치지직·SOOP·유튜브 신입 버튜버 라이브 일정 집계 중.'
  },
  ja: {
    title: 'VDébut | VTuber デビューカレンダー - 初配信・移籍・ライブ日程',
    description: '新しいVTuberの初舞台を一番最初にチェックしよう。世界中のVTuber(YouTube・CHZZK・SOOP)のデビュー日程をタイムゾーンに合わせて提供。',
    keywords: 'VDébut, VTuber, デビュー, 初配信, スケジュール, カレンダー, バーチャルYouTuber, 移籍, YouTube, CHZZK, SOOP',
    ogTitle: 'VDébut | グローバル VTuber デビューカレンダー',
    ogDescription: '新しいVTuberの初舞台を一番最初にチェックしよう！YouTube・CHZZK・SOOPの新人VTuber初配信日程を一目でチェック。'
  },
  en: {
    title: 'VDébut | VTuber Debut Calendar - Every debut deserves an audience',
    description: 'Every debut deserves an audience. Track upcoming VTuber debuts, first streams, and platform transfers worldwide in your local timezone.',
    keywords: 'VDébut, VTuber, Debut Calendar, First Stream, Virtual YouTuber, Schedule, YouTube, CHZZK, SOOP',
    ogTitle: 'VDébut | Global VTuber Debut Schedule Calendar',
    ogDescription: 'Every debut deserves an audience. Check upcoming debuts worldwide converted into your local timezone.'
  }
};

export const UI_TRANSLATIONS: Record<Language, Record<string, string>> = {
  ko: {
    heroTitle: '새로운 버튜버의 첫 무대를 가장 먼저 만나보세요.',
    heroSubtitle: '전 세계 다양한 VTuber의 데뷔 일정을 내 시간대에 맞춰 한눈에 확인하세요.',
    scheduleTab: '데뷔 일정',
    submitButton: '데뷔 일정 등록',
    editButton: '수정',
    liveNow: 'LIVE NOW',
    agency: '소속',
    indie: '개인세',
    watchStream: '방송 보러가기',
    saveIcs: '알림 저장',
    tzLabel: '내 타임존',
    searchPlaceholder: '버튜버 이름, 플랫폼, 소속사 검색...',
    allPlatforms: '전체 플랫폼',
    forCreators: 'FOR NEW CREATORS',
    bannerTitle: '곧 데뷔를 준비하고 있나요?',
    bannerDesc: '날짜, 방송 플랫폼, 공지 링크를 등록하면 검토 후 소개됩니다.',
    copyright: '© 2026 VDebut. All rights reserved.'
  },
  ja: {
    heroTitle: '新しいVTuberの初舞台を一番最初にチェックしよう。',
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
    forCreators: 'FOR NEW CREATORS',
    bannerTitle: 'まもなくデビュー予定ですか？',
    bannerDesc: '日時、配信プラットフォーム、告知リンクを登録すると掲載されます.',
    copyright: '© 2026 VDebut. All rights reserved.'
  },
  en: {
    heroTitle: 'Every debut deserves an audience.',
    heroSubtitle: 'Check global VTuber debut schedules at a glance, aligned to your timezone.',
    scheduleTab: 'Debut Schedule',
    submitButton: 'Register Debut',
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
    copyright: '© 2026 VDebut. All rights reserved.'
  }
};
