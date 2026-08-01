# 📖 V-DEBUT 기획 및 기술 문서 통합 목차

V-DEBUT 프로젝트의 라이브 프로덕션(Production Live) 공식 기획 및 개발 명세서입니다.

---

## 📌 공식 문서 목록 (Production Standard v2.0)

1. **[00_DOCUMENTATION_RULES.md](./00_DOCUMENTATION_RULES.md)**: 문서화 및 작성 명명 규칙
2. **[01_PROJECT_PRD_MVP.md](./01_PROJECT_PRD_MVP.md)**: V-DEBUT 서비스 PRD 및 기능 정의서
3. **[02_SYSTEM_ARCHITECTURE.md](./02_SYSTEM_ARCHITECTURE.md)**: Cloudflare Worker + D1 짝꿍 테이블 아키텍처
4. **[03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)**: D1 Pair Tables (`streamerChannel` & `streamerChannel_info` + `country_code`) 스키마 & ERD
5. **[04_API_SPECIFICATION.md](./04_API_SPECIFICATION.md)**: 백엔드 REST API 명세서 (`countryCode` 지원)
6. **[05_UI_UX_DESIGN_GUIDE.md](./05_UI_UX_DESIGN_GUIDE.md)**: UI/UX 디자인 시스템 및 메인 프로필 카드 정책
7. **[graph.html](./graph.html)**: Graphify v8 코드베이스 & DB 스키마 인터랙티브 시각화 지식 그래프

---

## 📂 참고 및 배포 문서
- **[2. 참고 폴더문서](../2.%20참고%20폴더문서)**: 외부 플랫폼 API 규격, 보안/환경변수, DevOps 배포 가이드
- **[backend/migrations/README.md](../backend/migrations/README.md)**: Cloudflare D1 마이그레이션 및 운영 가이드
