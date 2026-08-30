import type { Creature } from '../sim/creature'
import type { Ghost } from '../sim/types'

function Bar({ label, v, max }: { label: string; v: number; max: number }) {
  return (
    <div className="mb-1.5">
      {label} {v.toFixed(2)}
      <div className="h-1.5 bg-pink-100 rounded-full mt-0.5">
        <div className="h-full bg-pink-400 rounded-full" style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
      </div>
    </div>
  )
}

export function Panel({ c, lineage }: { c: Creature; lineage: (Creature | Ghost)[] }) {
  const g = c.genes
  return (
    <div className="card fixed top-3 right-3 w-[270px] px-4 py-3 text-[13px] leading-relaxed">
      <h3 className="font-bold mb-1.5">
        <span style={{ color: c.color }}>■</span> {c.isPredator ? '🦊' : '🐣'} {c.name} · {c.gen}세대
      </h3>
      <Bar label="속도" v={g.speed} max={4} />
      <Bar label="크기" v={g.size} max={10} />
      <Bar label="시야" v={g.sight} max={250} />
      <div>에너지 {c.energy.toFixed(0)} · 나이 {c.age} · 자식 {c.children}{c.petted > 0 && <span className="text-pink-400"> · 쓰담 {c.petted}</span>}</div>
      {c.infected > 0 && <div className="text-lime-400">🦠 감염 중 ({c.infected}틱 남음)</div>}
      {c.immune && <div className="text-[#9a8fae]">면역</div>}
      <hr className="border-pink-200 my-2" />
      <div className="text-xs text-[#9a8fae]">족보 ({lineage.length}대 위까지)</div>
      <div className="text-xs">
        {lineage.length === 0 && <div>1세대 (조상 없음)</div>}
        {lineage.map((p) => (
          <div key={p.id}>
            ↑ {p.name} {p.gen}세대 · 속 {p.genes.speed.toFixed(2)} 크 {p.genes.size.toFixed(1)} 시 {p.genes.sight.toFixed(0)}
            {'died' in p && ` † ${p.cause}`}
          </div>
        ))}
      </div>
    </div>
  )
}
