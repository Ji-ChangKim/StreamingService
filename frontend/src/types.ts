export interface DebutEvent {
  id: string;
  title: string;
  type: string;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string;
    agency: string;
    countryCode: string;
    languages: string[];
  };
  startAtUtc: string;
  originalTimezone: string;
  status: string;
  verificationStatus: string;
  links: { platform: string; url: string; isPrimary: boolean }[];
  description: string;
}
