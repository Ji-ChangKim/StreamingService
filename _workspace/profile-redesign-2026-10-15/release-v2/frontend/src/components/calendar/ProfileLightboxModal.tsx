import { X } from 'lucide-react';

interface ProfileLightboxModalProps {
  previewAvatar: { url: string; name: string } | null;
  onClose: () => void;
}

export function ProfileLightboxModal({ previewAvatar, onClose }: ProfileLightboxModalProps) {
  if (!previewAvatar) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-6 max-w-[420px] w-full flex flex-col items-center relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
        <h4 className="text-base font-bold text-[#0F172A] mb-3">
          {previewAvatar.name} 프로필 이미지
        </h4>
        <img
          src={previewAvatar.url}
          alt={previewAvatar.name}
          className="w-64 h-64 rounded-full object-cover border-4 border-[#2563EB] shadow-xl mb-3"
        />
      </div>
    </div>
  );
}
