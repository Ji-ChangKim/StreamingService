import { portalChannelUrl, PortalChannelDetails } from '../../../shared/portal';

export type ChannelBanner = PortalChannelDetails;

// 등록된 SOOP 주소의 채널 식별자만 추출해 외부 요청 대상을 고정한다.
export function soopBannerChannelId(channelUrl: string): string {
  const safe = portalChannelUrl(channelUrl, 'SOOP');
  if (!safe) return '';
  const parts = new URL(safe).pathname.split('/').filter(Boolean);
  const id = parts[0] === 'station' ? parts[1] : parts[0];
  return id && /^[a-zA-Z0-9_]{1,50}$/.test(id) && !['station', 'memo', 'post'].includes(id) ? id : '';
}

// SOOP API가 제공한 채널 아트 파일만 원본 이미지 서버 주소로 변환한다.
export function soopBannerImageUrl(filename: unknown): string {
  return typeof filename === 'string' && /^SKIN\/\d+\/[a-zA-Z0-9_-]+\.(?:jpe?g|png|gif|webp)$/i.test(filename)
    ? `https://stimg.sooplive.com/${filename}` : '';
}

// 다른 채널이나 잘못된 응답을 현재 소개의 배너로 표시하지 않는다.
export function soopBannerFromStation(value: unknown, userId: string): ChannelBanner {
  if (!value || typeof value !== 'object') throw new Error('Invalid SOOP station');
  const data = value as { station?: { userId?: unknown }; channelArt?: { pcFilename?: unknown; mobileFilename?: unknown }; display?: { profileText?: unknown } };
  if (data.station?.userId !== userId) throw new Error('Invalid SOOP station');
  const pc = soopBannerImageUrl(data.channelArt?.pcFilename);
  const mobile = soopBannerImageUrl(data.channelArt?.mobileFilename);
  // 채널 운영자가 작성한 소개만 일반 문자열로 반환하고 줄바꿈을 유지한다.
  const description = typeof data.display?.profileText === 'string' ? data.display.profileText.replace(/\r\n?/g, '\n').trim().slice(0, 4000) : '';
  return { bannerUrl: pc || mobile, mobileBannerUrl: mobile, description };
}

// 응답 본문 크기를 제한해 외부 API 오류가 Worker 메모리를 소모하지 않게 한다.
async function readStationJson(response: Response): Promise<unknown> {
  if (!response.ok || !response.body) throw new Error(`SOOP station unavailable (${response.status})`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128 * 1024) { await reader.cancel(); throw new Error('SOOP station too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

// 배너 조회는 짧은 시간 안에 끝내며 소개 본문 로딩과 분리한다.
export async function fetchSoopChannelBanner(channelUrl: string): Promise<ChannelBanner> {
  const userId = soopBannerChannelId(channelUrl);
  if (!userId) return { bannerUrl: '', mobileBannerUrl: '', description: '' };
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 3500);
  try {
    const response = await fetch(`https://api-channel.sooplive.com/v1.1/channel/${userId}/station`, {
      // Workers는 redirect:error를 지원하지 않아 수동 응답 검사로 이동을 거절한다.
      headers: { Accept: 'application/json' }, signal: abort.signal, redirect: 'manual',
    });
    return soopBannerFromStation(await readStationJson(response), userId);
  } finally { clearTimeout(timeout); }
}
