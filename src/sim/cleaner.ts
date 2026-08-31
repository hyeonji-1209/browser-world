/** 청소 조사 모드: 지울 수 있는 캐시를 젤리들이 "조사"만 함 (읽기 전용 — 아무것도 삭제하지 않음) */
import { isTauri } from './system'

export interface JunkChunk { bytes: number; files: number; source: string }

export const sourceLabel = (s: string) => (s === 'npm' ? 'npm 캐시' : s === 'pip' ? 'pip 캐시' : 'Xcode 빌드 캐시')
export const cleanHint = (s: string) =>
  s === 'npm' ? 'npm cache clean --force' : s === 'pip' ? 'pip cache purge' : 'rm -rf ~/Library/Developer/Xcode/DerivedData'
export const fmtSize = (b: number) => (b > 1e9 ? (b / 1e9).toFixed(1) + 'GB' : Math.round(b / 1e6) + 'MB')

export async function scanJunk(): Promise<JunkChunk[]> {
  if (!isTauri()) return []
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<JunkChunk[]>('scan_junk')
}
