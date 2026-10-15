const fs = require('node:fs');
const path = require('node:path');
const original = fs.readFileSync('backend/wrangler.toml', 'utf8');
const section = /\[\[env\.dev\.d1_databases\]\][\s\S]*?(?=\n\[|$)/;
if (!section.test(original)) throw new Error('개발 DB 설정이 없습니다.');

// 작업 중인 설정 파일을 보존하면서 이번 개발 배포만 별도 개발 DB에 연결한다.
const config = original.replace(section, part => part.replace(/database_name\s*=\s*"[^"]+"/, 'database_name = "vdebut-db-dev"').replace(/database_id\s*=\s*"[^"]+"/, 'database_id = "465fff79-9542-46d6-90dd-a78367bb92a6"'))
  .replace(/^main\s*=.*$/m, `main = ${JSON.stringify(path.resolve('backend/src/index.ts').replaceAll('\\', '/'))}`)
  .replace(/^bucket\s*=.*$/m, 'bucket = "../../frontend/dist"');
fs.mkdirSync('backend/.cache', { recursive: true });
fs.writeFileSync('backend/.cache/wrangler-p0-content.toml', config);
console.log('개발 전용 설정: streaming-dev / vdebut-db-dev. 원본 설정 파일은 보존했습니다.');
