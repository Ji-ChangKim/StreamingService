export const STATISTICS_COLLECTION_MINUTES = 10;
export const STATISTICS_COLLECTION_CRON = '*/10 * * * *';
export type CollectedPlatform = 'CHZZK' | 'SOOP';

export interface StatisticsCollectionPlatform {
  platform: CollectedPlatform;
  state: 'pending' | 'healthy' | 'partial' | 'delayed';
  firstCollectedAt: string | null;
  lastAttemptAt: string | null;
  lastCompleteAt: string | null;
  expectedRuns: number;
  completeRuns: number;
  partialRuns: number;
  failedRuns: number;
  missingRuns: number;
}

export interface StatisticsCollectionStatus {
  checkedAt: string;
  intervalMinutes: number;
  platforms: StatisticsCollectionPlatform[];
}
