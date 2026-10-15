// Creator Profile API Service

export interface CreatorChannelData {
  id: number;
  platform: string;
  channelName: string;
  channelUrl: string;
  isPrimary: boolean;
}

export interface CreatorProfileData {
  id: number;
  slug: string;
  displayName: string;
  description: string;
  profileImageUrl: string;
  agencyName: string;
  creatorType: 'INDIE' | 'AGENCY';
  language: string;
  xUrl?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  channels: CreatorChannelData[];
  events: any[];
}

export async function fetchCreatorProfile(slug: string): Promise<CreatorProfileData | null> {
  try {
    const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
    const res = await fetch(`${apiHost}/api/v1/creator/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.creator) {
      return data.creator;
    }
    return null;
  } catch (err) {
    console.error('fetchCreatorProfile Error:', err);
    return null;
  }
}

export interface UpdateCreatorPayload {
  displayName?: string;
  description?: string;
  agencyName?: string;
  debutDate?: string;
  debutTime?: string;
  channelUrl?: string;
  xUrl?: string;
  profileImageUrl?: string;
}

export async function updateCreatorProfile(slug: string, payload: UpdateCreatorPayload): Promise<boolean> {
  try {
    const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
    const res = await fetch(`${apiHost}/api/v1/creator/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('updateCreatorProfile Error:', err);
    return false;
  }
}

export async function deleteCreatorProfile(slug: string): Promise<boolean> {
  try {
    const apiHost = (import.meta as any).env?.VITE_API_HOST || '';
    const res = await fetch(`${apiHost}/api/v1/creator/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('deleteCreatorProfile Error:', err);
    return false;
  }
}

