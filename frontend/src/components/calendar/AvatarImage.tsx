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
    const initial = alt ? alt.trim().charAt(0).toUpperCase() : 'V';
    return (
      <div
        onClick={onClick}
        className={`bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center rounded-full shrink-0 shadow-2xs select-none border-2 border-white cursor-pointer ${className}`}
        title={alt}
      >
        {initial}
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
