import { useState, useMemo, Fragment } from 'react';
import {
  CurrentContentData,
} from '../../services/analyticsApiService';
import {
  Gamepad2,
  ChevronDown,
  ChevronRight,
  Search,
  HelpCircle,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface CurrentContentPanelProps {
  data?: CurrentContentData;
  isLoading?: boolean;
}

type SortOption = 'viewers_desc' | 'live_desc' | 'average_desc';

export function CurrentContentPanel({ data, isLoading = false }: CurrentContentPanelProps) {
  // 상태 관리
  const [isGameExpanded, setIsGameExpanded] = useState<boolean>(true); // 기본으로 게임 펼침 상태 제공
  const [parentSort, setParentSort] = useState<SortOption>('viewers_desc');
  const [childSort, setChildSort] = useState<SortOption>('viewers_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleChildCount, setVisibleChildCount] = useState<number>(5);
  const [selectedDetailKey, setSelectedDetailKey] = useState<string | null>(null); // 동적 1위 자동 선택

  // 수집 시각 포맷
  const collectionTimeStr = useMemo(() => {
    if (!data?.meta?.collectionCompletedAt) return '최근 회차';
    try {
      const d = new Date(data.meta.collectionCompletedAt);
      return new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
    } catch {
      return data.meta.collectionCompletedAt;
    }
  }, [data?.meta?.collectionCompletedAt]);

  // 대분류 정렬
  const sortedGroups = useMemo(() => {
    if (!data?.groups) return [];
    const copy = [...data.groups];
    copy.sort((a, b) => {
      if (parentSort === 'viewers_desc') return b.viewerSum - a.viewerSum;
      if (parentSort === 'live_desc') return b.liveCount - a.liveCount;
      if (parentSort === 'average_desc') return (b.averageViewers || 0) - (a.averageViewers || 0);
      return 0;
    });
    return copy;
  }, [data?.groups, parentSort]);

  // 게임 자식 목록 (검색 & 정렬)
  const gameGroup = useMemo(() => {
    return data?.groups.find((g) => g.groupKey === 'GAME');
  }, [data?.groups]);

  const filteredChildren = useMemo(() => {
    if (!gameGroup?.children) return [];
    let list = [...gameGroup.children];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (childSort === 'viewers_desc') return b.viewerSum - a.viewerSum;
      if (childSort === 'live_desc') return b.liveCount - a.liveCount;
      if (childSort === 'average_desc') return (b.averageViewers || 0) - (a.averageViewers || 0);
      return 0;
    });

    return list;
  }, [gameGroup?.children, searchQuery, childSort]);

  const displayedChildren = useMemo(() => {
    return filteredChildren.slice(0, visibleChildCount);
  }, [filteredChildren, visibleChildCount]);

  // 선택된 세부 게임 (미선택 시 1위 게임 기본 선택)
  const activeDetailKey = useMemo(() => {
    if (selectedDetailKey) return selectedDetailKey;
    if (displayedChildren.length > 0) return displayedChildren[0].detailKey;
    return null;
  }, [selectedDetailKey, displayedChildren]);

  const hasMoreChildren = filteredChildren.length > visibleChildCount;
  const remainingCount = Math.max(0, filteredChildren.length - visibleChildCount);

  if (isLoading && !data) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm mb-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-72 bg-slate-100 rounded mb-6" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const platformDisplay = data.meta?.platform === 'ALL'
    ? '치지직 · SOOP 종합'
    : data.meta?.platform === 'SOOP'
    ? 'SOOP (숲)'
    : 'CHZZK (치지직)';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-6 overflow-hidden">
      {/* A. 헤더 영역 */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-white via-slate-50/50 to-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <Gamepad2 className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
              현재 콘텐츠별 동시시청
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              게임 드릴다운
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            {platformDisplay} · 실시간 LIVE 기준 · 수집 {collectionTimeStr} KST
          </p>
        </div>

        {/* 정렬 선택 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#64748B] flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-[#2563EB]" />
            <span>대분류 정렬:</span>
          </span>
          <select
            value={parentSort}
            onChange={(e) => setParentSort(e.target.value as SortOption)}
            className="text-xs font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="viewers_desc">동시시청순</option>
            <option value="live_desc">LIVE순</option>
            <option value="average_desc">평균시청순</option>
          </select>
        </div>
      </div>

      {/* D. 부모 표 (대분류) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
              <th className="py-3 px-4 sm:px-6 w-[28%] min-w-[140px]">콘텐츠</th>
              <th className="py-3 px-4 sm:px-6 text-right w-[24%] min-w-[120px]">동시시청 합계</th>
              <th className="py-3 px-4 sm:px-6 text-right w-[16%] min-w-[90px]">전체 점유율</th>
              <th className="py-3 px-4 sm:px-6 text-right w-[16%] min-w-[90px]">LIVE 수</th>
              <th className="py-3 px-4 sm:px-6 text-right w-[16%] min-w-[100px]">방송당 평균</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {sortedGroups.map((group) => {
              const isGame = group.groupKey === 'GAME';
              const sharePercent = (group.shareOfTotal * 100).toFixed(1);

              return (
                <Fragment key={group.groupKey}>
                  {/* 대분류 행 */}
                  <tr
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isGame ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0F172A]">
                      {isGame ? (
                        <button
                          type="button"
                          onClick={() => setIsGameExpanded(!isGameExpanded)}
                          aria-expanded={isGameExpanded}
                          aria-controls="game-drilldown-table"
                          className="flex items-center gap-1.5 text-left font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors cursor-pointer group"
                        >
                          {isGameExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#2563EB] shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#2563EB] shrink-0" />
                          )}
                          <span>{group.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                              isGameExpanded
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isGameExpanded ? '접기' : '펼치기'}
                          </span>
                        </button>
                      ) : (
                        <span className="pl-5">{group.name}</span>
                      )}
                    </td>

                    {/* 동시시청 합계 (전체 점유율 비례 보조 막대 포함) */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono font-bold text-[#0F172A]">
                          {group.viewerSum.toLocaleString()}명
                        </span>
                        <div className="w-24 sm:w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2563EB] h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, group.shareOfTotal * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 전체 점유율 */}
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono font-bold text-[#334155]">
                      {sharePercent}%
                    </td>

                    {/* LIVE 수 */}
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono text-[#0F172A]">
                      {group.liveCount}개
                    </td>

                    {/* 방송당 평균 */}
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono text-[#475569]">
                      {group.averageViewers !== null ? `${group.averageViewers.toFixed(1)}명` : '-'}
                    </td>
                  </tr>

                  {/* E. 게임 자식 표 (펼쳐진 상태) */}
                  {isGame && isGameExpanded && (
                    <tr id="game-drilldown-table" className="bg-slate-50/70 border-b border-[#CBD5E1]">
                      <td colSpan={5} className="p-3 sm:p-5">
                        <div className="bg-white border border-[#CBD5E1] rounded-xl p-3 sm:p-4 shadow-xs ml-0 sm:ml-4">
                          {/* 자식 표 툴바 (검색 & 자식 정렬) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-[#E2E8F0]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#0F172A] flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>세부 게임 목록</span>
                              </span>
                              <span className="text-[11px] text-[#64748B]">
                                (총 {filteredChildren.length}개 게임 관측)
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* 검색 인풋 */}
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setVisibleChildCount(5); // 검색 시 상위 5개 리셋
                                  }}
                                  placeholder="세부 게임 검색..."
                                  className="text-xs pl-8 pr-2.5 py-1 bg-slate-50 border border-[#CBD5E1] rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
                                />
                              </div>

                              {/* 자식 정렬 */}
                              <select
                                value={childSort}
                                onChange={(e) => setChildSort(e.target.value as SortOption)}
                                className="text-[11px] font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
                              >
                                <option value="viewers_desc">동시시청순</option>
                                <option value="live_desc">LIVE순</option>
                                <option value="average_desc">평균시청순</option>
                              </select>
                            </div>
                          </div>

                          {/* 자식 표 본문 */}
                          {filteredChildren.length === 0 ? (
                            <div className="py-6 text-center text-xs text-[#64748B]">
                              일치하는 세부 게임이 없습니다.
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {/* 자식 표 헤더 - 기획서 원칙: 반드시 '게임 내 점유율' 명시 */}
                              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-[#64748B] px-3 py-1.5 bg-[#F8FAFC] rounded-lg">
                                <div className="col-span-5">세부 게임</div>
                                <div className="col-span-3 text-right">동시시청 합계</div>
                                <div className="col-span-2 text-right text-blue-700">게임 내 점유율</div>
                                <div className="col-span-2 text-right">LIVE 수</div>
                              </div>

                              {/* 자식 행 목록 */}
                              {displayedChildren.map((item) => {
                                const isSelected = activeDetailKey === item.detailKey;
                                const childSharePercent = (item.shareOfGroup * 100).toFixed(1);

                                return (
                                  <div
                                    key={item.detailKey}
                                    className="border border-[#E2E8F0] rounded-lg overflow-hidden transition-all"
                                  >
                                    <div
                                      onClick={() =>
                                        setSelectedDetailKey(isSelected ? null : item.detailKey)
                                      }
                                      className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 cursor-pointer text-xs transition-colors ${
                                        isSelected ? 'bg-blue-50/60 font-bold' : 'hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                                        <button
                                          type="button"
                                          className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[#2563EB] font-bold shrink-0"
                                        >
                                          {isSelected ? '닫기' : '상세'}
                                        </button>
                                        <span className="truncate text-[#0F172A]">{item.name}</span>
                                        {item.classificationStatus === 'UNSET' && (
                                          <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-500 shrink-0">
                                            미설정
                                          </span>
                                        )}
                                      </div>

                                      <div className="col-span-3 text-right font-mono text-[#0F172A]">
                                        {item.viewerSum.toLocaleString()}명
                                      </div>

                                      <div className="col-span-2 text-right font-mono font-bold text-blue-700">
                                        {childSharePercent}%
                                      </div>

                                      <div className="col-span-2 text-right font-mono text-[#475569]">
                                        {item.liveCount}개
                                      </div>
                                    </div>

                                    {/* F. 세부 게임 상세 패널 (클릭 시 아코디언 확장) */}
                                    {isSelected && (
                                      <div className="p-3 bg-white border-t border-[#CBD5E1] text-xs">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                                          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                                            <div className="text-[10px] text-[#64748B] mb-0.5">
                                              동시시청 / LIVE
                                            </div>
                                            <div className="font-bold text-[#0F172A]">
                                              {item.viewerSum.toLocaleString()}명 / {item.liveCount}개
                                            </div>
                                          </div>
                                          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                                            <div className="text-[10px] text-[#64748B] mb-0.5">
                                              방송당 평균 시청
                                            </div>
                                            <div className="font-bold text-[#0F172A]">
                                              {item.averageViewers !== null
                                                ? `${item.averageViewers.toFixed(1)}명`
                                                : '-'}
                                            </div>
                                          </div>
                                          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                                            <div className="text-[10px] text-[#64748B] mb-0.5">
                                              방송별 중앙값
                                            </div>
                                            <div className="font-bold text-[#0F172A]">
                                              {item.medianViewers !== null
                                                ? `${item.medianViewers}명`
                                                : '-'}
                                            </div>
                                          </div>
                                          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                                            <div className="text-[10px] text-[#64748B] mb-0.5">
                                              최대 방송 점유율
                                            </div>
                                            <div className="font-bold text-amber-700">
                                              {item.top1Share !== null
                                                ? `${(item.top1Share * 100).toFixed(1)}%`
                                                : '-'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 더 보기 버튼 */}
                          {hasMoreChildren && (
                            <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex justify-center">
                              <button
                                type="button"
                                onClick={() => setVisibleChildCount((prev) => prev + 10)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-xs transition-all cursor-pointer"
                              >
                                나머지 {remainingCount}개 세부 게임 더 보기
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {/* 합계 행 */}
            <tr className="bg-[#F8FAFC] font-extrabold text-[#0F172A] border-t-2 border-[#CBD5E1]">
              <td className="py-3 px-4 sm:px-6">전체 합계</td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono">
                {data.totals.viewerSum.toLocaleString()}명
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono">100%</td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono">
                {data.totals.liveCount}개
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono text-[#475569]">
                {data.totals.averageViewers !== null
                  ? `${data.totals.averageViewers.toFixed(1)}명`
                  : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* G. 기준 안내 문구 */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span>
            동시시청 합계는 방송별 동시접속 슬롯의 단순 합계(중복 시청 가능)이며 고유 사람 수가 아닙니다.
          </span>
        </div>
        <div className="text-slate-500">
          * 반올림으로 인해 점유율 합계는 100%와 소폭 다를 수 있습니다.
        </div>
      </div>
    </div>
  );
}
