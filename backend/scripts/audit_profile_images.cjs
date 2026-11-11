const fs = require('node:fs');
const path = require('node:path');

const headers = { 'User-Agent': 'VDebut-Deployment-Check/1.0' };

// HEAD 성공만으로 이미지가 보인다고 판단하지 않고 파일 시그니처까지 읽는다.
function imageFormat(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (/^GIF8[79]a/.test(bytes.toString('ascii', 0, 6))) return 'gif';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (bytes.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(bytes.toString('ascii', 8, 32))) return 'avif';
  return '';
}

async function inspectImage(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { state: 'invalid-url' };
    const response = await fetch(url, { headers: { ...headers, Referer: 'https://vdebut.live/' }, signal: AbortSignal.timeout(15000) });
    const type = response.headers.get('content-type') || '';
    if (!response.ok) {
      await response.body?.cancel();
      return { state: 'http-error', status: response.status, contentType: type };
    }
    const reader = response.body?.getReader();
    let bytes = Buffer.alloc(0);
    if (reader) {
      try {
        while (bytes.length < 32) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes = Buffer.concat([bytes, Buffer.from(chunk.value)]);
        }
      } finally { await reader.cancel(); }
    }
    const format = imageFormat(bytes);
    return { state: format && type.startsWith('image/') ? 'ok' : 'invalid-image', status: response.status, contentType: type, format };
  } catch (error) {
    return { state: 'request-error', reason: error.cause?.code || error.name };
  }
}

// 같은 원본 주소는 한 번만 검사하고 실패한 주소만 재시도한다.
async function inspectImages(urls) {
  const results = new Map();
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(6, urls.length) }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const first = await inspectImage(url);
      const result = first.state === 'ok' ? first : { ...await inspectImage(url), firstAttempt: first };
      results.set(url, result);
    }
  }));
  return results;
}

async function main() {
  const output = path.resolve(process.argv[2] || '_workspace/home-performance-2026-11-06');
  const response = await fetch('https://vdebut.live/api/v1/portal/profiles?version=3', { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Public profile API: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.profiles)) throw new Error('Invalid public profile response');
  const urls = [...new Set(data.profiles.map(p => p.avatarUrl).filter(Boolean))];
  const images = await inspectImages(urls);
  const rows = data.profiles.map(p => ({ slug: p.slug, displayName: p.displayName, platform: p.platform, targetMonth: p.targetMonth, channelUrl: p.channelUrl, avatarUrl: p.avatarUrl, ...(!p.avatarUrl ? { state: 'missing' } : images.get(p.avatarUrl)) }));
  const counts = {};
  for (const row of rows) counts[row.state] = (counts[row.state] || 0) + 1;
  const report = { checkedAt: new Date().toISOString(), source: response.url, totalProfiles: rows.length, uniqueImageUrls: urls.length, counts, rows };
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'profile-image-audit.json'), JSON.stringify(report, null, 2));
  const fields = ['displayName', 'slug', 'platform', 'targetMonth', 'state', 'status', 'reason', 'channelUrl', 'avatarUrl'];
  const csv = [fields, ...rows.filter(row => row.state !== 'ok').map(row => fields.map(key => row[key] ?? ''))].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  fs.writeFileSync(path.join(output, 'profile-image-issues.csv'), '\ufeff' + csv);
  console.log(JSON.stringify({ totalProfiles: rows.length, uniqueImageUrls: urls.length, counts, issues: rows.filter(row => row.state !== 'ok').map(({ displayName, slug, state, status, reason }) => ({ displayName, slug, state, status, reason })), output }, null, 2));
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { imageFormat, inspectImage, inspectImages };
