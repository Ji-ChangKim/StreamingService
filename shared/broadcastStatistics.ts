export type StatisticsPlatform = 'SOOP' | 'CHZZK' | 'TWITCH' | 'CHZZM';
export type StatisticsPlatformFilter = StatisticsPlatform | 'ALL';
export type SourceState = 'available' | 'partial' | 'unavailable' | 'unsupported';

export interface PlatformSource {
  platform: StatisticsPlatform;
  state: SourceState;
  scope: string;
  observedAt: string | null;
  checkedChannels: number | null;
}

export interface StatisticsBroadcast {
  id: string;
  platform: StatisticsPlatform;
  streamId: string;
  channelKey: string | null;
  channelName: string | null;
  channelUrl: string | null;
  imageUrl: string | null;
  liveUrl: string | null;
  title: string;
  categoryId: string;
  categoryName: string;
  viewers: number;
  startedAt: string | null;
}

export interface StatisticsPoint {
  platform: StatisticsPlatform;
  at: string;
  viewers: number;
  channels: number;
  kind: 'history' | 'current';
  partial?: boolean;
}

export interface StatisticsPeak extends StatisticsBroadcast {
  peakAt: string;
  isLive: boolean;
  samples: Array<{ at: string; viewers: number }>;
}

export interface BroadcastStatistics {
  meta: {
    generatedAt: string;
    timezone: 'Asia/Seoul';
    refreshSeconds: number;
    historyState: 'available' | 'empty' | 'unavailable';
    lastHistoryAt: string | null;
    peakFrom: string;
    historyFrom: string;
    historyScope: string;
    unlinkedPeakChannels: number;
  };
  sources: PlatformSource[];
  lives: StatisticsBroadcast[];
  points: StatisticsPoint[];
  peaks: StatisticsPeak[];
}
