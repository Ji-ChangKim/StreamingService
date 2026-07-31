# Workspace Rules & Guidelines

## Code Design Principles
- **단일 책임 원칙 (Single Responsibility Principle)**: 하나의 함수는 항상 단 하나의 명확한 기능/책임만 동작하도록 작성한다.
- 복합 작업이 필요한 경우 데이터 변환, 유효성 검사, API 요청, UI 상태 업데이트 등의 세부 기능을 독립된 단일 전용 함수로 분리한다.

## Mandatory Approval & Brand Guidelines
- **작업 전 사전 승인 원칙 (Pre-approval Requirement)**: 모든 코드 작성, 기능 구현 및 디자인 수정 작업 전, **반드시 구체적인 구현 방식과 계획을 사용자에게 상세 보고하고 검사 및 명시적 승인(Approval)을 받은 후에만** 실작업을 진행한다.
- **타사 브랜드 자산 무가공 원칙 (Strict Brand Compliance)**: 치지직, SOOP, YouTube 등 타 스트리밍 플랫폼의 공식 로고 및 아이콘 자산은 어떠한 경우에도 임의 튜닝, 가공, 임의 배경 추가, 변형을 절대 금지하며, 공식 배포 자산 순수 그대로만 렌더링한다.

## Git & Workflow Guidelines
- **Git 커밋 메시지 한글 작성 원칙**: `git commit` 명령을 수행할 때 커밋 메시지는 **반드시 명확한 한글(Ko)**로 작성한다. (예: `git commit -m "feat: 캘린더 컨트롤 UI 개편 및 robots.txt 추가"`)

## Database & Migration Guidelines
- **DB 마이그레이션 및 작업 안전 관리 원칙**:
  - 단순 컬럼 추가나 데이터 UPDATE 작업 시 기존 마이그레이션 스크립트를 임의로 훼손/수정하거나 과거 마이그레이션을 일괄 재실행하지 않는다.
  - 현재 활성 데이터베이스 표준 스키마는 `streamerChannel` & `streamerChannel_info` 짝꿍 테이블 구조이며, 레거시 마이그레이션(`0001`~`0005`)과의 충돌 방지를 위해 DB 작업 시 최신 스키마 가이드를 항상 참조한다.
  - 마이그레이션 및 스키마 변경 사항은 반드시 문서(`backend/migrations/README.md` 등)를 통해 최신화 상태로 동기화 관리한다.
