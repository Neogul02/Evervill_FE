export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

export const NICKNAME_PATTERN = /^[a-zA-Z0-9가-힣_]{2,20}$/

export const RESERVED_NICKNAMES = ['admin', 'administrator', 'root', 'system', '관리자', '운영자']

export function isReservedNickname(nickname: string): boolean {
  return RESERVED_NICKNAMES.includes(nickname.trim().toLowerCase())
}

export function containsUnsafePattern(value: string): boolean {
  return /<|>|javascript:|on\w+\s*=/i.test(value)
}
