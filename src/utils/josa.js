/** 받침 여부에 따라 조사 선택: josa("메트로놈", "이", "가") → "메트로놈이" */
export function josa(word, withBatchim, withoutBatchim) {
  const last = word?.charCodeAt(word.length - 1) ?? 0;
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const has = isHangul ? (last - 0xac00) % 28 !== 0 : /[0-9LMNR]$/i.test(word);
  return `${word}${has ? withBatchim : withoutBatchim}`;
}
