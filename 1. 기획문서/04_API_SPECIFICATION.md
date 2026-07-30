# 📡 [기획] 04_API_SPECIFICATION.md
**버전**: v1.0  
**최종 수정일**: 2026-07-30  
**Base URL**: `https://streaming.gametps.workers.dev/api/v1`  

---

## 1. 플랫폼 프로필 자동 조회 API

### `GET /platform/profile`
입력된 방송국 URL에서 크리에이터 정보(닉네임, 아바타, 소개글)를 자동 추출합니다.

#### Request Parameters (Query)
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `platform` | String | Yes | `CHZZK`, `SOOP`, `YOUTUBE`, `TWITCH` | `SOOP` |
| `url` | String | Yes | 방송국/채널/동영상 URL | `https://www.sooplive.com/station/ddiddu4` |

#### Response Example (Success - 200 OK)
```json
{
  "success": true,
  "platform": "SOOP",
  "channelId": "ddiddu4",
  "creatorName": "치즈치즈♪",
  "profileImageUrl": "https://profile.img.sooplive.co.kr/LOGO/dd/ddiddu4/ddiddu4.jpg",
  "channelUrl": "https://www.sooplive.com/station/ddiddu4",
  "description": "치즈치즈♪의 공식 SOOP 방송국입니다.",
  "verified": true
}
```

---

## 2. 데뷔 일정 API (Events API)

### `GET /events`
전체 등록된 데뷔 일정 목록을 조회합니다.

#### Response Example (200 OK)
```json
[
  {
    "id": "evt_1785404500000",
    "type": "✨ 최초 데뷔",
    "startAtUtc": "2026-08-01T11:00:00.000Z",
    "originalTimezone": "Asia/Seoul",
    "title": "치즈치즈♪ 데뷔 방송",
    "description": "반가워요! 치즈치즈♪입니다.",
    "creator": {
      "id": "cr_1785404500000",
      "displayName": "치즈치즈♪",
      "avatarUrl": "https://profile.img.sooplive.co.kr/LOGO/dd/ddiddu4/ddiddu4.jpg",
      "agency": "개인세",
      "languages": ["KO"]
    },
    "links": [
      {
        "id": "link_1785404500000",
        "platform": "SOOP",
        "url": "https://www.sooplive.com/station/ddiddu4",
        "isPrimary": true
      }
    ]
  }
]
```

### `POST /events`
새로운 데뷔 일정을 등록합니다.

#### Request Body
```json
{
  "type": "✨ 최초 데뷔",
  "startAtUtc": "2026-08-01T11:00:00.000Z",
  "originalTimezone": "Asia/Seoul",
  "title": "치즈치즈♪ 데뷔 방송",
  "description": "반가워요! 치즈치즈♪입니다.",
  "creator": {
    "displayName": "치즈치즈♪",
    "avatarUrl": "https://profile.img.sooplive.co.kr/LOGO/dd/ddiddu4/ddiddu4.jpg",
    "agency": "개인세",
    "languages": ["KO"]
  },
  "links": [
    {
      "platform": "SOOP",
      "url": "https://www.sooplive.com/station/ddiddu4",
      "isPrimary": true
    }
  ]
}
```

### `PUT /events/:id`
기존 등록된 데뷔 일정을 수정합니다.

#### Path Parameter
- `id`: 수정할 이벤트 ID (`evt_...`)

#### Request Body
- `POST /events`와 동일한 Schema (업데이트 항목 포함)
