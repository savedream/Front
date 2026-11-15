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
  logsApi,
  metronomeApi,
  mockControlApi,
  rescueSignalApi,
  sessionApi,
  systemApi,
  timerApi,
} from "../api";
import { KIT_API_CONFIG } from "../api/kitConfig";
import { KIT_EVENT, subscribeKitEvents } from "../api/kitEvents";
import { toMs } from "../api/kitDevices";
import { voiceApi } from "../api/services/voiceApi";
import { josa } from "../utils/josa";

/**
 * 살려드림 전역 상태
 * - 화면 이동과 무관하게 타이머·장치 감시·대화 기록을 유지한다 (공통 ②).
 * - 모든 기능 실행은 runFeature 하나를 거친다 (공통 ①: 버튼과 음성 명령이 같은 흐름).
 *
 * 말하기·긴급 매뉴얼 파트는 runFeature / addLog / showNotice 로 연결한다 (src/COLLABORATION.md).
 * 부저는 2026-11-02 범위에서 제외.
 */

const KitContext = createContext(null);

const POLL_MS = 1500;
const DEVICE_LABEL = {
  mic: "마이크",
  speaker: "스피커",
  aiModel: "AI 응급 모델",
  manualData: "매뉴얼 데이터",
};

let logSeq = 0;
const newId = (p) => `${p}_${Date.now()}_${++logSeq}`;

// 문구 없이 code 만 오는 ui.notice 의 화면 문구
const NOTICE_TEXT = {
  OUT_OF_SCOPE: "응급 상황과 관련된 내용을 말씀해 주세요.",
};

const INITIAL_TIMER = { status: "idle", startedAt: null, accumulatedMs: 0, segments: [] };
const INITIAL_SOUND = { playing: false, pausedBy: null, interrupted: false, state: "off" };

