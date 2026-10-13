import React from 'react';
import ReactDOM from 'react-dom/client';
import { PortalApp } from './portal/PortalApp';
import './index.css';

// 개발 전용 진입점은 운영 앱과 도메인 선택용 추가 다운로드를 거치지 않는다.
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><PortalApp /></React.StrictMode>);

// 배포 직후 이전 화면이 삭제된 청크를 요청하면 1분에 한 번만 새 셸로 복구한다.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const previous = Number(sessionStorage.getItem('vd-chunk-reload')) || 0;
    if (Date.now() - previous < 60000) return;
    sessionStorage.setItem('vd-chunk-reload', String(Date.now()));
    event.preventDefault();
    window.location.reload();
  } catch { /* 저장소가 차단된 경우 오류 화면의 복구 동작을 사용한다. */ }
});
