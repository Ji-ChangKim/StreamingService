import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import { fetchEventsFromD1, insertEventToD1, updateEventInD1, MOCK_EVENTS } from './services/eventDbService';
import { fetchPlatformProfile } from './services/platformApiService';
import { fetchCreatorProfileBySlug } from './services/creatorDbService';

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
  if (!c.env.DB) {
    return c.json({
      success: false,
      message: 'D1 database binding is not configured.',
    }, 503);
  }

  try {
    const body = await c.req.json();
    const eventId = await insertEventToD1(c.env.DB, body);

    return c.json({
      success: true,
      message: '데뷔 일정이 데이터베이스에 저장되었습니다.',
      eventId,
    });
  } catch (err: any) {
    console.error('Create event failed:', err);
    return c.json({
      success: false,
      message: '데뷔 일정 저장에 실패했습니다.',
      error: err?.message || 'unknown_error',
    }, 500);
  }
});
// 3.5 Update Debut Event in D1 DB
app.put('/api/v1/events/:id', async (c) => {
  const eventId = c.req.param('id');
  const body = await c.req.json();
  let updated = false;

  if (c.env.DB && eventId) {
    updated = await updateEventInD1(c.env.DB, eventId, body);
  }

  return c.json({
    success: updated,
    message: updated ? '데뷔 일정이 수정되었습니다.' : '수정에 실패했습니다.',
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

// 5. Creator Profile API Endpoint
app.get('/api/v1/creator/:slug', async (c) => {
  const slug = c.req.param('slug');
  const creator = await fetchCreatorProfileBySlug(c.env.DB || null, slug);

  if (!creator) {
    return c.json({
      success: false,
      error: '해당 크리에이터 프로필을 찾을 수 없습니다.'
    }, 404);
  }

  return c.json({
    success: true,
    creator
  });
});

// 6. Dynamic Sitemap XML for SEO
app.get('/sitemap.xml', async (c) => {
  const slugs = ['arongtti'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vdebut.live/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${slugs.map((slug) => `
  <url>
    <loc>https://vdebut.live/creator/${slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`;

  return c.text(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8'
  });
});

// 7. Dynamic SEO Meta Injection for /creator/:slug
app.get('/creator/:slug', async (c) => {
  const slug = c.req.param('slug');
  const creator = await fetchCreatorProfileBySlug(c.env.DB || null, slug);

  const title = creator
    ? `${creator.displayName} 버튜버 프로필·데뷔 일정 | VDébut`
    : `버튜버 프로필 | VDébut`;

  const description = creator
    ? (creator.description || `${creator.displayName} 버튜버의 프로필과 데뷔 방송 일정 및 활동 채널 정보입니다.`)
    : `버튜버 프로필 및 데뷔 방송 일정을 확인하세요.`;

  const imageUrl = creator?.profileImageUrl || 'https://vdebut.live/og-image.png';
  const canonicalUrl = `https://vdebut.live/creator/${slug}`;

  // Schema.org JSON-LD (ProfilePage & Person)
  const jsonLd = creator
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        'mainEntity': {
          '@type': 'Person',
          'name': creator.displayName,
          'alternateName': creator.displayName,
          'description': description,
          'image': imageUrl,
          'url': canonicalUrl,
          'sameAs': creator.channels.map((ch) => ch.channelUrl),
        },
      })
    : '';

  // SPA HTML 가져오기 후 Dynamic Meta/OG/JSON-LD 주입
  const assetManifest = JSON.parse(manifestJSON || '{}');
  try {
    const res = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: serveSinglePageApp,
      }
    );

    let html = await res.text();

    // Dynamically replace SEO elements in HTML head
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${title}" />`);
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${imageUrl}" />`);

    if (jsonLd) {
      html = html.replace('</head>', `<script type="application/ld+json">${jsonLd}</script></head>`);
    }

    return c.html(html);
  } catch (e: any) {
    return c.text(`SPA Asset Error: ${e?.message || 'Asset NotFound'}`, 404);
  }
});

// 7.5 Dynamic SEO Meta Injection for /upload
app.get('/upload', async (c) => {
  const title = `데뷔 일정 등록 | VDébut - 버튜버 데뷔 일정 신청`;
  const description = `신입 버튜버 데뷔 일정을 VDébut 캘린더에 자유롭게 등록하고 공식 소식을 전하세요.`;
  const canonicalUrl = `https://vdebut.live/upload`;

  const assetManifest = JSON.parse(manifestJSON || '{}');
  try {
    const res = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: serveSinglePageApp,
      }
    );

    let html = await res.text();

    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${title}" />`);
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);

    return c.html(html);
  } catch (e: any) {
    return c.text(`SPA Asset Error: ${e?.message || 'Asset NotFound'}`, 404);
  }
});

// 8. Safe Static Asset & SPA Fallback Handler
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
        mapRequestToAsset: serveSinglePageApp,
      }
    );
  } catch (e: any) {
    return c.text(`SPA Asset Error: ${e?.message || 'Asset NotFound'}`, 404);
  }
});

export default app;
