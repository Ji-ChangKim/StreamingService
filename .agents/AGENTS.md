# Workspace Rules & Guidelines

## Code Design Principles
- **단일 책임 원칙 (Single Responsibility Principle)**: 하나의 함수는 항상 단 하나의 명확한 기능/책임만 동작하도록 작성한다.
- 복합 작업이 필요한 경우 데이터 변환, 유효성 검사, API 요청, UI 상태 업데이트 등의 세부 기능을 독립된 단일 전용 함수로 분리한다.

## Git & Workflow Guidelines
- **Git 커밋 메시지 한글 작성 원칙**: `git commit` 명령을 수행할 때 커밋 메시지는 **반드시 명확한 한글(Ko)**로 작성한다. (예: `git commit -m "feat: 캘린더 컨트롤 UI 개편 및 robots.txt 추가"`)

