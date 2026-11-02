/**
 * 매뉴얼 목데이터 — 키트 서버 응답과 같은 형식 (snake_case, Notion "API 명세서" · 매뉴얼)
 *
 *   GET /api/manuals            → 목록: 아래 항목에서 view_steps 를 뺀 값
 *   GET /api/manuals/{manual_id} → 보기용 카드: 아래 항목 그대로 (없으면 404 MANUAL_NOT_FOUND)
 *
 * .env 의 EXPO_PUBLIC_USE_MOCK=true 일 때 사용한다. 실제 API 와 같은 변환 함수(api/services/manualApi.js)를 거친다.
 *
 * ⚠ 목데이터 기준
 * - 응급처치 문구·그림은 기존 화면에 쓰던 내용 그대로다.
 * - manual_id: 실제 서버 값은 "EM-01"(심정지 의심), "EM-02"(기도폐쇄)처럼 온다. 나머지 코드는 명세에서 확인되지 않아
 *   기존 화면 ID 를 그대로 둔다. (화면 색·아이콘은 이름으로 찾으므로 실제 ID 로 바뀌어도 그대로 동작)
 * - kind(check 확인 · call 도움 요청 · action 처치)는 목데이터용으로 붙인 값이다. title 은 기존 자료에 없어 null.
 * - image: 서버는 파일 경로 문자열(/static/manuals/...)을 주고, 목데이터는 앱에 들어 있는 그림을 쓴다.
 */
