import { Crest } from './Crest'

export interface YearData {
  year: number
  births: number
  deaths: Record<string, number>
  topFamily: string | null
  speedFrom: number
  speedTo: number
}

const CAUSE_EMOJI: Record<string, string> = { 포식: '🦊', 굶주림: '🍂', 질병: '🤒', 노화: '🕰' }

export function YearReport({ r, onClose }: { r: YearData; onClose: () => void }) {
  const totalDeaths = Object.values(r.deaths).reduce((a, b) => a + b, 0)
  const d = (r.speedTo - r.speedFrom)
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="card px-6 py-5 w-[340px] text-[14px] leading-relaxed" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold mb-1">📜 {r.year}년차 연대기</div>
        <div className="text-xs text-[#9a8fae] mb-2">한 해가 저물었어요. 올해의 기록이에요.</div>
        <div className="space-y-1 text-[#6b5b7b]">
          <div>🐣 태어난 아이 <b>{r.births.toLocaleString()}</b> · 🕯 떠난 아이 <b>{totalDeaths.toLocaleString()}</b></div>
          {totalDeaths > 0 && (
            <div className="text-xs text-[#9a8fae]">
              {Object.entries(r.deaths).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${CAUSE_EMOJI[c] ?? ''} ${c} ${n}`).join(' · ')}
            </div>
          )}
          <div>👑 올해의 가문: {r.topFamily ? <><Crest family={r.topFamily} size={13} /> <b>{r.topFamily}가</b></> : '없음'}</div>
          <div>
            🧬 평균 속도 {r.speedFrom.toFixed(2)} → {r.speedTo.toFixed(2)}
            <span className="text-xs text-[#9a8fae]"> ({d >= 0 ? '+' : ''}{d.toFixed(2)} {Math.abs(d) < 0.05 ? '· 평온한 해' : d > 0 ? '· 더 빨라졌어요' : '· 더 느긋해졌어요'})</span>
          </div>
        </div>
        <button className="btn mt-4 w-full" onClick={onClose}>다음 해도 잘 부탁해 🌱</button>
      </div>
    </div>
  )
}
