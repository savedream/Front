import { kitRequest } from "./kitClient";

/**
 * 백엔드(Back) GET /api/devices 를 기존 화면이 쓰던 모양으로 바꾼다.
 *
 * 백엔드는 장치·소리 기능·타이머·배터리를 GET /api/devices 한 번에 준다.
 * 배터리·장치·메트로놈·구조신호·타이머 서비스가 같은 주기에 각각 부르므로 짧게 묶어서 한 번만 요청한다.
 * 서버 필드(snake_case)는 이 파일과 services/* 에서만 바꾼다. 화면·KitContext 는 기존 모양 그대로 쓴다.
 */

/**
 * 기기 파트용 키트 요청. kitRequest(공통)를 그대로 부르고, 시간 초과면 e.isTimeout = true 를 붙인다.
 * (KitContext 가 기존 ApiError 처럼 e.isTimeout 으로 시간 초과를 가린다. 공통 kitErrors.js 는 건드리지 않는다)
 */
export async function kitCall(method, path, body) {
  try {
    return await kitRequest(method, path, body);
  } catch (e) {
    if (e?.code === "TIMEOUT") e.isTimeout = true;
    throw e;
  }
}

const SHARE_MS = 500;
let last = { at: 0, promise: null };

/** GET /api/devices (0.5초 안의 요청은 같은 응답을 같이 쓴다) */
export function fetchKitDevices({ fresh = false } = {}) {
  const now = Date.now();
  if (!fresh && last.promise && now - last.at < SHARE_MS) return last.promise;
  const promise = kitCall("GET", "/devices");
  last = { at: now, promise };
  promise.catch(() => {
    if (last.promise === promise) last = { at: 0, promise: null };
  });
  return promise;
}

/** 기능 요청 뒤 다음 조회는 새로 받는다 */
export function invalidateKitDevices() {
  last = { at: 0, promise: null };
}

/** ISO 시각 → ms (없으면 null) */
export const toMs = (iso) => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/* ---------------------------------------------------------------- 장치 목록 */

const META = {
  mic: { name: "마이크", requiredFor: ["음성 입력", "말하기"] },
  speaker: { name: "스피커", requiredFor: ["음성 안내", "구조신호"] },
  aiModel: { name: "AI 응급 모델", requiredFor: ["음성 상황 해석"] },
  manualData: { name: "매뉴얼 데이터", requiredFor: ["응급 매뉴얼"] },
};

const MIC_DETAIL = {
  armed: "음성 입력 준비됨",
  capturing: "듣고 있어요",
  processing: "말을 처리하고 있어요",
  paused: "음성 입력 일시정지",
  blocked: "구조신호 중이라 듣기 멈춤",
  unavailable: "마이크 연결 확인 필요",
};

function device(id, ok, detail, statusOverride) {
  return {
    id,
    name: META[id].name,
    requiredFor: META[id].requiredFor,
    connected: ok,
    operational: ok,
    status: statusOverride ?? (ok ? "ok" : "error"),
    detail,
  };
}

/** 백엔드 devices 응답 → { checkedAt, devices: Device[] } (id: mic | speaker | aiModel | manualData) */
export function toDeviceList(data) {
  const mic = data.microphone ?? {};
  const speaker = data.speaker ?? {};
  const llm = data.models?.llm ?? {};
  const manual = data.manual_db ?? {};

  const llmOk = !!llm.loaded;
  const llmDetail = llmOk
    ? `모델 ${llm.version ?? ""}${llm.warmed ? "" : " · 준비 중"}`.trim()
    : "모델 확인 불가";

  return {
    checkedAt: Date.now(),
    devices: [
      {
        ...device("mic", !!mic.connected, mic.connected ? MIC_DETAIL[mic.state] ?? "음성 입력 준비됨" : MIC_DETAIL.unavailable),
        micState: mic.state ?? null, // armed | capturing | processing | paused | blocked | unavailable (상시 듣기 토글)
      },
      device(
        "speaker",
        !!speaker.connected,
        speaker.connected ? `음성 안내 볼륨 ${speaker.volume ?? "-"}%` : "스피커 연결 확인 필요"
      ),
      device("aiModel", llmOk, llmDetail),
      device(
        "manualData",
        !!manual.loaded,
        manual.loaded ? `매뉴얼 데이터 v${manual.version ?? "-"}` : "데이터 확인 불가"
      ),
    ],
  };
}

