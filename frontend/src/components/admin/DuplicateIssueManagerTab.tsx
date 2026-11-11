import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Trash2,
  Edit3,
  Layers,
  SearchCheck,
} from 'lucide-react';
import { AvatarImage } from '../calendar/AvatarImage';

interface DuplicateIssueManagerTabProps {
  scanData: {
    summary?: {
      totalActiveProfiles: number;
      duplicateGroupCount: number;
      channelDuplicateCount: number;
      nameDuplicateCount: number;
      slugVariantCount: number;
      missingAvatarCount: number;
      missingSpecsCount: number;
    };
    groups: any[];
  };
  isLoading: boolean;
  onRefreshScan: () => void;
  onResolveGroup: (keepSlug: string, removeSlugs: string[]) => Promise<void>;
  onEditStreamerBySlug: (slug: string) => void;
  onDeleteStreamerBySlug: (slug: string, displayName: string) => Promise<void>;
  onTriggerSpecResearch: () => Promise<void>;
  onTriggerSyncProfiles: () => Promise<void>;
  isResearchingSpecs: boolean;
  isSyncingProfiles: boolean;
}

export function DuplicateIssueManagerTab({
  scanData,
  isLoading,
  onRefreshScan,
  onResolveGroup,
  onEditStreamerBySlug,
  onDeleteStreamerBySlug,
  onTriggerSpecResearch,
  onTriggerSyncProfiles,
  isResearchingSpecs,
  isSyncingProfiles,
}: DuplicateIssueManagerTabProps) {
  const [selectedKeepByGroup, setSelectedKeepByGroup] = useState<Record<string, string>>({});
  const [resolvingGroupId, setResolvingGroupId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CHANNEL_DUPLICATE' | 'NAME_DUPLICATE' | 'SLUG_VARIANT'>('ALL');

  const summary = scanData.summary || {
    totalActiveProfiles: 0,
    duplicateGroupCount: 0,
    channelDuplicateCount: 0,
    nameDuplicateCount: 0,
    slugVariantCount: 0,
    missingAvatarCount: 0,
    missingSpecsCount: 0,
  };

  const groups = (scanData.groups || []).filter(
    (g) => typeFilter === 'ALL' || g.type === typeFilter
  );

  const handleMergeGroup = async (group: any) => {
    const keepSlug = selectedKeepByGroup[group.id] || group.recommendedKeepSlug || group.members[0]?.slug;
    if (!keepSlug) return;
    const removeSlugs = group.members
      .map((m: any) => m.slug)
      .filter((s: string) => s !== keepSlug);

    const confirmMsg = removeSlugs.length > 0
      ? `대표 슬러그 [${keepSlug}]로 제원·프로필 정보를 병합하고, 나머지 중복 슬러그 [${removeSlugs.join(', ')}]를 완전히 정리하시겠습니까?`
      : `슬러그 [${keepSlug}] 내부의 중복된 레거시 행을 1개로 정리하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    setResolvingGroupId(group.id);
    await onResolveGroup(keepSlug, removeSlugs);
    setResolvingGroupId(null);
  };

  return (
    <div className="space-y-4">
      {/* 상단 요약 카드 & 원클릭 자동화 도구 */}
      <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <SearchCheck className="w-5 h-5 text-blue-600" />
              <span>DB 중복 이슈 전수 진단 & 자동 리서치 도구</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              레거시 테이블(`streamerChannel_info`)과 포털 테이블(`portal_profiles`)을 교차 스캔하여 채널·이름·슬러그 중복을 찾아내고 1-클릭으로 병합 정리합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onTriggerSpecResearch}
              disabled={isResearchingSpecs}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-[8px] shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="치지직 공지 및 SOOP 방송국 게시글에서 미보유 버튜버의 종족·생일·별자리·MBTI를 자동 스캔합니다."
            >
              <Sparkles className={`w-3.5 h-3.5 ${isResearchingSpecs ? 'animate-spin' : ''}`} />
              <span>{isResearchingSpecs ? '제원·MBTI 스캔 중...' : '제원·MBTI 자동 리서치 실행'}</span>
            </button>

            <button
              type="button"
              onClick={onTriggerSyncProfiles}
              disabled={isSyncingProfiles}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-[8px] shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="미비된 프로필 아바타와 채널 소개를 공식 플랫폼 API에서 일괄 동기화합니다."
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingProfiles ? 'animate-spin' : ''}`} />
              <span>{isSyncingProfiles ? '아바타 동기화 중...' : '아바타·소개 일괄 동기화'}</span>
            </button>

            <button
              type="button"
              onClick={onRefreshScan}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-[8px] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>다시 스캔</span>
            </button>
          </div>
        </div>

        {/* 지표 배지 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500">전체 등록 버튜버</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{summary.totalActiveProfiles}명</div>
          </div>
          <div className="p-3 rounded-[10px] bg-amber-50 border border-amber-200">
            <div className="text-[11px] font-bold text-amber-800">감지된 중복 그룹</div>
            <div className="text-lg font-black text-amber-900 mt-0.5">{summary.duplicateGroupCount}건</div>
          </div>
          <div className="p-3 rounded-[10px] bg-red-50 border border-red-200">
            <div className="text-[11px] font-bold text-red-700">동일 채널 중복</div>
            <div className="text-lg font-black text-red-800 mt-0.5">{summary.channelDuplicateCount}건</div>
          </div>
          <div className="p-3 rounded-[10px] bg-blue-50 border border-blue-200">
            <div className="text-[11px] font-bold text-blue-700">동일 이름 / 슬러그 변형</div>
            <div className="text-lg font-black text-blue-900 mt-0.5">
              {summary.nameDuplicateCount + summary.slugVariantCount}건
            </div>
          </div>
          <div className="p-3 rounded-[10px] bg-indigo-50 border border-indigo-200 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-indigo-700">제원 미보유 프로필</div>
            <div className="text-lg font-black text-indigo-900 mt-0.5">{summary.missingSpecsCount}명</div>
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {[
            { id: 'ALL', label: `전체 중복 (${summary.duplicateGroupCount})` },
            { id: 'CHANNEL_DUPLICATE', label: `방송국 채널 중복 (${summary.channelDuplicateCount})` },
            { id: 'NAME_DUPLICATE', label: `활동명 중복 (${summary.nameDuplicateCount})` },
            { id: 'SLUG_VARIANT', label: `슬러그 변형 (${summary.slugVariantCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-extrabold transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 중복 그룹 리스트 */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 font-bold text-xs">
          DB 중복 이슈를 전수 스캔하는 중입니다...
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-[14px] border border-slate-200 p-8 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="font-extrabold text-sm text-slate-800">감지된 중복 이슈가 없습니다!</p>
          <p className="text-xs text-slate-500">모든 버튜버 프로필과 채널 슬러그가 깨끗하게 정합성을 유지하고 있습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const currentKeep = selectedKeepByGroup[group.id] || group.recommendedKeepSlug || group.members[0]?.slug;
            const isResolving = resolvingGroupId === group.id;

            return (
              <div
                key={group.id}
                className="bg-white rounded-[14px] border border-amber-300 shadow-xs overflow-hidden"
              >
                {/* 그룹 헤더 */}
                <div className="px-4 py-3 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950">
                        {group.type === 'CHANNEL_DUPLICATE'
                          ? '채널 URL 중복'
                          : group.type === 'NAME_DUPLICATE'
                          ? '활동명 중복'
                          : '슬러그 변형'}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900">{group.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{group.reason}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMergeGroup(group)}
                    disabled={isResolving}
                    className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs rounded-[8px] shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {isResolving
                        ? '병합 정리 중...'
                        : `[${currentKeep}] 대표로 병합 & 중복 삭제`}
                    </span>
                  </button>
                </div>

                {/* 그룹 내 멤버 비교 카드 */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.members.map((m: any) => {
                    const isKeep = m.slug === currentKeep;
                    return (
                      <div
                        key={m.slug}
                        className={`p-3.5 rounded-[10px] border transition-all flex flex-col justify-between gap-3 ${
                          isKeep
                            ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-100'
                            : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name={`keep-${group.id}`}
                            checked={isKeep}
                            onChange={() =>
                              setSelectedKeepByGroup((prev) => ({ ...prev, [group.id]: m.slug }))
                            }
                            className="mt-1 w-4 h-4 text-blue-600 cursor-pointer shrink-0"
                            title="이 프로필을 대표로 유지"
                          />

                          <AvatarImage
                            src={m.avatarUrl}
                            alt={m.displayName}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                          />

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-extrabold text-slate-900">{m.displayName}</span>
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-white border border-slate-300 rounded text-blue-700">
                                /{m.slug}
                              </span>
                              {isKeep && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-600 text-white rounded">
                                  유지할 대표
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                              <span className="font-bold">{m.platform}</span>
                              <span>•</span>
                              <span>데뷔: {m.debutDate || '미정'} {m.debutTime}</span>
                              <span>•</span>
                              <span>제원 {m.specCount}개 보유</span>
                              <span>•</span>
                              <span className="text-[11px] text-slate-500">
                                DB: {m.storageSource} (레거시 {m.legacyRowCount}행)
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-slate-500 truncate">
                              {m.channelUrl}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/creator/${m.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              프로필 확인 <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                              href={m.channelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-slate-500 hover:underline inline-flex items-center gap-1"
                            >
                              방송국 <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditStreamerBySlug(m.slug)}
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-[6px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>수정</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteStreamerBySlug(m.slug, m.displayName)}
                              className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-[6px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>삭제</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

