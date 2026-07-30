# 🔒 [참고-보안] 02_SECURITY_AND_ENV_GUIDE.md
**버전**: v1.0  
**최종 수정일**: 2026-07-30  
**분류**: 보안 및 환경 변수 / 인프라 설정 지침  

---

## 1. 보안 지침 & 환경 변수 관리 수칙

> [!CAUTION]
> **대외비 및 보안 민감 정보 관리**
> 1. DB 접속 비밀번호, API Secret Key, Cloudflare API Token 등 민감 정보는 절대로 Git 퍼블릭 저장소에 커밋하지 않습니다.
> 2. 관련 대외비 정보는 루트의 `0. 대외비문서/` 폴더 내에 따로 안전하게 격리 보관합니다.
> 3. `.gitignore`에 `.env`, `.dev.vars`, `wrangler.toml`의 secret 값들이 포함되어 있는지 상시 확인합니다.

---

## 2. Cloudflare Workers Binding 및 환경 변수

### 2.1 D1 Database Binding (`wrangler.toml`)
- **Binding Name**: `DB`
- **Database Name**: `streaming-db`
- **Database ID**: `6757674b-3344-4ddd-a96c-c612f34aea3f`

### 2.2 CORS (Cross-Origin Resource Sharing) 보안
- 프론트엔드(`vdebut.live`, `streaming.gametps.workers.dev`)로부터의 요청만 허용하도록 백엔드 응답 헤더 설정:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 3. 네트워크 요청 보안 (Cloudflare Workers Restricted Headers)

> [!WARNING]
> Cloudflare Workers `fetch()` 호출 시 `User-Agent` 조작 시 일부 브라우저 호환성 에러가 발생할 수 있습니다. 
> 백엔드 외부 API 요청 시 안전한 헤더 구성을 유지하십시오.
