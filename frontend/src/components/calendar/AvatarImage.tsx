import { useState } from 'react';

interface AvatarImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function AvatarImage({ src, alt, className = '', onClick }: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  // Unsplash 또는 더미 이미지 주소 차단 ❌
  const isDummyUrl = !src || src.includes('unsplash.com') || src.includes('dummy') || src.includes('placeholder');

  if (hasError || isDummyUrl) {
    return (
      <div
        onClick={onClick}
        className={`bg-rose-100 text-rose-600 border border-rose-300 font-extrabold text-[10px] flex items-center justify-center rounded-full shrink-0 select-none ${className}`}
        title={`${alt} (프로필 불러오기 실패 ❌)`}
      >
        ❌
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      onClick={onClick}
      className={className}
    />
  );
}
