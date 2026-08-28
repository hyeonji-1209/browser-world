import { fmtGB, heatOf, pollutionOf, type SystemStats } from '../sim/system'

function Meter({ label, v, color, note }: { label: string; v: number; color: string; note: string }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-xs"><span>{label}</span><span className="text-[#9a8fae]">{note}</span></div>
      <div className="h-1.5 bg-pink-100 rounded-full mt-0.5">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, v * 100)}%`, background: color }} />
      </div>
    </div>
  )
}

export function SystemCard({ s }: { s: SystemStats | null }) {
  if (!s) return null
  const heat = heatOf(s), pol = pollutionOf(s)
  return (
    <div className="card fixed top-3 left-1/2 -translate-x-1/2 px-4 py-3 text-[13px] leading-relaxed w-[280px]">
      <div className="font-semibold mb-1">💻 내 컴퓨터가 곧 날씨</div>
      <Meter label={`🔥 열 (CPU ${s.cpu.toFixed(0)}%)`} v={heat} color="#fb7185"
        note={heat < 0.3 ? '쾌적' : heat < 0.7 ? '생명체가 빨라짐' : '폭염! 대사 폭증'} />
      <Meter label={`🌫 오염 (RAM ${fmtGB(s.mem_used)}/${fmtGB(s.mem_total)})`} v={pol} color="#94a3b8"
        note={pol === 0 ? '맑음' : pol < 0.5 ? '질병 확률 ↑' : '먹이 감소·역병'} />
      <div className="text-[11px] text-[#9a8fae]">프로세스 {s.process_count}개 · 켠 지 {(s.uptime_secs / 3600).toFixed(1)}시간</div>
    </div>
  )
}
