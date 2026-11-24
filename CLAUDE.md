## 화면 범위 유지

- 메인 상단 하이라이트와 캘린더는 기존 그대로 유지한다. 상세·목록 시안 반영을 이유로 변경하지 않는다.
- Header·Footer도 유지한다. 구체적인 유지 범위는 루트 `AGENTS.md`를 따른다.

## 한국어 텍스트 줄바꿈 (모든 화면 제작 시 필수)

- 새로 만들거나 개편하는 화면의 본문 최상위 요소에 `word-break: keep-all; overflow-wrap: break-word;`를 넣는다. 한국어가 어절 중간("보통이 / 에요")에서 끊기지 않게 하기 위해서다.
- 문단·요약 문장처럼 여러 줄이 되는 글에는 `text-wrap: pretty;`를 함께 넣어 마지막 줄에 한 단어만 남지 않게 한다.
- `max-width`로 줄 길이를 제한할 때는 위 두 설정이 있는지 먼저 확인한다.
- 화면을 만든 뒤에는 데스크톱(1440px)과 모바일(390px) 캡처로 문단 줄바꿈을 직접 확인한다.
- 메인 하이라이트·캘린더·Header·Footer는 유지 범위라 이 규칙을 일괄 적용하지 않는다(사용자가 요청할 때만).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
