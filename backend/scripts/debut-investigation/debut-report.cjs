const E = require('./debut-evidence.cjs');
const S = require('./debut-sources.cjs');
const LABELS = { FIRST_DEBUT: '첫 데뷔 후보', RE_DEBUT: '재데뷔', MODEL_2_0: '2.0 공개', MODEL_REVEAL: '모델 공개', DEBUT_3D: '3D 공개', NEW_OUTFIT: '신의상', RETURN: '복귀', MULTIPLE: '복수 행사', VERIFY: '종류 미확인' };
const REASONS = { OFFICIAL_CHANNEL_NOT_CHECKED: '공식 채널 API 미확인', AUTHOR_IDENTITY_NOT_VERIFIED: '본인 공지·소유권 미확인', FIRST_DEBUT_HISTORY_NOT_VERIFIED: '최초 활동 이력 미확인', NO_PRIMARY_ANNOUNCEMENT: '공식 원문 없이 시트만 확인', PRIOR_ACTIVITY_MENTIONED: '기존 활동 언급 있음', EVENT_KIND_NOT_DETERMINED: '행사 종류 근거 부족', DATE_NOT_CORROBORATED: '본문 날짜 대조 미완료', TIME_NOT_CORROBORATED: '본문 시간 대조 미완료', DATE_EVIDENCE_CONFLICT: '날짜 근거 상충', TIME_EVIDENCE_CONFLICT: '시간 근거 상충', TIME_UNKNOWN: '시간 미정', TIME_INVALID: '잘못된 시각', DATE_UNKNOWN_OR_INVALID: '날짜 미정 또는 오류', CHANNEL_NOT_FOUND: '공식 API에서 채널을 찾지 못함', DUPLICATE_TIME_CONFLICT: '중복 공지의 시간 상충', CANCELLED_OR_POSTPONED: '취소·연기 문구 재확인 필요' };

// 사람이 읽는 표에서는 검토 사유를 한국어로 표시한다.
function reasonText(reason) {
  return REASONS[reason] || (reason.startsWith('CHANNEL_') ? '채널 주소 확인 미완료' : reason);
}

// 비교와 검증에 필요한 값만 남기며 공지 원문 전체는 보관하지 않는다.
function candidate(seed, channel) {
  return { displayName: seed.displayName, platform: channel.platform, rawChannelUrl: seed.rawChannelUrl, sourceActor: seed.sourceActor, channel, debutDate: E.validDate(seed.debutDate) ? seed.debutDate : null, debutTime: seed.debutTime, rawDatePresent: Boolean(seed.rawDate), timeInputInvalid: Boolean((seed.rawHour || seed.rawMinute) && !/미정|TBD|undecided/i.test(seed.rawHour || '') && !seed.debutTime), scheduleNotice: /취소|cancelled|canceled/i.test(seed.text) ? 'CANCELLED_ANNOUNCEMENT' : /연기|일정\s*변경|미뤄|postponed/i.test(seed.text) ? 'POSTPONED_ANNOUNCEMENT' : null, timezone: 'Asia/Seoul', classification: E.classify(seed.text), textDates: E.textDates(seed.text), textTimes: E.textTimes(seed.text), timeClaims: seed.debutTime ? [seed.debutTime] : [], evidence: [seed.source], requiresApproval: true };
}

