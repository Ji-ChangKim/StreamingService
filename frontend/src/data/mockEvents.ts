import { DebutEvent } from '../types';
import { getAvatarUrl } from '../utils/avatarUtils';

/**
 * 2026년 7월 & 8월 45+ 명의 버튜버마다 각자 고유하고 예쁜 버추얼 프로필 캐릭터 아바타를 부여하는 데이터 모듈
 */
export function getMockEvents(): DebutEvent[] {
  const eventsRaw = [
    { id: 'evt_2026_1', name: '아롱띠', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/a0714/post/166790429', date: '2026-07-01T12:00:00.000Z', desc: '웰컴버추얼 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_2', name: '헤티', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/bps1017/post/166829897', date: '2026-07-02T20:00:00.000Z', desc: '소통 및 첫 데뷔 라이브', agency: '개인세' },
    { id: 'evt_2026_3', name: '마테', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/mate4077', date: '2026-07-03T14:00:00.000Z', desc: '첫 소통 데뷔 라이브', agency: '개인세' },
    { id: 'evt_2026_4', name: '담하로', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/harobangil/post/166904326', date: '2026-07-04T17:00:00.000Z', desc: '담하로 첫 공식 데뷔 스트림', agency: '개인세' },
    { id: 'evt_2026_5', name: '바쿠', platform: 'CHZZK', url: 'https://x.com/orbitaofbehind', date: '2026-07-04T19:00:00.000Z', desc: '치지직 신입 버튜버 바쿠 데뷔', agency: '개인세' },
    { id: 'evt_2026_6', name: '드라', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/dragonrabbit/post/166992056', date: '2026-07-06T12:00:00.000Z', desc: '웰컴버추얼 드라 첫 방송', agency: '개인세' },
    { id: 'evt_2026_7', name: '토척새', platform: 'CHZZK', url: 'https://x.com/TPRPWHDAKF/status/2068694382371537052', date: '2026-07-07T20:00:00.000Z', desc: '토척새 치지직 첫 생방송', agency: '개인세' },
    { id: 'evt_2026_8', name: '백새린', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/soren9900/post/167082005', date: '2026-07-08T18:00:00.000Z', desc: 'SOOP 버추얼 백새린 데뷔 무대', agency: '개인세' },
    { id: 'evt_2026_9', name: '소람', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/soramsoram/post/167115947', date: '2026-07-09T11:00:00.000Z', desc: '소람의 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_10', name: '슈요', platform: 'CHZZK', url: 'https://x.com/shuyo_chzzk/status/2071867582341104076', date: '2026-07-11T19:00:00.000Z', desc: '슈요 치지직 첫 데뷔 스트림', agency: '개인세' },
    { id: 'evt_2026_11', name: '해콩', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/haekong2/post/167250331', date: '2026-07-12T14:00:00.000Z', desc: 'SOOP 신입 해콩 데뷔 라이브', agency: '개인세' },
    { id: 'evt_2026_12', name: '김밍령', platform: 'CHZZK', url: 'https://chzzk.naver.com/video/14105462', date: '2026-07-12T17:00:00.000Z', desc: '김밍령 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_13', name: '별뭉치', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/jamstar/post/167385933', date: '2026-07-15T20:00:00.000Z', desc: '별뭉치 데뷔 스트림', agency: '개인세' },
    { id: 'evt_2026_29', name: '블루니아', platform: 'CHZZK', url: 'https://www.youtube.com/watch?v=87LBL1u7Ok8', date: '2026-07-27T15:30:00.000Z', desc: '블루니아 첫 공식 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_30', name: '큐에', platform: 'CHZZK', url: 'https://x.com/Yu_0w0r/status/2079417816948854910', date: '2026-07-27T20:00:00.000Z', desc: '큐에 치지직 데뷔 무대', agency: '개인세' },
    { id: 'evt_2026_31', name: '베리아', platform: 'CHZZK', url: 'https://x.com/Beriaroom/status/2078736030249996427', date: '2026-07-28T21:00:00.000Z', desc: '베리아 첫 방송 라이브', agency: '개인세' },
    { id: 'evt_2026_32', name: '루하', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/ruha0612/post/168012350', date: '2026-07-29T14:00:00.000Z', desc: '루하 SOOP 데뷔 생방송', agency: '개인세' },
    { id: 'evt_2026_33', name: '치즈치즈', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/cheesezz/post/168054144', date: '2026-07-30T14:00:00.000Z', desc: '치즈치즈 재데뷔 방송 무대', agency: '개인세' },
    { id: 'evt_2026_34', name: '트로이메라이', platform: 'CHZZK', url: 'https://x.com/Traumera2/status/2080945881533313116', date: '2026-07-30T15:00:00.000Z', desc: 'Live2D 신규 모델 최초 공개 방송', agency: '개인세' },
    { id: 'evt_2026_35', name: '(타)마고', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/tamago611/post/168056587', date: '2026-07-30T19:00:00.000Z', desc: '(타)마고 SOOP 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_36', name: '이로냥', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/ironyang/post/168100669', date: '2026-07-31T19:00:00.000Z', desc: '이로냥 7월 31일 데뷔 무대', agency: '개인세' },
    { id: 'evt_2026_37', name: '채은하', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/eunha0202/post/168146976', date: '2026-08-01T15:00:00.000Z', desc: '채은하 8월 1일 데뷔 방송', agency: '개인세' },
    { id: 'evt_2026_38', name: '아마츠 노야', platform: 'CHZZK', url: 'https://x.com/noya_yo_o', date: '2026-08-01T16:00:00.000Z', desc: '아마츠 노야 치지직 데뷔 라이브', agency: '개인세' },
    { id: 'evt_2026_39', name: '또모', platform: 'SOOP', url: 'https://www.sooplive.co.kr/station/memo/ddomo0/post/168150874', date: '2026-08-01T20:00:00.000Z', desc: '또모 SOOP 첫 방송', agency: '개인세' },
    { id: 'evt_2026_40', name: '나기 히유라', platform: 'CHZZK', url: 'https://x.com/SonagiNagi_/status/2080880724324806758', date: '2026-08-05T12:00:00.000Z', desc: '나기 히유라 치지직 데뷔 라이브', agency: '개인세' },
    { id: 'evt_2026_45', name: '키키모라', platform: 'CHZZK', url: 'https://x.com/V_LUP_Official', date: '2026-08-22T14:00:00.000Z', desc: 'V-LUP 소속 키키모라 데뷔 예정', agency: 'V-LUP' },
  ];

  return eventsRaw.map((item) => ({
    id: item.id,
    title: `${item.name} 데뷔 방송`,
    type: 'FIRST_DEBUT',
    creator: {
      id: `cr_${item.id}`,
      displayName: item.name,
      // Each VTuber gets a unique cute virtual avatar based on their name!
      avatarUrl: getAvatarUrl(item.name),
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
