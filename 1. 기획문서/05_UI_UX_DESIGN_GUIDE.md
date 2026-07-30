# 🎨 [기획] 05_UI_UX_DESIGN_GUIDE.md
**버전**: v1.0  
**최종 수정일**: 2026-07-30  

---

## 1. 디자인 시스템 & 컬러 팔레트 (Color Tokens)

| 토큰명 | Hex Code | 사용 위치 |
| :--- | :--- | :--- |
| **Primary Base** | `#0F172A` (Slate 900) | 메인 브랜드 컬러, 헤더/버튼 배경 |
| **Accent Blue** | `#2563EB` (Blue 600) | 주요 강조 텍스트, 활성 탭, 링크 |
| **Background** | `#F8FAFC` (Slate 50) | 전체 메인 배경색 |
| **Border Gray** | `#E2E8F0` / `#CBD5E1` | 카드 테두리, 구분선 |
| **CHZZK Badge** | `#3B89FF` | 치지직 플랫폼 태그 |
| **SOOP Badge** | `#FF6B00` | SOOP 플랫폼 태그 |
| **YouTube Badge** | `#EE1D36` | 유튜브 플랫폼 태그 |

---

## 2. 타이포그래피 (Typography)

- **Headings & Brand Title**: `'Outfit', sans-serif` (Google Fonts)
- **Body & Controls**: `'Inter', sans-serif` (Google Fonts)

---

## 3. UI/UX 레이아웃 규칙

1. **상단 네비게이션 (Navbar)**:
   - 로고 `V-DEBUT` + `[데뷔 일정]` 탭 + `[데뷔 일정 등록]` CTA 버튼
   - 스티키 top-0 고정으로 항상 스크롤 상단 유지.
2. **하단 푸터 (Footer)**:
   - 카피라이트 문구: `© 2026 GameTPS. All rights reserved.`
   - 불필요한 링크(공지사항, 약관, 문의 등) 제거로 깔끔함 유지.
3. **스케줄 패널 (Schedule Inspector Panel)**:
   - 캘린더 날짜 클릭 시 우측 슬라이딩 드로어로 표시.
   - `max-h-screen overflow-hidden` 구조로 하단 카드 잘림 방지.
4. **기업 뱃지 가시성**:
   - `개인세` 태그는 미노출하며, 기업 소속일 때만 `🏢 AgencyName` 형태로 표시.
5. **GIF 아바타 애니메이션**:
   - 모든 프로필 렌더링 영역(`<img>`)에서 `.gif` 포맷 자동 재생 지원.
