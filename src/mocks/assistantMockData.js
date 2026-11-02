/**
 * AI 안내(발화 해석) 목데이터
 *
 * 실제로는 키트의 온디바이스 AI 모델 + 절차 엔진이 답한다. (백엔드 미구현, 이벤트 형식 확인 필요)
 * 목데이터에서는 키워드 규칙으로 답한다. 위에서부터 먼저 일치하는 규칙을 쓴다.
 * (팀원이 c375a9f 이전에 쓰던 assistantRules.js 를 옮겨 와 매뉴얼 ID 를 현재 값으로 맞춤)
 *
 * 답변 형식 — 명세 /api/utterances 응답의 say[] 와 맞춤 + 대화창 버튼(actions)
 *   {
 *     intent:  { type: "manual", manualId } | { type: "command", feature, action } | { type: "unclear" },
 *     say:     [{ role: "instruction" | "question" | "notice", text }],
 *     actions: [{ type: "openManual", manualId, label } | { type: "openManualList", label }
 *               | { type: "reply", text, label }],
 *   }
 */

const openManual = (manualId, label) => ({ type: "openManual", manualId, label });
const quickReply = (text) => ({ type: "reply", text, label: text });

// 기능 명령 (메트로놈·구조신호·타이머) → 대화창 안내 + runFeature
const command = (feature, action, text) => ({
  intent: { type: "command", feature, action },
  say: [{ role: "notice", text }],
  actions: [],
});

const isOff = (t) => /(꺼|멈|정지|그만|중지)/.test(t);

export const ASSISTANT_MOCK_RULES = [
  {
    test: (t) => /메트로놈|박자/.test(t),
    build: (t) =>
      isOff(t)
        ? command("metronome", "off", "메트로놈을 끌게요.")
        : command("metronome", "on", "메트로놈을 켤게요."),
  },
  {
    test: (t) => /구조\s?신호|사이렌/.test(t),
    build: (t) =>
      isOff(t)
        ? command("rescue", "off", "구조신호를 끌게요.")
        : command("rescue", "on", "구조신호를 울릴게요. 주변 알림용이며 119 신고는 따로 해주세요."),
  },
  {
    test: (t) => /타이머|시간\s?(재|측정)/.test(t),
    build: (t) =>
      isOff(t)
        ? command("timer", "off", "타이머를 일시정지할게요.")
        : command("timer", "on", "타이머를 시작할게요."),
  },
  {
    test: (t) => /출혈은?\s?없/.test(t),
    build: () => ({
      intent: { type: "manual", manualId: "fracture" },
      say: [
        { role: "notice", text: "출혈이 없는 것으로 기록했어요." },
        { role: "instruction", text: "다친 다리를 움직이지 말고 고정해주세요. 골절·염좌 안내를 보여드릴게요." },
      ],
      actions: [openManual("fracture", "골절·염좌 안내 보기")],
    }),
  },
  {
    test: (t) => /출혈|피가|피를/.test(t),
    build: () => ({
      intent: { type: "manual", manualId: "bleeding" },
      say: [
        { role: "notice", text: "출혈이 있는 상황으로 이해했어요." },
        { role: "instruction", text: "깨끗한 천으로 상처를 세게 눌러주세요." },
      ],
      actions: [openManual("bleeding", "심한 출혈 안내 보기")],
    }),
  },
  {
    test: (t) => /쓰러|숨을?\s?안|숨을?\s?못|의식|심장|반응이?\s?없/.test(t),
    build: () => ({
      intent: { type: "manual", manualId: "cardiac-arrest" },
      say: [
        { role: "notice", text: "심정지가 의심돼요." },
        { role: "question", text: "어깨를 두드리며 반응과 호흡을 확인해주세요. 숨을 쉬나요?" },
      ],
      actions: [
        openManual("cardiac-arrest", "심정지 안내 보기"),
        quickReply("숨을 안 쉬어요"),
        quickReply("숨을 쉬어요"),
        quickReply("모르겠어요"),
      ],
    }),
  },
  {
    test: (t) => /목에\s?걸|기도|켁켁|숨이\s?막/.test(t),
    build: () => ({
      intent: { type: "manual", manualId: "choking" },
      say: [
        { role: "notice", text: "기도폐쇄가 의심돼요." },
        { role: "question", text: "기침을 할 수 있는지 먼저 확인해주세요." },
      ],
      actions: [openManual("choking", "기도폐쇄 안내 보기")],
    }),
  },
  {
    test: (t) => /화상|데었|데였|뜨거/.test(t),
    build: () => ({
      intent: { type: "manual", manualId: "burn" },
      say: [
        { role: "notice", text: "화상으로 이해했어요." },
        { role: "instruction", text: "흐르는 시원한 물로 화상 부위를 20분 이상 식혀주세요." },
      ],
      actions: [openManual("burn", "화상 안내 보기")],
    }),
  },
  {
    test: (t) => /머리|목이?\s?아|목을?\s?다|허리|척추|떨어졌/.test(t),
    build: () => ({
      intent: { type: "manual", manualId: "spine-injury" },
      say: [
        { role: "notice", text: "머리·목·허리 손상이 의심돼요." },
        { role: "instruction", text: "환자를 움직이지 말고 머리 양옆을 받쳐주세요." },
      ],
      actions: [openManual("spine-injury", "손상 안내 보기")],
    }),
  },
  {
    test: (t) => /넘어|다리|팔|발목|골절|부러|삐|접질/.test(t),
    build: () => ({
      intent: { type: "manual", manualId: "fracture" },
      say: [
        { role: "notice", text: "다리 부상으로 이해했어요." },
        { role: "question", text: "출혈이 있는지 먼저 확인해주세요." },
      ],
      actions: [
        quickReply("출혈이 있어요"),
        quickReply("출혈은 없어요"),
        openManual("fracture", "골절·염좌 안내 보기"),
      ],
    }),
  },
  {
    test: (t) => /모르겠/.test(t),
    build: () => ({
      intent: { type: "unclear" },
      say: [
        { role: "notice", text: "괜찮아요, 확인되지 않은 것으로 둘게요." },
        { role: "instruction", text: "가슴이 오르내리는지 10초 동안 지켜봐주세요." },
      ],
      actions: [quickReply("숨을 안 쉬어요"), quickReply("숨을 쉬어요")],
    }),
  },
  {
    test: (t) => /숨을?\s?쉬어/.test(t),
    build: () => ({
      intent: { type: "unclear" },
      say: [
        { role: "notice", text: "호흡이 있는 것으로 기록했어요." },
        { role: "instruction", text: "옆으로 눕히고 호흡이 계속되는지 지켜봐주세요." },
      ],
      actions: [],
    }),
  },
];

// 어떤 규칙에도 맞지 않을 때
export const ASSISTANT_MOCK_FALLBACK = {
  intent: { type: "unclear" },
  say: [
    { role: "notice", text: "잘 이해하지 못했어요." },
    { role: "question", text: "다친 곳이나 지금 상황을 한 번 더 말씀해주세요." },
  ],
  actions: [{ type: "openManualList", label: "매뉴얼 목록 보기" }],
};

// 답변까지 걸리는 시간 (모델 추론 흉내, ms)
export const ASSISTANT_MOCK_DELAY_MS = 600;