export const MANUAL_MOCK_DB = [
  {
    manual_id: "cardiac-arrest",
    type: "situation",
    situation_code: 1,
    name: "심정지 의심",
    summary: "반응·호흡 확인과 가슴압박",
    featured: 1,
    priority: 1,
    call_119: true,
    view_steps: [
      { no: 1, kind: "check", title: null, text: "반응과 호흡을 확인하세요.", image: require("../assets/image/manual/cardiacarrest/CA-1.png") },
      { no: 2, kind: "call", title: null, text: "119에 신고하고 AED를 요청하세요.", image: require("../assets/image/manual/cardiacarrest/CA-2.png") },
      { no: 3, kind: "action", title: null, text: "숨을 쉬지 않으면 가슴압박을 시작하세요.", image: require("../assets/image/manual/cardiacarrest/CA-3.png") },
      { no: 4, kind: "action", title: null, text: "가슴 중앙을 분당 100~120회,\n약 5cm 깊이로 압박하세요.", image: require("../assets/image/manual/cardiacarrest/CA-4.png") },
      { no: 5, kind: "action", title: null, text: "AED가 오면 음성 안내를 따르세요.", image: require("../assets/image/manual/cardiacarrest/CA-5.png") },
    ],
  },
  {
    manual_id: "choking",
    type: "situation",
    situation_code: 2,
    name: "기도폐쇄",
    summary: "기침 유도와 이물질 제거",
    featured: 2,
    priority: 2,
    call_119: true,
    view_steps: [
      { no: 1, kind: "action", title: null, text: "기침할 수 있으면 계속\n기침하게 하세요.", image: require("../assets/image/manual/choking/C-1.png") },
      { no: 2, kind: "call", title: null, text: "기침이나 말을 못 하면\n119에 신고하세요.", image: require("../assets/image/manual/choking/C-2.png") },
      { no: 3, kind: "action", title: null, text: "등을 강하게 5회 두드리세요.", image: require("../assets/image/manual/choking/C-3.png") },
      { no: 4, kind: "action", title: null, text: "복부를 안쪽 위로 5회 밀어내세요.", image: require("../assets/image/manual/choking/C-4.png") },
      { no: 5, kind: "action", title: null, text: "이물질이 나올 때까지 반복하세요.", image: require("../assets/image/manual/choking/C-5.png") },
    ],
  },
  {
    manual_id: "fracture",
    type: "situation",
    situation_code: 3,
    name: "골절·염좌 의심",
    summary: "손상 부위 고정과 순환 확인",
    featured: 3,
    priority: 3,
    call_119: true,
    view_steps: [
      { no: 1, kind: "action", title: null, text: "다친 부위를 움직이거나 억지로 맞추지 마세요.", image: require("../assets/image/manual/fracture/F-1.png") },
      { no: 2, kind: "action", title: null, text: "단단한 물건을 대어 움직이지 않게 고정하세요.", image: require("../assets/image/manual/fracture/F-2.png") },
      { no: 3, kind: "check", title: null, text: "너무 꽉 묶지 말고 손·발끝의 색과 감각을 확인하세요.", image: require("../assets/image/manual/fracture/F-3.png") },
      { no: 4, kind: "action", title: null, text: "다리를 다쳤다면 걷지 마세요.", image: require("../assets/image/manual/fracture/F-4.png") },
      { no: 5, kind: "call", title: null, text: "뼈가 보이거나 출혈이 심하면 119에 신고하세요.", image: require("../assets/image/manual/fracture/F-5.png") },
    ],
  },
  {
    manual_id: "bleeding",
    type: "situation",
    situation_code: 4,
    name: "심한 출혈",
    summary: "직접 압박과 체온 유지",
    featured: 4,
    priority: 4,
    call_119: true,
    view_steps: [
      { no: 1, kind: "action", title: null, text: "천이나 거즈를 상처에 대고 강하게 누르세요.", image: require("../assets/image/manual/bleeding/BL-1.png") },
      { no: 2, kind: "action", title: null, text: "피가 배어나와도 떼지 말고 위에 덧대어 계속 누르세요.", image: require("../assets/image/manual/bleeding/BL-2.png") },
      { no: 3, kind: "action", title: null, text: "박힌 물건이 있다면 빼지 마세요.", image: require("../assets/image/manual/bleeding/BL-3.png") },
      { no: 4, kind: "call", title: null, text: "압박하면서 119에 신고하세요.", image: require("../assets/image/manual/bleeding/BL-4.png") },
      { no: 5, kind: "action", title: null, text: "환자를 눕히고 따뜻하게 해주세요.", image: require("../assets/image/manual/bleeding/BL-5.png") },
    ],
  },
  {
    manual_id: "spine-injury",
    type: "situation",
    situation_code: 5,
    name: "머리·목·허리 손상",
    summary: "움직임 제한과 감각 확인",
    featured: 5,
    priority: 5,
    call_119: true,
    view_steps: [
      { no: 1, kind: "action", title: null, text: "환자를 움직이지 마세요.", image: require("../assets/image/manual/spineinjury/S-1.png") },
      { no: 2, kind: "action", title: null, text: "환자에게도 움직이지 말라고 하세요.", image: require("../assets/image/manual/spineinjury/S-2.png") },
      { no: 3, kind: "action", title: null, text: "머리 양옆에 옷가지를 대어 움직임을 줄이세요.", image: require("../assets/image/manual/spineinjury/S-3.png") },
      { no: 4, kind: "call", title: null, text: "119에 신고하세요.", image: require("../assets/image/manual/spineinjury/S-4.png") },
      { no: 5, kind: "check", title: null, text: "손가락·발가락을 움직일 수 있는지 확인하세요.", image: require("../assets/image/manual/spineinjury/S-5.png") },
    ],
  },
  {
    manual_id: "burn",
    type: "situation",
    situation_code: 6,
    name: "화상",
    summary: "20분 냉각과 피부 보호",
    featured: 6,
    priority: 6,
    call_119: true,
    view_steps: [
      { no: 1, kind: "action", title: null, text: "열원에서 벗어나 안전한 곳으로 이동하세요.", image: require("../assets/image/manual/burn/BU-1.png") },
      { no: 2, kind: "action", title: null, text: "흐르는 시원한 물로 20분 이상 식히세요.", image: require("../assets/image/manual/burn/BU-2.png") },
      { no: 3, kind: "action", title: null, text: "피부에 붙은 옷을 떼거나 물집을 터뜨리지 마세요.", image: require("../assets/image/manual/burn/BU-3.png") },
      { no: 4, kind: "action", title: null, text: "식힌 뒤 깨끗한 거즈로 덮으세요.", image: require("../assets/image/manual/burn/BU-4.png") },
      { no: 5, kind: "call", title: null, text: "얼굴·목 화상이나 심한 화상일 시 바로 119에 신고하세요.", image: require("../assets/image/manual/burn/BU-5.png") },
    ],
  },
];
