import { DebutEvent } from '../types';

export function getMockEvents(): DebutEvent[] {
  const eventsRaw = [
    { id: 'evt_2026_1', name: '아롱띠', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/a0714/post/166790429', date: '2026-07-01T12:00:00.000Z', desc: '웰컴버추얼 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_2', name: '헤티', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/bps1017/post/166829897', date: '2026-07-02T20:00:00.000Z', desc: '소통 및 첫 데뷔 라이브', agency: '개인세' },
    { id: 'evt_2026_3', name: '마테', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/mate4077', date: '2026-07-03T14:00:00.000Z', desc: '첫 소통 데뷔 라이브', agency: '개인세' },
    { id: 'evt_2026_4', name: '담하로', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/harobangil/post/166904326', date: '2026-07-04T17:00:00.000Z', desc: '담하로 첫 공식 데뷔 스트림', agency: '개인세' },
    { id: 'evt_2026_5', name: '바쿠', platform: 'CHZZK', url: 'https://x.com/orbitaofbehind', date: '2026-07-04T19:00:00.000Z', desc: '치지직 신입 버튜버 바쿠 데뷔', agency: '개인세' },
    { id: 'evt_2026_12', name: '김밍령', platform: 'CHZZK', url: 'https://chzzk.naver.com/video/14105462', date: '2026-07-13T17:00:00.000Z', desc: '김밍령 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_32', name: '루하', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/ruha0612/post/168012350', date: '2026-07-29T14:00:00.000Z', desc: '루하 SOOP 데뷔 생방송', agency: '개인세' },
    { id: 'evt_2026_33', name: '치즈치즈', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/cheesezz/post/168054144', date: '2026-07-30T14:00:00.000Z', desc: '치즈치즈 재데뷔 방송 무대', agency: '개인세' },
  ];

  return eventsRaw.map((item) => ({
    id: item.id,
    title: `${item.name} 데뷔 방송`,
    type: 'FIRST_DEBUT',
    creator: {
      id: `cr_${item.id}`,
      displayName: item.name,
      avatarUrl: '', // 더미 이미지 금지 ❌ (외부 API 연동 시에만 채워짐)
      agency: item.agency,
      countryCode: 'KR',
      languages: ['ko'],
    },
    startAtUtc: item.date,
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'SOURCE_VERIFIED',
    links: [{ platform: item.platform, url: item.url, isPrimary: true }],
    description: item.desc,
  }));
}
