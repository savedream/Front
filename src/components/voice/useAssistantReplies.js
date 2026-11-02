import { useEffect, useRef } from "react";

import { useKit } from "../../state/KitContext";
import { createAssistantEngine } from "./assistantEngine";

// 답할 대상: 말하기로 확정된 문장 · 대화창 빠른 답 버튼
const USER_KINDS = ["user_speech", "user_report"];

// 이미 답한(또는 답하지 않기로 한) 기록 id — 화면이 여러 개 떠 있어도(메인이 스택에 두 번 쌓이는 경우 등)
// 한 문장에는 한 번만 답하도록 모든 인스턴스가 함께 쓴다
const handledLogIds = new Set();

/**
 * 대화창에 새 사용자 문장이 올라오면 AI 안내 답변을 붙인다. (팀원 코드 변경 없이 대화 기록만 보고 동작)
 *
 *   user_speech / user_report 기록 추가
 *     → engine.reply(text)
 *     → addLog({ kind: "device_guidance", title, text, actions })   대화창 안내 말풍선 (+ 버튼)
 *     → 기능 명령이면 runFeature(feature, action, "voice")          버튼과 같은 흐름
 *
 * 마운트 이전에 있던 기록(부팅 시 불러온 기록 등)에는 답하지 않는다.
 * 여러 곳에서 동시에 쓰여도 같은 기록에는 한 번만 답한다.
 */
export function useAssistantReplies({ engine: engineProp } = {}) {
  const { logs, addLog, runFeature } = useKit();
  const engineRef = useRef(undefined);
  if (engineRef.current === undefined) {
    engineRef.current = engineProp !== undefined ? engineProp : createAssistantEngine();
  }
  const initializedRef = useRef(false);
  const actionsRef = useRef({ addLog, runFeature });
  actionsRef.current = { addLog, runFeature };

  useEffect(() => {
    // 처음에는 지금까지의 기록을 모두 처리한 것으로 본다
    if (!initializedRef.current) {
      initializedRef.current = true;
      logs.forEach((l) => handledLogIds.add(l.id));
      return;
    }
    const engine = engineRef.current;
    const fresh = logs.filter(
      (l) => USER_KINDS.includes(l.kind) && !handledLogIds.has(l.id)
    );
    fresh.forEach((log) => {
      handledLogIds.add(log.id);
      if (!engine) return; // API 미연결: 답변 없음
      engine
        .reply(log.text)
        .then((answer) => {
          const say = Array.isArray(answer?.say) ? answer.say : [];
          if (say.length === 0) return;
          const [first, ...rest] = say;
          actionsRef.current.addLog({
            kind: "device_guidance",
            title: first.text,
            text: rest.map((u) => u.text).join(" ") || undefined,
            actions: answer.actions ?? [],
            meta: { intent: answer.intent, replyTo: log.id },
          });
          if (answer.intent?.type === "command") {
            actionsRef.current.runFeature(answer.intent.feature, answer.intent.action, "voice");
          }
        })
        .catch(() => {
          actionsRef.current.addLog({
            kind: "system",
            text: "안내를 만들지 못했어요. 매뉴얼에서 상황을 직접 선택해주세요.",
          });
        });
    });
  }, [logs]);
}
