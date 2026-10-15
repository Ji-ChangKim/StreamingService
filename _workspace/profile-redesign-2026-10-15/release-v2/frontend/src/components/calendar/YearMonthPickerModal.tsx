import { X } from 'lucide-react';

interface YearMonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number;
  onSelectYearMonth: (year: number, month: number) => void;
}

export function YearMonthPickerModal({
  isOpen,
  onClose,
  currentYear,
  currentMonth,
  onSelectYearMonth,
}: YearMonthPickerModalProps) {
  if (!isOpen) return null;

  const years = Array.from({ length: 7 }, (_, i) => 2024 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-base font-extrabold text-[#0F172A]">날짜 빠른 이동</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F1F5F9] rounded-full text-[#64748B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#64748B]">연도 선택</label>
          <div className="grid grid-cols-4 gap-1.5">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => onSelectYearMonth(y, currentMonth)}
                className={`py-1.5 text-xs font-bold rounded-[6px] transition-all ${
                  y === currentYear
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#E2E8F0] border border-[#CBD5E1]'
                }`}
              >
                {y}년
              </button>
            ))}
          </div>
        </div>

        {/* Month Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#64748B]">월 선택</label>
          <div className="grid grid-cols-4 gap-1.5">
            {months.map((m) => (
              <button
                key={m}
                onClick={() => {
                  onSelectYearMonth(currentYear, m);
                  onClose();
                }}
                className={`py-2 text-xs font-bold rounded-[6px] transition-all ${
                  m === currentMonth
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#E2E8F0] border border-[#CBD5E1]'
                }`}
              >
                {m + 1}월
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] rounded-[8px] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
