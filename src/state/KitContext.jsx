import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  batteryApi,
  devicesApi,
  gpsApi,
  logsApi,
  manualApi,
  metronomeApi,
  mockControlApi,
  rescueSignalApi,
  systemApi,
  timerApi,
  voiceApi,
} from "../api";
import { josa } from "../utils/josa";

/**
 * 살려드림 전역 상태
 * - 화면 이동과 무관하게 타이머·장치 감시·대화 기록을 유지한다 (공통 ②).
 * - 모든 기능 실행은 runFeature 하나를 거친다 (공통 ①: 버튼과 음성 명령이 같은 흐름).
 */

const KitContext = createContext(null);

const POLL_MS = 1500;
const DEVICE_LABEL = {
  gps: "GPS",
  mic: "마이크",
  speaker: "스피커",
  buzzer: "부저",
  aiModel: "AI 응급 모델",
  manualData: "매뉴얼 데이터",
};

let logSeq = 0;
const newId = (p) => `${p}_${Date.now()}_${++logSeq}`;

const INITIAL_TIMER = { status: "idle", startedAt: null, accumulatedMs: 0, segments: [] };
const INITIAL_SOUND = { playing: false, pausedBy: null, interrupted: false, state: "off" };

export function KitProvider({ children }) {
  const [phase, setPhase] = useState("booting"); // booting | ready | shutdown
  const [bootStep, setBootStep] = useState("시스템 초기화");

  const [battery, setBattery] = useState(null); // null = 확인 전
  const [batteryError, setBatteryError] = useState(false);
  const [devices, setDevices] = useState({}); // id → Device
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState(false);

  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [clockOffset, setClockOffset] = useState(0); // serverTime - Date.now()
  const [metronome, setMetronome] = useState({ ...INITIAL_SOUND, bpm: 110 });
  const [rescue, setRescue] = useState(INITIAL_SOUND);
  const [listening, setListeningState] = useState({ enabled: true, micAvailable: true });
  const [speaking, setSpeaking] = useState(false);

  const [busy, setBusy] = useState({});
  const [featureError, setFeatureError] = useState({});
  const [logs, setLogs] = useState([]);
  const [manuals, setManuals] = useState([]);
  const [manualsError, setManualsError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [powerDialog, setPowerDialog] = useState(null); // null | confirm | saving | failed | stopping

  // 비동기 흐름에서 최신 상태를 읽기 위한 ref
  const ref = useRef({});
  ref.current = { timer, metronome, rescue, devices, listening, logs, phase };
  const busyRef = useRef({});
  const noticeTimer = useRef(null);
  const speakTimer = useRef(null);

  /* ------------------------------------------------------------ 알림 */
  const showNotice = useCallback((text, tone = "info") => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, tone, id: Date.now() });
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  /* ------------------------------------------------------------ 기록 (공통 ⑤) */
  const persist = useCallback(async (entries) => {
    const ids = entries.map((e) => e.id);
    setLogs((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, saved: "saving" } : l)));
    try {
      const clean = entries.map(({ saved, ...rest }) => rest);
      await logsApi.save(clean);
      setLogs((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, saved: true } : l)));
      return true;
    } catch (e) {
      setLogs((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, saved: false } : l)));
      return false;
    }
  }, []);

  const addLog = useCallback(
    (entry) => {
      const full = { id: newId(entry.kind), at: Date.now(), saved: "saving", ...entry };
      setLogs((prev) => [...prev, full]);
      persist([full]);
      return full;
    },
    [persist]
  );

  const retryUnsaved = useCallback(() => {
    const unsaved = ref.current.logs.filter((l) => l.saved === false);
    if (unsaved.length) return persist(unsaved);
    return Promise.resolve(true);
  }, [persist]);

  /* ------------------------------------------------------------ 음성 안내 (공통 ④) */
  const speak = useCallback(async (text) => {
    if (!text) return;
    try {
      const { durationMs } = await voiceApi.speak(text);
      clearTimeout(speakTimer.current);
      setSpeaking(true);
      speakTimer.current = setTimeout(() => setSpeaking(false), durationMs);
    } catch (e) {
      // 스피커 불가 → 글 안내만 유지
      setSpeaking(false);
    }
  }, []);

  /* ------------------------------------------------------------ 상태 감시 */
  const applyDevices = useCallback(
    (list) => {
      const next = Object.fromEntries(list.map((d) => [d.id, d]));
      const prev = ref.current.devices;
      if (ref.current.phase === "ready" && Object.keys(prev).length) {
        list.forEach((d) => {
          const before = prev[d.id];
          if (!before || before.status === d.status) return;
          const name = DEVICE_LABEL[d.id] ?? d.name;
          const affected = d.requiredFor?.join(", ");
          if (d.status !== "ok") {
            showNotice(`${name} 연결이 끊겼어요. ${affected} 기능이 제한돼요.`, "error");
            addLog({ kind: "system", text: `${name} 연결 끊김 · ${affected} 사용 제한` });
          } else {
            const extra =
              d.id === "speaker" || d.id === "buzzer" ? " 필요하면 다시 켜주세요." : "";
            showNotice(`${josa(name, "이", "가")} 다시 연결됐어요.${extra}`, "success");
            addLog({ kind: "system", text: `${name} 연결 복구` });
          }
        });
      }
      setDevices(next);
    },
    [addLog, showNotice]
  );

  const syncTimer = useCallback((t) => {
    setTimer(t);
    if (t.serverTime) setClockOffset(t.serverTime - Date.now());
  }, []);

  const refreshAll = useCallback(
    async (withSlow = false) => {
      const jobs = [
        devicesApi.list().then((r) => applyDevices(r.devices)),
        gpsApi
          .get()
          .then((g) => {
            setGps(g);
            setGpsError(false);
          })
          .catch(() => setGpsError(true)),
        voiceApi.getListening().then(setListeningState),
      ];
      if (!busyRef.current.metronome) jobs.push(metronomeApi.get().then(setMetronome));
      if (!busyRef.current.rescue) jobs.push(rescueSignalApi.get().then(setRescue));
      if (withSlow) {
        jobs.push(
          batteryApi
            .get()
            .then((b) => {
              setBattery(b);
              setBatteryError(false);
            })
            .catch(() => setBatteryError(true))
        );
        if (!busyRef.current.timer) jobs.push(timerApi.get().then(syncTimer));
      }
      await Promise.allSettled(jobs);
    },
    [applyDevices, syncTimer]
  );

  useEffect(() => {
    if (phase !== "ready") return undefined;
    let tick = 0;
    refreshAll(true);
    const id = setInterval(() => {
      tick += 1;
      refreshAll(tick % 6 === 0);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [phase, refreshAll]);

  /* ------------------------------------------------------------ 부팅 (기능 ①) */
  const boot = useCallback(async () => {
    setPhase("booting");
    setBootStep("시스템 초기화");
    try {
      setBootStep("저장된 매뉴얼과 기록 불러오기");
      const [bootRes, manualRes, logRes] = await Promise.all([
        systemApi.boot(),
        manualApi.list().catch((e) => {
          setManualsError(e.message);
          return { manuals: [] };
        }),
        logsApi.list().catch(() => ({ entries: [] })),
      ]);
      setManuals(manualRes.manuals);
      setLogs(logRes.entries.map((e) => ({ ...e, saved: true })));
      setBootStep("배터리와 외부장치 확인");
      setDevices(Object.fromEntries(bootRes.devices.map((d) => [d.id, d])));
      setBattery(bootRes.battery);
      const [t, l] = await Promise.all([timerApi.get(), voiceApi.getListening()]);
      syncTimer(t);
      setListeningState(l);
      setPhase("ready");
      if (!logRes.entries.length) {
        addLog({
          kind: "device_guidance",
          title: "어떤 상황인지 말씀해주세요.",
          text: "화면을 보지 않아도 괜찮아요. 제가 듣고 안내할게요.",
        });
      }
    } catch (e) {
      setBootStep(`초기화 실패: ${e.message}`);
    }
  }, [addLog, syncTimer]);

  useEffect(() => {
    boot();
  }, [boot]);

  const reloadManuals = useCallback(async () => {
    try {
      const r = await manualApi.list();
      setManuals(r.manuals);
      setManualsError(null);
    } catch (e) {
      setManualsError(e.message);
    }
  }, []);

  /* ------------------------------------------------------------ 기능 실행 (공통 ①) */
  const FEATURES = useMemo(
    () => ({
      metronome: {
        label: "메트로놈",
        device: "speaker",
        isOn: () => ref.current.metronome.playing,
        on: metronomeApi.start,
        off: metronomeApi.stop,
        get: metronomeApi.get,
        apply: setMetronome,
        onText: "메트로놈을 켰어요.",
        offText: "메트로놈을 껐어요.",
      },
      rescue: {
        label: "구조신호",
        device: "buzzer",
        isOn: () => ref.current.rescue.playing,
        on: rescueSignalApi.start,
        off: rescueSignalApi.stop,
        get: rescueSignalApi.get,
        apply: setRescue,
        onText: "구조신호를 울리고 있어요. (주변 알림용 · 119 신고는 별도)",
        offText: "구조신호를 껐어요.",
      },
      timer: {
        label: "타이머",
        device: null,
        isOn: () => ref.current.timer.status === "running",
        on: () => (ref.current.timer.status === "paused" ? timerApi.resume() : timerApi.start()),
        off: timerApi.pause,
        get: timerApi.get,
        apply: syncTimer,
        onText: "타이머 측정을 시작했어요.",
        offText: "타이머를 일시정지했어요.",
      },
    }),
    [syncTimer]
  );

  const runFeature = useCallback(
    async (feature, action = "toggle", source = "button") => {
      const f = FEATURES[feature];
      if (!f) return;
      // 처리 중이면 중복 실행 방지
      if (busyRef.current[feature]) {
        showNotice(`${f.label} 요청을 처리하고 있어요.`);
        return;
      }
      const current = f.isOn();
      const target = action === "toggle" ? !current : action === "on";

      if (current === target) {
        const stateText = target
          ? feature === "timer" ? "측정 중이에요" : "켜져 있어요"
          : feature === "timer" ? "멈춰 있어요" : "꺼져 있어요";
        const text = `${josa(f.label, "이", "가")} 이미 ${stateText}.`;
        showNotice(text);
        addLog({ kind: "device_result", text, meta: { feature, source, result: "unchanged" } });
        return;
      }

      // 필요한 장치 확인 (켤 때만)
      if (target && f.device) {
        const dev = ref.current.devices[f.device];
        if (dev && dev.status !== "ok") {
          const text = `${DEVICE_LABEL[f.device]} 연결을 확인해주세요. ${josa(f.label, "을", "를")} 사용할 수 없어요.`;
          setFeatureError((p) => ({ ...p, [feature]: `${DEVICE_LABEL[f.device]} 연결 확인` }));
          showNotice(text, "error");
          addLog({ kind: "device_result", text, meta: { feature, source, result: "unavailable" } });
          return;
        }
      }

      busyRef.current[feature] = true;
      setBusy((p) => ({ ...p, [feature]: true }));
      setFeatureError((p) => ({ ...p, [feature]: null }));
      try {
        const res = await (target ? f.on() : f.off());
        f.apply(res);
        addLog({
          kind: "device_result",
          text: target ? f.onText : f.offText,
          meta: { feature, source, result: "success" },
        });
      } catch (e) {
        if (e.isTimeout) {
          if (feature !== "timer") f.apply((p) => ({ ...p, state: "unknown" }));
          setFeatureError((p) => ({ ...p, [feature]: "상태 확인 불가" }));
          showNotice(`${f.label} 응답이 없어 상태를 확인하고 있어요.`, "error");
          addLog({ kind: "device_result", text: `${f.label} 상태 확인 불가 (응답 시간 초과)`, meta: { feature, source, result: "timeout" } });
          f.get().then(f.apply).catch(() => {});
        } else {
          const msg = target ? `${f.label} 실행 실패` : `${f.label} 정지 확인 필요`;
          setFeatureError((p) => ({ ...p, [feature]: msg }));
          showNotice(`${msg}: ${e.message}`, "error");
          addLog({ kind: "device_result", text: `${msg} · ${e.message}`, meta: { feature, source, result: "failure" } });
        }
      } finally {
        busyRef.current[feature] = false;
        setBusy((p) => ({ ...p, [feature]: false }));
      }
    },
    [FEATURES, addLog, showNotice]
  );

  /* ------------------------------------------------------------ 타이머 초기화 (공통 ⑥) */
  const resetTimer = useCallback(async () => {
    if (busyRef.current.timer) return { ok: false, message: "처리 중이에요." };
    busyRef.current.timer = true;
    setBusy((p) => ({ ...p, timer: true }));
    try {
      const t = await timerApi.reset();
      syncTimer(t);
      addLog({ kind: "device_result", text: "타이머 기록을 저장하고 초기화했어요.", meta: { feature: "timer" } });
      return { ok: true };
    } catch (e) {
      showNotice("기록을 저장하지 못해 초기화하지 않았어요.", "error");
      return { ok: false, message: e.message };
    } finally {
      busyRef.current.timer = false;
      setBusy((p) => ({ ...p, timer: false }));
    }
  }, [addLog, showNotice, syncTimer]);

  /* ------------------------------------------------------------ 음성 / 대화 (기능 ④) */
  const setListening = useCallback(
    async (enabled) => {
      try {
        const r = await voiceApi.setListening(enabled);
        setListeningState(r);
      } catch (e) {
        showNotice(e.message, "error");
      }
    },
    [showNotice]
  );

  const sendUtterance = useCallback(
    async (text, kind = "user_speech") => {
      const trimmed = text?.trim();
      if (!trimmed) return;
      addLog({ kind, text: trimmed });
      try {
        const { intent, reply } = await voiceApi.sendMessage(trimmed);
        addLog({
          kind: "device_guidance",
          title: reply.title,
          text: reply.body,
          actions: reply.actions,
          meta: { intent },
        });
        speak([reply.title, reply.body].filter(Boolean).join(" "));
        if (intent?.type === "command") {
          await runFeature(intent.feature, intent.action, "voice");
        }
      } catch (e) {
        addLog({ kind: "system", text: `안내를 만들지 못했어요 · ${e.message}` });
      }
    },
    [addLog, runFeature, speak]
  );

  /* ------------------------------------------------------------ 전원 (기능 ①, 공통 ⑥) */
  const requestPower = useCallback(() => setPowerDialog("confirm"), []);
  const cancelPower = useCallback(() => setPowerDialog(null), []);

  const confirmShutdown = useCallback(async () => {
    setPowerDialog("saving");
    const t = ref.current.timer;
    const elapsed = t.accumulatedMs + (t.status === "running" ? Date.now() - t.startedAt : 0);
    const finalEntry = {
      id: newId("system"),
      kind: "system",
      text: `전원 종료 · 경과 시간 ${Math.round(elapsed / 1000)}초 저장`,
      at: Date.now(),
    };
    const pending = ref.current.logs.filter((l) => l.saved !== true);
    try {
      await logsApi.save([...pending, finalEntry].map(({ saved, ...r }) => r));
    } catch (e) {
      setPowerDialog("failed");
      return;
    }
    setPowerDialog("stopping");
    try {
      await systemApi.shutdown();
    } catch (e) {
      // 종료 명령 실패해도 화면은 종료 상태로 전환 (시연)
    }
    setPowerDialog(null);
    setPhase("shutdown");
  }, []);

  const powerOn = useCallback(async () => {
    if (mockControlApi.enabled()) await mockControlApi.reset().catch(() => {});
    setLogs([]);
    setTimer(INITIAL_TIMER);
    setMetronome({ ...INITIAL_SOUND, bpm: 110 });
    setRescue(INITIAL_SOUND);
    setDevices({});
    setGps(null);
    boot();
  }, [boot]);

  const value = {
    phase,
    bootStep,
    battery,
    batteryError,
    devices,
    gps,
    gpsError,
    timer,
    clockOffset,
    metronome,
    rescue,
    listening,
    speaking,
    busy,
    featureError,
    logs,
    manuals,
    manualsError,
    notice,
    powerDialog,
    // actions
    runFeature,
    resetTimer,
    setListening,
    sendUtterance,
    addLog,
    retryUnsaved,
    refreshAll,
    reloadManuals,
    showNotice,
    requestPower,
    cancelPower,
    confirmShutdown,
    powerOn,
  };

  return <KitContext.Provider value={value}>{children}</KitContext.Provider>;
}

export function useKit() {
  const ctx = useContext(KitContext);
  if (!ctx) throw new Error("useKit 은 KitProvider 안에서 사용해야 해요.");
  return ctx;
}

/** 타이머 경과 시간(ms)을 250ms 마다 다시 계산 */
export function useElapsed() {
  const { timer, clockOffset } = useKit();
  const [, force] = useState(0);
  useEffect(() => {
    if (timer.status !== "running") return undefined;
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [timer.status]);
  const now = Date.now() + clockOffset;
  return timer.accumulatedMs + (timer.status === "running" ? now - timer.startedAt : 0);
}

export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const sec = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export const formatClock = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
