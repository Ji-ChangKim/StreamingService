import { sendDebutReportEmail } from './emailService';
import { fetchPlatformProfile } from './platformApiService';

export interface CrawledCreatorData {
  displayName: string;
  platform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH';
  debutDate: string; // YYYY-MM-DD
  debutTime?: string; // HH:mm
  channelUrl: string;
  xUrl?: string;
  agencyName?: string;
  profileImageUrl?: string;
  description?: string;
  isNew: boolean;
}

export interface CrawlerRunResult {
  success: boolean;
  runAt: string;
  totalCrawledCount: number;
  existingMatchedCount: number;
  newDiscoveredCount: number;
  emailSent: boolean;
  creators: CrawledCreatorData[];
  error?: string;
}

/**
 * 1. 외부 커뮤니티 & 시트 데이터 자동 웹서치/크롤링 파서
 */
export async function runDebutCrawlerProcess(db?: D1Database, recipientEmail: string = 'kimjichang1234@gmail.com', apiKey?: string): Promise<CrawlerRunResult> {
  const runAt = new Date().toISOString();
  console.log(`[Crawler] Starting Debut Auto Web Search & Sync at ${runAt}...`);

  const crawledList: CrawledCreatorData[] = [];

  try {
    // 1-A. 구글 시트 / 커뮤니티 데이터 크롤링
    const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38/export?format=csv&gid=1884409648';
    const response = await fetch(sheetCsvUrl);

    if (response.ok) {
      const csvText = await response.text();
      const lines = csvText.split('\n');

      for (let i = 5; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // CSV 단순 파싱
        const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length > 4) {
          const dateRaw = parts[1] || '';
          const hourRaw = parts[2] || '';
          const minRaw = parts[3] || '';
          const name = parts[4] || '';
          const channelUrl = parts[5] || '';
          const xId = parts[6] || '';

          if (name && dateRaw) {
            // 날짜 포맷 변환 (2026. 8. 1 -> 2026-08-01)
            let formattedDate = dateRaw.replace(/\s+/g, '').replace(/\./g, '-');
            if (formattedDate.endsWith('-')) {
              formattedDate = formattedDate.slice(0, -1);
            }
            const dateParts = formattedDate.split('-');
            if (dateParts.length === 3) {
              const y = dateParts[0];
              const m = dateParts[1].padStart(2, '0');
              const d = dateParts[2].padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
            }

            let formattedTime = '20:00';
            if (hourRaw) {
              const h = hourRaw.replace(/[^0-9]/g, '').padStart(2, '0');
              const m = minRaw.replace(/[^0-9]/g, '').padStart(2, '0') || '00';
              formattedTime = `${h}:${m}`;
            }

            let platform: 'CHZZK' | 'SOOP' | 'YOUTUBE' | 'TWITCH' = 'CHZZK';
            const lowerUrl = channelUrl.toLowerCase();
            if (lowerUrl.includes('sooplive') || lowerUrl.includes('afreeca')) {
              platform = 'SOOP';
            } else if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) {
              platform = 'YOUTUBE';
            } else if (lowerUrl.includes('twitch')) {
              platform = 'TWITCH';
            }

            let xUrl = xId;
            if (xId && !xId.startsWith('http')) {
              const cleanX = xId.replace(/^@/, '');
              xUrl = `https://x.com/${cleanX}`;
            }

            crawledList.push({
              displayName: name,
              platform,
              debutDate: formattedDate,
              debutTime: formattedTime,
              channelUrl: channelUrl || `https://chzzk.naver.com/search?query=${encodeURIComponent(name)}`,
              xUrl,
              agencyName: '개인세',
              isNew: false
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[Crawler] Fetch error:', err);
  }

  // 중복 체크 및 DB 갱신
  let existingMatchedCount = 0;
  let newDiscoveredCount = 0;

  if (db) {
    try {
      // D1 DB에서 기존 스트리머 목록 조회
      const { results: existingStreamers } = await db.prepare(`SELECT slug, display_name, channel_url FROM streamerChannel_info i INNER JOIN streamerChannel c ON i.channel_id = c.id`).all();
      const existingUrls = new Set((existingStreamers as any[]).map((s) => (s.channel_url || '').toLowerCase()));
      const existingNames = new Set((existingStreamers as any[]).map((s) => (s.display_name || '').toLowerCase()));

      for (const item of crawledList) {
        const isUrlMatched = item.channelUrl && existingUrls.has(item.channelUrl.toLowerCase());
        const isNameMatched = item.displayName && existingNames.has(item.displayName.toLowerCase());

        if (isUrlMatched || isNameMatched) {
          item.isNew = false;
          existingMatchedCount++;
        } else {
          item.isNew = true;
          newDiscoveredCount++;

          // 신규 스트리머 DB 자동 INSERT
          const cleanSlug = item.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `creator_${Date.now()}`;
          const profileInfo = await fetchPlatformProfile(item.platform, item.channelUrl);
          
          const chRes = await db.prepare(`INSERT INTO streamerChannel (platform, channel_url, channel_name) VALUES (?, ?, ?)`).bind(item.platform, item.channelUrl, item.displayName).run();
          const channelId = chRes.meta.last_row_id;

          const startAtUtc = new Date(`${item.debutDate}T${item.debutTime}:00+09:00`).toISOString();

          await db.prepare(`
            INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, x_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            channelId,
            cleanSlug,
            item.displayName,
            profileInfo.profileImageUrl || '',
            profileInfo.description || `${item.displayName}의 데뷔 방송입니다.`,
            item.agencyName || '개인세',
            item.debutDate,
            item.debutTime || '20:00',
            'Asia/Seoul',
            startAtUtc,
            item.xUrl || ''
          ).run();
        }
      }
    } catch (dbErr) {
      console.error('[Crawler] DB sync error:', dbErr);
    }
  } else {
    // DB가 전달되지 않은 테스트 환경
    existingMatchedCount = crawledList.length;
  }

  // 이메일 알림 전송 (kimjichang1234@gmail.com)
  let emailSent = false;
  try {
    const targetMonth = crawledList.length > 0 ? `${crawledList[0].debutDate.substring(0, 7)}월` : '이번 달';
    const emailRes = await sendDebutReportEmail(
      {
        recipientEmail,
        targetMonth,
        totalFound: crawledList.length,
        existingMatchedCount,
        newDiscoveredCount,
        creators: crawledList.map((c) => ({ ...c, isNew: !!c.isNew }))
      },
      apiKey
    );
    emailSent = emailRes.success;
  } catch (mailErr) {
    console.error('[Crawler] Email dispatch failed:', mailErr);
  }

  // crawler_update_logs DB에 결과 기록
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO crawler_update_logs (updated_count, updated_creators_json, email_sent)
        VALUES (?, ?, ?)
      `).bind(crawledList.length, JSON.stringify(crawledList), emailSent ? 1 : 0).run();
    } catch (logErr) {
      console.error('[Crawler] Log insert error:', logErr);
    }
  }

  return {
    success: true,
    runAt,
    totalCrawledCount: crawledList.length,
    existingMatchedCount,
    newDiscoveredCount,
    emailSent,
    creators: crawledList
  };
}
