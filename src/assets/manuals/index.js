/**
 * 매뉴얼 이미지 자산 레지스트리
 *
 * React Native 는 require() 경로가 정적이어야 하므로, 매뉴얼 데이터의
 * assetPath 문자열을 여기서 실제 이미지로 연결한다.
 * 새 이미지 추가: 파일을 src/assets/manuals/<manualId>/ 에 넣고 아래에 한 줄 추가.
 * 등록되지 않은 assetPath 는 StepImage 에서 "이미지를 불러오지 못했어요"로 처리되고
 * 단계 텍스트는 그대로 보인다.
 *
 * 현재 이미지는 UI 명세 PDF 캡처에서 잘라낸 시연용 자리표시자이며,
 * 승인된 삽화로 교체해야 한다.
 */
export const MANUAL_ASSETS = {
  "manuals/cardiac_arrest/step_01.png": require("./cardiac_arrest/step_01.png"),
  "manuals/cardiac_arrest/step_02.png": require("./cardiac_arrest/step_02.png"),
  "manuals/cardiac_arrest/step_03.png": require("./cardiac_arrest/step_03.png"),
  "manuals/cardiac_arrest/step_04.png": require("./cardiac_arrest/step_04.png"),
  "manuals/cardiac_arrest/step_05.png": require("./cardiac_arrest/step_05.png"),
  "manuals/choking/step_01.png": require("./choking/step_01.png"),
  "manuals/choking/step_02.png": require("./choking/step_02.png"),
  "manuals/choking/step_03.png": require("./choking/step_03.png"),
  "manuals/choking/step_04.png": require("./choking/step_04.png"),
  "manuals/choking/step_05.png": require("./choking/step_05.png"),
};

export function resolveManualAsset(assetPath) {
  if (!assetPath) return null;
  if (/^(https?:|file:)/.test(assetPath)) return { uri: assetPath };
  return MANUAL_ASSETS[assetPath] ?? null;
}
