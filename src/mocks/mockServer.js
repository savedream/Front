/**
 * 시연용 목서버
 *
 * 실제 백엔드와 같은 REST 경로를 받아 메모리 상태로 응답한다.
 * - 응답 지연(150~450ms)을 넣어 "처리 중" 표시를 확인할 수 있다.
 * - /__mock/* 로 장치 끊김, 저장 실패, 응답 시간 초과를 재현할 수 있다.
 *
 * 말하기(STT·발화 해석·음성 안내)와 긴급 매뉴얼 API 는 담당 팀원 파트라 여기에 없다.
 * 해당 파트의 목 응답이 필요하면 아래 route(...) 형식으로 같은 파일에 추가하면 된다.
 */
import { ApiError } from "../api/errors";

class MockHttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const now = () => Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const latency = () => 150 + Math.random() * 300;
const clone = (v) => JSON.parse(JSON.stringify(v));

// 장치 메타데이터. 장치를 추가/삭제하려면 여기와 screens/DeviceStatusScreen.jsx 의 ORDER 등을 함께 수정한다.
// (2026-11-02 부저 제외)
const DEVICE_META = {
  gps: { name: "GPS", requiredFor: ["현재 위치 좌표"] },
  mic: { name: "마이크", requiredFor: ["음성 입력", "말하기"] },
  speaker: { name: "스피커", requiredFor: ["음성 안내", "메트로놈"] },
  aiModel: { name: "AI 응급 모델", requiredFor: ["음성 상황 해석"] },
  manualData: { name: "매뉴얼 데이터", requiredFor: ["응급 매뉴얼"] },
};

// GPS 목데이터 좌표 (GPS 모듈 미구매 → 이 좌표로 고정)
const BASE_LAT = 37.5818;
const BASE_LNG = 127.0101;

function createDb() {
  const t = now();
  return {
    bootedAt: t,
    devices: {
      gps: { connected: true, changedAt: t },
      mic: { connected: true, changedAt: t },
      speaker: { connected: true, changedAt: t, volume: 78 },
      aiModel: { connected: true, changedAt: t, lastVerifiedAt: t - 3 * 86400000 },
      manualData: { connected: true, changedAt: t, sizeLabel: "128MB", version: "1.0" },
    },
    battery: { startLevel: 84, startedAt: t, charging: false },
    gps: { fixAt: t + 2500, lastKnown: null },
    timer: { status: "idle", startedAt: null, accumulatedMs: 0, segments: [] },
    metronome: { playing: false, bpm: 110, interrupted: false, unknown: false },
    rescue: { playing: false, interrupted: false, unknown: false },
    listening: true,
    logs: [],
    config: { saveFailure: false, slowFeature: null },
  };
}

let db = createDb();

/* ---------------------------------------------------------------- 장치 */

const isConnected = (id) => db.devices[id].connected;

function deviceView(id) {
  const d = db.devices[id];
  const meta = DEVICE_META[id];
  let detail = "";
  switch (id) {
    case "gps": {
      const g = gpsView();
      detail = !d.connected
        ? "연결 끊김"
        : g.fix
          ? `위치 정확도 ${g.accuracyM}m`
          : "위치 찾는 중";
      break;
    }
    case "mic":
      detail = d.connected
        ? db.listening
          ? "음성 입력 준비됨"
          : "음성 입력 일시정지"
        : "마이크 연결 확인 필요";
      break;
    case "speaker":
      detail = d.connected ? `음성 안내 볼륨 ${d.volume}%` : "스피커 연결 확인 필요";
      break;
    case "aiModel": {
      const days = Math.round((now() - d.lastVerifiedAt) / 86400000);
      detail = d.connected ? `마지막 검증 ${days}일 전` : "모델 확인 불가";
      break;
    }
    case "manualData":
      detail = d.connected ? `매뉴얼 데이터 ${d.sizeLabel} · v${d.version}` : "데이터 확인 불가";
      break;
    default:
  }
  return {
    id,
    name: meta.name,
    requiredFor: meta.requiredFor,
    connected: d.connected,
    operational: d.connected,
    status: d.connected ? "ok" : "error",
    detail,
    changedAt: d.changedAt,
  };
}

