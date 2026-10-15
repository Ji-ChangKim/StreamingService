// Single Responsibility Principle: Front-end Slug Preview & Generation Utility

const CHOSUNG = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'
];

const JUNGSUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
];

const JONGSUNG = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 'h'
];

export function romanizeKorean(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 44032 && code <= 55203) {
      const unicodeIndex = code - 44032;
      const cho = Math.floor(unicodeIndex / 588);
      const jung = Math.floor((unicodeIndex % 588) / 28);
      const jong = unicodeIndex % 28;
      result += CHOSUNG[cho] + JUNGSUNG[jung] + JONGSUNG[jong];
    } else {
      result += text[i];
    }
  }
  return result;
}

export function extractHandleFromUrl(channelUrl?: string, xUrl?: string): string | null {
  if (xUrl && xUrl.trim()) {
    try {
      const parsed = new URL(xUrl.trim());
      const handle = parsed.pathname.replace(/^\/|@/g, '').split('/')[0];
      if (handle && handle.length >= 2 && !handle.toLowerCase().includes('intent')) {
        return handle.toLowerCase().replace(/_/g, '-');
      }
    } catch {}
  }

  if (channelUrl && channelUrl.trim()) {
    try {
      const parsed = new URL(channelUrl.trim());
      const pathname = parsed.pathname;

      if (pathname.includes('/@')) {
        const handle = pathname.split('/@')[1].split('/')[0];
        if (handle) return handle.toLowerCase().replace(/_/g, '-');
      }

      if (parsed.hostname.includes('sooplive.co.kr') || parsed.hostname.includes('afreecatv.com')) {
        const parts = pathname.split('/').filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length >= 3 && !['station', 'memo', 'post'].includes(lastPart)) {
          return lastPart.toLowerCase();
        }
      }

      if (parsed.hostname.includes('twitch.tv')) {
        const handle = pathname.replace(/^\//, '').split('/')[0];
        if (handle && handle.length >= 3) return handle.toLowerCase();
      }

      if (parsed.hostname.includes('chzzk.naver.com') && pathname.startsWith('/live/')) {
        const handle = pathname.replace('/live/', '').split('/')[0];
        if (handle && handle.length < 25 && !/^[a-f0-9]{32}$/i.test(handle)) {
          return handle.toLowerCase();
        }
      }
    } catch {}
  }

  return null;
}

export function generateSuggestedSlug(displayName: string, channelUrl?: string, xUrl?: string): string {
  const urlHandle = extractHandleFromUrl(channelUrl, xUrl);
  if (urlHandle) {
    const sanitized = urlHandle.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (sanitized && sanitized.length >= 2) return sanitized;
  }

  if (displayName && displayName.trim()) {
    let cleanName = displayName;
    if (cleanName.includes('/')) {
      const parts = cleanName.split('/');
      const englishPart = parts.find(p => /[a-zA-Z]/.test(p));
      cleanName = englishPart ? englishPart.trim() : parts[0].trim();
    }

    const romanized = romanizeKorean(cleanName);
    const slug = romanized
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (slug && slug.length >= 2) {
      return slug;
    }
  }

  return 'creator';
}
