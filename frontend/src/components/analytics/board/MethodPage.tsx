import { useEffect } from 'react';
import { linkProps } from './boardParts';
import './analyticsBoard.css';

const TERMS: Array<[string, string]> = [
  ['치지직 시청자', '그 정각에 치지직 인기 방송 상위 100개의 시청자를 모두 더한 수예요.'],
  ['평소', '최근 4주 같은 요일, 같은 정각 값의 가운데 값이에요. 4주 중 3주 이상 기록이 있을 때만 비교해요.'],
  ['오늘 최고', '오늘 0시부터 지금까지 정각마다 확인한 값 중 가장 큰 값이에요.'],
  ['1,000명 이상 방송', '그 정각에 시청자가 1,000명 이상인 방송의 수예요.'],
  ['방송 수', '그 정각에 같은 게임을 하고 있는 방송의 수예요. 오늘·7일은 정각마다 센 값의 평균이에요.'],
  ['방송당 시청자', '게임 시청자를 방송 수로 나눈 값이에요. 방송이 2개 이상인 게임만 계산해요.'],
  ['경쟁', '방송당 시청자를 같은 시각 모든 게임의 가운데 값과 비교해요. 1.5배 이상이면 여유, 0.67배 이하면 혼잡, 그 사이는 보통이에요.'],
  ['태그 방송 수', '이 태그를 단 방송의 수예요. 한 채널은 한 번만 세고, 띄어쓰기와 대소문자만 다른 태그는 같은 태그로 봐요.'],
  ['태그 시청자', '이 태그를 단 방송의 시청자를 더한 수예요. 한 방송에 태그가 여러 개면 각 태그에 모두 더해져요.'],
];
const RANKS: Array<[string, string, string]> = [
  ['실시간 채널 순위', '정각 기준 시청자 수', '매시 정각'],
  ['인기 게임 순위', '게임 시청자 (지금 / 오늘 평균 / 7일 평균)', '매시 정각'],
  ['급상승 게임', '지난 7일 시청자가 그 전 7일보다 30% 이상 늘고, 7일 평균 1,000명 이상', '매시 정각'],
  ['방송 태그 순위', '지금 태그 시청자', '매시 정각'],
  ['게임별 상위 채널', '최근 7일 그 게임 방송의 평균 시청자', '매시 정각'],
];

// 집계 기준(정의서 4~6장을 사용자 말로 공개).
export function MethodPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  useEffect(() => { document.title = '방송 통계 집계 기준 | VDébut'; }, []);
  return <div className="ab ab-method">
    <main className="ab-main" style={{ maxWidth: 880 }}>
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 집계 기준</nav>
      <h1>집계 기준</h1>
      <section className="ab-section" aria-labelledby="m-collect"><h2 id="m-collect">어떻게 모으나요</h2>
        <dl>
          <dt>대상</dt><dd>치지직은 시청자가 많은 순 상위 100개 방송, SOOP은 VDébut에 등록된 채널의 방송이에요. 두 플랫폼의 수집 범위가 달라 플랫폼 현황과 시청자 추이는 치지직만 보여 줘요.</dd>
          <dt>주기</dt><dd>1시간마다, 매시 정각. 페이지를 열어 두어도 정각이 지나면 새 집계로 바뀌어요.</dd>
          <dt>보관</dt><dd>최근 90일</dd>
          <dt>시간</dt><dd>모든 날짜와 시각은 한국 시간이에요.</dd>
        </dl>
      </section>
      <section className="ab-section" aria-labelledby="m-terms"><h2 id="m-terms">숫자의 뜻</h2>
        <dl>{TERMS.map(([name, desc]) => <div key={name} style={{ display: 'contents' }}><dt>{name}</dt><dd>{desc}</dd></div>)}</dl>
      </section>
      <section className="ab-section" aria-labelledby="m-rank"><h2 id="m-rank">순위는 어떻게 정하나요</h2>
        <dl>{RANKS.map(([name, by, when]) => <div key={name} style={{ display: 'contents' }}><dt>{name}</dt><dd>{by} · {when} 갱신</dd></div>)}</dl>
      </section>
      <section className="ab-section" aria-labelledby="m-class" style={{ gap: 14 }}><h2 id="m-class">분류 기준</h2>
        <div><h3>게임</h3><p>플랫폼이 정한 카테고리를 따라요. 같은 게임은 플랫폼이 달라도 하나로 묶고, '종합 게임'처럼 특정 게임이 아닌 분류는 게임 순위에서 빼요.</p></div>
        <div><h3>게임 외 콘텐츠</h3><p>토크, 노래, 먹방, 그림 등 게임이 아닌 방송은 따로 모아 보여 줘요.</p></div>
        <div><h3>태그</h3><p>방송인이 직접 단 태그를 그대로 모아요. 지금은 치지직 방송 태그만 집계해요.</p></div>
        <div><h3>버튜버</h3><p>VDébut에 소개가 등록된 버튜버의 채널만 '버튜버만'에 들어가요.</p></div>
        <div><h3>소속</h3><p>공식 소속이 확인된 채널만 플랫폼 옆에 소속을 함께 적어요. 예: 치지직 / 소속 이름</p></div>
      </section>
      <section className="ab-section" aria-labelledby="m-limit"><h2 id="m-limit">알아 두면 좋은 점</h2>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>상위 100개 밖에 있던 시간의 방송은 기록되지 않아요.</li>
          <li>플랫폼이 잠시 응답하지 않은 정각은 계산에서 빼고, 그래프에서는 비워 둬요.</li>
          <li>시청자 수는 각 플랫폼이 공개한 동시 시청자 수예요. 플랫폼마다 세는 방식이 다를 수 있어요.</li>
        </ul>
      </section>
    </main>
  </div>;
}