function setDeviceConnected(id, connected) {
  const d = db.devices[id];
  if (!d) throw new MockHttpError(404, "NOT_FOUND", "알 수 없는 장치예요.");
  if (d.connected === connected) return;
  d.connected = connected;
  d.changedAt = now();

  // 공통 ③: 장치 끊김 시 실행 중이던 기능의 실제 상태 반영
  if (id === "speaker" && !connected && db.metronome.playing) {
    db.metronome.playing = false;
    db.metronome.interrupted = true; // 출력 중단 · 연결 오류
  }
  if (id === "gps") {
    if (!connected) {
      const g = gpsView(true);
      if (g.fix) db.gps.lastKnown = { latitude: g.latitude, longitude: g.longitude, receivedAt: g.receivedAt };
    } else {
      db.gps.fixAt = now() + 3000; // 재연결 후 최신 좌표 다시 확보
    }
  }
  // 재연결: 메트로놈·구조신호는 자동 재생하지 않는다
  if (connected && id === "speaker") db.metronome.interrupted = false;
}

/* ---------------------------------------------------------------- GPS */

function gpsView(ignoreConnection = false) {
  const connected = ignoreConnection || isConnected("gps");
  const fix = connected && now() >= db.gps.fixAt;
  if (!fix) {
    return { connected, fix: false, latitude: null, longitude: null, accuracyM: null, receivedAt: null, lastKnown: db.gps.lastKnown };
  }
  // 고정 좌표 (흔들림 없음)
  return {
    connected,
    fix: true,
    latitude: BASE_LAT,
    longitude: BASE_LNG,
    accuracyM: 5,
    receivedAt: now(),
    lastKnown: db.gps.lastKnown,
  };
}

/* ---------------------------------------------------------------- 배터리 */

function batteryView() {
  const b = db.battery;
  const drained = Math.floor((now() - b.startedAt) / (5 * 60000)); // 5분에 1%
  const level = Math.max(1, b.startLevel - drained);
  return {
    available: true,
    level,
    charging: b.charging,
    estimatedMinutes: Math.round(level * 6.4),
    low: level <= 20,
  };
}

/* ---------------------------------------------------------------- 소리 기능 */

// pausedBy: 음성 안내(TTS) 중 임시중단 상태. 말하기 파트에서 TTS 를 붙이면 채운다.
const guidanceActive = () => false;

function metronomeView() {
  const m = db.metronome;
  return {
    playing: m.playing,
    bpm: m.bpm,
    pausedBy: m.playing && guidanceActive() ? "guidance" : null,
    interrupted: m.interrupted,
    state: m.unknown ? "unknown" : m.playing ? "on" : "off",
  };
}

function rescueView() {
  const r = db.rescue;
  return {
    playing: r.playing,
    pausedBy: r.playing && guidanceActive() ? "guidance" : null,
    interrupted: r.interrupted,
    state: r.unknown ? "unknown" : r.playing ? "on" : "off",
  };
}

async function maybeSlow(feature) {
  if (db.config.slowFeature === feature) await sleep(8000); // 응답 시간 초과 재현
}

/* ---------------------------------------------------------------- 타이머 */

function timerView() {
  return { ...clone(db.timer), serverTime: now() };
}

const elapsedOf = (t) =>
  t.accumulatedMs + (t.status === "running" ? now() - t.startedAt : 0);

/* ---------------------------------------------------------------- 기록 */

function saveLogs(entries) {
  if (db.config.saveFailure) {
    throw new MockHttpError(500, "SAVE_FAILED", "기기 저장소에 기록을 저장하지 못했어요.");
  }
  const ids = [];
  entries.forEach((e) => {
    const i = db.logs.findIndex((l) => l.id === e.id);
    if (i >= 0) db.logs[i] = e;
    else db.logs.push(e);
    ids.push(e.id);
  });
  return { savedIds: ids };
}

/* ---------------------------------------------------------------- 라우터 */

const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp(
    "^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$"
  );
  routes.push({ method, re, keys, handler });
};

// 시스템
route("POST", "/system/boot", async () => {
  await sleep(900);
  return {
    logsLoaded: db.logs.length,
    devices: Object.keys(db.devices).map(deviceView),
    battery: batteryView(),
  };
});
route("POST", "/system/shutdown", () => {
  db.metronome.playing = false;
  db.rescue.playing = false;
  db.listening = false;
  return { ok: true, at: now() };
});

