# 살려드림 API 계약 (프론트 ↔ 백엔드)

프론트는 `src/api/services/*` 만 호출합니다. 지금은 `API_CONFIG.USE_MOCK = true` 라서
`src/mocks/mockServer.js` 가 같은 경로로 시연용 응답을 돌려줍니다.
백엔드가 준비되면 `src/api/config.js` 의 `USE_MOCK` 을 `false`, `BASE_URL` 을 실제 주소로 바꾸면 됩니다.

## 공통 규칙
- 요청/응답 JSON, 응답은 데이터 객체 그대로 (envelope 없음)
- 에러: HTTP 4xx/5xx + `{ "code": "...", "message": "사용자에게 보여줄 문장" }`
  - `DEVICE_UNAVAILABLE` 필요한 장치 연결 안 됨 (409)
  - `SAVE_FAILED` 기기 저장소 저장 실패 (500)
  - `NOT_FOUND`
- 프론트 타임아웃 5초 → `TIMEOUT` 으로 처리하고 "상태 확인 불가" 표시 후 GET 으로 재조회
- 시간 값은 epoch milliseconds

## 엔드포인트

| 기능 | 메서드 · 경로 | 응답 |
| --- | --- | --- |
| 부팅 | POST /system/boot | `{ logsLoaded, devices[], battery }` |
| 전원 종료 | POST /system/shutdown | `{ ok, at }` (마이크·메트로놈·구조신호 종료) |
| 배터리 | GET /battery | `{ available, level, charging, estimatedMinutes, low }` |
| 장치 목록 | GET /devices | `{ checkedAt, devices: Device[] }` |
| 장치 재연결 | POST /devices/:id/reconnect | `Device` |
| 타이머 | GET /timer · POST /timer/start · /pause · /resume | `Timer` |
| 타이머 초기화 | POST /timer/reset `{save:true}` | `Timer` (저장 실패 시 SAVE_FAILED, 초기화 안 함) |
| 메트로놈 | GET /metronome · POST /metronome/start · /stop | `{ playing, bpm, pausedBy, interrupted, state }` |
| 구조신호 | GET /rescue-signal · POST /rescue-signal/start · /stop | `{ playing, pausedBy, interrupted, state }` |
| 기록 저장 | POST /logs `{entries}` | `{ savedIds }` |
| 기록 조회 | GET /logs | `{ entries }` |

### 타입
```
Device  = { id: mic|speaker|aiModel|manualData, name, connected, operational,
            status: ok|error|unknown, detail, requiredFor: string[] }
Timer   = { status: idle|running|paused, startedAt, accumulatedMs, serverTime, segments[] }
          경과 시간 = accumulatedMs + (running ? now - startedAt : 0)
action  = { type: openManual, manualId, label } | { type: openManualList, label }
        | { type: runFeature, feature, action, label } | { type: reply, text, label }   (대화창 말풍선 버튼)
LogEntry= { id, kind: user_speech|user_report|device_guidance|device_result|system, title?, text, at, meta? }
```

### 동작 규칙 (플로우차트 반영)
- 메트로놈·구조신호 `state: "unknown"` = 연결 오류로 실제 출력 상태 확인 불가
- `pausedBy: "guidance"` = 음성 안내(TTS) 중 임시중단, 안내 후 자동 재개 (사용자가 끄면 재개 안 함). TTS 는 말하기 파트에서 연결
- 장치 재연결만으로 메트로놈·구조신호를 다시 켜지 않는다
- `/__mock/*` 경로는 시연용 목서버 전용이며 실서버에 만들 필요 없음

## 이 문서에 없는 API (담당 팀원 파트)
- 말하기: STT 세션, 발화 해석, 음성 안내(TTS), 자동 듣기 설정
- 긴급 매뉴얼: 목록, 상세
- 부저: 2026-11-02 범위에서 제외 (구조신호 출력 장치는 미정)

각 파트에서 `src/api/services/` 에 서비스 파일을 추가하고 이 표에 행을 추가해주세요.
