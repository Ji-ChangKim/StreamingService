const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = '.cache/adsense-production-release-20261015';
const settings = JSON.parse(fs.readFileSync('.cache/adsense-production-settings-before.json', 'utf8'));
const source = execFileSync('git', ['show', '40ed628:backend/wrangler.toml'], { encoding: 'utf8' });
const db = settings.bindings.find(binding => binding.name === 'DB' && binding.type === 'd1');
if (db?.database_id !== '888a8c04-5657-4bff-9b50-5002a47ac7c7' || !settings.domains.some(domain => domain.hostname === 'vdebut.live')) throw Error('운영 DB·도메인 확인 자료가 올바르지 않습니다.');

// 검증 기준 작업본만 빌드하며 현재 운영의 도메인·스케줄·서브도메인을 보존한다.
const routes = settings.domains.map(domain => `{ pattern = ${JSON.stringify(domain.hostname)}, custom_domain = true }`).concat(settings.routes.map(route => `{ pattern = ${JSON.stringify(route.pattern)}, zone_id = ${JSON.stringify(settings.zoneId)} }`));
const config = source.replace(/^main\s*=.*$/m, `main = ${JSON.stringify(path.resolve(`${root}/backend/src/index.ts`).replaceAll('\\', '/'))}`)
  .replace(/^bucket\s*=.*$/m, 'bucket = "adsense-production-release-20261015/frontend/dist"')
  .replace('[env.production]\n', `[env.production]\nworkers_dev = ${Boolean(settings.subdomain.enabled)}\npreview_urls = ${Boolean(settings.subdomain.previews_enabled)}\nroutes = [${routes.join(', ')}]\n`)
  .replace('[env.production]\r\n', `[env.production]\r\nworkers_dev = ${Boolean(settings.subdomain.enabled)}\r\npreview_urls = ${Boolean(settings.subdomain.previews_enabled)}\r\nroutes = [${routes.join(', ')}]\r\n`);
fs.writeFileSync('.cache/wrangler-adsense-production.toml', `${config}\n[env.production.triggers]\ncrons = ${JSON.stringify(settings.schedules.schedules.map(schedule => schedule.cron))}\n`);
console.log('운영 배포 전용 설정 생성: streaming / vdebut-db / 기존 도메인·수집 스케줄 유지');
