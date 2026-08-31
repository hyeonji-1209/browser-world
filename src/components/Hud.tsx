import type { WorldStats } from '../sim/types'
import { Card } from './Card'
import { Crest } from './Crest'

/** 세계의 기분 한 줄 */
function mood(s: WorldStats): string {
  if (s.night > 0.6) return '모두 새근새근 자는 중이에요 💤'
  if (s.infected >= 3) return '역병이 돌고 있어요… 아픈 아이를 찾아보세요 🤒'
  if (s.population > 0 && s.population < 12) return '힘든 시기예요… 🌱 먹이를 뿌려 도와주세요'
  if (s.pollution > 0.5) return '공기가 탁해요 — RAM을 정리하면 맑아져요 🌫'
  if (s.heat > 0.7) return '너무 더워요 🥵 컴퓨터를 쉬게 해주세요'
  if (s.foodMul <= 0.3) return '겨울이라 먹이가 귀해요 ❄️ 봄을 기다려요'
  if (s.predators >= 6) return '여우가 많아서 다들 조마조마해요 👀'
  return '평화로운 하루예요 ☀️'
}

export function Hud({ stats, paused, event, feed }: { stats: WorldStats | null; paused: boolean; event: string; feed: string[] }) {
  if (!stats) return null
  const day = Math.floor(stats.tick / 2000) + 1
  return (
    <Card id="hud" title={`🌱 ${day.toLocaleString()}일째 · ${stats.season}`} className="w-full">
      <div className="text-[#8a7f9e]">{paused ? '⏸ 시간이 멈춰 있어요' : mood(stats)}</div>
      <div className="mt-1">🐣 {stats.population}마리 · 🦊 {stats.predators} · 🍓 {stats.food}{stats.infected > 0 && <span> · 🤒 {stats.infected}</span>}</div>
      <div className="text-xs text-[#9a8fae]">
        👑 {stats.topFamilies[0] ? <><Crest family={stats.topFamilies[0].family} size={12} /> {stats.topFamilies[0].family}가 ({stats.topFamilies[0].count}마리)</> : '아직 큰 가문이 없어요'} · {stats.maxGen}세대까지
      </div>
      <div className="text-[11px] text-[#b0a6c2]">
        평균 속도 {stats.avgSpeed.toFixed(2)} · 크기 {stats.avgSize.toFixed(2)} · 시야 {stats.avgSight.toFixed(0)} · 먹이 성장 x{(stats.foodMul * stats.activityMul).toFixed(2)}
      </div>
      {event && <div className="text-xs text-amber-600 mt-1">⚠ {event}</div>}
      {feed.length > 0 && (
        <div className="mt-2 pt-2 border-t border-pink-200 text-xs text-[#8a7f9e]">
          {feed.map((f, i) => <div key={i} style={{ opacity: 1 - i * 0.2 }}>{f}</div>)}
        </div>
      )}
    </Card>
  )
}
