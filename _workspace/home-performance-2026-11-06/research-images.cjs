const fs = require('node:fs');
const path = require('node:path');
const targets = JSON.parse(fs.readFileSync(path.join(__dirname, 'repair-targets.json')));
const headers = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json,text/html', 'Accept-Language': 'ko-KR,ja,en;q=0.7' };
const extraChannels = { baekhoyang: '8c14ab2e0f180f3be5f64b7b421d152f', 'baekhoyang-2': '8c14ab2e0f180f3be5f64b7b421d152f', yeonsaeneul: 'db8c2f4b478e9aaca4a42a45e5e89b7f', 'yeonsaeneul-2': 'db8c2f4b478e9aaca4a42a45e5e89b7f' };
async function inspect(p) {
  try {
    const id = extraChannels[p.slug] || p.channelUrl.split('/').find(s => /^[a-f0-9]{32}$/.test(s));
    const url = p.platform === 'CHZZK' ? `https://api.chzzk.naver.com/service/v1/channels/${id}` : p.channelUrl;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    fs.writeFileSync(path.join(__dirname, `source-${p.slug}.${p.platform === 'CHZZK' ? 'json' : 'html'}`), text);
    let result = { slug: p.slug, source: url, status: res.status, bytes: text.length };
    if (p.platform === 'CHZZK') {
      const data = JSON.parse(text);
      const c = data.content;
      result = { ...result, code: data.code, channelId: c?.channelId, name: c?.channelName, avatarUrl: c?.channelImageUrl, description: c?.channelDescription, links: c?.channelLinks };
    } else {
      const og = [...text.matchAll(/<meta[^>]*(?:property|name)=["'](og:title|og:image|twitter:image|description)["'][^>]*content=["']([^"']*)["']/g)].map(m => [m[1], m[2]]);
      result.meta = Object.fromEntries(og);
      result.images = [...new Set(text.match(/https:\/\/(?:yt3\.(?:googleusercontent|ggpht)\.com|static-cdn\.jtvnw\.net)[^"<>\s\\]+/g) || [])].slice(0, 8);
      result.channelId = text.match(/"externalId":"([^"]+)"/)?.[1];
      result.clientIds = [...new Set([...text.matchAll(/(?:clientId|client_id|Client-ID)["']?\s*[:=]\s*["']([a-z0-9]+)/g)].map(m => m[1]))];
    }
    return result;
  } catch (e) { return { slug: p.slug, error: e.message }; }
}
(async () => {
  const results = [];
  for (let index = 0; index < targets.length; index += 4) results.push(...await Promise.all(targets.slice(index, index + 4).map(inspect)));
  fs.writeFileSync(path.join(__dirname, 'image-research.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
