# 살려드림 Front 협업 가이드

화면은 파트별로 나눠 작업하고, 공통 상태(`useKit`)와 API 레이어(`src/api`)로 이어 붙입니다.

## 폴더 구조

```
src/
  api/                  백엔드 호출. services/* 만 화면에서 사용 (config.js 의 USE_MOCK 로 목/실서버 전환)
    API.md              엔드포인트 계약
  mocks/mockServer.js   시연용 목서버 (USE_MOCK=true 일 때 응답)
  state/KitContext.jsx  전역 상태 + 공개 API(useKit)
  components/
    common/             헤더, 상태바, 대화상자, 알림, 자리표시자
    main/               메인 화면 카드들 (타이머, GPS, 대화창, 기능 버튼)
    voice/              [말하기 파트]  VoiceInputModal.jsx (스텁)
    manual/             [긴급 매뉴얼 파트] ManualShortcutCard.jsx (스텁)
  screens/
    MainScreen.jsx          메인 (HOME)
    DeviceStatusScreen.jsx  기기 상태
    ManualScreen.jsx        [긴급 매뉴얼 파트] 목록 (스텁, 라우트 "ManualList")
    ManualDetailScreen.jsx  [긴급 매뉴얼 파트] 상세 (스텁, 라우트 "ManualDetail", params { manualId })
```

스텁 파일은 **파일 경로와 props 를 그대로 두고 내용만 교체**하면 메인·네비게이션에 바로 연결됩니다.

## 파트별 연결 지점

### 말하기 파트
- `components/voice/VoiceInputModal.jsx` — props: `visible`, `onClose()`, `onSubmit(text)`
- 메인의 `handleVoiceSubmit(text)` (MainScreen.jsx) 에서 확정 문장을 받습니다. 발화 해석을 붙일 때 여기서 이어서 처리하세요.
- 대화창 하단 마이크 상태 영역은 `ChatPanel` 의 `footer` prop 슬롯을 사용하세요.
- 음성 명령으로 기능 실행: `runFeature("metronome", "on", "voice")` — 버튼과 같은 흐름(중복 방지, 이미 켜짐 안내, 장치 확인, 실패 기록)을 탑니다.
- 대화창 기록: `addLog({ kind: "user_speech", text })`, `addLog({ kind: "device_guidance", title, text, actions })`

### 긴급 매뉴얼 파트
- `screens/ManualScreen.jsx`, `screens/ManualDetailScreen.jsx`, `components/manual/ManualShortcutCard.jsx`
- 이동: `navigation.navigate("ManualDetail", { manualId })`, `navigation.navigate("ManualList")`
- 대화창 안내 버튼에서 매뉴얼 열기: `actions: [{ type: "openManual", manualId, label }]`
- 헤더(뒤로가기·배터리·시간·전원)는 네비게이터가 자동으로 붙입니다.

## useKit 공개 API

| 이름 | 설명 |
| --- | --- |
| `runFeature(id, "on"\|"off"\|"toggle", source)` | 기능 실행. 결과 `{ ok, reason }` |
| `addLog(entry)` | 대화창 기록 추가 + 저장. kind: `user_speech` `user_report` `device_guidance` `device_result` `system` |
| `showNotice(text, tone)` | 상단 알림. tone: `info` `success` `error` |
| `metronome`, `rescue` | 기능 상태 (예: `metronome.playing`) |
| `devices[id]` | 장치 상태 (`status === "ok"` 이면 사용 가능) |
| `timer`, `useElapsed()` | 타이머 상태 / 경과 시간(ms) |

## 자주 하는 작업

**켜고 끄는 기능 추가** — `api/services/` 에 서비스 추가 → `state/KitContext.jsx` 의 `FEATURES` 에 항목 추가(label, device, isOn, on, off, get, apply, 문구) → `MainScreen.jsx` 에 버튼 추가 → (목데이터) `mocks/mockServer.js` 에 `route(...)` 추가. `runFeature(id)` 가 처리 중·이미 켜짐·장치 확인·실패 기록을 공통으로 처리합니다.

**장치 추가/삭제** — `mocks/mockServer.js` 의 `DEVICE_META`, `screens/DeviceStatusScreen.jsx` 의 `ORDER`·`ICON`·`okLabel`·`names`, `KitContext.jsx` 의 `DEVICE_LABEL` 에서 같은 id 를 추가/삭제. 기능이 장치를 필요로 하면 `FEATURES` 의 `device` 에 id 를 넣습니다.

**대화창 버튼 타입 추가** — `MainScreen.jsx` 의 `handleChatAction` switch 에 case 추가.

## 범위 메모 (2026-11-02)
- 조명·지도 제외, GPS 는 좌표만
- 부저 제외 → 구조신호는 출력 장치 미지정(`FEATURES.rescue.device: null`)
- 말하기·긴급 매뉴얼은 담당 팀원 파트 (현재 스텁)
