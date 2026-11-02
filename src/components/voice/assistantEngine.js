import { KIT_API_CONFIG } from "../../api/kitConfig";
import {
  ASSISTANT_MOCK_DELAY_MS,
  ASSISTANT_MOCK_FALLBACK,
  ASSISTANT_MOCK_RULES,
} from "../../mocks/assistantMockData";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * AI 안내(발화 해석) 엔진
 *
 *   reply(text): Promise<{ intent, say: [{ role, text }], actions }>
 *
 * - 목데이터(.env EXPO_PUBLIC_USE_MOCK=true): mocks/assistantMockData.js 의 키워드 규칙으로 답한다
 * - 키트 API: 아직 없음 → null (대화창에 답변을 추가하지 않는다)
 *   TODO: 백엔드가 정하면 speech.final 이후 같은 turn_id 로 오는 안내 이벤트(say[])를 받아 연결
 */
export function createMockAssistantEngine({
  rules = ASSISTANT_MOCK_RULES,
  fallback = ASSISTANT_MOCK_FALLBACK,
  delayMs = ASSISTANT_MOCK_DELAY_MS,
} = {}) {
  return {
    async reply(text) {
      await sleep(delayMs);
      const sentence = String(text ?? "");
      const rule = rules.find((r) => r.test(sentence));
      // 규칙 객체가 공유되지 않도록 복사해서 돌려준다
      return JSON.parse(JSON.stringify(rule ? rule.build(sentence) : fallback));
    },
  };
}

export function createAssistantEngine() {
  if (KIT_API_CONFIG.USE_MOCK) return createMockAssistantEngine();
  return null;
}
