import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('*', cors());

// Client Version Check Middleware
app.use('*', async (c, next) => {
  const clientVersion = c.req.header('X-Client-Version') || 'v0.1.0';
  c.header('X-Server-Version', 'v0.1.0-latest');
  c.header('X-Client-Version-Received', clientVersion);
  await next();
});

// Mock Initial Data for Demonstration when D1 is unpopulated
const MOCK_EVENTS = [
  {
    id: 'evt_01',
    title: '나비야 (Nabiya) 1st Global Debut Stream',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_01',
      slug: 'nabiya',
      displayName: '나비야 (Nabiya)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: 'Indie Creator',
      countryCode: 'KR',
      languages: ['ko', 'en']
    },
    startAtUtc: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days later
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'OWNER_VERIFIED',
    lastVerifiedAt: new Date().toISOString(),
    links: [
      { platform: 'CHZZK', url: 'https://chzzk.naver.com/live/nabiya_official', isPrimary: true },
      { platform: 'YOUTUBE', url: 'https://youtube.com/@nabiya_official', isPrimary: false }
    ],
    description: '안녕하세요! 꿈과 노래를 전달하는 버튜버 나비야의 첫 공식 데뷔 방송입니다. 글로벌 팬분들을 위해 한/영 동시 진행 예정입니다!'
  },
  {
    id: 'evt_02',
    title: 'Aria Eclipse Redebut & New Model Reveal',
    type: 'REDEBUT',
    creator: {
      id: 'cr_02',
      slug: 'aria-eclipse',
      displayName: 'Aria Eclipse',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      agency: 'V-PRO Project',
      countryCode: 'US',
      languages: ['en', 'ja']
    },
    startAtUtc: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days later
    originalTimezone: 'America/Los_Angeles',
    status: 'PUBLISHED',
    verificationStatus: 'OFFICIAL_SOURCE',
    lastVerifiedAt: new Date().toISOString(),
    links: [
      { platform: 'YOUTUBE', url: 'https://youtube.com/live/aria_debut_stream', isPrimary: true },
      { platform: 'TWITCH', url: 'https://twitch.tv/aria_eclipse', isPrimary: false }
    ],
    description: 'Welcome to Aria Eclipse 2.0 Redebut stream! Presenting brand new 2D live model & original song reveal.'
  },
  {
    id: 'evt_03',
    title: 'SOOP 신입 버튜버 [모카] 첫인사 라이브',
    type: 'FIRST_DEBUT',
    creator: {
      id: 'cr_03',
      slug: 'moka-soop',
      displayName: '모카 (Moka)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      agency: 'SOOP Stars',
      countryCode: 'KR',
      languages: ['ko']
    },
    startAtUtc: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours later
    originalTimezone: 'Asia/Seoul',
    status: 'LIVE',
    verificationStatus: 'OWNER_VERIFIED',
    lastVerifiedAt: new Date().toISOString(),
    links: [
      { platform: 'SOOP', url: 'https://sooplive.co.kr/moka', isPrimary: true }
    ],
    description: '오늘 저녁! 드디어 소프에서 첫 데뷔 라이브를 진행합니다. 함께 소통해요!'
  }
];

// 1. Health & System Version Check
app.get('/api/v1/system/version', (c) => {
  const clientVersion = c.req.header('X-Client-Version') || 'v0.1.0';
  return c.json({
    status: 'healthy',
    service: 'V-DEBUT HUB Backend',
    serverVersion: 'v0.1.0-latest',
    minSupportedClientVersion: 'v0.1.0',
    clientVersionReceived: clientVersion,
    isClientSupported: true,
    timestamp: new Date().toISOString()
  });
});

// 2. Get Debut Events (Calendar & List)
app.get('/api/v1/events', async (c) => {
  try {
    if (c.env.DB) {
      const { results } = await c.env.DB.prepare(
        `SELECT * FROM debut_events WHERE status != 'DRAFT' ORDER BY start_at_utc ASC`
      ).all();

      if (results && results.length > 0) {
        return c.json({ success: true, events: results });
      }
    }
  } catch (err) {
    console.log('D1 fallback to Mock:', err);
  }

  // Fallback to rich Mock data
  return c.json({
    success: true,
    events: MOCK_EVENTS,
    total: MOCK_EVENTS.length,
    source: 'mock_initial'
  });
});

// 3. Get Debut Event Detail
app.get('/api/v1/events/:id', (c) => {
  const id = c.req.param('id');
  const event = MOCK_EVENTS.find((e) => e.id === id) || MOCK_EVENTS[0];
  return c.json({ success: true, event });
});

// 4. Create Debut Event (Submit Studio)
app.post('/api/v1/events', async (c) => {
  const body = await c.req.json();
  const newEvent = {
    id: `evt_${Date.now()}`,
    title: body.title || '신규 VTuber 데뷔 방송',
    type: body.type || 'FIRST_DEBUT',
    creator: {
      id: `cr_${Date.now()}`,
      slug: body.slug || 'new-vtuber',
      displayName: body.displayName || '신입 VTuber',
      avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      agency: body.agency || '개인 (Indie)',
      countryCode: body.countryCode || 'KR',
      languages: body.languages || ['ko']
    },
    startAtUtc: body.startAtUtc || new Date(Date.now() + 86400000 * 3).toISOString(),
    originalTimezone: body.originalTimezone || 'Asia/Seoul',
    status: 'SUBMITTED', // Under review
    verificationStatus: 'UNVERIFIED',
    lastVerifiedAt: new Date().toISOString(),
    links: body.links || [{ platform: 'CHZZK', url: 'https://chzzk.naver.com', isPrimary: true }],
    description: body.description || '데뷔 일정 소개글입니다.'
  };

  return c.json({
    success: true,
    message: '데뷔 일정이 성공적으로 제출되었습니다. 운영 검수 후 메인 캘린더에 공개됩니다.',
    event: newEvent
  });
});

// 5. Admin Review Queue
app.get('/api/v1/admin/review', (c) => {
  return c.json({
    success: true,
    pendingCases: [
      {
        id: 'rev_101',
        eventId: 'evt_04',
        title: '체리 (Cheri) Chzzk Debut',
        creatorName: '체리 (Cheri)',
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        verificationStatus: 'UNVERIFIED',
        riskLevel: 'LOW',
        evidenceUrl: 'https://chzzk.naver.com/live/cheri_channel'
      }
    ]
  });
});

export default app;
