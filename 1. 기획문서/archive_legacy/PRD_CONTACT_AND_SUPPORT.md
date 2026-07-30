# 📮 [PRD] 문의하기 및 고객 지원 모듈 제품 요구사항 정의서 (Contact & Support)

- **제품명**: V-DEBUT HUB
- **문서 구분**: 기능별 PRD (3. 문의하기 및 피드백 모듈)
- **작성일**: 2026-07-30
- **문서 상태**: Approved

---

## 1. 개요 및 목적 (Overview & Objective)

문의하기 및 지원(Contact & Support) 모듈은 **오정보/오타 제보, 크리에이터 본인 소유권/사칭 신고, 기능 제안 및 광고/스폰서십 문의**를 손쉽게 접수받고, 운영진이 신속하게 처리할 수 있도록 돕는 양방향 커뮤니케이션 창구입니다.

---

## 2. 4가지 문의 유형 (Inquiry Categories)

| 유형 코드 | 문의 분류 | 주요 내용 | 우선 처리 등급 |
|---|---|---|---|
| **`INQ_ERR`** | 🐛 오정보 / 오타 제보 | 데뷔 시각 오기, 플랫폼 URL 오류, 닉네임 오타 | Normal (24시간 내 수정) |
| **`INQ_VERIFY`** | 🛡️ 본인 소유권 / 사칭 신고 | 본인 채널 무단 등록, 본인 확인 검증(Owner Verification) 요청 | **Urgent (12시간 내 우선 처리)** |
| **`INQ_FEAT`** | 💡 기능 제안 및 피드백 | UI 개선 요구, 새로운 플랫폼 추가 요청 | Low (정기 패치 시 반영) |
| **`INQ_AD`** | 💼 광고 및 비즈니스 문의 | 상단 배너 광고, 데뷔 프로모션 스폰서십 문의 | **High (영업일 1일 내 답변)** |

---

## 3. 핵심 기능 및 폼 명세 (Form & Flow Specifications)

### 📌 3.1 문의 접수 폼 (`/contact`)

```
+-----------------------------------------------------------------------------------+
| 📮 V-DEBUT HUB 문의 및 피드백 접수                                                |
+-----------------------------------------------------------------------------------+
| 1. 문의 카테고리 선택: [ 🛡️ 사칭 신고/본인 인증 ▼ ]                               |
| 2. 회신받을 이메일 주소: [ creator@example.com ]                                  |
| 3. 관련 데뷔 일정 URL / 크리에이터명 (선택): [ https://vdebut.hub/events/evt_123 ]|
| 4. 문의 상세 내용:                                                                |
|    [ 본인 채널이 무단으로 등록되어 삭제/소유권 변경을 요청합니다.              ] |
| 5. 증빙 첨부파일 (선택): [ 📂 파일 첨부 (최대 10MB 이미지/PDF) ]                     |
|                                                                                   |
| [ 🚀 문의 접수하기 ]                                                              |
+-----------------------------------------------------------------------------------+
```

---

### 📌 3.2 백엔드 처리 파이프라인 (Backend Workflow)

1. **접수 시 이메일 자동 회신 (Auto-Responder)**:
   - 문의 접수 즉시 제출자의 이메일로 접수 확인 번호(Ticket ID: `#TCK-20260730-01`) 발송.
2. **운영자 검수 큐 (Admin Review Queue) 자동 적재**:
   - `INQ_VERIFY`(사칭 신고)의 경우 검수 큐 상단에 붉은색 알림 뱃지로 배치.
3. **처리 상태 업데이트 시스템**:
   - `RECEIVED`(접수 완료) ➔ `IN_REVIEW`(검토 중) ➔ `RESOLVED`(처리 완료 및 이메일 회신).

---

## 4. 데이터 스키마 명세 (Data Schema)

```typescript
interface CustomerInquiry {
  id: string; // 'tck_2026_01'
  category: 'INQ_ERR' | 'INQ_VERIFY' | 'INQ_FEAT' | 'INQ_AD';
  contactEmail: string;
  targetEventId?: string;
  message: string;
  attachmentUrls?: string[];
  status: 'RECEIVED' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
  adminNote?: string;
  createdAtUtc: string;
  resolvedAtUtc?: string;
}
```
