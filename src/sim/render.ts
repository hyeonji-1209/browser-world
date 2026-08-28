import type { Creature } from './creature'
import type { Season } from './types'
import type { World } from './world'

const BG: Record<Season, [string, string]> = {
  봄: ['#fdf2f8', '#e9f8e6'],
  여름: ['#e6f7ff', '#eafbe7'],
  가을: ['#fff4e0', '#fbe7d0'],
  겨울: ['#eef2ff', '#f8fafc'],
}
const FOOD_COLOR: Record<Season, string> = { 봄: '#f472b6', 여름: '#fb7185', 가을: '#f59e0b', 겨울: '#60a5fa' }

let frame = 0

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, dir: number, bounce: number, predator: boolean) {
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,.08)'
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.9, r * 0.9, r * 0.35, 0, 0, Math.PI * 2); ctx.fill()

  const by = y - bounce
  // 몸통 (살짝 눌린 원)
  ctx.fillStyle = color
  ctx.beginPath(); ctx.ellipse(x, by, r, r * (0.9 + bounce / r * 0.15), 0, 0, Math.PI * 2); ctx.fill()

  if (predator) {
    // 귀
    ctx.beginPath()
    ctx.moveTo(x - r * 0.8, by - r * 0.4); ctx.lineTo(x - r * 0.6, by - r * 1.5); ctx.lineTo(x - r * 0.1, by - r * 0.8)
    ctx.moveTo(x + r * 0.8, by - r * 0.4); ctx.lineTo(x + r * 0.6, by - r * 1.5); ctx.lineTo(x + r * 0.1, by - r * 0.8)
    ctx.fill()
  }

  // 눈 (바라보는 방향으로 살짝 이동)
  const ex = Math.cos(dir) * r * 0.25, ey = Math.sin(dir) * r * 0.25
  const eyeR = Math.max(1, r * 0.18)
  ctx.fillStyle = '#2b2b3a'
  ctx.beginPath(); ctx.arc(x - r * 0.35 + ex, by - r * 0.1 + ey, eyeR, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + r * 0.35 + ex, by - r * 0.1 + ey, eyeR, 0, Math.PI * 2); ctx.fill()
  // 눈 하이라이트
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(x - r * 0.35 + ex - eyeR * 0.3, by - r * 0.1 + ey - eyeR * 0.3, eyeR * 0.4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + r * 0.35 + ex - eyeR * 0.3, by - r * 0.1 + ey - eyeR * 0.3, eyeR * 0.4, 0, Math.PI * 2); ctx.fill()
  // 볼터치
  ctx.fillStyle = 'rgba(255,120,150,.35)'
  ctx.beginPath(); ctx.arc(x - r * 0.55, by + r * 0.25, r * 0.2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + r * 0.55, by + r * 0.25, r * 0.2, 0, Math.PI * 2); ctx.fill()
}

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, selected: Creature | null) {
  frame++
  const [c1, c2] = BG[w.season]
  const grad = ctx.createLinearGradient(0, 0, 0, w.H)
  grad.addColorStop(0, c1); grad.addColorStop(1, c2)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w.W, w.H)

  // 오염: 화면 가장자리 회색 안개
  if (w.pollution > 0) {
    const v = ctx.createRadialGradient(w.W / 2, w.H / 2, Math.min(w.W, w.H) * 0.3, w.W / 2, w.H / 2, Math.max(w.W, w.H) * 0.75)
    v.addColorStop(0, 'rgba(90,90,100,0)'); v.addColorStop(1, `rgba(90,90,100,${w.pollution * 0.55})`)
    ctx.fillStyle = v; ctx.fillRect(0, 0, w.W, w.H)
  }
  // 열: 붉은 기운
  if (w.heat > 0.3) {
    ctx.fillStyle = `rgba(251,113,133,${(w.heat - 0.3) * 0.25})`; ctx.fillRect(0, 0, w.W, w.H)
  }

  // 밤: 남색 오버레이 + 별
  if (w.night > 0) {
    ctx.fillStyle = `rgba(30,27,75,${w.night * 0.55})`; ctx.fillRect(0, 0, w.W, w.H)
    ctx.fillStyle = `rgba(255,255,255,${w.night * 0.9})`
    for (let i = 0; i < 60; i++) {
      const x = (i * 271) % w.W, y = (i * 173) % (w.H * 0.6)
      const tw = 0.5 + Math.abs(Math.sin(frame * 0.05 + i)) * 1.2
      ctx.beginPath(); ctx.arc(x, y, tw, 0, Math.PI * 2); ctx.fill()
    }
  }

  // 겨울엔 눈
  if (w.season === '겨울') {
    ctx.fillStyle = 'rgba(255,255,255,.8)'
    for (let i = 0; i < 40; i++) {
      const x = (i * 197 + frame * 0.3) % w.W, y = (i * 131 + frame * 0.8) % w.H
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill()
    }
  }

  // 먹이: 열매
  ctx.fillStyle = FOOD_COLOR[w.season]
  for (const f of w.food) {
    ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1
  for (const f of w.food) { ctx.beginPath(); ctx.moveTo(f.x, f.y - 2); ctx.lineTo(f.x + 1.5, f.y - 5); ctx.stroke() }

  // 생명체 (y 순으로 그려 겹침 자연스럽게)
  const sorted = [...w.creatures].sort((a, b) => a.y - b.y)
  for (const c of sorted) {
    const r = c.genes.size * 1.6
    const bounce = Math.abs(Math.sin((frame + c.id * 7) * 0.15)) * c.genes.speed * 1.2
    const color = c.infected
      ? `hsl(${c.genes.hue},25%,70%)`
      : c.isPredator ? `hsl(${c.genes.hue},75%,68%)` : `hsl(${c.genes.hue},65%,72%)`
    blob(ctx, c.x, c.y, r, color, c.dir, bounce, c.isPredator)
    if (c.infected) {
      ctx.fillStyle = '#84cc16'
      ctx.font = `${Math.max(8, r)}px sans-serif`
      ctx.fillText('🦠', c.x + r * 0.6, c.y - r * 1.4)
    }
  }

  if (selected) {
    const r = selected.genes.size * 1.6
    ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(selected.x, selected.y, r + 5, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(244,114,182,.25)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(selected.x, selected.y, selected.genes.sight, 0, Math.PI * 2); ctx.stroke()
    // 하트
    ctx.fillStyle = '#f472b6'; ctx.font = '12px sans-serif'
    ctx.fillText('♥', selected.x - 4, selected.y - r - 8)
  }
}