export function KitProvider({ children }) {
  const [phase, setPhase] = useState("booting"); // booting | ready | shutdown
  const [bootStep, setBootStep] = useState("시스템 초기화");

  const [battery, setBattery] = useState(null); // null = 확인 전
  const [batteryError, setBatteryError] = useState(false);
  const [devices, setDevices] = useState({}); // id → Device

  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [clockOffset, setClockOffset] = useState(0); // serverTime - Date.now()
  const [metronome, setMetronome] = useState({ ...INITIAL_SOUND, bpm: 110 });
  const [rescue, setRescue] = useState(INITIAL_SOUND);

  const [busy, setBusy] = useState({});
  const [featureError, setFeatureError] = useState({});
  const [logs, setLogs] = useState([]);
  const [notice, setNotice] = useState(null);
  const [powerDialog, setPowerDialog] = useState(null); // null | confirm | saving | failed | stopping
  const [serverUnsaved, setServerUnsaved] = useState(0); // 키트에 저장되지 않은 처치 기록 수 (실제 API)
  const [micState, setMicState] = useState("armed"); // 마이크 상태: armed | capturing | processing | paused | blocked | unavailable
  // 상시 듣기 토글 값 (사용자 설정). 구조신호 중(blocked)·녹음 중(capturing)에는 서버 상태가 paused 를 덮어쓰므로
  // armed / paused 일 때만 서버 값으로 맞추고, 그 밖의 상태에서는 마지막 설정을 유지한다.
  const [micPaused, setMicPaused] = useState(false);
  const applyMicState = useCallback((state) => {
    if (!state) return;
    setMicState(state);
    if (state === "armed" || state === "paused") setMicPaused(state === "paused");
  }, []);

  // 비동기 흐름에서 최신 상태를 읽기 위한 ref
  const ref = useRef({});
  ref.current = { timer, metronome, rescue, devices, logs, phase, serverUnsaved };
  const busyRef = useRef({});
  const noticeTimer = useRef(null);

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

  const retryUnsaved = useCallback(async () => {
    const unsaved = ref.current.logs.filter((l) => l.saved === false);
    if (unsaved.length) return persist(unsaved);
    // 화면 기록은 다 저장됐지만 키트 쪽에 미저장 기록이 남은 경우 (record.save_failed) → POST /api/records/retry
    if (!KIT_API_CONFIG.USE_MOCK && ref.current.serverUnsaved > 0) {
      try {
        await logsApi.save([]);
        setServerUnsaved(0);
        showNotice("기록을 저장했어요.", "success");
        return true;
      } catch (e) {
        showNotice(`기록을 저장하지 못했어요: ${e.message}`, "error");
        return false;
      }
    }
    return true;
  }, [persist, showNotice]);

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
            const extra = d.id === "speaker" ? " 필요하면 다시 켜주세요." : "";
            showNotice(`${josa(name, "이", "가")} 다시 연결됐어요.${extra}`, "success");
            addLog({ kind: "system", text: `${name} 연결 복구` });
          }
        });
      }
      setDevices(next);
      // 상시 듣기 상태는 실제 API 에서만 서버 값을 따른다 (목데이터는 토글 값을 화면에서만 유지)
      if (!KIT_API_CONFIG.USE_MOCK && !busyRef.current.mic) applyMicState(next.mic?.micState);
    },
    [addLog, applyMicState, showNotice]
  );

  const syncTimer = useCallback((t) => {
    setTimer(t);
    if (t.serverTime) setClockOffset(t.serverTime - Date.now());
  }, []);

  const refreshAll = useCallback(
    async (withSlow = false) => {
      const jobs = [
        devicesApi.list().then((r) => {
          applyDevices(r.devices);
          if (typeof r.unsavedRecords === "number") setServerUnsaved(r.unsavedRecords);
        }),
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

  /* ------------------------------------------------------------ 키트 이벤트 → 대화창 (실제 API) */
  // 말하기 결과(speech.final)와 키트 안내(guide.say)는 이벤트로 온다. 서버가 이미 기록했으므로 다시 저장하지 않고,
  // id 는 서버 record_id 를 써서 부팅 때 불러온 기록과 겹치지 않게 한다.
  // 버튼으로 낸 턴의 안내(확인 문장·질문 반복)는 device_result 로 이미 보여주므로 말하기 턴 · 키트 자체 안내만 보여준다.
  useEffect(() => {
    if (KIT_API_CONFIG.USE_MOCK || phase !== "ready") return undefined;
    const spokenTurns = new Set();
    const pushServerLog = (entry) =>
      setLogs((prev) => (prev.some((l) => l.id === entry.id) ? prev : [...prev, { ...entry, saved: true }]));
    const offs = [
      // 새 세션 턴(session.updated 에 session_id 가 있음)의 시작 안내도 보여준다
      subscribeKitEvents(KIT_EVENT.SESSION_UPDATED, (d) => {
        if (d?.turn_id && d.session_id) spokenTurns.add(d.turn_id);
      }),
      subscribeKitEvents(KIT_EVENT.SPEECH_FINAL, (d) => {
        if (d?.turn_id) spokenTurns.add(d.turn_id);
        if (!d?.text) return;
        pushServerLog({ id: d.record_id ?? newId("user_speech"), kind: "user_speech", text: d.text, at: toMs(d.at) ?? Date.now() });
      }),
      subscribeKitEvents(KIT_EVENT.GUIDE_SAY, (d) => {
        if (!d?.text) return;
        if (d.turn_id && !spokenTurns.has(d.turn_id)) return;
        pushServerLog({ id: d.record_id ?? newId("device_guidance"), kind: "device_guidance", text: d.text, at: toMs(d.at) ?? Date.now() });
      }),
    ];
    // 화면에만 띄우는 알림 (소리 없음)
    offs.push(
      subscribeKitEvents(KIT_EVENT.UI_NOTICE, (d) => {
        const code = String(d?.code ?? "");
        if (code.startsWith("STT_")) {
          // 잡음·인식 실패: 대화창에 쌓지 않고 잠깐만 알린다 (말하기 창이 열려 있으면 창에도 표시됨)
          showNotice("잘 알아듣지 못했어요. 다시 말해주세요.");
          return;
        }
        if (code === "SAVE_FAILED") {
          showNotice("기록을 저장하지 못했어요. 대화창 위 배너를 눌러 다시 저장해주세요.", "error");
          return;
        }
        // OUT_OF_SCOPE 등 문구가 있는 알림은 대화창 시스템 메시지로
        const text = d?.text || NOTICE_TEXT[code];
        if (text) pushServerLog({ id: `notice_${d.seq ?? Date.now()}`, kind: "system", text, at: toMs(d.at) ?? Date.now() });
      }),
      // 처치 기록 저장 실패 → "저장되지 않은 기록" 배너
      subscribeKitEvents(KIT_EVENT.RECORD_SAVE_FAILED, (d) => {
        if (typeof d?.unsaved === "number") setServerUnsaved(d.unsaved);
        showNotice(d?.message ?? "기록을 저장하지 못했어요.", "error");
      }),
      // 미저장 건수 변화 (자동 재시도로 저장되면 0 → 배너가 사라진다)
      subscribeKitEvents(KIT_EVENT.STATUS_CHANGED, (d) => {
        const n = d?.storage?.unsaved_records;
        if (typeof n === "number") setServerUnsaved(n);
      })
    );
    return () => offs.forEach((off) => off());
  }, [phase, showNotice]);

  /* ------------------------------------------------------------ 부팅 (기능 ①) */
  const boot = useCallback(async () => {
    setPhase("booting");
    setBootStep("시스템 초기화");
    try {
      setBootStep("저장된 기록 불러오기");
      const [bootRes, logRes] = await Promise.all([
        systemApi.boot(),
        logsApi.list().catch(() => ({ entries: [] })),
      ]);
      setLogs(logRes.entries.map((e) => ({ ...e, saved: true })));
      setBootStep("배터리와 외부장치 확인");
      setDevices(Object.fromEntries(bootRes.devices.map((d) => [d.id, d])));
      setBattery(bootRes.battery);
      syncTimer(await timerApi.get());
      setPhase("ready");
    } catch (e) {
      setBootStep(`초기화 실패: ${e.message}`);
    }
  }, [addLog, syncTimer]);

  useEffect(() => {
    boot();
  }, [boot]);

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
        device: null, // 부저 제외(2026-11-02). 출력 장치가 정해지면 장치 id 를 넣는다.
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

  /* ------------------------------------------------------------ 상시 듣기 (대화창 헤더 토글) */
  // on: POST /api/mic/resume → armed | blocked(구조신호 중) | unavailable(마이크 없음), off: POST /api/mic/pause → paused
  const setMicListening = useCallback(
    async (on) => {
      if (busyRef.current.mic) return;
      busyRef.current.mic = true;
      setBusy((p) => ({ ...p, mic: true }));
      const before = { state: micState, paused: micPaused };
      setMicPaused(!on);
      if (micState === "armed" || micState === "paused") setMicState(on ? "armed" : "paused");
      try {
        if (KIT_API_CONFIG.USE_MOCK) {
          showNotice(on ? "상시 듣기를 켰어요." : "상시 듣기를 껐어요. 말하기 버튼으로는 계속 말할 수 있어요.");
          return;
        }
        const { state } = on ? await voiceApi.resumeMic() : await voiceApi.pauseMic();
        if (state) setMicState(state);
        setMicPaused(!on); // blocked 로 와도 사용자가 켠 설정은 켜짐으로 유지
        if (state === "blocked") showNotice("구조신호가 울리는 동안은 듣지 않아요. 끄면 다시 들어요.");
        else if (state === "unavailable") showNotice("마이크 연결을 확인해주세요.", "error");
        else showNotice(on ? "상시 듣기를 켰어요." : "상시 듣기를 껐어요. 말하기 버튼으로는 계속 말할 수 있어요.");
      } catch (e) {
        setMicState(before.state);
        setMicPaused(before.paused);
        showNotice(`상시 듣기를 ${on ? "켜지" : "끄지"} 못했어요: ${e.message}`, "error");
      } finally {
        busyRef.current.mic = false;
        setBusy((p) => ({ ...p, mic: false }));
      }
    },
    [micState, micPaused, showNotice]
  );

  /* ------------------------------------------------------------ 새 세션 */
  // 대화창을 비우고 새 세션을 연다. 시작 안내(guide.say)가 응답보다 먼저 올 수 있어 요청 전에 비우고, 실패하면 되돌린다.
  const newSession = useCallback(async () => {
    if (busyRef.current.session) return { ok: false, message: "처리 중이에요." };
    busyRef.current.session = true;
    setBusy((p) => ({ ...p, session: true }));
    const prevLogs = ref.current.logs;
    setLogs([]);
    try {
      await sessionApi.reset();
      setFeatureError({});
      if (KIT_API_CONFIG.USE_MOCK) {
        setTimer(INITIAL_TIMER);
        setMetronome({ ...INITIAL_SOUND, bpm: 110 });
        setRescue(INITIAL_SOUND);
      } else {
        refreshAll(true);
      }
      showNotice("새 세션을 시작했어요.", "success");
      return { ok: true };
    } catch (e) {
      setLogs((cur) => [...prevLogs, ...cur.filter((l) => !prevLogs.some((p) => p.id === l.id))]);
      showNotice(`새 세션을 시작하지 못했어요: ${e.message}`, "error");
      return { ok: false, message: e.message };
    } finally {
      busyRef.current.session = false;
      setBusy((p) => ({ ...p, session: false }));
    }
  }, [refreshAll, showNotice]);

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
    boot();
  }, [boot]);

  const value = {
    phase,
    bootStep,
    battery,
    batteryError,
    devices,
    timer,
    clockOffset,
    metronome,
    rescue,
    busy,
    featureError,
    logs,
    notice,
    powerDialog,
    // actions (다른 파트 연결용: runFeature, addLog, showNotice)
    runFeature,
    resetTimer,
    newSession,
    micState,
    micPaused,
    setMicListening,
    serverUnsaved,
    addLog,
    retryUnsaved,
    refreshAll,
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
