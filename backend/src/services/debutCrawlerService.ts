import { sendDebutReportEmail } from './emailService';
import { fetchPlatformProfile } from './platformApiService';
import {
  calculateWeeklyAuditDateRange,
  isEligibleDebutForSync,
  getTodayKstDateString,
  type AuditDateRange,
} from './weeklyAuditRangeService';
import { generateCleanSlug, resolveUniqueSlug } from '../utils/slugUtils';
import { readCrawlerReportSource } from './crawlerReportSource';
import { parseCrawlerCsv } from './crawlerCsv';

export interface CrawledCreatorData {
  displayName: string;
  platform: 'CHZZK' | 'SOOP';
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
  auditRange: AuditDateRange;
  totalCrawledCount: number;
  existingMatchedCount: number;
  newDiscoveredCount: number;
  emailSent: boolean;
  creators: CrawledCreatorData[];
  error?: string;
}

// 보고 모드는 운영 DB와 대조하지 않으므로 신규·기존 건수를 미확인 값으로 반환한다.
export interface CrawlerReportResult extends Omit<CrawlerRunResult, 'existingMatchedCount' | 'newDiscoveredCount'> {
  schemaVersion: 1;
  mode: 'REPORT_ONLY';
  dbRead: false;
  dbWritten: false;
  comparisonPerformed: false;
  existingMatchedCount: null;
  newDiscoveredCount: null;
}

// DB와 이메일 인자를 받지 않는 수집·보고 전용 진입점이다.
export function runDebutCrawlerReport(baseDate?: Date): Promise<CrawlerReportResult> {
  return runDebutCrawlerProcess(undefined, undefined, undefined, baseDate, true);
}

// 기존 실행자의 반환 형식을 유지하면서 보고 모드의 별도 결과 형식을 보장한다.
export function runDebutCrawlerProcess(db: D1Database | undefined, recipientEmail: string | undefined, apiKey: string | undefined, forcedBaseDate: Date | undefined, reportOnly: true): Promise<CrawlerReportResult>;
export function runDebutCrawlerProcess(db?: D1Database, recipientEmail?: string, apiKey?: string, forcedBaseDate?: Date, reportOnly?: false): Promise<CrawlerRunResult>;

/**
 * 1. 매일 아침 7시(KST) 요일별 검사 범위 및 치지직/숲(KR) 기준 정기 데뷔 동기화 프로세스 (SRP)
 */