/* ---------------------------------------------------------------- 배터리 */

/**
 * 백엔드 battery → { available, level, charging, estimatedMinutes, low }
 * 가짜 모드에서는 battery: null 이라 null 을 돌려준다 (화면은 "확인 불가").
 * ⚠ 실제 키트의 battery 칸 이름은 백엔드에 아직 없어서 level/percent, charging, remaining_min 을 가정했다.
 */
// 배터리 칸이 백엔드에 없어(가짜 모드 battery: null) 100% 로 고정해 보여준다
export const FIXED_BATTERY = { available: true, level: 100, charging: false, estimatedMinutes: 0, low: false };

export function toBattery(battery) {
  if (!battery || typeof battery !== "object") return FIXED_BATTERY;
  const level = battery.level ?? battery.percent ?? null;
  if (level === null) return FIXED_BATTERY;
  const minutes = battery.remaining_min ?? battery.estimated_minutes ?? null;
  return {
    available: true,
    level,
    charging: !!battery.charging,
    estimatedMinutes: minutes ?? 0,
    low: battery.low ?? level <= 20,
  };
}

/* ---------------------------------------------------------------- 소리 기능 (메트로놈·구조신호) */

/**
 * 백엔드 DeviceState → { playing, pausedBy, interrupted, state }
 * status: on | off | pending | unknown · held_by: tts | recording | null (안내 음성·녹음 동안 잠시 멈춤)
 */
export function toSound(dev, extra = {}) {
  if (!dev) return { playing: false, pausedBy: null, interrupted: false, state: "unknown", ...extra };
  const status = dev.status ?? "unknown";
  return {
    playing: status === "on",
    pausedBy: dev.held_by ? "guidance" : null,
    interrupted: !dev.connected || dev.last_result === "failed",
    state: status === "pending" ? "on" : status,
    ...extra,
  };
}

/** 버튼 응답 result 가 pending·queued 면 확인 문장이 끝난 뒤 켜지거나 꺼진다 → 화면에는 요청한 상태로 먼저 보여준다 */
export function soundAfterPress(res, on) {
  const view = toSound(res.device);
  if (res.result === "pending" || res.result === "queued") {
    return { ...view, playing: on, state: on ? "on" : "off" };
  }
  return view;
}

/* ---------------------------------------------------------------- 타이머 */

/**
 * 백엔드 TimerState { status, elapsed_s, started_at } → { status, startedAt, accumulatedMs, segments }
 * 화면은 경과 = accumulatedMs + (running ? now - startedAt : 0) 으로 계산하므로
 * running 이면 startedAt 을 "지금 - 경과" 로, 아니면 accumulatedMs 에 경과를 넣는다.
 * (백엔드 started_at 은 처음 시작한 시각이라 일시정지가 있으면 계산에 쓸 수 없다)
 */
export function toTimer(timer) {
  const status = timer?.status ?? "idle";
  const elapsedMs = Math.max(0, (timer?.elapsed_s ?? 0) * 1000);
  if (status === "running") {
    return { status, startedAt: Date.now() - elapsedMs, accumulatedMs: 0, segments: [] };
  }
  return { status, startedAt: null, accumulatedMs: status === "idle" ? 0 : elapsedMs, segments: [] };
}

/** 타이머 버튼 응답: pending·queued 면 확인 문장 뒤에 바뀌므로 요청한 상태로 먼저 보여준다 */
export function timerAfterPress(res, want) {
  const view = toTimer(res.timer);
  if ((res.result === "pending" || res.result === "queued") && view.status !== want) {
    const elapsedMs = view.status === "running" ? Date.now() - view.startedAt : view.accumulatedMs;
    return want === "running"
      ? { ...view, status: "running", startedAt: Date.now() - elapsedMs, accumulatedMs: 0 }
      : { ...view, status: "paused", startedAt: null, accumulatedMs: elapsedMs };
  }
  return view;
}
