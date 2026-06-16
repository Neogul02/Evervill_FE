import type { User } from '@/types'

export function parseJwt(token: string): Partial<User> | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: Number(payload.sub),
      email: payload.email ?? '',
      role: payload.role ?? 'USER',
      nickname: payload.nickname ?? '',
    }
  } catch {
    return null
  }
}
