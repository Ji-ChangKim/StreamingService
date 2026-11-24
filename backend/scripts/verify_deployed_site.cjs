const SITE_URL = 'https://vdebut.live/robots.txt';
const USER_AGENT = 'VDebut-Deployment-Check/1.0';

// HTML 차단 페이지나 실패 상태를 배포 성공으로 판단하지 않는다.
function requireRobotsResponse(response) {
  return response.status !== 200 || !/^text\/plain(?:;|$)/i.test(response.headers.get('Content-Type') || '')
    ? Promise.reject(new Error(`공개 주소 확인 실패: HTTP ${response.status}, Cloudflare 요청 ID ${response.headers.get('CF-Ray') || '없음'}`))
    : response.text();
}

// 운영 주소의 robots 원문을 확인하며 API·SQL·등록 요청은 보내지 않는다.
function requireProductionRobots(text) {
  return /^User-agent:\s*\*/m.test(text) && /^Sitemap:\s*https:\/\/vdebut\.live\/sitemap\.xml\s*$/m.test(text)
    ? { url: SITE_URL, status: 200, verified: true, dbWritten: false }
    : (() => { throw new Error('공개 주소가 예상한 VDébut robots.txt를 반환하지 않았습니다.'); })();
}

// 서비스명을 명시한 점검 요청을 사용하고 리다이렉트·무기한 대기를 허용하지 않는다.
function verifyDeployedSite(fetcher = globalThis.fetch) {
  return fetcher(SITE_URL, { method: 'GET', redirect: 'error', headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' }, signal: AbortSignal.timeout(15000) })
    .then(requireRobotsResponse).then(requireProductionRobots);
}

async function verifyCalendarContract(fetcher=globalThis.fetch){
  const suffix=`?verification=${Date.now()}`;
  const read=async url=>{const r=await fetcher(url,{method:'GET',redirect:'error',headers:{'User-Agent':USER_AGENT,'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`캘린더 계약 확인 HTTP ${r.status}`);return r.json();};
  const [payload,calendar]=await Promise.all([read('https://vdebut.live/api/v1/portal/profiles?version=3&verification='+Date.now()),read('https://vdebut.live/api/v1/events'+suffix)]);
  if(!Array.isArray(payload.profiles)||!payload.profiles.length||!Array.isArray(calendar.events))throw new Error('공개 프로필·달력 응답 형식 오류');
  let checked=0;
  for(const p of payload.profiles){
    if(p.dateState==='NONE')continue;const event=calendar.events.find(e=>e.creator?.slug===p.slug);
    if(!event||event.type!==(p.debutKind||'FIRST_DEBUT')||event.startAtUtc!==p.startAtUtc||!event.links?.some(l=>l.url===p.channelUrl))throw new Error(`공개 프로필·달력 불일치: ${p.slug}`);
    checked++;
  }
  return {calendarContractVerified:true,profilesChecked:checked,dbWritten:false};
}
module.exports = { verifyDeployedSite, verifyCalendarContract, SITE_URL, USER_AGENT };

// 실패는 처리되지 않은 거부로 종료되어 Actions가 성공으로 숨기지 않게 한다.
if (require.main === module) Promise.all([verifyDeployedSite(),verifyCalendarContract()]).then((result) => console.log(JSON.stringify(result)));
