# 📖 V-DEBUT 기획 및 기술 문서 통합 목차

- **문서명**: VDébut 기획 및 기술 문서 통합 목차
- **버전**: v1.9 (등록·관리자 정정 개발 반영 추가)
- **최신 배포 보고**: [LIVE 업데이트 점검 및 배포 결과](./16_LIVE_RELEASE_READINESS.md) — 운영 데이터 보존·누락 복원·인증 보완·언어 전환·실제 적용 및 복구 기준
- **최종 수정일**: 2026-10-11
- **작성자/담당**: Codex 작성 · 프로젝트 담당자 검토

VDébut 프로젝트의 제품 기획 및 기술 문서 목차입니다. 각 문서의 버전·상태를 기준으로 현재 구현과 향후 요구사항을 구분합니다.

현재 서비스 방향성은 **“버튜버와 팬의 소개팅”**을 중심으로 개정한 [통합 플랫폼 PRD v3.0 검토안](./01_PROJECT_PRD_MVP.md)을 참조합니다. 신규 버튜버의 직접 데뷔 등록을 현재 성장 목표로, 국가·방송 플랫폼·규모를 넘어 정보를 축적하는 통합 플랫폼을 장기 비전으로 정의합니다.

---

## 📌 제품 및 기술 문서 목록

1. **[00_DOCUMENTATION_RULES.md](./00_DOCUMENTATION_RULES.md)**: 문서화 및 작성 명명 규칙
2. **[01_PROJECT_PRD_MVP.md](./01_PROJECT_PRD_MVP.md)**: 통합 버튜버 플랫폼 PRD v3.0 검토안 — 비전·사용자 가치·직접 등록·발견·통계·수용 기준·성공 지표
3. **[02_SYSTEM_ARCHITECTURE.md](./02_SYSTEM_ARCHITECTURE.md)**: Cloudflare Worker + D1 짝꿍 테이블 아키텍처
4. **[03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)**: D1 Pair Tables (`streamerChannel` & `streamerChannel_info` + `country_code`) 스키마 & ERD
5. **[04_API_SPECIFICATION.md](./04_API_SPECIFICATION.md)**: 백엔드 REST API 명세서 (`countryCode` 지원)
6. **[05_UI_UX_DESIGN_GUIDE.md](./05_UI_UX_DESIGN_GUIDE.md)**: UI/UX 디자인 시스템 및 메인 프로필 카드 정책
7. **[graph.html](./graph.html)**: Graphify v8 코드베이스 & DB 스키마 인터랙티브 시각화 지식 그래프
8. **[11_SCREEN_PLAN.md](./11_SCREEN_PLAN.md)**: 화면 계획서 v1.0 검토안 — URL·설명·핵심 전달 내용, 기존·추가 화면 구분, PRD 연결
9. **[12_MAIN_CALENDAR_IMPROVEMENT_PLAN.md](./12_MAIN_CALENDAR_IMPROVEMENT_PLAN.md)**: 화면 개선 01 — 메인 데뷔 캘린더의 배치·탐색·소개·등록·상태·PC/모바일 수용 기준
10. **[13_DEV_PLATFORM_IMPLEMENTATION.md](./13_DEV_PLATFORM_IMPLEMENTATION.md)**: 개발 도메인 전체 화면 구현·URL·등록 심사·소유권 관리·배포·검증 및 현재 지원 범위
11. **[14_BRAND_AND_REGISTRATION_RESTORATION.md](./14_BRAND_AND_REGISTRATION_RESTORATION.md)**: 기존 브랜드·하이라이트·자동 프로필 조회 복원, 첨부 등록 레이아웃, 중복 버튼 제거, 신규 기능 사전 보고·승인 원칙

12. **[15_PERFORMANCE_OPTIMIZATION.md](./15_PERFORMANCE_OPTIMIZATION.md)**: 페이지·메모리 최적화, 전후 측정, 캐시 정책, 검증 및 남은 첫 조회 병목

13. **[16_LIVE_RELEASE_READINESS.md](./16_LIVE_RELEASE_READINESS.md)**: LIVE 배포·데이터 보존·운영 검증 기록
14. **[17_PRD_GAP_CHECKLIST.md](./17_PRD_GAP_CHECKLIST.md)**: PRD 요구사항별 완료·부분·제외 판정과 등록·운영·발견·계측 잔여 과제
15. **[18_REGISTRATION_AND_ADMIN_IMPROVEMENTS.md](./18_REGISTRATION_AND_ADMIN_IMPROVEMENTS.md)**: 등록 국가·시간대·신청 역할, 재시도/채널 중복 방지, 관리자 정정·이력·복구 구현 및 개발 배포 결과

---

## 📂 참고 및 배포 문서
- **[2. 참고 폴더문서](../2.%20참고%20폴더문서)**: 외부 플랫폼 API 규격, 보안/환경변수, DevOps 배포 가이드
- **[backend/migrations/README.md](../backend/migrations/README.md)**: Cloudflare D1 마이그레이션 및 운영 가이드
