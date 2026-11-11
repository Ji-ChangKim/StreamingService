// 외부 아바타를 Cloudflare 이미지 변환으로 표시 크기에 맞춰 받는다.
// 대시보드에서 Images > Transformations와 원격 원본 허용을 켠 뒤 VITE_IMAGE_RESIZE=true로 빌드할 때만 사용한다.
const RESIZE_ENABLED = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_IMAGE_RESIZE === 'true';

export function sizedImageUrl(url: string, displayWidth: number): string {
  if (!RESIZE_ENABLED || !/^https:\/\//i.test(url)) return url;
  return `/cdn-cgi/image/width=${Math.round(displayWidth * 2)},quality=80,format=auto,fit=cover/${url}`;
}
