import { Hono } from 'hono';
import { timingSafeEqual } from 'hono/utils/buffer';
import { runDebutCrawlerReport } from './debutCrawlerService';

// 보고 경로에는 DB 바인딩을 전달하지 않고 수집용 비밀키만 사용한다.
export const debutCrawlerReportApi = new Hono<{ Bindings: { CRAWLER_SECRET?: string } }>();

// 직접 만든 응답에도 인증 결과와 후보 목록의 캐시 금지를 명시한다.
function reportJson(data: unknown, status: number): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

// 인증 실패는 DB 기반 관리자 세션 확인으로 우회하지 않는다.
function reportResponse(requestSecret: string | undefined, expectedSecret: string | undefined): Promise<Response> {
  return !expectedSecret
    ? Promise.resolve(reportJson({ success: false, error: '수집용 비밀키가 설정되지 않았습니다.' }, 503))
    : !requestSecret
      ? Promise.resolve(reportJson({ success: false, error: '수집 인증이 필요합니다.' }, 401))
      : timingSafeEqual(requestSecret, expectedSecret).then((valid) => valid
        ? runDebutCrawlerReport().then((report) => reportJson(report, report.success ? 200 : 502))
        : reportJson({ success: false, error: '수집 인증이 올바르지 않습니다.' }, 401));
}

// 요청 본문의 저장·메일 옵션은 읽지 않으며 보고 전용 동작만 수행한다.
debutCrawlerReportApi.post('/', (c) => reportResponse(c.req.header('X-Crawler-Secret'), c.env.CRAWLER_SECRET));

// 잘못된 메서드도 DB 기반 인증 경로로 넘어가지 않게 종료한다.
debutCrawlerReportApi.all('*', () => reportJson({ success: false, error: '보고 전용 POST 요청만 허용합니다.' }, 405));
