import { STEP_ITEM_BASE_WIDTH } from "./ManualStepItem";

/**
 * 매뉴얼 단계 배치 계산 (ManualStepFlow 에서 사용)
 */

// 레이아웃 치수 (시안 기준)
export const MAX_COLUMNS = 3; // 한 행에 최대 3단계
export const MIN_ITEM_WIDTH = 220; // 이보다 좁아지면 열 수를 줄인다
export const FIRST_ROW_ARROW_WIDTH = 30; // 첫 행 단계 사이 화살표 영역 (화살표는 양옆 여백으로 넘쳐 보임)
export const ARROW_GAP_WIDTH = 80; // 다음 행 단계 사이 화살표 영역
export const LEADING_ARROW_WIDTH = 80; // 다음 행 시작 화살표 영역 (행 너비에 포함하지 않고 왼쪽에 띄워 둠)

function chunk(count, size) {
  const rows = [];
  for (let start = 0; start < count; start += size) {
    rows.push(
      Array.from({ length: Math.min(size, count - start) }, (_, i) => start + i)
    );
  }
  return rows;
}

/**
 * 단계 수와 사용 가능한 너비로 행 배치를 계산한다.
 * - 가로 배치: 한 행에 최대 3단계, 단계 사이마다 화살표 1개, 두 번째 행부터는 행 시작 화살표.
 *   두 번째 행부터는 단계들만 가로 가운데 정렬하고, 행 시작 화살표는 첫 단계 왼쪽에 띄운다
 *   (양옆에 화살표 폭만큼 여백을 확보해 좌우 대칭).
 *   → 5단계면 기존과 동일하게 [1,2,3] / [→ 4,5], 화살표 인덱스 0,1 | 2,3
 * - 너비가 부족하면 열 수를 줄이고, 2열도 부족하면 세로 1열(아래 화살표)로 표시한다.
 * - 화살표 i 는 항상 (i+1)단계 → (i+2)단계 전환을 뜻하므로 애니메이션 순서가 유지된다.
 */
export function buildStepLayout(stepCount, innerWidth) {
  if (stepCount <= 0) return { vertical: false, rows: [], itemWidth: 0 };

  const widthFor = (columns) => {
    const rows = chunk(stepCount, columns);
    const itemWidth = Math.min(
      ...rows.map((row, rowIndex) => {
        const fixed =
          rowIndex === 0
            ? (row.length - 1) * FIRST_ROW_ARROW_WIDTH
            : (row.length - 1) * ARROW_GAP_WIDTH + LEADING_ARROW_WIDTH * 2;
        return (innerWidth - fixed) / row.length;
      })
    );
    return { rows, itemWidth: Math.min(STEP_ITEM_BASE_WIDTH, itemWidth) };
  };

  for (let columns = Math.min(MAX_COLUMNS, stepCount); columns >= 2; columns -= 1) {
    const layout = widthFor(columns);
    if (layout.itemWidth >= MIN_ITEM_WIDTH) {
      return { vertical: false, ...layout };
    }
  }

  // 단계가 1개이거나 너비가 매우 좁은 경우: 세로 1열
  return {
    vertical: stepCount > 1,
    rows: chunk(stepCount, 1),
    itemWidth: Math.max(0, Math.min(STEP_ITEM_BASE_WIDTH, innerWidth)),
  };
}
