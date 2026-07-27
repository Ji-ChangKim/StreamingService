import { Calendar, PlusCircle, ShieldCheck, Globe } from 'lucide-react';

interface NavbarProps {
  activeTab: 'calendar' | 'studio' | 'admin';
  setActiveTab: (tab: 'calendar' | 'studio' | 'admin') => void;
  selectedTimezone: string;
  setSelectedTimezone: (tz: string) => void;
  onOpenSubmitModal: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  selectedTimezone,
  setSelectedTimezone,
  onOpenSubmitModal,
}: NavbarProps) {
  const timezones = [
    { label: 'Asia/Seoul (KST • UTC+9)', value: 'Asia/Seoul' },
    { label: 'Asia/Tokyo (JST • UTC+9)', value: 'Asia/Tokyo' },
    { label: 'US West (PST • UTC-8)', value: 'America/Los_Angeles' },
    { label: 'US East (EST • UTC-5)', value: 'America/New_York' },
    { label: 'UTC (협정 세계시)', value: 'UTC' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#D8D8D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('calendar')}>
          <div className="w-9 h-9 rounded-[4px] bg-[#080808] flex items-center justify-center text-white font-extrabold text-lg">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-[#080808] font-['Outfit']">V-DEBUT HUB</span>
              <span className="bg-[#080808] text-white text-[10px] font-medium px-2 py-0.5 rounded-[4px] uppercase tracking-[1px]">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-[#5A5A5A] font-medium">글로벌 VTuber 데뷔 일정 발견 & 알림</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-[4px] border border-[#D8D8D8]">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] text-xs font-medium transition-all ${
              activeTab === 'calendar'
                ? 'bg-white text-[#080808] shadow-sm font-semibold'
                : 'text-[#5A5A5A] hover:text-[#080808]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            데뷔 달력
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] text-xs font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-[#080808] shadow-sm font-semibold'
                : 'text-[#5A5A5A] hover:text-[#080808]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            검수 관리자
          </button>
        </nav>

        {/* Actions & Timezone Selector */}
        <div className="flex items-center gap-3">
          {/* Timezone Select */}
          <div className="relative flex items-center bg-[#F8FAFC] hover:bg-slate-200/70 border border-[#D8D8D8] rounded-[4px] px-3 py-1.5 transition-colors">
            <Globe className="w-3.5 h-3.5 text-[#080808] mr-2 flex-shrink-0" />
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#080808] focus:outline-none cursor-pointer pr-1"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-white text-[#080808]">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Submit CTA Button (Ink Black #080808, Tight 4px Radius) */}
          <button
            onClick={onOpenSubmitModal}
            className="btn-primary text-xs sm:text-sm font-medium px-4 py-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">데뷔 일정 제보</span>
            <span className="sm:hidden">제보</span>
          </button>
        </div>
      </div>
    </header>
  );
}

