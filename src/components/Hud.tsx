import type { WorldStats } from '../sim/types'

export function Hud({ stats, paused }: { stats: WorldStats | null; paused: boolean }) {
  if (!stats) return null
  return (
    <div className="fixed top-3 left-3 bg-[#0b0e14]/85 border border-[#2a3140] px-3 py-2 text-[13px] leading-relaxed pointer-events-none whitespace-pre">
      {`tick ${stats.tick}   개체 ${stats.population}   먹이 ${stats.food}
최고 세대 ${stats.maxGen}
평균 속도 ${stats.avgSpeed.toFixed(2)}  크기 ${stats.avgSize.toFixed(2)}  시야 ${stats.avgSight.toFixed(0)}`}
      {paused && '\n⏸ 일시정지'}
    </div>
  )
}