// 배터리 / 장치 / GPS
route("GET", "/battery", () => batteryView());
route("GET", "/devices", () => ({
  checkedAt: now(),
  devices: Object.keys(db.devices).map(deviceView),
}));
route("POST", "/devices/:id/reconnect", async ({ id }) => {
  await sleep(700);
  // 시연: 강제로 끊어둔 장치는 재시도해도 복구되지 않는다 (목 제어판에서 다시 연결)
  if (!db.devices[id]) throw new MockHttpError(404, "NOT_FOUND", "알 수 없는 장치예요.");
  if (!db.devices[id].connected) {
    throw new MockHttpError(409, "DEVICE_UNAVAILABLE", `${DEVICE_META[id].name} 응답이 없어요.`);
  }
  return deviceView(id);
});
route("GET", "/gps", () => gpsView());

// 타이머
route("GET", "/timer", () => timerView());
route("POST", "/timer/start", async () => {
  await maybeSlow("timer");
  if (db.timer.status === "idle") {
    db.timer = { ...db.timer, status: "running", startedAt: now(), accumulatedMs: 0 };
  }
  return timerView();
});
route("POST", "/timer/pause", async () => {
  await maybeSlow("timer");
  if (db.timer.status === "running") {
    db.timer.accumulatedMs = elapsedOf(db.timer);
    db.timer.status = "paused";
    db.timer.startedAt = null;
  }
  return timerView();
});
route("POST", "/timer/resume", async () => {
  await maybeSlow("timer");
  if (db.timer.status === "paused") {
    db.timer.status = "running";
    db.timer.startedAt = now();
  }
  return timerView();
});
route("POST", "/timer/reset", () => {
  const elapsed = elapsedOf(db.timer);
  saveLogs([
    { id: `timer_${now()}`, kind: "device_result", text: `타이머 구간 저장 (${Math.round(elapsed / 1000)}초)`, at: now() },
  ]);
  db.timer = {
    status: "idle",
    startedAt: null,
    accumulatedMs: 0,
    segments: [...db.timer.segments, { endedAt: now(), elapsedMs: elapsed }],
  };
  return timerView();
});

// 메트로놈
route("GET", "/metronome", () => metronomeView());
route("POST", "/metronome/start", async () => {
  await maybeSlow("metronome");
  if (!isConnected("speaker")) throw new MockHttpError(409, "DEVICE_UNAVAILABLE", "스피커 연결을 확인해주세요.");
  db.metronome.playing = true;
  db.metronome.interrupted = false;
  db.metronome.unknown = false;
  return metronomeView();
});
route("POST", "/metronome/stop", async () => {
  await maybeSlow("metronome");
  db.metronome.playing = false;
  db.metronome.interrupted = false;
  db.metronome.unknown = false;
  return metronomeView();
});

// 구조신호
route("GET", "/rescue-signal", () => rescueView());
route("POST", "/rescue-signal/start", async () => {
  await maybeSlow("rescue");
  db.rescue = { playing: true, interrupted: false, unknown: false };
  return rescueView();
});
route("POST", "/rescue-signal/stop", async () => {
  await maybeSlow("rescue");
  db.rescue = { playing: false, interrupted: false, unknown: false };
  return rescueView();
});

// 기록
route("GET", "/logs", () => ({ entries: clone(db.logs) }));
route("POST", "/logs", (_, body) => saveLogs(body.entries ?? []));

// 시연 제어
route("GET", "/__mock/config", () => ({
  ...db.config,
  devices: Object.fromEntries(Object.entries(db.devices).map(([k, v]) => [k, v.connected])),
}));
route("PUT", "/__mock/config", (_, body) => {
  db.config = { ...db.config, ...body };
  if (body.batteryLevel != null) {
    db.battery = { ...db.battery, startLevel: body.batteryLevel, startedAt: now() };
  }
  return db.config;
});
route("PUT", "/__mock/devices/:id", ({ id }, body) => {
  setDeviceConnected(id, !!body.connected);
  return deviceView(id);
});
route("POST", "/__mock/reset", () => {
  db = createDb();
  return { ok: true };
});

export async function handleMockRequest(method, path, body) {
  await sleep(latency());
  const [pathname] = path.split("?");
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = pathname.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    try {
      return await r.handler(params, body ?? {});
    } catch (e) {
      if (e instanceof MockHttpError) {
        // client.js 와 같은 형태의 에러로 변환
        throw new ApiError(e.message, { status: e.status, code: e.code });
      }
      throw e;
    }
  }
  throw new ApiError(`목서버에 없는 경로: ${method} ${path}`, { status: 404, code: "NOT_FOUND" });
}
