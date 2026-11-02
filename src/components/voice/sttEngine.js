import { KIT_API_CONFIG } from "../../api/kitConfig";
import { createApiSttEngine } from "./apiSttEngine";
import { createMockSttEngine } from "./mockSttEngine";

/**
 * 말하기(STT) 엔진 선택
 *
 * - 목데이터/실제 API 전환은 .env 의 EXPO_PUBLIC_USE_MOCK 하나로 한다 (api/kitConfig.js 가 읽음).
 * - MOCK_REALTIME_TEXT: 목데이터에서 말하는 도중 글자를 실시간으로 보여줄지
 *     실제 API 명세에는 실시간 글자가 없다 ("인식된 문장은 말이 끝난 뒤 speech.final 로 온다").
 *     false 로 두면 목데이터도 실제 API 와 똑같이 "말하기 완료 후 문장 표시"로 동작한다.
 */
export const STT_CONFIG = {
  MOCK_REALTIME_TEXT: true,
};

/** 말하기 창 하나마다 엔진 인스턴스를 하나 만든다 (VoiceModal 에서 사용) */
export function createSttEngine() {
  if (KIT_API_CONFIG.USE_MOCK) {
    return createMockSttEngine({ realtimeText: STT_CONFIG.MOCK_REALTIME_TEXT });
  }
  return createApiSttEngine();
}
