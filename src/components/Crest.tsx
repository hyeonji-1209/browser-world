import { useEffect, useRef } from 'react'
import { crestHue, crestPattern } from '../sim/crest'

/** 가문 문장 아이콘 */
export function Crest({ family, size = 16 }: { family: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const x = cv.getContext('2d')!
    const cells = crestPattern(family)
    const hue = crestHue(family)
    x.clearRect(0, 0, 5, 5)
    x.fillStyle = `hsl(${hue},55%,88%)`
    x.fillRect(0, 0, 5, 5)
    x.fillStyle = `hsl(${hue},60%,55%)`
    cells.forEach((on, i) => { if (on) x.fillRect(i % 5, Math.floor(i / 5), 1, 1) })
  }, [family])
  return (
    <canvas
      ref={ref}
      width={5}
      height={5}
      style={{ width: size, height: size, imageRendering: 'pixelated', borderRadius: 3, verticalAlign: '-2px' }}
      title={`${family}가의 문장`}
    />
  )
}
