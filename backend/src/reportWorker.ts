import { Hono } from 'hono';
import { debutCrawlerReportApi } from './services/debutCrawlerReportApi';

// 보고용 Worker는 DB·KV·메일·정기 작업 없이 인증된 보고 요청만 처리한다.
const reportWorker = new Hono<{ Bindings: { CRAWLER_SECRET?: string } }>();
reportWorker.route('/api/v1/admin/crawler/report', debutCrawlerReportApi);

// 다른 주소로 운영 사이트 또는 자동 등록 경로를 우회하지 않는다.
reportWorker.all('*', (c) => c.json({ success: false, error: '보고 전용 주소를 확인해 주세요.' }, 404, { 'Cache-Control': 'no-store' }));

// 정기 실행 핸들러를 내보내지 않는다.
export default { fetch: reportWorker.fetch };
