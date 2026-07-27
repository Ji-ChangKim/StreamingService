# V-DEBUT HUB 개발 브랜치, DB 동기화 및 클라이언트 버전 관리 가이드

본 문서는 **V-DEBUT HUB**의 DEV/LIVE 브랜치 관리, Cloudflare D1 DB 동기화 및 클라이언트 버저닝 정책을 정리한 운영 가이드입니다.

---

## 1. Git 브랜치 및 서버 배포 파이프라인

### 1.1 브랜치 전략
- `dev` 브랜치:
  - 기능 개발 및 테스트 브랜치.
  - Cloudflare Workers Staging 환경 배포.
  - Staging DB (`v-debut-hub-db-dev`) 바인딩.
- `live` (또는 `main`) 브랜치:
  - 운영 프로덕션 브랜치.
  - Cloudflare Workers Production 환경 배포.
  - Production DB (`v-debut-hub-db-live`) 바인딩.

### 1.2 서버(Backend API) 원칙
- **항상 최신 로직 유지**: 서버 코드는 최신 기능을 빠르게 반영하되 하위 호환성(Backward Compatibility)을 준수합니다.
- **클라이언트 버전 수신**: 클라이언트가 전송하는 `X-Client-Version` 헤더를 수신하여, 구버전 클라이언트의 요청도 호환성을 유지하여 응답합니다.

---

## 2. DB 동기화 (LIVE -> DEV)

운영 환경(LIVE DB)의 최신 이벤트/프로필 데이터를 개발 환경(DEV DB)으로 복제하여 테스트하기 위해 제공되는 동기화 체계입니다.

### 2.1 동기화 실행 방법
```bash
# 백엔드 디렉토리에서 동기화 스크립트 실행
cd backend
npm run db:sync:live-to-dev
```

### 2.2 동기화 절차
1. `wrangler d1 export v-debut-hub-db-live`를 통해 LIVE DB 데이터 덤프 추출.
2. 덤프 파일 내 민감한 인증 토큰 마스킹/정제.
3. `wrangler d1 execute v-debut-hub-db-dev`를 통해 DEV DB로 덤프 적용.

---

## 3. Client 버전 관리 정책

- **버전 스키마**: Semantic Versioning (`vMAJOR.MINOR.PATCH`) 사용 (예: `v0.1.0`)
- **빌드 시 버전 주입**: 프론트엔드 빌드 타임 환경변수 `VITE_APP_VERSION`으로 버전 주입.
- **서버 통신**: 모든 API 요청 헤더에 `X-Client-Version: v0.1.0` 포함.
- **클라이언트 버전 체크 API**: GET `/api/v1/system/version` 엔드포인트를 호출하여 최소 요구 버전 및 최신 안내 메시지 확인 가능.
