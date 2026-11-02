import { http } from "../client";

/** 기능 ① 전체 실행 및 전원 */
export const systemApi = {
  /** 부팅 상태: 매뉴얼·기록 로드, 장치 점검 결과 */
  boot: () => http.post("/system/boot"),
  /** 마이크·메트로놈·구조신호를 모두 종료하고 전원 종료 */
  shutdown: () => http.post("/system/shutdown"),
};
