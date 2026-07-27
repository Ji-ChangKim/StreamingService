# Workspace Rules & Guidelines

## Code Design Principles
- **단일 책임 원칙 (Single Responsibility Principle)**: 하나의 함수는 항상 단 하나의 명확한 기능/책임만 동작하도록 작성한다.
- 복합 작업이 필요한 경우 데이터 변환, 유효성 검사, API 요청, UI 상태 업데이트 등의 세부 기능을 독립된 단일 전용 함수로 분리한다.
