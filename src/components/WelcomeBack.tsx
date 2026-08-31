export function WelcomeBack({ away, onFF, onClose }: { away: { ms: number; ticks: number }; onFF: (t: number) => void; onClose: () => void }) {
  const h = away.ms / 3600e3
  const label = h >= 24 ? `${Math.floor(h / 24)}일` : h >= 1 ? `${Math.floor(h)}시간` : `${Math.floor(away.ms / 60e3)}분`
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="card px-6 py-5 w-[340px] text-[14px] leading-relaxed" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold mb-2">{label} 만이에요! 👋</div>
        <div className="text-[#6b5b7b]">
          젤리들은 그 모습 그대로 잠들어 기다리고 있었어요.
          원하면 다녀온 만큼 세월을 흐르게 할 수도 있어요 — 세대가 바뀌어 있을지도!
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn flex-1" onClick={onClose}>그대로 이어가기</button>
          <button className="btn flex-1" onClick={() => onFF(away.ticks)}>⏩ 세월 흐르기 ({away.ticks.toLocaleString()}틱)</button>
        </div>
      </div>
    </div>
  )
}