export async function runDebutCrawlerProcess(
  db?: D1Database,
  recipientEmail: string = 'kimjichang1234@gmail.com',
  apiKey?: string,
  forcedBaseDate?: Date,
  reportOnly: boolean = false
): Promise<CrawlerRunResult | CrawlerReportResult> {
  const runAt = new Date().toISOString();
  // KST 요일별 검사 날짜 범위 및 오늘(KST) 날짜 산출
  const baseDate = forcedBaseDate || new Date();
  const auditRange = calculateWeeklyAuditDateRange(baseDate);
  const todayKst = getTodayKstDateString(baseDate);
  console.log(`[Crawler] Starting Debut Auto Web Search & Sync at ${runAt}... Range: ${auditRange.description} (Today KST: ${todayKst})`);

  const crawledList: CrawledCreatorData[] = [];
  // 원본 조회 실패를 빈 목록 성공으로 표시하지 않는다.
  let sourceError: string | undefined;

  try {
    // 1-A. 공개 구글 시트 / 커뮤니티 데뷔 데이터 파싱
    const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38/export?format=csv&gid=1884409648';
    const response = await fetch(sheetCsvUrl, reportOnly ? { signal: AbortSignal.timeout(20_000) } : undefined);

    if (reportOnly && !response.ok) throw new Error(`수집 원본 응답 오류: HTTP ${response.status}`);

    if (response.ok) {
      const csvText = reportOnly ? await readCrawlerReportSource(response) : await response.text();
      const lines = reportOnly ? parseCrawlerCsv(csvText) : csvText.split('\n');

      for (let i = 5; i < lines.length; i++) {
        const line = lines[i];
        if (typeof line === 'string' && !line.trim()) continue;

        // CSV 행 분할
        const parts = Array.isArray(line) ? line.map((part) => part.trim()) : line.trim().split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length > 4) {
          const dateRaw = parts[1] || '';
          const hourRaw = parts[2] || '';
          const minRaw = parts[3] || '';
          const name = parts[4] || '';
          const channelUrl = parts[5] || '';
          const xId = parts[6] || '';

          if (name && dateRaw) {
            // 날짜 포맷 표준화 (2026. 8. 1 -> 2026-08-01)
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

            // 💡 [필터 1: 요일별 검사 범위 + 향후 예정된 미래 데뷔 일정 상시 수집]
            if (!isEligibleDebutForSync(formattedDate, auditRange, todayKst)) {
              continue;
            }

            // 플랫폼 분류 (치지직 / 숲 전용)
            let platform: 'CHZZK' | 'SOOP' | null = null;
            const lowerUrl = channelUrl.toLowerCase();
            if (lowerUrl.includes('sooplive') || lowerUrl.includes('afreeca')) {
              platform = 'SOOP';
            } else if (lowerUrl.includes('chzzk') || lowerUrl.includes('naver.com')) {
              platform = 'CHZZK';
            } else if (!lowerUrl.includes('youtube') && !lowerUrl.includes('youtu.be') && !lowerUrl.includes('twitch')) {
              // 플랫폼 미지정 일반 링크의 경우 기본 치지직 채널로 수용
              platform = 'CHZZK';
            }

            // 💡 [필터 2: 치지직 및 숲(SOOP) 플랫폼만 검사 대상으로 한정]
            if (!platform) {
              continue;
            }

            // 보고서에서는 알려지지 않은 시간을 임의로 채우지 않는다.
            let formattedTime: string | undefined = reportOnly ? undefined : '20:00';
            if (hourRaw) {
              const h = hourRaw.replace(/[^0-9]/g, '').padStart(2, '0');
              const m = minRaw.replace(/[^0-9]/g, '').padStart(2, '0') || '00';
              formattedTime = reportOnly && (!/\d/.test(hourRaw) || Number(h) > 23 || Number(m) > 59 || (minRaw && !/\d/.test(minRaw))) ? undefined : `${h}:${m}`;
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
              channelUrl: channelUrl || (reportOnly ? '' : `https://chzzk.naver.com/search?query=${encodeURIComponent(name)}`),
              xUrl,
              agencyName: '개인세',
              isNew: false,
            });
          }
        }
      }
    }
  } catch (err) {
    sourceError = err instanceof Error ? err.message : '수집 원본을 읽지 못했습니다.';
    console.error('[Crawler] Fetch error:', err);
  }

  // DB가 전달되어도 조회·저장·로그·프로필 동기화·메일 코드에 도달하기 전에 종료한다.
  if (reportOnly) return {
    success: !sourceError,
    schemaVersion: 1,
    mode: 'REPORT_ONLY',
    dbRead: false,
    dbWritten: false,
    comparisonPerformed: false,
    runAt,
    auditRange,
    totalCrawledCount: sourceError ? 0 : crawledList.length,
    existingMatchedCount: null,
    newDiscoveredCount: null,
    emailSent: false,
    creators: sourceError ? [] : crawledList,
    ...(sourceError ? { error: sourceError } : {}),
  };

  // 중복 체크 및 D1 DB 안전 갱신
  let existingMatchedCount = 0;
  let newDiscoveredCount = 0;

  if (db) {
    try {
      // D1 DB에서 기존 등록 스트리머 목록 조회
      const { results: existingStreamers } = await db.prepare(`
        SELECT c.id, i.slug, i.display_name, c.channel_url, i.profile_image_url
        FROM streamerChannel_info i
        INNER JOIN streamerChannel c ON i.channel_id = c.id
      `).all();

      const existingUrls = new Map<string, any>();
      const existingNames = new Map<string, any>();
      for (const s of (existingStreamers || []) as any[]) {
        if (s.channel_url) existingUrls.set(s.channel_url.toLowerCase().trim(), s);
        if (s.display_name) existingNames.set(s.display_name.toLowerCase().trim(), s);
      }

      for (const item of crawledList) {
        const cleanUrl = item.channelUrl.toLowerCase().trim();
        const cleanName = item.displayName.toLowerCase().trim();
        const existing = existingUrls.get(cleanUrl) || existingNames.get(cleanName);

        if (existing) {
          item.isNew = false;
          existingMatchedCount++;

          // 기존 등록자 중 프로필 이미지가 누락된 경우 자동 보완(Sync)
          if (!existing.profile_image_url && item.channelUrl) {
            try {
              const profileInfo = await fetchPlatformProfile(item.platform, item.channelUrl);
              if (profileInfo.success && profileInfo.profileImageUrl) {
                await db.prepare(`
                  UPDATE streamerChannel_info
                  SET profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
                  WHERE channel_id = ?
                `).bind(profileInfo.profileImageUrl, existing.id).run();
              }
            } catch (syncErr) {
              console.warn(`[Crawler] Profile sync failed for ${item.displayName}:`, syncErr);
            }
          }
        } else {
          item.isNew = true;
          newDiscoveredCount++;

          // 신규 스트리머 외부 플랫폼 API 프로필 실시간 조사
          let profileImageUrl = '';
          let description = `${item.displayName}의 데뷔 방송입니다.`;
          try {
            const profileInfo = await fetchPlatformProfile(item.platform, item.channelUrl);
            if (profileInfo.success) {
              profileImageUrl = profileInfo.profileImageUrl || '';
              if (profileInfo.description) description = profileInfo.description;
            }
          } catch (apiErr) {
            console.warn(`[Crawler] External platform profile fetch failed for ${item.displayName}:`, apiErr);
          }

          // ① 상위 streamerChannel에 INSERT 및 RETURNING id로 안전하게 channel_id 확보
          const chRes = await db.prepare(`
            INSERT INTO streamerChannel (platform, channel_url, channel_name)
            VALUES (?, ?, ?)
            RETURNING id
          `).bind(item.platform, item.channelUrl, item.displayName).first<{ id: number }>();

          const channelId = chRes?.id;
          if (!channelId) {
            console.error(`[Crawler] Failed to insert streamerChannel for ${item.displayName}`);
            continue;
          }

          // ② 고유 슬러그 생성 및 중복 방지
          const rawSlug = generateCleanSlug(item.displayName, item.platform);
          const slug = await resolveUniqueSlug(db, rawSlug);

          const startAtUtc = new Date(`${item.debutDate}T${item.debutTime}:00+09:00`).toISOString();

          // ③ 하위 streamerChannel_info에 등록 (KR 국가코드 고정)
          await db.prepare(`
            INSERT INTO streamerChannel_info (
              channel_id, slug, display_name, profile_image_url, description,
              agency_name, debut_date, debut_time, timezone, start_at_utc,
              country_code, x_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KR', ?)
          `).bind(
            channelId,
            slug,
            item.displayName,
            profileImageUrl,
            description,
            item.agencyName || '개인세',
            item.debutDate,
            item.debutTime || '20:00',
            'Asia/Seoul',
            startAtUtc,
            item.xUrl || ''
          ).run();

          console.log(`[Crawler] Successfully auto-registered: ${item.displayName} (${item.platform}, ${item.debutDate}) -> /creator/${slug}`);
        }
      }
    } catch (dbErr) {
      console.error('[Crawler] DB sync error:', dbErr);
    }
  } else {
    // DB가 전달되지 않은 환경
    existingMatchedCount = crawledList.length;
  }

  // 이메일 알림 전송 (신규 발견자 리포트)
  let emailSent = false;
  try {
    const emailRes = await sendDebutReportEmail(
      {
        recipientEmail,
        targetMonth: `${auditRange.description} (검사 건수: ${crawledList.length}건, 신규: ${newDiscoveredCount}건)`,
        totalFound: crawledList.length,
        existingMatchedCount,
        newDiscoveredCount,
        creators: crawledList.map((c) => ({ ...c, isNew: !!c.isNew })),
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
    auditRange,
    totalCrawledCount: crawledList.length,
    existingMatchedCount,
    newDiscoveredCount,
    emailSent,
    creators: crawledList,
  };
}
