export interface DebutEvent {
  id: string;
  title: string;
  type: string;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string;
    agency: string;
    groupName?: string;
    countryCode: string;
    languages: string[];
    xUrl?: string;
    videoUrl?: string;
    websiteUrl?: string;
  };
  startAtUtc: string;
  originalTimezone: string;
  status: string;
  verificationStatus: string;
  links: { platform: string; url: string; isPrimary: boolean }[];
  description: string;
  groupName?: string;
  videoUrl?: string;
  websiteUrl?: string;
  isTbd?: boolean;
  tbdType?: 'DATE_TBD' | 'TIME_TBD';
  targetMonth?: string; // YYYY-MM
}
