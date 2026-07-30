# 🛠️ [참고-DevOps] 03_DEVOPS_AND_DEPLOYMENT.md
**버전**: v1.0  
**최종 수정일**: 2026-07-30  
**목적**: 프로젝트 빌드, Git 커밋 수칙, Cloudflare Workers 라이브 배포 프로세스 정리  

---

## 1. Git 버전 관리 및 커밋 지침 (Mandatory Rule)

> [!IMPORTANT]
> **Git 커밋 메시지 한글 작성 필수 원칙**
> - `git commit` 명령을 수행할 때 커밋 메시지는 **반드시 명확한 한글(Ko)**로 작성해야 합니다.
> - 예시:
>   - `git commit -m "feat: 유튜브 프로필 자동 파서 구현 및 YouTube 채널 연동 추가"`
>   - `git commit -m "fix: SOOP 최신 API 도메인(chapi.sooplive.co.kr) 반영"`
>   - `git commit -m "style: 상단 메뉴 및 푸터 카피라이트 문구 변경"`

---

## 2. 프로젝트 빌드 및 배포 워크플로우 (Deployment Steps)

### Step 1. 프론트엔드 프로젝트 빌드
```bash
cmd /c "npm run build"
```
*Vite 및 TypeScript 컴파일 검증 후 `frontend/dist` 생성*

### Step 2. Git 변경사항 스테이징 및 한글 커밋
```bash
git add .
git commit -m "feat: [기능 설명 한글 작성]"
git push origin main
```

### Step 3. Cloudflare Workers 라이브 배포
```bash
cmd /c "npm run deploy"
```
*Cloudflare Workers & Assets가 실시간 라이브 도메인(`streaming.gametps.workers.dev` / `vdebut.live`)으로 업로드 및 배포 완료됨.*

---

## 3. D1 데이터베이스 마이그레이션 명령어
```bash
# 로컬 D1 DB 스키마 적용
npx wrangler d1 execute streaming-db --local --file=./backend/schema.sql

# 프로덕션 D1 DB 스키마 적용
npx wrangler d1 execute streaming-db --remote --file=./backend/schema.sql
```
