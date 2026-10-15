const corrections = require('../content/adsense-p0-corrections-2026-10-15.json');

// 확인된 필드만 변경하고 원본 주소·소유권·미확인 정보를 보존한다.
function correctedProfile(original, correction, holdProfile, checkedAt) {
  return correction.hold ? holdProfile({ ...original, ...correction.fields }, 'HOLD', checkedAt) : { ...original, ...correction.fields };
}

module.exports = { corrections, correctedProfile };
