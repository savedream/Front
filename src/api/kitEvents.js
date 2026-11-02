import { KIT_API_CONFIG } from "./kitConfig";

/**
 * 키트 이벤트 스트림 (SSE): GET /api/events
 *
 * 화면 상태는 REST 응답이 아니라 이 이벤트로 바꾼다. (명세: "말하기 시작" 프론트 주의사항)
 * React Native 에는 EventSource 가 없어서 XMLHttpRequest 로 text/event-stream 을 읽는다.
 *
 * ⚠ 이벤트 data 형식은 명세 캡처에 없어서 JSON 이라고 가정했다. (백엔드 확인 필요)
 *   예) event: speech.state  data: {"turn_id": "t_0012", "state": "capturing", "trigger": "button"}
 *       event: speech.final  data: {"turn_id": "t_0012", "text": "..."}
 */
export const KIT_EVENT = {
  SPEECH_STATE: "speech.state", // 말하기 상태 변화
  SPEECH_FINAL: "speech.final", // 인식 문장 (말이 끝난 뒤)
};

const RECONNECT_MS = 2000;

/** SSE 텍스트 블록 하나를 { event, data } 로 해석 */
export function parseSseBlock(block) {
  let event = "message";
  const dataLines = [];
  block.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith(":")) return; // 빈 줄·주석
    const sep = line.indexOf(":");
    const field = sep < 0 ? line : line.slice(0, sep);
    const value = sep < 0 ? "" : line.slice(sep + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") dataLines.push(value);
  });
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  let data = raw;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    // JSON 이 아니면 문자열 그대로 전달
  }
  return { event, data };
}

/** 받은 텍스트를 이벤트 블록(빈 줄 구분)으로 나눈다. 끝나지 않은 마지막 조각은 rest 로 남긴다. */
export function splitSseBuffer(buffer) {
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? "";
  return { blocks: parts, rest };
}

// 연결 하나를 여러 화면이 같이 쓴다
const listeners = new Map(); // eventName → Set<handler>
let xhr = null;
let reconnectTimer = null;

function dispatch(event, data) {
  [event, "*"].forEach((name) => {
    listeners.get(name)?.forEach((handler) => {
      try {
        handler(data, event);
      } catch (e) {
        // 한 화면의 처리 오류가 다른 구독에 영향을 주지 않게
      }
    });
  });
}

function hasListeners() {
  for (const set of listeners.values()) if (set.size > 0) return true;
  return false;
}

function connect(XHR) {
  if (xhr) return;
  // .env 에 키트 주소가 없으면 연결하지 않는다
  if (!KIT_API_CONFIG.BASE_URL) return;
  const request = new XHR();
  xhr = request;
  let seen = 0;
  let buffer = "";

  const read = () => {
    const text = request.responseText ?? "";
    if (text.length <= seen) return;
    buffer += text.slice(seen);
    seen = text.length;
    const { blocks, rest } = splitSseBuffer(buffer);
    buffer = rest;
    blocks.forEach((block) => {
      const parsed = parseSseBlock(block);
      if (parsed) dispatch(parsed.event, parsed.data);
    });
  };

  request.onprogress = read;
  request.onreadystatechange = () => {
    if (request.readyState === 3) read();
    if (request.readyState === 4) {
      read();
      if (xhr === request) xhr = null;
      // 연결이 끊기면 구독이 남아 있는 동안 다시 연결
      if (hasListeners()) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => connect(XHR), RECONNECT_MS);
      }
    }
  };
  request.open("GET", `${KIT_API_CONFIG.BASE_URL}/events`);
  request.setRequestHeader("Accept", "text/event-stream");
  request.setRequestHeader("Cache-Control", "no-cache");
  request.send();
}

/**
 * 이벤트 구독. 반환값을 호출하면 구독 해제 (마지막 구독이 해제되면 연결도 닫는다)
 * @param {string} eventName KIT_EVENT 값 또는 "*" (전체)
 * @param {(data: any, event: string) => void} handler
 */
export function subscribeKitEvents(eventName, handler, { XHR = globalThis.XMLHttpRequest } = {}) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(handler);
  connect(XHR);

  return () => {
    listeners.get(eventName)?.delete(handler);
    if (!hasListeners()) {
      clearTimeout(reconnectTimer);
      const current = xhr;
      xhr = null;
      current?.abort();
    }
  };
}
