/** GitHub 공개 활동 → 세계의 환경 변수 */
export interface Activity {
  user: string
  today: number // 24시간 내 push 수
  week: number // 7일 내 push 수
  lastPush: string | null
  error?: string
}

const KEY = 'bw:gh-user'
export const defaultUser = () =>
  new URLSearchParams(location.search).get('gh') ?? localStorage.getItem(KEY) ?? 'hyeonji-1209'
export const saveUser = (u: string) => localStorage.setItem(KEY, u)

export async function fetchActivity(user: string): Promise<Activity> {
  try {
    const res = await fetch(`https://api.github.com/users/${user}/events/public?per_page=100`)
    if (!res.ok) return { user, today: 0, week: 0, lastPush: null, error: `GitHub ${res.status}` }
    const events: { type: string; created_at: string; payload: { size?: number } }[] = await res.json()
    const now = Date.now()
    let today = 0, week = 0, lastPush: string | null = null
    for (const e of events) {
      if (e.type !== 'PushEvent') continue
      const age = now - new Date(e.created_at).getTime()
      const n = e.payload.size ?? 1
      if (age < 86400e3) today += n
      if (age < 7 * 86400e3) week += n
      lastPush ??= e.created_at
    }
    return { user, today, week, lastPush }
  } catch (e) {
    return { user, today: 0, week: 0, lastPush: null, error: String(e) }
  }
}

/** 활동량 → 먹이 생성 배율 (0.6 ~ 2.0) */
export const foodMulOf = (a: Activity | null) =>
  a ? Math.min(2, 0.6 + a.today * 0.15 + a.week * 0.03) : 1
