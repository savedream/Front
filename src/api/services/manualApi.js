import { http } from "../client";

/**
 * 기능 ⑤ 응급조치 매뉴얼 (오프라인 로컬 데이터)
 * GET /manuals      → { manuals: ManualSummary[] }
 * GET /manuals/:id  → Manual
 *
 * Manual = { id, title, summary, icon, tone, version, reviewStatus, steps: Step[] }
 * Step   = { id, order, title, body, images: Image[] }
 * Image  = { id, assetPath, alt, caption, order }
 * steps 가 비어 있으면 "준비 중"으로 표시한다.
 */
export const manualApi = {
  list: () => http.get("/manuals"),
  get: (id) => http.get(`/manuals/${id}`),
};
