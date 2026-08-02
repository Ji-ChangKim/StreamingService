import { Calendar, PlusCircle, Users } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSubmitModal: () => void;
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  onOpenSubmitModal,
}: MobileBottomNavProps) {
  return (
    <nav className="h-16 bg-[#121212] border-t border-white/10 fixed bottom-0 left-0 right-0 z-40 px-4 flex items-center justify-around shadow-2xl">
      {/* 1. 스케줄 탭 */}
      <button
        onClick={() => setActiveTab('schedule')}
        className={`flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
          activeTab === 'schedule'
            ? 'bg-white text-black font-black px-4 py-2 rounded-xl shadow-md'
            : 'text-zinc-200 hover:text-white font-bold px-3 py-2'
        }`}
      >
        <Calendar className={`w-4 h-4 ${activeTab === 'schedule' ? 'text-black' : 'text-zinc-300'}`} />
        <span className="text-xs tracking-tight">스케줄</span>
      </button>

      {/* 2. 등록 탭 */}
      <button
        onClick={() => {
          setActiveTab('submit');
          onOpenSubmitModal();
        }}
        className={`flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
          activeTab === 'submit'
            ? 'bg-white text-black font-black px-4 py-2 rounded-xl shadow-md'
            : 'text-zinc-200 hover:text-white font-bold px-3 py-2'
        }`}
      >
        <PlusCircle className={`w-4 h-4 ${activeTab === 'submit' ? 'text-black' : 'text-zinc-300'}`} />
        <span className="text-xs tracking-tight">등록</span>
      </button>

      {/* 3. 크리에이터 탭 */}
      <button
        onClick={() => setActiveTab('creators')}
        className={`flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
          activeTab === 'creators'
            ? 'bg-white text-black font-black px-4 py-2 rounded-xl shadow-md'
            : 'text-zinc-200 hover:text-white font-bold px-3 py-2'
        }`}
      >
        <Users className={`w-4 h-4 ${activeTab === 'creators' ? 'text-black' : 'text-zinc-300'}`} />
        <span className="text-xs tracking-tight">크리에이터</span>
      </button>
    </nav>
  );
}

