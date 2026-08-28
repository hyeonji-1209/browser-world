import type { WorldStats } from '../sim/types'

export function Hud({ stats, paused, event }: { stats: WorldStats | null; paused: boolean; event: string }) {
  if (!stats) return null
  return (
    <div className="card fixed top-3 left-3 px-4 py-3 text-[13px] leading-relaxed pointer-events-none whitespace-pre">
      {`tick ${stats.tick}   ${stats.season} (먹이 x${(stats.foodMul * stats.activityMul).toFixed(2)})
피식자 ${stats.population}   포식자 ${stats.predators}   감염 ${stats.infected}   먹이 ${stats.food}
최고 세대 ${stats.maxGen}
평균 속도 ${stats.avgSpeed.toFixed(2)}  크기 ${stats.avgSize.toFixed(2)}  시야 ${stats.avgSight.toFixed(0)}`}
      {event && `\n⚠ ${event}`}
      {paused && '\n⏸ 일시정지'}
    </div>
  )
}
