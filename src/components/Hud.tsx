import type { WorldStats } from '../sim/types'

export function Hud({ stats, paused, event, feed }: { stats: WorldStats | null; paused: boolean; event: string; feed: string[] }) {
  if (!stats) return null
  return (
    <div className="card fixed top-3 left-3 px-4 py-3 text-[13px] leading-relaxed pointer-events-none whitespace-pre">
      {`tick ${stats.tick}   ${stats.season} (먹이 x${(stats.foodMul * stats.activityMul).toFixed(2)})
피식자 ${stats.population}   포식자 ${stats.predators}   감염 ${stats.infected}   먹이 ${stats.food}
최고 세대 ${stats.maxGen}
평균 속도 ${stats.avgSpeed.toFixed(2)}  크기 ${stats.avgSize.toFixed(2)}  시야 ${stats.avgSight.toFixed(0)}`}
      {`\n👑 ${stats.topFamilies.map((f) => `${f.family}가 ${f.count}`).join(' · ') || '-'}`}
      {event && `\n⚠ ${event}`}
      {paused && '\n⏸ 일시정지'}
      {feed.length > 0 && (
        <div className="mt-2 pt-2 border-t border-pink-200 text-xs text-[#8a7f9e] whitespace-normal w-[240px]">
          {feed.map((f, i) => <div key={i} style={{ opacity: 1 - i * 0.2 }}>{f}</div>)}
        </div>
      )}
    </div>
  )
}
