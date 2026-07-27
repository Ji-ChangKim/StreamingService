import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Globe, 
  PlusCircle, 
  ShieldCheck, 
  Tv, 
  Clock, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Download,
  UserCheck
} from 'lucide-react';
import { CLIENT_VERSION, fetchWithVersion } from './config';

interface DebutEvent {
  id: string;
  title: string;
  type: string;
  creator: {
    id: string;
    slug: string;
    displayName: string;
    avatarUrl: string;
    agency: string;
    countryCode: string;
    languages: string[];
  };
  startAtUtc: string;
  originalTimezone: string;
  status: string;
  verificationStatus: string;
  lastVerifiedAt: string;
  links: { platform: string; url: string; isPrimary: boolean }[];
  description: string;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'studio' | 'admin'>('calendar');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Seoul');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [events, setEvents] = useState<DebutEvent[]>([]);
  const [serverVersion, setServerVersion] = useState<string>('v0.1.0-latest');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Form State for Studio Submit
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCreatorName, setFormCreatorName] = useState<string>('');
  const [formPlatform, setFormPlatform] = useState<string>('CHZZK');
  const [formWatchUrl, setFormWatchUrl] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formTime, setFormTime] = useState<string>('20:00');
  const [formTimezone, setFormTimezone] = useState<string>('Asia/Seoul');
  const [formDesc, setFormDesc] = useState<string>('');

  useEffect(() => {
    // Load Server Version & Events
    fetchWithVersion('/system/version')
      .then((data) => {
        if (data?.serverVersion) setServerVersion(data.serverVersion);
      })
      .catch(() => {});

    fetchWithVersion('/events')
      .then((data) => {
        if (data?.events) setEvents(data.events);
      })
      .catch(() => {});
  }, []);

  // Filter events based on Platform & Search Query
  const filteredEvents = events.filter((evt) => {
    const matchPlatform = selectedPlatform === 'ALL' || evt.links.some((l) => l.platform === selectedPlatform);
    const matchSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        evt.creator.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPlatform && matchSearch;
  });

  const formatLocalTime = (utcIso: string, tz: string) => {
    try {
      const date = new Date(utcIso);
      return new Intl.DateTimeFormat('ko-KR', {
        timeZone: tz,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch {
      return utcIso;
    }
  };

  const handleDownloadICS = (evt: DebutEvent) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//V-DEBUT HUB//DEBUT CALENDAR//KO
BEGIN:VEVENT
UID:${evt.id}@v-debut-hub.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(evt.startAtUtc).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:[V-DEBUT] ${evt.creator.displayName} 데뷔 라이브
DESCRIPTION:${evt.description}
URL:${evt.links[0]?.url || 'https://v-debut-hub.com'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${evt.creator.slug}_debut.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const utcDate = new Date(`${formDate}T${formTime}:00`).toISOString();
    
    try {
      const res = await fetchWithVersion('/events', {
        method: 'POST',
        body: JSON.stringify({
          title: formTitle,
          displayName: formCreatorName,
          startAtUtc: utcDate,
          originalTimezone: formTimezone,
          links: [{ platform: formPlatform, url: formWatchUrl, isPrimary: true }],
          description: formDesc
        })
      });

      alert(res.message || '데뷔 일정이 성공적으로 제출되었습니다!');
      setShowSubmitModal(false);
      // reload events
      const updated = await fetchWithVersion('/events');
      if (updated?.events) setEvents(updated.events);
    } catch (err) {
      alert('제출 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation */}
      <header className="glass-panel" style={{ margin: '16px 24px', padding: '16px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              V
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(90deg, #F1F5F9, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                V-DEBUT HUB
              </h1>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>글로벌 VTuber 데뷔 캘린더</span>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
            <button 
              className={activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setActiveTab('calendar')}
            >
              <CalendarIcon size={18} /> 캘린더 발견
            </button>
            <button 
              className={activeTab === 'studio' ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setActiveTab('studio')}
            >
              <PlusCircle size={18} /> 일정 등록 (Studio)
            </button>
            <button 
              className={activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'} 
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={18} /> 검수 큐 (Admin)
            </button>
          </nav>
        </div>

        {/* Global Timezone Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={18} color="#06B6D4" />
          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>내 시간대:</span>
          <select 
            value={selectedTimezone} 
            onChange={(e) => setSelectedTimezone(e.target.value)}
            style={{ background: 'var(--bg-card)', color: '#F1F5F9', border: '1px solid var(--border-glass)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            <option value="Asia/Seoul">KST (Asia/Seoul)</option>
            <option value="America/Los_Angeles">PST/PDT (US West)</option>
            <option value="America/New_York">EST/EDT (US East)</option>
            <option value="Asia/Tokyo">JST (Tokyo)</option>
            <option value="UTC">UTC (Universal)</option>
          </select>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '0 24px 32px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        
        {/* Banner Announcement */}
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9' }}>✨ 새로운 VTuber의 첫 등장의 순간을 함께하세요</h2>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '4px' }}>
              공식 소유권 검증 및 현지 시간 자동 변환으로 최적의 시청 경험을 제공합니다.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowSubmitModal(true)}>
            <PlusCircle size={18} /> 내 데뷔 일정 등록하기
          </button>
        </div>

        {/* Tab 1: Calendar Discovery */}
        {activeTab === 'calendar' && (
          <div>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '240px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  placeholder="VTuber 이름, 별칭, 에이전시 검색..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 40px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: '#F1F5F9' }}
                />
              </div>

              {/* Platform Selector Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'YOUTUBE', 'TWITCH', 'CHZZK', 'SOOP'].map((plat) => (
                  <button
                    key={plat}
                    className={selectedPlatform === plat ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setSelectedPlatform(plat)}
                    style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredEvents.map((evt) => (
                <div 
                  key={evt.id} 
                  className="glass-panel" 
                  style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', overflow: 'hidden' }}
                >
                  {/* Status Badge Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {evt.status === 'LIVE' ? (
                      <span className="badge badge-live">🔴 LIVE 진행 중</span>
                    ) : (
                      <span className="badge badge-official">📅 예정됨 ({evt.type})</span>
                    )}

                    {evt.verificationStatus === 'OWNER_VERIFIED' && (
                      <span className="badge badge-owner"><ShieldCheck size={12} /> Owner Verified</span>
                    )}
                    {evt.verificationStatus === 'OFFICIAL_SOURCE' && (
                      <span className="badge badge-official"><CheckCircle2 size={12} /> Official Source</span>
                    )}
                  </div>

                  {/* Creator Info Header */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img 
                      src={evt.creator.avatarUrl} 
                      alt={evt.creator.displayName} 
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9' }}>{evt.creator.displayName}</h3>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                        소속: {evt.creator.agency} • 언어: {evt.creator.languages.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Event Title & Local Time */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '8px' }}>{evt.title}</h4>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#06B6D4" />
                      <span>{formatLocalTime(evt.startAtUtc, selectedTimezone)} ({selectedTimezone})</span>
                    </div>
                  </div>

                  {/* Description Snippet */}
                  <p style={{ fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {evt.description}
                  </p>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                    {evt.links[0] && (
                      <a 
                        href={evt.links[0].url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-primary" 
                        style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem' }}
                      >
                        <Tv size={16} /> {evt.links[0].platform} 방송 보러 가기 <ExternalLink size={14} />
                      </a>
                    )}
                    <button 
                      className="btn-secondary" 
                      onClick={() => handleDownloadICS(evt)}
                      title="내 캘린더에 추가 (.ics)"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Studio Submit Intro */}
        {activeTab === 'studio' && (
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <UserCheck size={48} color="#8B5CF6" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Creator Studio - 데뷔 일정 등록</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
              신입 VTuber 및 에이전시 담당자분들은 공식 채널 소유권 검증 후 캘린더에 데뷔 라이브를 노출할 수 있습니다. 글로벌 현지 시간 자동 변환 및 알림 캘린더가 지원됩니다.
            </p>
            <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }} onClick={() => setShowSubmitModal(true)}>
              <PlusCircle size={20} /> 6단계 등록 폼 작성 시작
            </button>
          </div>
        )}

        {/* Tab 3: Admin Review Queue */}
        {activeTab === 'admin' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#06B6D4" /> 운영자 검수 큐 (Admin Review Queue)
            </h2>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-glass)' }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>체리 (Cheri) Chzzk Debut</h4>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>제출자: 체리 • 증거: https://chzzk.naver.com/live/cheri_channel</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>승인 (Publish)</button>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>보완 요청</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal for Submitting New Event */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px', borderRadius: '20px', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>V-DEBUT HUB 데뷔 일정 제출</h3>
            <form onSubmit={handleSubmitEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>활동명 (VTuber Display Name)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="예: 나비야" 
                  value={formCreatorName} 
                  onChange={(e) => setFormCreatorName(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>데뷔 방송 제목</label>
                <input 
                  type="text" 
                  required 
                  placeholder="예: [첫 방송] 신입 버튜버 나비야 데뷔 라이브" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>방송 플랫폼</label>
                  <select 
                    value={formPlatform} 
                    onChange={(e) => setFormPlatform(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="CHZZK">CHZZK</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="TWITCH">Twitch</option>
                    <option value="SOOP">SOOP</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>기준 시간대 (IANA)</label>
                  <select 
                    value={formTimezone} 
                    onChange={(e) => setFormTimezone(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>데뷔 날짜</label>
                  <input 
                    type="date" 
                    required 
                    value={formDate} 
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>데뷔 시간</label>
                  <input 
                    type="time" 
                    required 
                    value={formTime} 
                    onChange={(e) => setFormTime(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>방송 URL</label>
                <input 
                  type="url" 
                  required 
                  placeholder="https://chzzk.naver.com/live/..." 
                  value={formWatchUrl} 
                  onChange={(e) => setFormWatchUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>소개 및 데뷔 정보</label>
                <textarea 
                  rows={3} 
                  placeholder="데뷔 방송 소개를 입력하세요." 
                  value={formDesc} 
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  제출 및 검수 요청
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowSubmitModal(false)}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Status Footer */}
      <footer className="glass-panel" style={{ margin: 'auto 24px 16px 24px', padding: '12px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94A3B8' }}>
        <div>
          V-DEBUT HUB © 2026 • Platform Status: <span style={{ color: '#22D3EE' }}>Operational</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Client Version: <strong style={{ color: '#F1F5F9' }}>{CLIENT_VERSION}</strong></span>
          <span>Server Version: <strong style={{ color: '#F1F5F9' }}>{serverVersion}</strong></span>
        </div>
      </footer>
    </div>
  );
}

export default App;
