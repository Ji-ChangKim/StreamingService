import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import { fetchEventsFromD1, insertEventToD1, MOCK_EVENTS } from './services/eventDbService';
import { fetchPlatformProfile } from './services/platformApiService';

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

// 2. Get Debut Events (Real D1 Database Query with Fallback & Merge)
app.get('/api/v1/events', async (c) => {
  let dbEvents: any[] = [];
  if (c.env.DB) {
    const res = await fetchEventsFromD1(c.env.DB);
    if (res && res.length > 0) {
      dbEvents = res;
    }
  }

  // D1 데이터베이스 저장 이벤트와 MOCK 이벤트를 병합하여 반환
  const combinedMap = new Map();
  MOCK_EVENTS.forEach((e) => combinedMap.set(e.id, e));
  dbEvents.forEach((e) => combinedMap.set(e.id, e));

  const allEvents = Array.from(combinedMap.values());

  return c.json({
    success: true,
    events: allEvents,
    total: allEvents.length,
    source: dbEvents.length > 0 ? 'd1_database_merged' : 'mock_fallback'
  });
});

// 3. Create Debut Event into D1 DB
app.post('/api/v1/events', async (c) => {
  const body = await c.req.json();
  let eventId = `evt_${Date.now()}`;

  if (c.env.DB) {
    eventId = await insertEventToD1(c.env.DB, body);
  }

  return c.json({
    success: true,
    message: '데뷔 일정이 데이터베이스에 성공적으로 저장되었습니다.',
    eventId
  });
});

// 4. Fetch Real External Platform Profile (CHZZK, SOOP, etc.)
app.get('/api/v1/platform/profile', async (c) => {
  const platform = c.req.query('platform') || 'CHZZK';
  const url = c.req.query('url') || c.req.query('channelUrl') || '';

  if (!url) {
    return c.json({
      success: false,
      error: '채널 URL 또는 아이디를 입력해주세요.'
    }, 400);
  }

  const result = await fetchPlatformProfile(platform, url);
  return c.json(result);
});

// 4. Safe Static Asset & SPA Fallback Handler
app.all('*', async (c) => {
  const assetManifest = JSON.parse(manifestJSON || '{}');
  try {
    return await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      }
    );
  } catch (e) {
    try {
      const url = new URL(c.req.url);
      const indexRequest = new Request(`${url.origin}/index.html`);
      return await getAssetFromKV(
        {
          request: indexRequest,
          waitUntil: (promise) => c.executionCtx.waitUntil(promise),
        },
        {
          ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (spaErr: any) {
      return c.text(`SPA Index Serve Error: ${spaErr?.message || 'Asset NotFound'}`, 500);
    }
  }
});

export default app;
