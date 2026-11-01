/**
 * 시연용 목서버
 *
 * 실제 백엔드와 같은 REST 경로를 받아 메모리 상태로 응답한다.
 * - 응답 지연(150~450ms)을 넣어 "처리 중" 표시를 확인할 수 있다.
 * - /__mock/* 로 장치 끊김, 저장 실패, 응답 시간 초과를 재현할 수 있다.
 */
import { ApiError } from "../api/errors";
import { MANUALS, toSummary } from "./data/manuals";
import { STT_SCRIPTS } from "./data/sttScripts";
import { ASSISTANT_RULES, FALLBACK_REPLY } from "./data/assistantRules";

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

const DEVICE_META = {
  gps: { name: "GPS", requiredFor: ["현재 위치 좌표"] },
  mic: { name: "마이크", requiredFor: ["음성 입력", "말하기"] },
  speaker: { name: "스피커", requiredFor: ["음성 안내", "메트로놈"] },
  buzzer: { name: "부저", requiredFor: ["구조신호"] },
  aiModel: { name: "AI 응급 모델", requiredFor: ["음성 상황 해석"] },
  manualData: { name: "매뉴얼 데이터", requiredFor: ["응급 매뉴얼"] },
};

// 기준 좌표 (PDF 예시값)
const BASE_LAT = 37.40218;
const BASE_LNG = 127.67942;

