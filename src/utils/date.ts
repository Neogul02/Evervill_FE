// 백엔드는 타임존 오프셋 없는 UTC 시각 문자열을 내려준다 (예: "2026-06-23T08:39:58").
// 오프셋이 없으면 브라우저가 이를 로컬 시각으로 잘못 해석하므로, 명시적으로 UTC로 지정한 뒤
// Asia/Seoul로 변환한다 (KST = UTC + 9시간).
export function parseServerDate(dateStr: string): Date {
  const hasOffset = /Z$|[+-]\d\d:?\d\d$/.test(dateStr)
  return new Date(hasOffset ? dateStr : `${dateStr}Z`)
}

export function formatKstTime(dateStr: string): string {
  return parseServerDate(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

export function formatKstDate(dateStr: string): string {
  return parseServerDate(dateStr).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export function formatKstDateTime(dateStr: string): string {
  return parseServerDate(dateStr).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}
