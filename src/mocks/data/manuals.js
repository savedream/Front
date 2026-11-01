/**
 * 시연용 매뉴얼 목데이터
 * - 구조는 UI 명세 06 "매뉴얼 공통 모델"을 따른다.
 * - 의료 문구는 검수 전 자리표시자다 (reviewStatus: "pending").
 *   실제 배포 전 승인된 자료로 교체해야 한다.
 */

const step = (manualId, order, body, withImage = false) => ({
  id: `step_0${order}`,
  order,
  title: null,
  body,
  images: withImage
    ? [
        {
          id: `image_0${order}`,
          assetPath: `manuals/${manualId}/step_0${order}.png`,
          alt: `${order}단계 동작 그림`,
          caption: null,
          order: 1,
        },
      ]
    : [],
});

export const MANUALS = [
  {
    id: "cardiac_arrest",
    title: "심정지 의심",
    shortTitle: "심정지",
    summary: "반응·호흡 확인과 가슴압박",
    icon: "heart",
    tone: "red",
    version: "1.0",
    reviewStatus: "pending",
    steps: [
      step("cardiac_arrest", 1, "반응과 호흡을 확인하세요.", true),
      step("cardiac_arrest", 2, "119에 신고하고 AED를 요청하세요.", true),
      step("cardiac_arrest", 3, "숨을 쉬지 않으면 가슴압박을 시작하세요.", true),
      step("cardiac_arrest", 4, "가슴 중앙을 분당 100~120회, 약 5cm 깊이로 압박하세요.", true),
      step("cardiac_arrest", 5, "AED가 오면 음성 안내를 따르세요.", true),
    ],
  },
  {
    id: "choking",
    title: "기도폐쇄",
    shortTitle: "기도폐쇄",
    summary: "기침 유도와 이물질 제거",
    icon: "lungs",
    tone: "green",
    version: "1.0",
    reviewStatus: "pending",
    steps: [
      step("choking", 1, "기침할 수 있으면 계속 기침하게 하세요.", true),
      step("choking", 2, "기침이나 말을 못 하면 119에 신고하세요.", true),
      step("choking", 3, "등을 강하게 5회 두드리세요.", true),
      step("choking", 4, "복부를 안쪽 위로 5회 밀어내세요.", true),
      step("choking", 5, "이물질이 나올 때까지 반복하세요.", true),
    ],
  },
  {
    id: "fracture",
    title: "골절·염좌 의심",
    shortTitle: "골절·염좌",
    summary: "손상 부위 고정과 순환 확인",
    icon: "bone",
    tone: "blue",
    version: "1.0",
    reviewStatus: "pending",
    steps: [
      step("fracture", 1, "다친 부위를 움직이지 않게 하세요."),
      step("fracture", 2, "출혈이 있으면 깨끗한 천으로 눌러 먼저 지혈하세요."),
      step("fracture", 3, "부목이나 단단한 물건으로 다친 부위의 위아래 관절까지 고정하세요."),
      step("fracture", 4, "고정 후 손끝·발끝의 색, 감각, 온기를 확인하세요."),
      step("fracture", 5, "천으로 감싼 냉찜질로 붓기를 줄이고 도움을 요청하세요."),
    ],
  },
  {
    id: "bleeding",
    title: "심한 출혈",
    shortTitle: "심한 출혈",
    summary: "직접 압박과 체온 유지",
    icon: "drop",
    tone: "red",
    version: "1.0",
    reviewStatus: "pending",
    steps: [
      step("bleeding", 1, "깨끗한 천이나 거즈로 상처를 세게 직접 누르세요."),
      step("bleeding", 2, "피가 배어 나와도 천을 떼지 말고 위에 덧대어 계속 누르세요."),
      step("bleeding", 3, "119에 신고하세요."),
      step("bleeding", 4, "담요나 옷으로 덮어 체온을 유지하세요."),
    ],
  },
  {
    id: "spinal_injury",
    title: "머리·목·허리 손상",
    shortTitle: "머리·목·허리",
    summary: "움직임 제한과 감각 확인",
    icon: "person",
    tone: "purple",
    version: "1.0",
    reviewStatus: "pending",
    steps: [
      step("spinal_injury", 1, "환자를 움직이지 말고 그 자리에서 안정시키세요."),
      step("spinal_injury", 2, "머리와 목이 움직이지 않도록 양손으로 머리 양옆을 받쳐주세요."),
      step("spinal_injury", 3, "119에 신고하세요."),
      step("spinal_injury", 4, "의식, 호흡, 손발의 감각과 움직임을 확인하고 변화를 알려주세요."),
    ],
  },
  {
    id: "burn",
    title: "화상",
    shortTitle: "화상",
    summary: "20분 냉각과 피부 보호",
    icon: "flame",
    tone: "orange",
    version: "1.0",
    reviewStatus: "pending",
    steps: [
      step("burn", 1, "열원에서 벗어나게 하세요."),
      step("burn", 2, "흐르는 시원한 물로 20분 정도 식히세요."),
      step("burn", 3, "붓기 전에 반지·시계를 빼고, 달라붙은 옷은 떼지 마세요."),
      step("burn", 4, "물집은 터뜨리지 말고 깨끗한 천으로 느슨하게 덮으세요."),
      step("burn", 5, "넓은 화상이나 얼굴·손 화상은 도움을 요청하세요."),
    ],
  },
];

export const toSummary = ({ steps, ...rest }) => ({
  ...rest,
  stepCount: steps.length,
  available: steps.length > 0,
});
