const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'release-v2/frontend/dist');
const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'preview-profiles.json'), 'utf8'));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

// 운영에 쓰기 요청을 보내지 않고 실제 대상 자료로 격리 화면을 확인한다.
function respond(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (url.pathname.startsWith('/api/')) {
    response.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/api/v1/portal/profiles') return response.end(JSON.stringify(profiles));
    if (url.pathname.endsWith('/access')) return response.end('{"owner":false}');
    if (url.pathname.endsWith('/banner')) return response.end(JSON.stringify({ bannerUrl: profiles.profiles[0].bannerUrl, mobileBannerUrl: '', description: '' }));
    return response.end('{}');
  }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { response.statusCode = 403; return response.end(); }
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(root, 'portal.html');
  response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(response);
}
http.createServer(respond).listen(Number(process.env.PORT || 4178), '127.0.0.1', () => process.stdout.write('상세페이지 검증 서버 준비 완료\n'));