// API 대조 이전에도 공식 확인과 최초 활동 검증은 미완료로 남긴다.
function baseChecks(item, official) {
  return { sourceRetrieved: 'PASS', channelFormat: item.channel.channelId ? 'PASS' : item.channel.status === 'INVALID_CHANNEL_ID' || item.channel.status === 'INVALID_URL' ? 'FAIL' : 'NOT_CHECKED', calendarDate: item.debutDate ? 'PASS' : item.rawDatePresent ? 'FAIL' : 'NOT_CHECKED', timeKnown: item.timeInputInvalid ? 'FAIL' : item.debutTime ? 'PASS' : 'NOT_CHECKED', dateAgreement: item.textDates.length ? item.debutDate && item.textDates.length === 1 && item.textDates[0] === item.debutDate ? 'PASS' : 'FAIL' : 'NOT_CHECKED', timeAgreement: item.textTimes.length ? item.debutTime && item.textTimes.length === 1 && item.textTimes[0] === item.debutTime && item.timeClaims.length < 2 ? 'PASS' : 'FAIL' : item.timeClaims.length > 1 ? 'FAIL' : 'NOT_CHECKED', officialChannel: official.status === 'OK' && item.channel.channelId ? official.channels.some((row) => row.channelId === item.channel.channelId) ? 'PASS' : 'FAIL' : 'NOT_CHECKED', authorIdentity: 'NOT_CHECKED', firstDebutHistory: item.classification.eventType === 'FIRST_DEBUT' ? 'NOT_CHECKED' : 'NOT_APPLICABLE', eventKind: item.classification.eventType === 'VERIFY' ? 'NOT_CHECKED' : 'PASS' };
}

// 같은 채널·종류·날짜인 후보만 합치며 상충하는 시간은 그대로 보존한다.
function mergeCandidate(old, next) {
  return { ...old, evidence: [...new Map([...old.evidence, ...next.evidence].map((item) => [item.contentHash, item])).values()], textDates: [...new Set([...old.textDates, ...next.textDates])], textTimes: [...new Set([...old.textTimes, ...next.textTimes])], timeClaims: [...new Set([...old.timeClaims, ...next.timeClaims])] };
}

// 동명이인은 이름만으로 병합하지 않는다.
function deduplicate(items) {
  return [...items.reduce((groups, item) => ((key) => groups.set(key, groups.has(key) ? mergeCandidate(groups.get(key), item) : item))(`${E.identityKey(item)}:${item.debutDate || 'DATE_UNKNOWN'}`), new Map()).values()];
}

// 검증 결과를 게시 승인과 분리하고 미확인 근거를 개별 사유로 표시한다.
function verification(item, checks) {
  return { status: Object.values(checks).includes('FAIL') ? 'CONFLICT' : 'REVIEW_REQUIRED', checks, reasons: [checks.channelFormat !== 'PASS' && `CHANNEL_${item.channel.status}`, checks.calendarDate !== 'PASS' && 'DATE_UNKNOWN_OR_INVALID', checks.timeKnown !== 'PASS' && (item.timeInputInvalid ? 'TIME_INVALID' : 'TIME_UNKNOWN'), checks.dateAgreement === 'NOT_CHECKED' && 'DATE_NOT_CORROBORATED', checks.timeAgreement === 'NOT_CHECKED' && 'TIME_NOT_CORROBORATED', item.scheduleNotice && 'CANCELLED_OR_POSTPONED', checks.dateAgreement === 'FAIL' && 'DATE_EVIDENCE_CONFLICT', checks.timeAgreement === 'FAIL' && 'TIME_EVIDENCE_CONFLICT', checks.officialChannel === 'NOT_CHECKED' && 'OFFICIAL_CHANNEL_NOT_CHECKED', checks.officialChannel === 'FAIL' && 'CHANNEL_NOT_FOUND', 'AUTHOR_IDENTITY_NOT_VERIFIED', checks.firstDebutHistory === 'NOT_CHECKED' && 'FIRST_DEBUT_HISTORY_NOT_VERIFIED', checks.eventKind === 'NOT_CHECKED' && 'EVENT_KIND_NOT_DETERMINED', item.classification.priorActivityMentioned && 'PRIOR_ACTIVITY_MENTIONED', item.evidence.every((source) => source.authority === 'COMMUNITY_UNVERIFIED') && 'NO_PRIMARY_ANNOUNCEMENT', item.timeClaims.length > 1 && 'DUPLICATE_TIME_CONFLICT'].filter(Boolean) };
}

// 데뷔 공지 시각이 지났어도 실제 방송 완료라고 추정하지 않는다.
function eventState(item, today) {
  return item.scheduleNotice || (!item.debutDate ? 'DATE_TBD' : item.debutDate < today ? 'PAST_ANNOUNCEMENT_NOT_CONFIRMED_COMPLETED' : 'SCHEDULED_ANNOUNCEMENT');
}

