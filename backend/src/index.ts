import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import { fetchEventsFromD1, insertEventToD1, updateEventInD1, MOCK_EVENTS } from './services/eventDbService';
import { fetchPlatformProfile } from './services/platformApiService';
import { fetchCreatorProfileBySlug, fetchAllCreatorSlugs, updateCreatorProfileInD1, deleteCreatorProfileFromD1 } from './services/creatorDbService';
import { runDebutCrawlerProcess } from './services/debutCrawlerService';
import { validateDebutEventPayload } from './services/eventValidationService';
import { verifyAdminLogin, validateAdminToken } from './services/adminAuthService';
import {
  createSubmissionToD1,
  fetchSubmissionsFromD1,
  approveSubmissionInD1,
  rejectSubmissionInD1,
  deleteSubmissionFromD1,
  fetchAllActiveStreamersForAdmin,
} from './services/submissionDbService';

type Bindings = {
  DB: D1Database;
  __STATIC_CONTENT: any;
  CRAWLER_SECRET?: string;
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

// Dynamic Sitemap XML Generator Handler
const sitemapXmlHandler = async (c: any) => {
  const baseUrl = 'https://vdebut.live';
  const todayStr = new Date().toISOString().split('T')[0];
  const creators = await fetchAllCreatorSlugs(c.env.DB || null);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  // 1. Home / Landing Page
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/?lang=ko" />\n`;
  xml += `    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/?lang=ja" />\n`;
  xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en" />\n`;
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />\n`;
  xml += `    <lastmod>${todayStr}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Language variations
  ['ko', 'ja', 'en'].forEach((lang) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/?lang=${lang}</loc>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/?lang=ko" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/?lang=ja" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en" />\n`;
    xml += `    <lastmod>${todayStr}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;
  });

  // 3. Upload Page (/upload)
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/upload</loc>\n`;
  xml += `    <lastmod>${todayStr}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;

  // 4. Dynamic Creator Profiles (/creator/:slug)
  creators.forEach((item) => {
    const modDate = item.updatedAt || todayStr;
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/creator/${encodeURIComponent(item.slug)}</loc>\n`;
    xml += `    <lastmod>${modDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};

app.get('/sitemap.xml', sitemapXmlHandler);
app.get('/api/v1/sitemap.xml', sitemapXmlHandler);


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

  c.header('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');

  return c.json({
    success: true,
    events: allEvents,
    total: allEvents.length,
    source: dbEvents.length > 0 ? 'd1_database_merged' : 'mock_fallback'
  });
});

// 3. Create Debut Submission (Pending Queue - 100% Protected from direct calendar spam)
app.post('/api/v1/submissions', async (c) => {
  if (!c.env.DB) {
    return c.json({
      success: false,
      message: 'D1 database binding is not configured.',
    }, 503);
  }

  try {
    const body = await c.req.json();

    // 엄격한 입력값 유효성 검증
    const validation = validateDebutEventPayload(body);
    if (!validation.isValid) {
      return c.json({
        success: false,
        message: validation.errorMessage || '입력값이 올바르지 않습니다.',
      }, 400);
    }

    const submissionId = await createSubmissionToD1(c.env.DB, body);

    return c.json({
      success: true,
      message: '데뷔 일정 신청서가 정상 접수되었습니다. 운영자 검토 후 캘린더에 정식 반영됩니다.',
      submissionId,
    });
  } catch (err: any) {
    console.error('Create submission failed:', err);
    return c.json({
      success: false,
      message: '데뷔 일정 신청서 저장에 실패했습니다.',
      error: err?.message || 'unknown_error',
    }, 500);
  }
});

// Legacy POST /api/v1/events (신청서 대기열로 안전하게 통합 처리)
app.post('/api/v1/events', async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, message: 'D1 database binding is not configured.' }, 503);
  }
  try {
    const body = await c.req.json();
    const validation = validateDebutEventPayload(body);
    if (!validation.isValid) {
      return c.json({ success: false, message: validation.errorMessage || '입력값이 올바르지 않습니다.' }, 400);
    }
    const submissionId = await createSubmissionToD1(c.env.DB, body);
    return c.json({
      success: true,
      message: '데뷔 일정 신청서가 정상 접수되었습니다. 운영자 검토 후 캘린더에 정식 반영됩니다.',
      submissionId,
      eventId: `sub_${submissionId}`
    });
  } catch (err: any) {
    return c.json({ success: false, message: '신청서 접수에 실패했습니다.', error: err?.message }, 500);
  }
});

// ==========================================
// 🛡️ ADMIN CMS ENDPOINTS (보안 인증 & 승인 관리)
// ==========================================

// 1. 관리자 로그인 (ID: Vdebut.admin / PW: Vdebut1#)
app.post('/api/v1/admin/login', async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, error: 'Database binding unavailable' }, 500);
  }
  try {
    const body = await c.req.json().catch(() => ({}));
    const username = body.username || '';
    const password = body.password || '';

    const result = await verifyAdminLogin(c.env.DB, username, password);
    if (!result.success) {
      return c.json({ success: false, error: result.error || '로그인 실패' }, 401);
    }

    return c.json({
      success: true,
      message: '관리자 로그인에 성공했습니다.',
      token: result.token,
      username
    });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message || '로그인 오류' }, 500);
  }
});

// 2. 관리자 신청서 목록 조회 (PENDING / APPROVED / REJECTED / ALL)
app.get('/api/v1/admin/submissions', async (c) => {
  if (!c.env.DB) return c.json({ success: false, error: 'Database unavailable' }, 500);

  const authHeader = c.req.header('Authorization') || c.req.header('X-Admin-Token') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAuthed = await validateAdminToken(token);
  if (!isAuthed) {
    return c.json({ success: false, error: 'Unauthorized: 관리자 인증이 필요합니다.' }, 401);
  }

  const status = c.req.query('status') || 'PENDING';
  const list = await fetchSubmissionsFromD1(c.env.DB, status);
  return c.json({ success: true, submissions: list, total: list.length });
});

// 3. 관리자 1-클릭 승인 (debut_submissions ➔ streamerChannel & streamerChannel_info)
app.post('/api/v1/admin/submissions/:id/approve', async (c) => {
  if (!c.env.DB) return c.json({ success: false, error: 'Database unavailable' }, 500);

  const authHeader = c.req.header('Authorization') || c.req.header('X-Admin-Token') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAuthed = await validateAdminToken(token);
  if (!isAuthed) {
    return c.json({ success: false, error: 'Unauthorized: 관리자 인증이 필요합니다.' }, 401);
  }

  const subId = parseInt(c.req.param('id'), 10);
  if (isNaN(subId)) return c.json({ success: false, error: '올바른 ID가 아닙니다.' }, 400);

  const body = await c.req.json().catch(() => ({}));
  const customSlug = body.customSlug;

  const result = await approveSubmissionInD1(c.env.DB, subId, customSlug);
  return c.json({
    success: result.success,
    message: result.success ? `신청서가 승인되어 /creator/${result.slug} 주소로 캘린더에 즉시 발행되었습니다!` : '승인 처리에 실패했습니다.',
    error: result.error,
    eventId: result.eventId,
    slug: result.slug
  });
});

// 4. 관리자 반려 처리
app.post('/api/v1/admin/submissions/:id/reject', async (c) => {
  if (!c.env.DB) return c.json({ success: false, error: 'Database unavailable' }, 500);

  const authHeader = c.req.header('Authorization') || c.req.header('X-Admin-Token') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAuthed = await validateAdminToken(token);
  if (!isAuthed) {
    return c.json({ success: false, error: 'Unauthorized: 관리자 인증이 필요합니다.' }, 401);
  }

  const subId = parseInt(c.req.param('id'), 10);
  const body = await c.req.json().catch(() => ({}));
  const ok = await rejectSubmissionInD1(c.env.DB, subId, body.adminNote);
  return c.json({ success: ok, message: ok ? '신청서가 반려 처리되었습니다.' : '반려 처리에 실패했습니다.' });
});

// 5. 관리자 신청서 삭제
app.delete('/api/v1/admin/submissions/:id', async (c) => {
  if (!c.env.DB) return c.json({ success: false, error: 'Database unavailable' }, 500);

  const authHeader = c.req.header('Authorization') || c.req.header('X-Admin-Token') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAuthed = await validateAdminToken(token);
  if (!isAuthed) {
    return c.json({ success: false, error: 'Unauthorized: 관리자 인증이 필요합니다.' }, 401);
  }

  const subId = parseInt(c.req.param('id'), 10);
  const ok = await deleteSubmissionFromD1(c.env.DB, subId);
  return c.json({ success: ok, message: ok ? '신청서가 삭제되었습니다.' : '삭제에 실패했습니다.' });
});

// 6. 관리자 CMS 전체 등록 버튜버 목록 조회
app.get('/api/v1/admin/streamers', async (c) => {
  if (!c.env.DB) return c.json({ success: false, error: 'Database unavailable' }, 500);

  const authHeader = c.req.header('Authorization') || c.req.header('X-Admin-Token') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAuthed = await validateAdminToken(token);
  if (!isAuthed) {
    return c.json({ success: false, error: 'Unauthorized: 관리자 인증이 필요합니다.' }, 401);
  }

  const streamers = await fetchAllActiveStreamersForAdmin(c.env.DB);
  return c.json({ success: true, streamers, total: streamers.length });
});

// 7. 관리자 CMS 버튜버 1-클릭 캘린더 삭제
app.delete('/api/v1/admin/streamers/:slug', async (c) => {
  if (!c.env.DB) return c.json({ success: false, error: 'Database unavailable' }, 500);

  const authHeader = c.req.header('Authorization') || c.req.header('X-Admin-Token') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAuthed = await validateAdminToken(token);
  if (!isAuthed) {
    return c.json({ success: false, error: 'Unauthorized: 관리자 인증이 필요합니다.' }, 401);
  }

  const slug = c.req.param('slug');
  const ok = await deleteCreatorProfileFromD1(c.env.DB, slug);
  return c.json({
    success: ok,
    message: ok ? '스트리머가 캘린더에서 완전히 삭제되었습니다.' : '스트리머 삭제에 실패했습니다.'
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

// Update Creator Profile API Endpoint
app.put('/api/v1/creator/:slug', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();
  const ok = await updateCreatorProfileInD1(c.env.DB || null, slug, body);

  return c.json({
    success: ok,
    message: ok ? '크리에이터 프로필이 성공적으로 수정되었습니다.' : '프로필 수정에 실패했습니다.'
  });
});

// Delete Creator Profile API Endpoint
app.delete('/api/v1/creator/:slug', async (c) => {
  const slug = c.req.param('slug');
  const ok = await deleteCreatorProfileFromD1(c.env.DB || null, slug);

  return c.json({
    success: ok,
    message: ok ? '크리에이터 프로필이 성공적으로 삭제되었습니다.' : '프로필 삭제에 실패했습니다.'
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

// 7.8 Dynamic SEO Meta Injection & Strict Noindex for /admin (CMS Console)
app.get('/admin', async (c) => {
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
    html = html.replace(/<title>.*?<\/title>/, `<title>V-DEBUT HUB CMS Console</title>`);
    html = html.replace('</head>', `<meta name="robots" content="noindex, nofollow, noarchive" /></head>`);

    c.header('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return c.html(html);
  } catch (e: any) {
    return c.text(`SPA Asset Error: ${e?.message || 'Asset NotFound'}`, 404);
  }
});

// 9. Admin Crawler Web Search & Email Report Manual Trigger
app.post('/api/v1/admin/crawler/run', async (c) => {
  try {
    const crawlerSecret = c.env.CRAWLER_SECRET;
    const requestSecret = c.req.header('X-Crawler-Secret') || c.req.header('x-crawler-secret');
    
    // CRAWLER_SECRET이 설정되어 있는 경우, 헤더 비밀키와 일치 여부 검증
    if (crawlerSecret && requestSecret !== crawlerSecret) {
      return c.json({ success: false, error: 'Unauthorized: Invalid crawler secret key' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const recipient = body.recipientEmail || 'kimjichang1234@gmail.com';
    const result = await runDebutCrawlerProcess(c.env.DB || null, recipient);
    return c.json({
      success: true,
      message: '자동 웹서치 수집 및 이메일 리포트 발송 프로세스가 성공적으로 수행되었습니다.',
      result
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || '크롤러 실행 중 오류 발생' }, 500);
  }
});

// 10. Admin Crawler Logs History Fetch API
app.get('/api/v1/admin/crawler/logs', async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, error: 'Database binding unavailable' }, 500);
  }
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM crawler_update_logs ORDER BY run_at DESC LIMIT 50`).all();
    return c.json({
      success: true,
      logs: results || []
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 11. Safe Static Asset & SPA Fallback Handler
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

// Cloudflare Workers Scheduled Cron Handler (매일 오전 09:00 KST 정기 웹서치 자동 1회 수행)
export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Bindings, ctx: any) {
    ctx.waitUntil(
      runDebutCrawlerProcess(env.DB || null, 'kimjichang1234@gmail.com')
        .then((res) => console.log('[Scheduled Cron] Debut search & email report success:', res.totalCrawledCount))
        .catch((err) => console.error('[Scheduled Cron] Error:', err))
    );
  }
};
