# Graphify v8 사용법 및 개발 가이드라인

## 1. Graphify 개요

**Graphify**는 코드베이스, SQL 스키마, 문서, 구성 파일 등을 **지식 그래프(Knowledge Graph)** 형태로 변환하여 AI 코딩 어시스턴트(Antigravity, Gemini CLI 등)가 프로젝트 전반의 구조와 파일 간 상관관계를 신속하게 쿼리할 수 있도록 돕는 로컬 파싱 기반 오픈소스 도구입니다.

### 주요 이점
- **무료 및 오프라인 (Local-First):** `tree-sitter` AST 파서를 활용하여 외부 LLM 호출 없이 완전히 로컬 환경에서 코드 관계(calls, imports, inherits, table references 등)를 맵핑합니다.
- **컨텍스트 토큰 절감:** 대규모 텍스트 탐색(Grep) 대신 생성된 지식 그래프(`graph.json`)를 쿼리하여 필요한 파트만 고정밀도로 탐색합니다.
- **인터랙티브 시각화:** `graphify-out/graph.html`을 웹 브라우저로 열어 서브시스템(커뮤니티)과 연결망을 한눈에 확인할 수 있습니다.

---

## 2. CLI 주요 명령어 사용법

터미널(PowerShell/Bash)에서 직접 다음 명령어들을 수행할 수 있습니다.

### 2.1 지식 그래프 생성 / 갱신
```powershell
# 프로젝트 루트 디렉터리 전체 맵핑 (graphify-out/ 생성)
graphify .
```

### 2.2 지식 개념 설명 (Explain)
특정 모듈, 클래스, 테이블, 함수 등의 연결망과 출처를 조회합니다.
```powershell
graphify explain "creator_profiles"
graphify explain "APIRouter"
```

### 2.3 연결 경로 추적 (Path)
두 요소 간의 shortest path (연결 고리)를 추적합니다.
```powershell
graphify path "StudioSubmitModal" "creator_profiles"
```

### 2.4 자연어 쿼리 (Query)
지식 그래프 상에서 질문과 관련된 서브그래프를 조회합니다.
```powershell
graphify query "어떤 서비스가 크리에이터 프로필 정보를 처리하는가?"
```

---

## 3. AI 코딩 어시스턴트(Antigravity) 스킬 활용 가이드

프로젝트 스킬로 등록되어 있으므로 (`.agents/skills/graphify/`), 에이전트 대화 창에서 직접 호출할 수 있습니다.

```text
/graphify .
```

### AI 협업 패턴
1. **신규 기능 개발 전:** `/graphify`를 통해 연관 파일 및 DB 테이블 구조(예: `streamerChannel`, `streamerChannel_info`) 관계를 미리 파악합니다.
2. **리팩토링 시:** 특정 함수의 변경이 어떤 프론트엔드/백엔드 모듈까지 영향을 미치는지 `graphify path` 또는 `graphify explain`을 통해 영향 범위를 체크합니다.

---

## 4. 프로젝트 개발 규칙 준수 가이드라인

1. **아티팩트 무시 (`.gitignore`)**
   - `graphify-out/` 디렉터리는 프로젝트 빌드 결과물과 동일하므로 Git에 커밋하지 않습니다. (`.gitignore`에 추가되어 있음)
2. **사전 승인 원칙 준수 (`AGENTS.md`)**
   - Graphify는 조회(Read-Only) 도구입니다. 지식 그래프 결과를 바탕으로 실제 코드를 수정하기 전에는 반드시 구현 계획을 사용자에게 상세 보고하고 명시적 승인을 받아야 합니다.
3. **타사 브랜드 자산 무가공 원칙 및 DB 마이그레이션 규칙**
   - 지식 그래프를 활용한 UI/DB 작업 시에도 치지직, SOOP, YouTube 등의 브랜드 자산 무가공 원칙과 최신 짝꿍 테이블 구조(`streamerChannel` & `streamerChannel_info`) 마이그레이션 규칙을 엄격히 준수해야 합니다.
4. **Git 한글 커밋 메시지**
   - 스킬 등록 및 문서 추가 등 관련 Git 커밋 수행 시 명확한 한글 메시지를 작성합니다. (예: `git commit -m "docs: Graphify v8 가이드라인 문서 추가"`)
