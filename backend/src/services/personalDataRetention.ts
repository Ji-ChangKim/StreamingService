// 개인정보처리방침에 적은 보관 기간을 실제로 지킨다.
// 처리가 끝난 문의·등록 신청은 1년이 지나면 연락 이메일을 지우고, 문의는 내용까지 지운다.
// 검토 중(PENDING)인 신청은 처리가 끝날 때까지 남긴다.
export const REQUEST_RETENTION_DAYS = 365;

export async function prunePersonalData(db: D1Database): Promise<void> {
  const cutoff = `-${REQUEST_RETENTION_DAYS} days`;
  await db.batch([
    db.prepare(`DELETE FROM portal_submission_keys WHERE request_id IN
      (SELECT id FROM portal_requests WHERE kind='CONTACT' AND status!='PENDING' AND updated_at < datetime('now', ?))`).bind(cutoff),
    db.prepare(`DELETE FROM portal_requests WHERE kind='CONTACT' AND status!='PENDING' AND updated_at < datetime('now', ?)`).bind(cutoff),
    // 등록 신청은 공개 소개의 이력이라 남기고, 연락 이메일과 접속 정보 해시만 지운다.
    db.prepare(`UPDATE portal_requests SET payload=json_remove(payload, '$.contactEmail'), requester_hash=''
      WHERE status!='PENDING' AND updated_at < datetime('now', ?) AND (json_extract(payload, '$.contactEmail') IS NOT NULL OR requester_hash!='')`).bind(cutoff),
    db.prepare(`UPDATE debut_submissions SET contact_email=NULL
      WHERE status!='PENDING' AND contact_email IS NOT NULL AND COALESCE(processed_at, created_at) < datetime('now', ?)`).bind(cutoff),
  ]);
}
