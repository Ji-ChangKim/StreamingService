import { X, ShieldCheck, CheckCircle2, FileText, Layers, AlertCircle } from 'lucide-react';
import { MethodologyInfo } from '../../services/analyticsApiService';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  methodology?: MethodologyInfo;
}

export function MethodologyModal({ isOpen, onClose, methodology }: MethodologyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#CBD5E1] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#0F172A]">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#0F172A] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              VDébut Analytics 데이터 수집 기준 및 관측 가이드
              <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                {methodology?.version || 'v0.2'}
              </span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              치지직 공식 API 수집 원칙, 4대 관측 지표 정의 및 객관적 통계 기준
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs leading-relaxed">
          {/* 1. 수집 기준 및 대상 범위 */}
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. 데이터 수집 기준 및 대상 범위</span>
            </h3>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2.5 text-[#334155]">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-[#0F172A]">수집 대상 채널:</strong> VDébut에서 확인·검증된 <strong>치지직(CHZZK) 버튜버 1,284개 채널</strong>을 전수 대상으로 집계합니다. 일반 스트리머나 미확인 채널은 통계에서 제외되어 버튜버 생태계 본연의 지표를 보여줍니다.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-[#0F172A]">10분 단위 정기 스냅샷:</strong> 치지직 공식 API를 통해 10분 주기로 실시간 방송 상태 및 동시 시청자 수를 정기 수집하여 시계열 및 시간대별 통계를 산출합니다.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-[#0F172A]">동시시청 합계 (Viewer Slots):</strong> 공식 API의 <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[11px]">concurrentUserCount</code>는 방송별 동시 접속 시청자 수입니다. 1인이 여러 방송을 동시 시청할 수 있으므로, 고유 사용자 수(UV/MAU)가 아닌 '방송별 동시시청 슬롯 합계'로 표기합니다.
                </span>
              </div>
            </div>
          </div>

          {/* 2. 4대 핵심 관측 지표 정의 */}
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-2.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>2. 4대 핵심 관측 지표 정의</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="font-bold text-[#0F172A] mb-1">총 동시시청자 (Total Viewers)</div>
                <div className="text-[#64748B] text-[11px]">
                  특정 시각 또는 구간에서 방송 중인 확인 버튜버들의 동시 시청자 총합입니다.
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="font-bold text-[#0F172A] mb-1">LIVE 방송 수 (Live Channels)</div>
                <div className="text-[#64748B] text-[11px]">
                  해당 시각에 실제로 방송 송출을 진행하고 있는 확인 버튜버 채널의 총 개수입니다.
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="font-bold text-[#0F172A] mb-1">방송당 평균 시청자 (Avg per Live)</div>
                <div className="text-[#64748B] text-[11px]">
                  총 동시시청자 ÷ LIVE 방송 수. 방송 1개당 평균적으로 관측되는 시청자 규모입니다.
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="font-bold text-[#0F172A] mb-1">상위 10 점유율 (Top 10 Concentration)</div>
                <div className="text-[#64748B] text-[11px]">
                  시청자 상위 10개 방송이 전체 동시시청에서 차지하는 비중(%)입니다. 대형 방송 집중도와 중소 방송 분산도를 나타냅니다.
                </div>
              </div>
            </div>
          </div>

          {/* 3. 수요·공급 비율 공식 및 4개 영역 구분 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4">
            <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>3. 콘텐츠 수요·공급 비율 및 관측 영역 구분</span>
            </h3>
            <div className="bg-white rounded-xl p-3 font-mono text-[11px] text-[#0F172A] border border-[#E2E8F0] shadow-sm mb-3">
              <div className="text-[#2563EB] font-bold">수요·공급 비율 = 시청 점유율(%) ÷ LIVE 방송 점유율(%)</div>
              <div className="text-xs text-[#64748B] mt-1 font-sans">
                • 1.0 초과: 공급 대비 시청 비중이 높은 분야 | • 1.0 미만: 공급 대비 시청 비중이 낮은 분야
              </div>
            </div>
            <div className="space-y-1.5 text-[11px] text-[#334155]">
              <div>• <strong className="text-emerald-700">공급 대비 시청 우위:</strong> 시청 점유율이 방송 점유율보다 상대적으로 높아 분산 유입 가능성이 관측되는 영역</div>
              <div>• <strong className="text-blue-700">고수요·고공급:</strong> 시청자와 방송자 모두 집중되는 대형 메이저 콘텐츠 영역</div>
              <div>• <strong className="text-slate-700">저수요·저공급:</strong> 방송 수와 시청자 모두 적은 틈새/매니아 영역</div>
              <div>• <strong className="text-amber-700">공급 대비 시청 열위:</strong> 방송 수에 비해 시청 점유 비중이 낮아 경쟁 강도가 높은 영역</div>
            </div>
          </div>

          {/* 4. 추천 기능 보류 및 향후 안내 */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-[#92400E] mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>4. 추천 기능 및 예측 보류 안내</span>
            </h3>
            <p className="text-[#78350F] text-[11px] leading-relaxed">
              VDébut Analytics는 주관적 가중치를 기반으로 한 단정적 '기회 점수'나 '추천 시간대'를 인위적으로 제공하지 않습니다. 
              최소 8주 이상의 데이터 축적 및 신규 방송 표본과의 상관관계 검증이 완료된 시점에 투명한 검증 보고서와 함께 참고 지표가 단계적으로 안내될 예정입니다.
            </p>
          </div>
        </div>

        {/* 확인 버튼 */}
        <div className="mt-7 pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
