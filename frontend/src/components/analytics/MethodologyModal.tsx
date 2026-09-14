import { X, ShieldCheck, CheckCircle2, FileText, HelpCircle } from 'lucide-react';
import { MethodologyInfo } from '../../services/analyticsApiService';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  methodology?: MethodologyInfo;
}

export function MethodologyModal({ isOpen, onClose, methodology }: MethodologyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141828] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-gray-200">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              VDébut Analytics 데이터 기준 및 산식 가이드
              <span className="text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                {methodology?.version || 'v0.1'}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              공식 API 기준 수집 원칙, 용어 정의 및 방송 기회 점수(Opportunity Score) 산식
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs leading-relaxed">
          {/* 1. 핵심 데이터 원칙 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2.5 flex items-center gap-1.5 text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. 데이터 표현 및 분석 원칙
            </h3>
            <ul className="space-y-2 pl-2">
              <li className="flex items-start gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">동시시청 합계 (Viewer Slots):</strong> 공식 API의 <code>concurrentUserCount</code>는 방송별 동시 시청자 수입니다. 중복 시청 가능성이 있으므로 고유 사용자 수(MAU)가 아닌 동시시청 슬롯 합계로 표기합니다.
                </span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">랭킹 왜곡 배제:</strong> 단순 인기 스트리머 순위를 메인에 두지 않으며, 시장 과열도 및 진입 장벽을 측정하는 '상위 10 집중도' 근거로만 활용합니다.
                </span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">확정 예측 지양:</strong> 특정 시간대의 성공을 단정하지 않으며, "상대적으로 진입이 유리한 시간대"를 통계적 근거 및 표본수와 함께 제공합니다.
                </span>
              </li>
            </ul>
          </div>

          {/* 2. 방송 기회 점수 산식 */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5 text-amber-300">
              <FileText className="w-4 h-4 text-amber-400" />
              2. 방송 기회 점수 (Opportunity Score v1.0) 산식
            </h3>
            <p className="text-gray-300 mb-3">
              동일 플랫폼·콘텐츠·요일 유형 안에서 24개 시간 셀을 상대 비교하여 100점 만점으로 계산합니다:
            </p>
            <div className="bg-[#0b0e17] rounded-xl p-3 font-mono text-[11px] text-gray-200 space-y-1 border border-white/5">
              <div className="text-indigo-400">Opportunity Score =</div>
              <div className="pl-4">  (방송당 시청 백분위) × 0.40</div>
              <div className="pl-4">+ (시청 증가율 백분위) × 0.20</div>
              <div className="pl-4">+ (1 - 상위 10 집중도 백분위) × 0.20</div>
              <div className="pl-4">+ (소형·신규 채널 점유율) × 0.10</div>
              <div className="pl-4">+ (데이터 안정성 점수) × 0.10</div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2.5">
              * 최소 14일 수집(권장 28일) 및 유효 스냅샷 80% 이상 충족 시 점수가 정식 노출됩니다.
            </p>
          </div>

          {/* 3. 데이터 출처 및 주기 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2.5 flex items-center gap-1.5 text-sky-300">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              3. 데이터 수집 출처 및 주기
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-white">
                  <img src="/icons/chzzk/chzzk Icon_01.png" alt="CHZZK" className="w-4 h-4" />
                  <span>CHZZK Open API</span>
                </div>
                <div className="text-gray-400 text-[11px] space-y-1">
                  <div>• 주기: 10분 전수 스냅샷 수집</div>
                  <div>• 수집 항목: 동시시청자, 방송제목, 카테고리, 태그, 오픈일시</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-white">
                  <img src="/icons/soop/soop_symbol_blue.svg" alt="SOOP" className="w-4 h-4" />
                  <span>SOOP Developers</span>
                </div>
                <div className="text-gray-400 text-[11px] space-y-1">
                  <div>• 주기: 10분 전수 스냅샷 수집</div>
                  <div>• 수집 항목: 실시간 시청자, 방송국 정보, 방송 시작시간</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 확인 버튼 */}
        <div className="mt-7 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
