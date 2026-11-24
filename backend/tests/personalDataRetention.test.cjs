// 개인정보처리방침의 보관 기간(처리 끝나고 1년)을 실제 정리 작업이 지키는지 확인한다.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('../../frontend/node_modules/esbuild');

const root = path.resolve(__dirname, '../..');
function loadTypeScript(file) {
  const bundle = esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const loaded = new Module(file, module);
  loaded._compile(bundle.outputFiles[0].text, file);
  return loaded.exports;
}
const { prunePersonalData } = loadTypeScript(path.join(root, 'backend/src/services/personalDataRetention.ts'));

function binding(db) {
  const statement = (sql, values) => ({ async run() { db.prepare(sql).run(...values); return {}; } });
  return { prepare(sql) { return { bind(...values) { return statement(sql, values); } }; }, async batch(list) { for (const s of list) await s.run(); } };
}

function fixture() {
  const db = new DatabaseSync(':memory:');
  for (const file of ['0019_create_admin_and_submissions.sql', '0036_portal_requests.sql', '0037_portal_submission_and_history.sql']) {
    db.exec(fs.readFileSync(path.join(root, 'backend/migrations', file), 'utf8'));
  }
  const old = "datetime('now','-400 days')";
  const recent = "datetime('now','-30 days')";
  const email = JSON.stringify({ message: '정정 요청', contactEmail: 'fan@example.com' });
  db.exec(`
    INSERT INTO portal_requests(id,kind,status,payload,token_hash,requester_hash,created_at,updated_at) VALUES
      ('contact-old','CONTACT','APPROVED','${email}','t1','ip1',${old},${old}),
      ('contact-new','CONTACT','APPROVED','${email}','t2','ip2',${recent},${recent}),
      ('contact-pending','CONTACT','PENDING','${email}','t3','ip3',${old},${old}),
      ('debut-old','DEBUT','APPROVED','${email}','t4','ip4',${old},${old});
    INSERT INTO portal_submission_keys(key_hash,payload_hash,request_id) VALUES ('k1','p1','contact-old');
    INSERT INTO debut_submissions(display_name,platform,channel_url,debut_date,debut_time,start_at_utc,contact_email,status,created_at,processed_at) VALUES
      ('옛 신청','CHZZK','https://chzzk.naver.com/a','2025-01-01','20:00','2025-01-01T11:00:00Z','old@example.com','APPROVED',${old},${old}),
      ('새 신청','CHZZK','https://chzzk.naver.com/b','2026-11-01','20:00','2026-11-01T11:00:00Z','new@example.com','APPROVED',${recent},${recent});
  `);
  return db;
}

test('처리 끝나고 1년 지난 문의는 지우고, 등록 신청은 연락 이메일과 접속 해시만 지운다', async () => {
  const db = fixture();
  await prunePersonalData(binding(db));
  const ids = db.prepare('SELECT id FROM portal_requests ORDER BY id').all().map((row) => row.id);
  assert.deepEqual(ids, ['contact-new', 'contact-pending', 'debut-old']);
  const debut = db.prepare("SELECT payload, requester_hash FROM portal_requests WHERE id='debut-old'").get();
  assert.equal(JSON.parse(debut.payload).contactEmail, undefined);
  assert.equal(JSON.parse(debut.payload).message, '정정 요청');
  assert.equal(debut.requester_hash, '');
  assert.match(db.prepare("SELECT payload FROM portal_requests WHERE id='contact-new'").get().payload, /fan@example.com/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM portal_submission_keys').get().n, 0);
  const emails = db.prepare('SELECT contact_email FROM debut_submissions ORDER BY id').all().map((row) => row.contact_email);
  assert.deepEqual(emails, [null, 'new@example.com']);
});