// 중복·날짜 정정·근거 변경을 비교할 안정적인 식별자와 지문을 붙인다.
function finishCandidate(item, official, today) {
  return { ...item, id: E.hash(`${E.identityKey(item)}:${item.debutDate || 'DATE_UNKNOWN'}`).slice(0, 24), identityKey: E.identityKey(item), fingerprint: E.fingerprint(item), eventState: eventState(item, today), firstDebutEligibility: item.classification.eventType === 'FIRST_DEBUT' ? 'REQUIRES_MANUAL_HISTORY_CHECK' : item.classification.eventType === 'VERIFY' ? 'UNDETERMINED' : 'EXCLUDED_FROM_FIRST_DEBUT', verification: verification(item, baseChecks(item, official)) };
}

// 이전 파일이 안전한 보고서가 아니면 승인 자료나 비교 기준으로 사용하지 않는다.
function validatePrevious(report) {
  return !report ? null : report.schemaVersion === 2 && report.mode === 'REPORT_ONLY' && report.success === true && report.dbRead === false && report.dbWritten === false && report.applySupported === false && Array.isArray(report.candidates) ? report : S.failure('PREVIOUS_REPORT_CONTRACT_INVALID');
}

// 날짜 정정은 양쪽에서 유일한 채널·종류가 일치할 때만 변경으로 연결한다.
function previousFor(item, current, previous) {
  return previous.find((old) => old.id === item.id) || (current.filter((row) => row.identityKey === item.identityKey).length === 1 && previous.filter((row) => row.identityKey === item.identityKey).length === 1 ? previous.find((old) => old.identityKey === item.identityKey) : null);
}

// 목록에서 사라진 항목은 삭제 지시가 아니라 재확인 대상으로 표시한다.
function compare(items, baseline) {
  return !baseline ? { available: false, reason: 'NO_PREVIOUS_REPORT', added: [], changed: [], unchanged: [], notInCurrentReport: [] } : { available: true, baselineRunAt: baseline.runAt, added: items.filter((item) => !previousFor(item, items, baseline.candidates)).map((item) => item.id), changed: items.flatMap((item) => ((old) => old && old.fingerprint !== item.fingerprint ? [{ id: item.id, previousId: old.id, before: { date: old.debutDate, time: old.debutTime, eventType: old.classification.eventType }, after: { date: item.debutDate, time: item.debutTime, eventType: item.classification.eventType } }] : [])(previousFor(item, items, baseline.candidates))), unchanged: items.filter((item) => previousFor(item, items, baseline.candidates)?.fingerprint === item.fingerprint).map((item) => item.id), notInCurrentReport: baseline.candidates.filter((old) => !items.some((item) => previousFor(item, items, baseline.candidates)?.id === old.id)).map((old) => ({ id: old.id, action: 'RECHECK_ONLY_NO_DELETION' })) };
}

// 외부 소스 객체에서 공지 전체와 API 응답·인증값을 제외한다.
function sourceSummary(source) {
  return Object.fromEntries(Object.entries(source).filter(([key]) => !['seeds', 'channels'].includes(key)));
}

// DB 연결과 적용 기능이 없는 보고 전용 계약을 고정한다.
function report(items, sources, official, now, baseline, truncatedCount = 0) {
  return ((candidates) => ({ schemaVersion: 2, mode: 'REPORT_ONLY', success: sources.every((source) => source.status !== 'FAILED') && official.status !== 'FAILED', runAt: now.toISOString(), window: S.windowFor(now), dbRead: false, dbWritten: false, emailSent: false, applySupported: false, approvalRequired: true, approvedCandidateIds: [], coverage: { status: sources.some((source) => source.status !== 'OK' || source.pageLimited) || official.status !== 'OK' || truncatedCount ? 'PARTIAL' : 'CONFIGURED_SOURCES_CHECKED', sources: [...sources, official].map(sourceSummary), truncatedCount, primaryAuthorAndFirstHistoryVerification: 'MANUAL_REVIEW_REQUIRED' }, totalCrawledCount: candidates.length, countsByEventType: candidates.reduce((counts, item) => ({ ...counts, [item.classification.eventType]: (counts[item.classification.eventType] || 0) + 1 }), {}), reviewRequiredCount: candidates.length, candidates, comparison: compare(candidates, validatePrevious(baseline)) }))(deduplicate(items).map((item) => finishCandidate(item, official, S.windowFor(now).today)).sort((left, right) => (left.debutDate || '9999').localeCompare(right.debutDate || '9999') || left.id.localeCompare(right.id)));
}