function createDb() {
  const t = now();
  return {
    bootedAt: t,
    devices: {
      gps: { connected: true, changedAt: t },
      mic: { connected: true, changedAt: t },
      speaker: { connected: true, changedAt: t, volume: 78 },
      buzzer: { connected: true, changedAt: t },
      aiModel: { connected: true, changedAt: t, lastVerifiedAt: t - 3 * 86400000 },
      manualData: { connected: true, changedAt: t, sizeLabel: "128MB", version: "1.0" },
    },
    battery: { startLevel: 84, startedAt: t, charging: false },
    gps: { fixAt: t + 2500, lastKnown: null },
    timer: { status: "idle", startedAt: null, accumulatedMs: 0, segments: [] },
    metronome: { playing: false, bpm: 110, interrupted: false, unknown: false },
    rescue: { playing: false, interrupted: false, unknown: false },
    guidanceUntil: 0,
    listening: true,
    stt: { sessions: {}, scriptIndex: 0, seq: 0 },
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
    case "buzzer":
      detail = d.connected ? "구조신호 출력 준비됨" : "부저 연결 확인 필요";
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
  if (id === "buzzer" && !connected && db.rescue.playing) {
    db.rescue.unknown = true; // 연결 오류 · 출력 상태 확인 불가
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
  if (connected && id === "buzzer" && db.rescue.unknown) {
    db.rescue.unknown = false;
    db.rescue.playing = false;
    db.rescue.interrupted = true;
  }
}

/* ---------------------------------------------------------------- GPS */

function gpsView(ignoreConnection = false) {
  const connected = ignoreConnection || isConnected("gps");
  const fix = connected && now() >= db.gps.fixAt;
  if (!fix) {
    return { connected, fix: false, latitude: null, longitude: null, accuracyM: null, receivedAt: null, lastKnown: db.gps.lastKnown };
  }
  // 약간의 흔들림
  const k = (now() - db.bootedAt) / 60000;
  return {
    connected,
    fix: true,
    latitude: +(BASE_LAT + Math.sin(k) * 0.00004).toFixed(5),
    longitude: +(BASE_LNG + Math.cos(k) * 0.00004).toFixed(5),
    accuracyM: 6 + Math.round(Math.abs(Math.sin(k * 3)) * 4),
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

const guidanceActive = () => now() < db.guidanceUntil;

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

/* ---------------------------------------------------------------- STT */

function sttSessionView(s) {
  const words = s.text.split(" ");
  const shown = Math.min(words.length, Math.floor((now() - s.startedAt - 600) / 320) + 1);
  if (shown <= 0) return { status: "listening", partial: "" };
  return {
    status: shown >= words.length ? "ready" : "listening",
    partial: words.slice(0, shown).join(" "),
  };
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
    manualsLoaded: MANUALS.length,
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
  if (!isConnected("buzzer")) throw new MockHttpError(409, "DEVICE_UNAVAILABLE", "부저 연결을 확인해주세요.");
  db.rescue = { playing: true, interrupted: false, unknown: false };
  return rescueView();
});
route("POST", "/rescue-signal/stop", async () => {
  await maybeSlow("rescue");
  if (!isConnected("buzzer")) throw new MockHttpError(409, "DEVICE_UNAVAILABLE", "부저가 응답하지 않아 정지를 확인할 수 없어요.");
  db.rescue = { playing: false, interrupted: false, unknown: false };
  return rescueView();
});

// 음성
route("GET", "/voice/listening", () => ({ enabled: db.listening, micAvailable: isConnected("mic") }));
route("PUT", "/voice/listening", (_, body) => {
  if (body.enabled && !isConnected("mic")) {
    throw new MockHttpError(409, "DEVICE_UNAVAILABLE", "마이크 연결을 확인해주세요.");
  }
  db.listening = !!body.enabled;
  return { enabled: db.listening, micAvailable: isConnected("mic") };
});
route("POST", "/stt/sessions", () => {
  if (!isConnected("mic")) throw new MockHttpError(409, "DEVICE_UNAVAILABLE", "마이크 연결을 확인해주세요.");
  const id = `stt_${++db.stt.seq}`;
  const text = STT_SCRIPTS[db.stt.scriptIndex % STT_SCRIPTS.length];
  db.stt.scriptIndex += 1;
  db.stt.sessions[id] = { id, text, startedAt: now(), finalized: false };
  return { sessionId: id };
});
route("GET", "/stt/sessions/:id", ({ id }) => {
  const s = db.stt.sessions[id];
  if (!s) throw new MockHttpError(404, "NOT_FOUND", "음성 세션이 없어요.");
  if (!isConnected("mic")) throw new MockHttpError(409, "DEVICE_UNAVAILABLE", "마이크 연결이 끊겼어요.");
  return sttSessionView(s);
});
route("POST", "/stt/sessions/:id/finalize", ({ id }) => {
  const s = db.stt.sessions[id];
  if (!s) throw new MockHttpError(404, "NOT_FOUND", "음성 세션이 없어요.");
  if (s.finalized) throw new MockHttpError(409, "ALREADY_FINALIZED", "이미 전달된 문장이에요.");
  const { partial } = sttSessionView(s);
  if (!partial.trim()) throw new MockHttpError(422, "EMPTY_TRANSCRIPT", "인식된 문장이 없어요.");
  s.finalized = true;
  return { text: partial };
});
route("DELETE", "/stt/sessions/:id", ({ id }) => {
  delete db.stt.sessions[id];
  return { ok: true };
});
route("POST", "/assistant/messages", async (_, body) => {
  await sleep(500);
  const text = String(body.text ?? "");
  if (!isConnected("aiModel")) {
    return {
      intent: { type: "unclear" },
      reply: { title: "AI 응급 모델을 사용할 수 없어요.", body: "매뉴얼 목록에서 상황을 직접 선택해주세요.", actions: [{ type: "openManualList", label: "매뉴얼 목록 보기" }] },
    };
  }
  const rule = ASSISTANT_RULES.find((r) => r.test(text));
  return clone(rule ? rule.build(text) : FALLBACK_REPLY);
});
route("POST", "/tts/speak", (_, body) => {
  if (!isConnected("speaker")) throw new MockHttpError(409, "DEVICE_UNAVAILABLE", "스피커 연결을 확인해주세요.");
  const durationMs = Math.min(6000, 1200 + String(body.text ?? "").length * 70);
  // 공통 ④: 응급 안내 중 메트로놈·구조신호 임시중단 → 안내 후 자동 재개
  db.guidanceUntil = now() + durationMs;
  return { durationMs };
});

// 매뉴얼
route("GET", "/manuals", () => {
  if (!isConnected("manualData")) throw new MockHttpError(503, "DEVICE_UNAVAILABLE", "매뉴얼 데이터를 읽을 수 없어요.");
  return { manuals: MANUALS.map(toSummary) };
});
route("GET", "/manuals/:id", ({ id }) => {
  if (!isConnected("manualData")) throw new MockHttpError(503, "DEVICE_UNAVAILABLE", "매뉴얼 데이터를 읽을 수 없어요.");
  const m = MANUALS.find((x) => x.id === id);
  if (!m) throw new MockHttpError(404, "NOT_FOUND", "매뉴얼을 찾을 수 없어요.");
  return clone(m);
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
