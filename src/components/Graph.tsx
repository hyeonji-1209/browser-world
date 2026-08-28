import { useEffect, useRef } from 'react'
import type { Sample } from '../sim/types'

const LINES: { key: keyof Sample; color: string; max: number; label: string }[] = [
  { key: 'pop', color: '#94a3b8', max: 300, label: '개체' },
  { key: 'pred', color: '#f87171', max: 40, label: '포식자' },
  { key: 'speed', color: '#6ee7b7', max: 4, label: '속도' },
  { key: 'size', color: '#fbbf24', max: 12, label: '크기' },
  { key: 'sight', color: '#60a5fa', max: 250, label: '시야' },
]

export function Graph({ history }: { history: Sample[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    const W = cv.width, H = cv.height
    ctx.clearRect(0, 0, W, H)
    if (history.length < 2) return
    for (const l of LINES) {
      ctx.strokeStyle = l.color
      ctx.lineWidth = 1
      ctx.beginPath()
      history.forEach((s, i) => {
        const x = (i / (history.length - 1)) * W
        const y = H - Math.min(1, (s[l.key] as number) / l.max) * H
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      })
      ctx.stroke()
    }
  }, [history])
  return (
    <div className="fixed bottom-3 right-3 bg-[#0b0e14]/85 border border-[#2a3140] p-2">
      <canvas ref={ref} width={300} height={80} className="block" />
      <div className="flex gap-2 text-[11px] mt-1">
        {LINES.map((l) => (
          <span key={l.key} style={{ color: l.color }}>■ {l.label}</span>
        ))}
      </div>
    </div>
  )
}
