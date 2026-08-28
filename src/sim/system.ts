/** 컴퓨터 상태 → 세계의 환경 (Tauri 데스크톱 앱에서만) */
export interface SystemStats {
  cpu: number
  mem_used: number
  mem_total: number
  mem_pct: number
  process_count: number
  uptime_secs: number
}

export const isTauri = () => '__TAURI_INTERNALS__' in window

export async function fetchSystem(): Promise<SystemStats | null> {
  if (!isTauri()) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<SystemStats>('system_stats')
}

/** CPU 사용률 → 열 (0~1). 열이 오르면 생명체가 빨라지고 대사가 늘어남 */
export const heatOf = (s: SystemStats | null) => (s ? Math.min(1, s.cpu / 100) : 0)
/** 메모리 사용률 → 오염 (0~1). 70% 넘어가면서 급격히. 오염은 질병·먹이에 악영향 */
export const pollutionOf = (s: SystemStats | null) => (s ? Math.min(1, Math.max(0, (s.mem_pct - 60) / 35)) : 0)

export const fmtGB = (b: number) => (b / 1024 ** 3).toFixed(1) + 'GB'
