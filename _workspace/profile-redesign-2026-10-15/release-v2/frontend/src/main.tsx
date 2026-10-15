import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 도메인에 필요한 화면 묶음만 불러온다.
const App = React.lazy(() => import('./App.tsx').then((module) => ({ default: module.App })));
const PortalApp = React.lazy(() => import('./portal/PortalApp').then((module) => ({ default: module.PortalApp })));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense fallback={<p style={{ padding: 40, textAlign: 'center', color: '#718198' }}>VDébut 화면을 불러오고 있어요.</p>}>
      {/* 개발 도메인에서 새 플랫폼의 전체 화면을 검토한다. */}
      {window.location.hostname === 'dev.vdebut.live' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? <PortalApp /> : <App />}
    </React.Suspense>
  </React.StrictMode>,
)