// 승인 검토용 파일에는 적용 명령이나 쓰기 권한을 넣지 않는다.
function approvalPreview(value) {
  return { schemaVersion: 1, mode: 'APPROVAL_PREVIEW_ONLY', hashAlgorithm: 'SHA256_CANONICAL_JSON', reportHash: E.hash(value), reportRunAt: value.runAt, approvedCandidateIds: [], candidates: value.candidates.map((item) => ({ id: item.id, fingerprint: item.fingerprint, displayName: item.displayName, eventType: item.classification.eventType, debutDate: item.debutDate, debutTime: item.debutTime, reasons: item.verification.reasons })), executionSupported: false, requiredNextStep: 'EXPLICIT_USER_APPROVAL_AND_SEPARATE_APPLY_IMPLEMENTATION' };
}

// 외부 텍스트를 GitHub 표·HTML·명령으로 해석하지 않게 이스케이프한다.
function markdown(value) {
  return String(value ?? '미정').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\r\n]+/g, ' ').replace(/[\\`*_[\]|]/g, '\\$&');
}

// 실행 화면에는 분류와 한계를 함께 표시하고 자동 승인으로 보일 수 없게 한다.
function summary(value) {
  return `## 데뷔 공지 조사 — 보고 전용\n\n운영 DB 조회·저장 없음 / 승인된 항목 0 / 적용 기능 없음\n\n후보 ${value.totalCrawledCount}건 · 조사 범위 ${value.window.startDate}~${value.window.endDate} KST · 소스 범위 ${value.coverage.status}\n\n${value.coverage.sources.map((source) => `- ${source.sourceId}: ${source.status}${source.reason ? ` (${source.reason})` : ''}`).join('\n')}\n\n| 이름 | 행사 분류 | KST 일정 | 검증 상태 | 보류 사유 |\n|---|---|---|---|---|\n${value.candidates.map((item) => `| ${markdown(item.displayName)} | ${LABELS[item.classification.eventType]} | ${markdown(item.debutDate)} ${markdown(item.debutTime)} | ${item.verification.status === 'CONFLICT' ? '근거 상충' : '검토 대기'} | ${markdown(item.verification.reasons.map(reasonText).join(', '))} |`).join('\n')}\n\n${value.comparison.available ? `이전 보고 대비 추가 ${value.comparison.added.length}, 변경 ${value.comparison.changed.length}, 동일 ${value.comparison.unchanged.length}, 재확인 ${value.comparison.notInCurrentReport.length}건.` : '첫 실행이거나 비교 자료가 없어 이전 보고와 대조하지 않았습니다.'}\n\n첫 데뷔 후보도 최초 활동과 본인 공지가 확인됐다는 뜻은 아닙니다. 각 후보의 출처와 근거는 report.json, 승인 검토 자료는 approval-preview.json에 있습니다.\n`;
}

// 스프레드시트에서 외부 이름이나 문구가 수식으로 실행되지 않게 한다.
function csvCell(value) {
  return `"${(/^[\s]*[=+@-]/.test(String(value ?? '')) ? "'" : '') + String(value ?? '').replace(/"/g, '""')}"`;
}

// 검토 표에는 개인 연락처와 인증값을 포함하지 않는다.
function csv(value) {
  return '\uFEFF' + [['id', '이름', '행사분류', '날짜_KST', '시간_KST', '채널', '검증상태', '보류사유', '출처'], ...value.candidates.map((item) => [item.id, item.displayName, item.classification.eventType, item.debutDate, item.debutTime, item.channel.url, item.verification.status, item.verification.reasons.join(';'), item.evidence.map((source) => source.url).join(';')])].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

module.exports = { candidate, deduplicate, finishCandidate, validatePrevious, compare, report, approvalPreview, summary, csv, csvCell };
