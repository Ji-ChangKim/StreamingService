const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');
const { corrections, correctedProfile } = require('./adsenseContentPatch.cjs');

// SQL 값은 문자열 조합 과정에서도 작은따옴표를 이스케이프한다.
function sqlValue(value) {
  return value == null ? 'NULL' : typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
}

// 운영 적용은 명시적 대상과 해당 DB 식별자를 가진 9건 백업을 요구한다.
const target = process.argv[2] || 'dev';
if (!['dev', 'production'].includes(target)) throw new Error('dev 또는 production 대상을 명시하세요.');
const database = target === 'production' ? 'vdebut-db' : 'vdebut-db-dev';
const databaseId = target === 'production' ? '888a8c04-5657-4bff-9b50-5002a47ac7c7' : '465fff79-9542-46d6-90dd-a78367bb92a6';
const prefix = `.cache/adsense-content-${target}`;
const backupPath = process.argv[3] || `${prefix}-db-before.json`;
const backup = JSON.parse(fs.readFileSync(path.resolve(backupPath), 'utf8').replace(/^\uFEFF/, ''));
if (target === 'production' && (backup.databaseId !== databaseId || backup.database !== database)) throw new Error('운영 DB 식별자와 백업이 일치하지 않습니다.');
const before = Array.isArray(backup) ? backup : backup.results;
if (before.length < 4 || before.some(r => !r.success || r.meta?.rows_written)) throw new Error('DB 읽기 백업이 올바르지 않습니다.');
const rows = before[1].results;
const additions = before[2].results;
if (rows.length !== 9 || corrections.some(c => !rows.some(r => r.slug === c.slug))) throw new Error('대상 9개 원본을 모두 확인해야 합니다.');
// 실제 저장소의 변환·보류 로직을 로드하며 별도 규칙을 복제하지 않는다.
const releaseRoot = process.argv[4] || '.';
const repositorySource = path.resolve(releaseRoot, 'backend/src/services/portalProfileRepository.ts');
const reviewSource = path.resolve(releaseRoot, 'shared/contentReview.ts');
const repositoryModule = new Module(repositorySource, module);
const reviewModule = new Module(reviewSource, module);
repositoryModule._compile(esbuild.buildSync({ entryPoints: [repositorySource], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, repositorySource);
reviewModule._compile(esbuild.buildSync({ entryPoints: [reviewSource], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, reviewSource);
const { readPortalProfiles } = repositoryModule.exports;
const { reviewedProfile } = reviewModule.exports;
const db = { prepare: sql => ({ all: async () => ({ results: sql.includes('JOIN streamerChannel') ? rows : additions.map(r => ({ data: r.data })) }) }) };
const checkedAt = new Date().toISOString();
const actor = crypto.createHash('sha256').update(`codex:user-authorized:${target}-p0-2026-10-15`).digest('hex');

// 백업에서 읽은 원본과 일치하는 대상만 정정하고 전후 이력을 저장한다.
readPortalProfiles(db).then(profiles => {
  const plan = corrections.map(correction => {
    const original = profiles.find(p => p.slug === correction.slug);
    const legacy = rows.find(r => r.slug === correction.slug);
    const oldData = additions.find(r => r.slug === correction.slug)?.data || '';
    const after = correctedProfile(original, correction, reviewedProfile, checkedAt);
    const id = `adsense-p0-2026-10-15-${target}-${correction.slug}`;
    const reason = `사용자 요청 ${target === 'production' ? '운영' : '개발'} 정정. 공식 출처: ${correction.sources.join(' / ')}. 미확인 유지: ${correction.pending.join(' / ')}. 콘텐츠·권리 일괄 승인 아님.`;
    const columns = Object.entries(legacy).map(([key, value]) => {
      if (!/^[a-z_]+$/.test(key)) throw new Error('예상하지 못한 원본 필드');
      return `${['platform', 'channel_url'].includes(key) ? 'c' : 'i'}.${key} IS ${sqlValue(value)}`;
    }).join(' AND ');
    const guard = `COALESCE((SELECT data FROM portal_profiles WHERE slug=${sqlValue(original.slug)}),'')=${sqlValue(oldData)} AND EXISTS(SELECT 1 FROM streamerChannel_info i JOIN streamerChannel c ON c.id=i.channel_id WHERE ${columns})`;
    const history = `INSERT INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash) SELECT ${[id, original.slug, JSON.stringify(original), JSON.stringify(after), reason, actor].map(sqlValue).join(',')} WHERE ${guard} AND NOT EXISTS(SELECT 1 FROM portal_profile_history WHERE id=${sqlValue(id)});`;
    const update = `INSERT INTO portal_profiles(slug,channel_url,data) SELECT ${[after.slug, after.channelUrl, JSON.stringify(after)].map(sqlValue).join(',')} WHERE ${guard} AND EXISTS(SELECT 1 FROM portal_profile_history WHERE id=${sqlValue(id)} AND after_data=${sqlValue(JSON.stringify(after))}) ON CONFLICT(slug) DO UPDATE SET channel_url=excluded.channel_url,data=excluded.data,updated_at=CURRENT_TIMESTAMP;`;
    return { slug: original.slug, before: original, after, sources: correction.sources, pending: correction.pending, sql: `${history}\n${update}` };
  });
  fs.writeFileSync(`${prefix}-plan.json`, JSON.stringify({ checkedAt, target, database, databaseId, backupPath, changes: plan.map(({ sql, ...change }) => change) }, null, 2));
  fs.writeFileSync(`${prefix}-apply.sql`, `-- ${target}: 원본 비교 조건과 변경 이력을 갖춘 9개 소개 정정\n${plan.map(p => p.sql).join('\n')}`);
  console.log(JSON.stringify(plan.map(p => ({ slug: p.slug, fields: Object.keys(corrections.find(c => c.slug === p.slug).fields), state: p.after.contentReview?.state || '기존 공개 기준 유지' })), null, 2));
}).catch(error => { console.error(error.message); process.exitCode = 1; });
