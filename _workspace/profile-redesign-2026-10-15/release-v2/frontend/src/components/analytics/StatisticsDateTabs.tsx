import { Calendar, RotateCcw, Radio } from 'lucide-react';
import { getKstDateString, formatKstDateKorean } from './statisticsModel';

interface StatisticsDateTabsProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  isPastDate?: boolean;
}

// 일자별 과거 리포트 탐색 탭 바 컴포넌트 (단일 책임: 날짜 선택 UI 및 변경 이벤트 처리)
export function StatisticsDateTabs({
  selectedDate,
  onSelectDate,
  isPastDate,
}: StatisticsDateTabsProps) {
  const todayKst = getKstDateString(0);
  const yesterdayKst = getKstDateString(-1);
  const twoDaysAgoKst = getKstDateString(-2);
  const threeDaysAgoKst = getKstDateString(-3);
  const minDateKst = getKstDateString(-7); // 최대 7일 전 아카이브

  const isLiveActive = !selectedDate || selectedDate === todayKst;

  const quickDates = [
    { key: yesterdayKst, label: `어제 (${formatKstDateKorean(yesterdayKst)})` },
    { key: twoDaysAgoKst, label: `그저께 (${formatKstDateKorean(twoDaysAgoKst)})` },
    { key: threeDaysAgoKst, label: formatKstDateKorean(threeDaysAgoKst) },
  ];

  return (
    <div className="bs-date-tabs-bar" role="region" aria-label="방송 일자 선택">
      <nav className="bs-date-tabs" aria-label="방송 일자 빠른 선택">
        {/* 오늘 (실시간 라이브) */}
        <button
          type="button"
          className={`bs-date-tab ${isLiveActive ? 'is-active is-live' : ''}`}
          aria-pressed={isLiveActive}
          onClick={() => onSelectDate(null)}
        >
          <span className="bs-live-dot" aria-hidden="true" />
          <Radio size={14} />
          <span>실시간 (오늘)</span>
        </button>

        {/* 최근 일자 퀵 버튼들 */}
        {quickDates.map((item) => {
          const isActive = selectedDate === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`bs-date-tab ${isActive ? 'is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onSelectDate(item.key)}
            >
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* 직접 날짜 선택 (캘린더 인풋) */}
        <label className={`bs-date-picker-label ${isPastDate && !quickDates.some((d) => d.key === selectedDate) ? 'is-active' : ''}`}>
          <Calendar size={14} />
          <span>{selectedDate && !isLiveActive && !quickDates.some((d) => d.key === selectedDate) ? formatKstDateKorean(selectedDate) : '날짜 선택'}</span>
          <input
            type="date"
            className="bs-date-picker-input"
            value={selectedDate || todayKst}
            max={todayKst}
            min={minDateKst}
            onChange={(e) => {
              const val = e.target.value;
              if (val === todayKst) {
                onSelectDate(null);
              } else if (val) {
                onSelectDate(val);
              }
            }}
          />
        </label>
      </nav>

      {/* 과거 날짜를 조회 중일 때의 안내 뱃지 및 오늘로 복귀 버튼 */}
      {isPastDate && selectedDate && (
        <div className="bs-past-date-banner">
          <span className="bs-past-badge">
            📅 {selectedDate} 리포트
          </span>
          <button
            type="button"
            className="bs-return-live-btn"
            onClick={() => onSelectDate(null)}
          >
            <RotateCcw size={12} />
            실시간 라이브로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
