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

// 2. Get Debut Events (Real D1 Database Query with Fallback)
app.get('/api/v1/events', async (c) => {
  if (c.env.DB) {
    const dbEvents = await fetchEventsFromD1(c.env.DB);
    if (dbEvents && dbEvents.length > 0) {
      return c.json({ success: true, events: dbEvents, source: 'd1_database' });
    }
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
