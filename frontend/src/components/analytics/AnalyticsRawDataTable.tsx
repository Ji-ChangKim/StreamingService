import { useState } from 'react';
import { HeatmapCell } from '../../services/analyticsApiService';
import { Table, ArrowUpDown } from 'lucide-react';

interface AnalyticsRawDataTableProps {
  cells: HeatmapCell[];
  isLoading?: boolean;
}

type SortField = 'time' | 'viewers' | 'liveCount' | 'viewersPerLive' | 'top10Share';
type SortOrder = 'asc' | 'desc';

export function AnalyticsRawDataTable({ cells, isLoading }: AnalyticsRawDataTableProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  if (isLoading || !cells || cells.length === 0) {
    return (
      <div className="h-64 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center text-[#64748B] text-xs animate-pulse">
        데이터 원본 테이블을 불러오는 중입니다...
      </div>
    );
  }

  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

  // 요일 필터링
  const filtered = selectedDay === 'ALL' ? cells : cells.filter((c) => c.dayOfWeek === selectedDay);

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === 'time') {
      diff = a.dayOfWeek !== b.dayOfWeek ? a.dayOfWeek - b.dayOfWeek : a.hour - b.hour;
    } else if (sortField === 'viewers') {
      diff = a.viewers - b.viewers;
    } else if (sortField === 'liveCount') {
      diff = a.liveCount - b.liveCount;
    } else if (sortField === 'viewersPerLive') {
      diff = a.viewersPerLive - b.viewersPerLive;
    } else if (sortField === 'top10Share') {
      diff = a.top10Share - b.top10Share;
    }
    return sortOrder === 'asc' ? diff : -diff;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
            <Table className="w-5 h-5 text-[#2563EB]" />
            <span>시간대별 관측 원본 데이터 표 (Raw Observation Data)</span>
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
            차트의 원본이 되는 168개 요일×시간대별 집계 수치를 직접 확인하고 정렬할 수 있습니다.
          </p>
        </div>

        {/* 요일 필터 버튼들 */}
        <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setSelectedDay('ALL')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              selectedDay === 'ALL'
                ? 'bg-[#0F172A] text-white shadow-2xs'
                : 'text-slate-700 hover:text-[#0F172A]'
            }`}
          >
            전체
          </button>
          {DAY_NAMES.map((name, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDay(idx)}
              className={`px-2.5 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                selectedDay === idx
                  ? 'bg-white text-[#2563EB] shadow-2xs border border-[#CBD5E1]'
                  : 'text-slate-700 hover:text-[#0F172A]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto border border-[#CBD5E1] rounded-xl">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="bg-slate-100 sticky top-0 z-10 text-slate-900 border-b-2 border-[#CBD5E1]">
            <tr>
              <th
                onClick={() => handleSort('time')}
                className="py-3 px-4 font-black cursor-pointer hover:text-blue-700"
              >
                <div className="flex items-center gap-1.5">
                  <span>요일 및 시간대</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('viewers')}
                className="py-3 px-4 text-right font-black cursor-pointer hover:text-blue-700"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>동시시청 평균</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('liveCount')}
                className="py-3 px-4 text-right font-black cursor-pointer hover:text-blue-700"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>LIVE 평균</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('viewersPerLive')}
                className="py-3 px-4 text-right font-black cursor-pointer hover:text-blue-700"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>방송당 평균</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('top10Share')}
                className="py-3 px-4 text-right font-black cursor-pointer hover:text-blue-700"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>상위 10 집중도</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 text-center font-black text-slate-800">
                표본 기간
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
            {sorted.map((c) => (
              <tr key={`${c.dayOfWeek}-${c.hour}`} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-bold">
                  <span className="inline-block w-7 text-center font-black text-[#2563EB] bg-blue-50 border border-blue-200 rounded mr-2.5 text-xs py-0.5">
                    {c.dayName}
                  </span>
                  <span className="font-mono">{String(c.hour).padStart(2, '0')}:00 ~ {String((c.hour + 1) % 24).padStart(2, '0')}:00</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-[#2563EB]">
                  {c.viewers.toLocaleString()}명
                </td>
                <td className="py-3 px-4 text-right font-mono text-purple-800 font-bold">
                  {c.liveCount}개
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                  {c.viewersPerLive}명
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                  {Math.round(c.top10Share * 100)}%
                </td>
                <td className="py-3 px-4 text-center text-slate-700 font-semibold text-xs">
                  최근 28일
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3.5 text-xs sm:text-sm text-slate-700 font-bold">
        <span>조회된 구간: 총 {sorted.length}개 시간대</span>
        <span>기준: 치지직 확인 버튜버 10분 스냅샷 누적 평균</span>
      </div>
    </div>
  );
}
