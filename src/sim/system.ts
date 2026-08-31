/** 컴퓨터 상태 → 세계의 환경 (Tauri 데스크톱 앱에서만) */
export interface SystemStats {
  cpu: number
  mem_used: number
  mem_total: number
  mem_pct: number
  process_count: number
  uptime_secs: number
  battery_pct: number | null // 배터리 없으면 null
  charging: boolean
  net_bps: number
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

/** 배터리 → 밤 (0~1). 충전 중이면 낮. 방전 중 60% 아래부터 어두워져 15%에 완전한 밤 */
export const nightOf = (s: SystemStats | null) => {
  if (!s || s.battery_pct == null || s.charging) return 0
  return Math.min(1, Math.max(0, (60 - s.battery_pct) / 45))
}

/** 네트워크 트래픽 → 바람 (0~1). 200KB/s부터 불기 시작, 8MB/s에 강풍 */
export const windOf = (s: SystemStats | null) => {
  if (!s || s.net_bps < 200e3) return 0
  return Math.min(1, Math.log10(s.net_bps / 200e3) / Math.log10(40))
}
export const fmtBps = (b: number) => (b > 1e6 ? (b / 1e6).toFixed(1) + 'MB/s' : (b / 1e3).toFixed(0) + 'KB/s')

export const fmtGB = (b: number) => (b / 1024 ** 3).toFixed(1) + 'GB'
