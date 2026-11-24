import { useEffect } from 'react';
import { linkProps } from './boardParts';
import './analyticsBoard.css';
import { METHOD_CLASSES, METHOD_COLLECT, METHOD_LIMITS, METHOD_RANKS, METHOD_TERMS } from '../../../../../shared/analyticsMethod';

// 집계 기준(정의서 4~6장을 사용자 말로 공개).
export function MethodPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  useEffect(() => { document.title = '방송 통계 집계 기준 | VDébut'; }, []);
  return <div className="ab ab-method">
    <main className="ab-main" style={{ maxWidth: 880 }}>
      <nav className="ab-crumb" aria-label="경로"><a {...linkProps('/analytics', onNavigate)}>방송 통계</a> / 집계 기준</nav>
      <h1>집계 기준</h1>
      <section className="ab-section" aria-labelledby="m-collect"><h2 id="m-collect">어떻게 모으나요</h2>
        <dl>{METHOD_COLLECT.map(([name, desc]) => <div key={name} style={{ display: 'contents' }}><dt>{name}</dt><dd>{desc}</dd></div>)}</dl>
      </section>
      <section className="ab-section" aria-labelledby="m-terms"><h2 id="m-terms">숫자의 뜻</h2>
        <dl>{METHOD_TERMS.map(([name, desc]) => <div key={name} style={{ display: 'contents' }}><dt>{name}</dt><dd>{desc}</dd></div>)}</dl>
      </section>
      <section className="ab-section" aria-labelledby="m-rank"><h2 id="m-rank">순위는 어떻게 정하나요</h2>
        <dl>{METHOD_RANKS.map(([name, by, when]) => <div key={name} style={{ display: 'contents' }}><dt>{name}</dt><dd>{by} · {when} 갱신</dd></div>)}</dl>
      </section>
      <section className="ab-section" aria-labelledby="m-class" style={{ gap: 14 }}><h2 id="m-class">분류 기준</h2>
        {METHOD_CLASSES.map(([name, desc]) => <div key={name}><h3>{name}</h3><p>{desc}</p></div>)}
      </section>
      <section className="ab-section" aria-labelledby="m-limit"><h2 id="m-limit">알아 두면 좋은 점</h2>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {METHOD_LIMITS.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
    </main>
  </div>;
}
