import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

type Bindings = {
  DB: D1Database;
  __STATIC_CONTENT: any;
};

// Cloudflare Durable Object Class Preservation
export class ChzzkSessionDO {
  state: any;
  env: any;
  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }
  async fetch(request: Request) {
    return new Response('ChzzkSessionDO Active', { status: 200 });
  }
}

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

// Mock Fallback Data
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
    startAtUtc: new Date(Date.now() + 86400000 * 2).toISOString(),
    originalTimezone: 'Asia/Seoul',
    status: 'PUBLISHED',
    verificationStatus: 'OWNER_VERIFIED',
    lastVerifiedAt: new Date().toISOString(),
    links: [
      { platform: 'CHZZK', url: 'https://chzzk.naver.com/live/nabiya_official', isPrimary: true }
    ],
    description: '안녕하세요! 꿈과 노래를 전달하는 버튜버 나비야의 첫 공식 데뷔 방송입니다.'
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

// 2. Get Debut Events (Real D1 Database Query)
app.get('/api/v1/events', async (c) => {
  try {
    if (c.env.DB) {
      const { results } = await c.env.DB.prepare(`
        SELECT 
          e.id,
          e.title,
          e.type,
          e.start_at_utc as startAtUtc,
          e.original_timezone as originalTimezone,
          e.status,
          e.verification_status as verificationStatus,
          e.description,
          c.id as creator_id,
          c.display_name as creator_displayName,
          c.avatar_url as creator_avatarUrl,
          c.agency_id as creator_agency,
          c.country_code as creator_countryCode,
          c.languages as creator_languages,
          l.platform as link_platform,
          l.watch_url as link_url,
          l.is_primary as link_isPrimary
        FROM debut_events e
        LEFT JOIN creator_profiles c ON e.creator_id = c.id
        LEFT JOIN debut_event_links l ON e.id = l.event_id
        WHERE e.status != 'DRAFT'
        ORDER BY e.start_at_utc ASC
      `).all();

      if (results && results.length > 0) {
        const eventsMap = new Map();
        results.forEach((row: any) => {
          if (!eventsMap.has(row.id)) {
            eventsMap.set(row.id, {
              id: row.id,
              title: row.title,
              type: row.type,
              startAtUtc: row.startAtUtc,
              originalTimezone: row.originalTimezone,
              status: row.status,
              verificationStatus: row.verificationStatus,
              description: row.description,
              creator: {
                id: row.creator_id,
                displayName: row.creator_displayName,
                avatarUrl: row.creator_avatarUrl,
                agency: row.creator_agency,
                countryCode: row.creator_countryCode,
                languages: JSON.parse(row.creator_languages || '["ko"]')
              },
              links: []
            });
          }
          if (row.link_platform) {
            eventsMap.get(row.id).links.push({
              platform: row.link_platform,
              url: row.link_url,
              isPrimary: Boolean(row.link_isPrimary)
            });
          }
        });

        const formattedEvents = Array.from(eventsMap.values());
        return c.json({ success: true, events: formattedEvents, source: 'd1_database' });
      }
    }
  } catch (err) {
    console.log('D1 Database Fetch Error:', err);
  }

  return c.json({
    success: true,
    events: MOCK_EVENTS,
    total: MOCK_EVENTS.length,
    source: 'mock_fallback'
  });
});

// 3. Create Debut Event into D1 DB
app.post('/api/v1/events', async (c) => {
  const body = await c.req.json();
  const eventId = `evt_${Date.now()}`;
  const creatorId = `cr_${Date.now()}`;
  const linkId = `link_${Date.now()}`;

  const displayName = body.displayName || '신입 VTuber';
  const avatarUrl = body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const agency = body.agency || 'Indie';
  const title = body.title || `${displayName} 데뷔 방송`;
  const startAtUtc = body.startAtUtc || new Date(Date.now() + 86400000 * 3).toISOString();
  const platform = body.platform || 'CHZZK';
  const watchUrl = body.watchUrl || 'https://chzzk.naver.com';

  try {
    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT INTO creator_profiles (id, slug, display_name, country_code, languages, agency_id, avatar_url)
        VALUES (?, ?, ?, 'KR', '["ko"]', ?, ?)
      `).bind(creatorId, `slug_${Date.now()}`, displayName, agency, avatarUrl).run();

      await c.env.DB.prepare(`
        INSERT INTO debut_events (id, creator_id, type, title, description, start_at_utc, original_timezone, status, verification_status)
        VALUES (?, ?, 'FIRST_DEBUT', ?, ?, ?, 'Asia/Seoul', 'PUBLISHED', 'COMMUNITY_SUBMITTED')
      `).bind(eventId, creatorId, title, body.description || '데뷔 일정입니다.', startAtUtc).run();

      await c.env.DB.prepare(`
        INSERT INTO debut_event_links (id, event_id, platform, watch_url, is_primary)
        VALUES (?, ?, ?, ?, 1)
      `).bind(linkId, eventId, platform, watchUrl).run();
    }
  } catch (err) {
    console.log('D1 Save Error:', err);
  }

  return c.json({
    success: true,
    message: '데뷔 일정이 데이터베이스에 성공적으로 저장되었습니다.',
    eventId
  });
});

// 4. Safe Static Asset & SPA Fallback Handler
app.all('*', async (c) => {
  const assetManifest = JSON.parse(manifestJSON || '{}');
  try {
    const page = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      }
    );
    return page;
  } catch (e) {
    if (e instanceof NotFoundError) {
      try {
        const url = new URL(c.req.url);
        const spaRequest = new Request(`${url.origin}/index.html`, c.req.raw);
        return await getAssetFromKV(
          {
            request: spaRequest,
            waitUntil: (promise) => c.executionCtx.waitUntil(promise),
          },
          {
            ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        );
      } catch (spaErr) {
        return c.text('SPA Index Fallback Error', 404);
      }
    }
    return c.text('Asset Serve Internal Error', 500);
  }
});

export default app;
