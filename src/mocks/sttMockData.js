/**
 * 음성 인식(STT) 목데이터
 *
 * 키트 API 가 연결되기 전까지 시연용으로 사용한다. (.env 의 EXPO_PUBLIC_USE_MOCK)
 * 말하기 창을 열거나 "다시 말하기"를 누를 때마다 아래 항목을 순서대로 하나씩 "인식"한다.
 *
 * 항목 형식
 * - 문자열: 한 단어씩 실시간으로 표시되는 인식 문장
 * - { error: "코드" }: 오류 상황 시연용 (키트 API 오류 코드)
 *     시작 실패: "MIC_UNAVAILABLE" · "AUDIO_BUSY" · "NOT_READY" / 듣는 도중: "NETWORK" · "TIMEOUT"
 */
export const STT_MOCK_SCRIPTS = [
  "등산하다 넘어졌는데, 다리를 움직이기 어려워요.",
  "사람이 쓰러졌는데, 숨을 안 쉬어요.",
  "친구가 음식을 먹다가, 목에 걸렸어요.",
  "넘어지면서 다리를 다쳤는데, 피가 많이 나요.",
  "뜨거운 물에 손을 데었어요.",
  "높은 곳에서 떨어졌는데, 목이 아프다고 해요.",
];

// 시연 타이밍 (ms)
export const STT_MOCK_TIMING = {
  micCheckMs: 600, // 마이크 확인
  firstWordDelayMs: 500, // 듣기 시작 후 첫 단어까지
  wordIntervalMs: 320, // 단어 사이 간격
  finalizeMs: 500, // 문장 확정(전달) 처리
  errorDelayMs: 1200, // 오류 시연 항목이 오류를 내기까지
  maxCaptureMs: 15000, // 최대 녹음 시간 (명세: 15초, 임시) — 지나면 자동으로 처리 시작
};
