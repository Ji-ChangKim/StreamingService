export interface StatisticsStreamer {
  id: string;
  platform: 'CHZZK' | 'SOOP';
  channelKey: string | null;
  name: string;
  channelUrl: string | null;
  imageUrl: string | null;
  profileSlug: string | null;
  isRegistered?: boolean;
  isLive?: boolean;
  followerCount?: number;
}

export interface StatisticsStreamerSearchResponse {
  query: string;
  streamers: StatisticsStreamer[];
  hasMore: boolean;
}

// 띄어쓰기와 영문 대소문자가 달라도 같은 이름을 찾는다.
export function normalizeStreamerQuery(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase().slice(0, 80);
}
