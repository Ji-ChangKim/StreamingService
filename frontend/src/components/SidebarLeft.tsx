import { Tv, Tag, Bell } from 'lucide-react';

interface SidebarLeftProps {
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
  savedNotificationCount: number;
}

export function SidebarLeft({
  selectedPlatform,
  setSelectedPlatform,
  savedNotificationCount,
}: SidebarLeftProps) {
  const platforms = [
    { id: 'ALL', label: '전체 플랫폼', count: 'All' },
    { id: 'CHZZK', label: '치지직 (CHZZK)', color: 'text-[#3B89FF]' },
    { id: 'YOUTUBE', label: '유튜브 (YouTube)', color: 'text-[#EE1D36]' },
    { id: 'SOOP', label: '숲 (SOOP)', color: 'text-[#FF6B00]' },
    { id: 'TWITCH', label: '트위치 (Twitch)', color: 'text-[#7A3DFF]' },
  ];

  const agencies = ['Indie (개인)', 'V-PRO', 'SOOP Stars', 'Hololive'];

  return (
    <aside className="w-full lg:w-60 flex-shrink-0 space-y-6">
      {/* Platform Selection Section */}
      <div className="bg-white rounded-[8px] p-4 border border-[#D8D8D8] shadow-layered-level2">
        <div className="eyebrow-uppercase text-[11px] text-[#080808] mb-3 flex items-center gap-1.5 font-semibold">
          <Tv className="w-3.5 h-3.5 text-[#080808]" />
          PLATFORMS
        </div>
        <div className="space-y-1">
          {platforms.map((p) => {
            const isActive = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`w-full text-left px-3 py-2 rounded-[4px] text-xs font-medium transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-[#080808] text-white font-semibold'
                    : 'text-[#363636] hover:bg-[#F8FAFC] hover:text-[#080808]'
                }`}
              >
                <span>{p.label}</span>
                {isActive && <span className="w-1.5 h-1.5 bg-white rounded-[9999px]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agency Quick Filter Section */}
      <div className="bg-white rounded-[8px] p-4 border border-[#D8D8D8] shadow-layered-level2">
        <div className="eyebrow-uppercase text-[11px] text-[#080808] mb-3 flex items-center gap-1.5 font-semibold">
          <Tag className="w-3.5 h-3.5 text-[#080808]" />
          AGENCIES & TAGS
        </div>
        <div className="flex flex-wrap gap-1.5">
          {agencies.map((agency) => (
            <span
              key={agency}
              className="bg-[#F8FAFC] text-[#5A5A5A] text-[11px] font-medium px-2.5 py-1 rounded-[4px] border border-[#D8D8D8] hover:border-[#080808] hover:text-[#080808] cursor-pointer transition-all"
            >
              {agency}
            </span>
          ))}
        </div>
      </div>

      {/* Saved Notification Status */}
      <div className="bg-[#F8FAFC] rounded-[8px] p-4 border border-[#D8D8D8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#7A3DFF]" />
          <span className="text-xs font-medium text-[#080808]">저장된 알림</span>
        </div>
        <span className="eyebrow-uppercase bg-white text-[#080808] border border-[#D8D8D8] text-xs font-semibold px-2 py-0.5 rounded-[4px]">
          {savedNotificationCount}개
        </span>
      </div>
    </aside>
  );
}
