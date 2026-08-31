export function TimeMachine({ snapshots, onTravel, onClose }: {
  snapshots: { tick: number; season: string; pop: number }[]
  onTravel: (tick: number) => void
  onClose: () => void
}) {
  return (
    <div className="card fixed bottom-16 left-3 w-[280px] px-4 py-3 text-[13px] leading-relaxed z-10">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">⏪ 타임머신</span>
        <button className="text-[#9a8fae] hover:text-pink-500 cursor-pointer" onClick={onClose}>✕</button>
      </div>
      {snapshots.length === 0 && <div className="text-xs text-[#9a8fae]">아직 기록이 없어요. 3,000틱마다 세계가 자동으로 남아요.</div>}
      {[...snapshots].reverse().map((s) => (
        <button
          key={s.tick}
          className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-pink-50 cursor-pointer"
          onClick={() => { if (window.confirm(`tick ${s.tick.toLocaleString()}의 세계로 돌아갈까요?\n지금 세계의 이후 이야기는 사라져요.`)) { onTravel(s.tick); onClose() } }}
        >
          🌀 tick {s.tick.toLocaleString()} · {s.season} · 피식자 {s.pop}마리
        </button>
      ))}
      {snapshots.length > 0 && <div className="text-[11px] text-[#9a8fae] mt-1">앱을 끄면 스냅샷은 사라져요 (지금 세계만 저장됨)</div>}
    </div>
  )
}
