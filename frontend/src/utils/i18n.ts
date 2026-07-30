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
    title: '버튜버 데뷔 일정 캘린더 | V-DEBUT - 치지직·SOOP·유튜브 버츄얼 스트리머 데뷔 방송 일정',
    description: '전 세계 다양한 VTuber(버츄얼 스트리머)의 데뷔 일정을 내 시간대에 맞춰 한눈에 확인하세요! 치지직·SOOP·유튜브 신입 버튜버 라이브 일정 집계 중.',
    keywords: '버튜버, VTuber, 데뷔 일정, 치지직, SOOP, 아프리카TV, 유튜브, 버츄얼 스트리머, 이적, 캘린더, V-DEBUT',
    ogTitle: 'V-DEBUT | 글로벌 버튜버 데뷔 일정 캘린더',
    ogDescription: '치지직·SOOP·유튜브 신입 버튜버 및 이적 스트리머의 데뷔 일정을 내 타임존 시각으로 한눈에 확인하세요!'
  },
  ja: {
    title: 'VTuber デビュー スケジュール カレンダー | V-DEBUT - 初配信・移籍・ライブ日程',
    description: '世界中のVTuber(バーチャルYouTuber)のデビュー・初配信・移籍日程をあなたのタイムゾーンに合わせて visual に確認！YouTube・CHZZK・SOOP 対応。',
    keywords: 'VTuber, デビュー, 初配信, スケジュール, カレンダー, バーチャルYouTuber, 移籍, YouTube, CHZZK, SOOP, V-DEBUT',
    ogTitle: 'V-DEBUT | グローバル VTuber デビューカレンダー',
    ogDescription: 'YouTube・CHZZK・SOOPの新人VTuber初配信 및 移籍日程をローカルタイムゾーンで一目でチェック！'
  },
  en: {
    title: 'VTuber Debut Calendar | V-DEBUT - Global VTuber Debut & Transfer Schedule',
    description: 'Track upcoming VTuber debuts, first streams, and platform transfers worldwide in your local timezone. Supports YouTube, CHZZK, and SOOP!',
    keywords: 'VTuber, Debut Calendar, First Stream, Virtual YouTuber, Schedule, YouTube, CHZZK, SOOP, V-DEBUT',
    ogTitle: 'V-DEBUT | Global VTuber Debut Schedule Calendar',
    ogDescription: 'Never miss a VTuber first stream! Check upcoming debuts worldwide converted into your local timezone.'
  }
};

export const UI_TRANSLATIONS: Record<Language, Record<string, string>> = {
  ko: {
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
    copyright: '© 2026 GameTPS. All rights reserved.'
  },
  ja: {
    scheduleTab: 'デビュー日程',
    submitButton: 'デビュー日程を registered',
    editButton: '編集',
    liveNow: 'LIVE NOW',
    agency: '所属',
    indie: '個人勢',
    watchStream: '配信を見る',
    saveIcs: 'カレンダー保存',
    tzLabel: 'タイムゾーン',
    searchPlaceholder: 'VTuber名、プラットフォーム、事務所を search...',
    allPlatforms: '全プラットフォーム',
    forCreators: 'FOR NEW CREATORS',
    bannerTitle: 'まもなくデビュー予定ですか？',
    bannerDesc: '日時、配信プラットフォーム、告知リンクを registered すると掲載されます。',
    copyright: '© 2026 GameTPS. All rights reserved.'
  },
  en: {
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
    copyright: '© 2026 GameTPS. All rights reserved.'
  }
};
