# 📐 V-DEBUT 문서화 및 폴더 관리 규칙 (Documentation Rules)

 본 문서는 V-DEBUT 프로젝트의 모든 기획, 기술, 참고 및 보안 문서의 분류 및 파일명 규칙을 정의합니다.

---

## 📁 1. 폴더 구조 디렉토리 맵

```
StreamingService/
├── 0. 대외비문서/                 # [보안] 내부 데이터베이스 접속 정보, 보안 키, 정책 문서
├── 1. 기획문서/                  # [기획] MVP 서비스 요구사항, 아키텍처, DB 스키마, API, UI/UX
│   ├── 00_DOCUMENTATION_RULES.md
│   ├── 01_PROJECT_PRD_MVP.md
│   ├── 02_SYSTEM_ARCHITECTURE.md
│   ├── 03_DATABASE_SCHEMA.md
│   ├── 04_API_SPECIFICATION.md
│   └── 05_UI_UX_DESIGN_GUIDE.md
├── 2. 참고 폴더문서/             # [참고&보안] 외부 API 규격, 보안/환경변수, DevOps 배포 가이드
│   ├── 01_PLATFORM_API_REFERENCE.md
│   ├── 02_SECURITY_AND_ENV_GUIDE.md
│   └── 03_DEVOPS_AND_DEPLOYMENT.md
├── backend/                      # Cloudflare Workers + D1 Backend Node.js/TS
└── frontend/                     # React + Vite + Tailwind CSS Frontend
```

---

## 🏷️ 2. 파일명 명명 규칙 (Naming Conventions)

1. **Prefix (순번)**: 주제별 순서와 중요도에 따라 `00_`, `01_`, `02_` 두 자리 숫자를 부여합니다.
2. **Body (파일명)**: **영문 대문자 SNAKE_CASE**를 사용합니다. (예: `01_PROJECT_PRD_MVP.md`)
3. **확장자**: 모든 문서는 Markdown (`.md`) 형식으로 작성합니다.

> [!IMPORTANT]
> - 기존 한글 및 버전에 명확성이 없던 파일들은 본 규칙에 따라 갱신·통합·정리되었습니다.
> - Git Commit 수행 시 커밋 메시지는 **반드시 명확한 한글(Ko)**로 작성해야 합니다.

---

## 📝 3. 문서 작성 표준 양식

- 모든 문서 상단에는 **[문서명]**, **[버전]**, **[최종 수정일]**, **[작성자/담당]** 표기를 포함합니다.
- 중요한 주의점이나 참고사항은 GitHub Alert (`> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]`)를 활용합니다.
