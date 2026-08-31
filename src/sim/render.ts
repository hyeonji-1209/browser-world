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

type Mood = 'normal' | 'hungry' | 'scared' | 'happy' | 'sleepy'
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, dir: number, bounce: number, predator: boolean, mood: Mood = 'normal') {
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

  // 눈 (바라보는 방향으로 살짝 이동) — 기분에 따라 모양이 바뀜
  const ex = Math.cos(dir) * r * 0.25, ey = Math.sin(dir) * r * 0.25
  const eyeR = Math.max(1, r * 0.18)
  const lx = x - r * 0.35 + ex, rx = x + r * 0.35 + ex, cy = by - r * 0.1 + ey
  ctx.fillStyle = '#2b2b3a'
  ctx.strokeStyle = '#2b2b3a'
  ctx.lineWidth = Math.max(1, r * 0.12)
  ctx.lineCap = 'round'
  if (mood === 'sleepy') {
    // 감은 눈 ‿ ‿
    ctx.beginPath(); ctx.arc(lx, cy, eyeR, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    ctx.beginPath(); ctx.arc(rx, cy, eyeR, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
  } else if (mood === 'happy') {
    // 웃는 눈 ^ ^
    ctx.beginPath(); ctx.arc(lx, cy + eyeR * 0.5, eyeR, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke()
    ctx.beginPath(); ctx.arc(rx, cy + eyeR * 0.5, eyeR, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke()
  } else if (mood === 'scared') {
    // 동그란 큰 눈 + 작은 동공
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(lx, cy, eyeR * 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(rx, cy, eyeR * 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#2b2b3a'
    ctx.beginPath(); ctx.arc(lx, cy, eyeR * 0.6, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(rx, cy, eyeR * 0.6, 0, Math.PI * 2); ctx.fill()
    // 땀
    ctx.fillStyle = '#7dd3fc'
    ctx.beginPath(); ctx.arc(x + r * 0.9, by - r * 0.6, eyeR * 0.5, 0, Math.PI * 2); ctx.fill()
  } else {
    ctx.beginPath(); ctx.arc(lx, cy, eyeR, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(rx, cy, eyeR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(lx - eyeR * 0.3, cy - eyeR * 0.3, eyeR * 0.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(rx - eyeR * 0.3, cy - eyeR * 0.3, eyeR * 0.4, 0, Math.PI * 2); ctx.fill()
    if (mood === 'hungry') {
      // 처진 눈썹 + 입 ~
      ctx.beginPath(); ctx.moveTo(lx - eyeR, cy - eyeR * 1.6); ctx.lineTo(lx + eyeR * 0.6, cy - eyeR * 1.1); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(rx + eyeR, cy - eyeR * 1.6); ctx.lineTo(rx - eyeR * 0.6, cy - eyeR * 1.1); ctx.stroke()
      ctx.beginPath(); ctx.arc(x + ex * 0.5, by + r * 0.45, eyeR * 0.7, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke()
    }
  }
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

  // 메마름: 누런 톤 + 갈라진 땅
  if (w.dry > 0) {
    ctx.fillStyle = `rgba(180,140,80,${w.dry * 0.15})`
    ctx.fillRect(0, 0, w.W, w.H)
    ctx.strokeStyle = `rgba(160,120,70,${w.dry * 0.3})`
    ctx.lineWidth = 1
    for (let i = 0; i < w.dry * 14; i++) {
      let x = (i * 397) % w.W, y = (i * 251) % w.H
      ctx.beginPath(); ctx.moveTo(x, y)
      for (let j = 0; j < 4; j++) { x += 8 + (i * 7 + j * 13) % 14; y += ((i + j) % 3 - 1) * 9; ctx.lineTo(x, y) }
      ctx.stroke()
    }
  }

  // 구름: 회색 톤
  if (w.cloud > 0) { ctx.fillStyle = `rgba(148,163,184,${w.cloud * 0.25})`; ctx.fillRect(0, 0, w.W, w.H) }

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

  // 바람 줄기
  if (w.wind > 0.05) {
    ctx.strokeStyle = `rgba(148,163,184,${0.15 + w.wind * 0.25})`; ctx.lineWidth = 1.5
    const n = 8 + w.wind * 25
    for (let i = 0; i < n; i++) {
      const y = (i * 167 + Math.sin(i) * 40) % w.H
      const x = (i * 311 + frame * (4 + w.wind * 14)) % (w.W + 120) - 60
      const len = 25 + w.wind * 50
      ctx.beginPath(); ctx.moveTo(x, y)
      ctx.bezierCurveTo(x + len * 0.4, y - 4, x + len * 0.7, y + 4, x + len, y)
      ctx.stroke()
    }
  }

  // 비
  if (w.rain > 0) {
    ctx.strokeStyle = `rgba(96,165,250,${0.35 + w.rain * 0.3})`; ctx.lineWidth = 1
    const n = 40 + w.rain * 120
    for (let i = 0; i < n; i++) {
      const x = (i * 263 + frame * 3) % w.W, y = (i * 149 + frame * 9) % w.H
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 10); ctx.stroke()
    }
    // 물웅덩이 반짝
    ctx.fillStyle = 'rgba(147,197,253,.25)'
    for (let i = 0; i < 6; i++) { const x = (i * 431) % w.W, y = (i * 277) % w.H; ctx.beginPath(); ctx.ellipse(x, y, 30 + i * 4, 8, 0, 0, Math.PI * 2); ctx.fill() }
  }
  // 눈 (바깥 날씨)
  if (w.snow > 0) {
    ctx.fillStyle = 'rgba(255,255,255,.9)'
    for (let i = 0; i < 80; i++) {
      const x = (i * 197 + frame * 0.5 + Math.sin(frame * 0.02 + i) * 20) % w.W, y = (i * 131 + frame * 1.2) % w.H
      ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 3) * 0.7, 0, Math.PI * 2); ctx.fill()
    }
  }

  // 먹이: 계절마다 다른 모양
  const fc = FOOD_COLOR[w.season]
  for (const f of w.food) {
    if (f.trash) {
      // 꼬깃한 캐시 뭉치 (크기 ∝ 용량)
      const tr = 4 + Math.min(4, f.trash.bytes / 1e8)
      ctx.fillStyle = '#b8bcc8'
      ctx.beginPath()
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2
        const rr = tr * (0.75 + ((i * 37 + Math.round(f.x)) % 10) / 22)
        ctx.lineTo(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr)
      }
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#8b90a0'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(f.x - tr * 0.4, f.y); ctx.lineTo(f.x + tr * 0.3, f.y - tr * 0.3); ctx.stroke()
      if ((frame + Math.round(f.y)) % 60 < 30) { ctx.fillStyle = '#facc15'; ctx.font = '9px sans-serif'; ctx.fillText('✦', f.x + tr, f.y - tr) }
      continue
    }
    if (w.season === '봄') {
      // 꽃
      ctx.fillStyle = fc
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 2.2, f.y + Math.sin(a) * 2.2, 1.6, 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(f.x, f.y, 1.4, 0, Math.PI * 2); ctx.fill()
    } else if (w.season === '가을') {
      // 버섯
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(f.x - 1, f.y, 2, 3)
      ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(f.x, f.y, 3, Math.PI, 0); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x - 1, f.y - 1.5, 0.7, 0, Math.PI * 2); ctx.fill()
    } else if (w.season === '겨울') {
      // 얼음열매
      ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(f.x - 0.8, f.y - 0.8, 1, 0, Math.PI * 2); ctx.fill()
    } else {
      // 여름 열매
      ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(f.x, f.y - 2); ctx.lineTo(f.x + 1.5, f.y - 5); ctx.stroke()
    }
  }

  // 생명체 (y 순으로 그려 겹침 자연스럽게)
  const sorted = [...w.creatures].sort((a, b) => a.y - b.y)
  for (const c of sorted) {
    const grow = Math.min(1, 0.45 + (c.age / 600) * 0.55) // 아기는 작게 태어나 자람
    const r = c.genes.size * 1.6 * grow
    const bounce = Math.abs(Math.sin((frame + c.id * 7) * 0.15)) * c.genes.speed * 1.2
    const color = c.infected
      ? `hsl(${c.genes.hue},25%,70%)`
      : c.isPredator ? `hsl(${c.genes.hue},75%,68%)` : `hsl(${c.genes.hue},65%,72%)`
    const mood: Mood = w.night > 0.6 ? 'sleepy' : c.scared ? 'scared' : c.happyTicks > 0 ? 'happy' : c.energy < 30 ? 'hungry' : 'normal'
    blob(ctx, c.x, c.y, r, color, c.dir, w.night > 0.6 ? bounce * 0.2 : bounce, c.isPredator, mood)
    if (mood === 'sleepy' && (frame + c.id * 13) % 90 < 45) {
      ctx.fillStyle = '#818cf8'; ctx.font = `${Math.max(9, r * 0.9)}px sans-serif`
      ctx.fillText('z', c.x + r * 0.9, c.y - r * 1.2 - ((frame + c.id * 13) % 45) * 0.15)
    }
    if (c.infected) {
      ctx.fillStyle = '#84cc16'
      ctx.font = `${Math.max(8, r)}px sans-serif`
      ctx.fillText('🦠', c.x + r * 0.6, c.y - r * 1.4)
    }
  }

  // 순간 이펙트
  ctx.textAlign = 'center'
  for (const e of w.effects) {
    const p = e.t / 60
    if (e.kind === 'eat') {
      ctx.globalAlpha = 1 - p; ctx.fillStyle = '#6b5b7b'; ctx.font = 'bold 11px sans-serif'
      ctx.fillText(e.text ?? '냠', e.x, e.y - p * 18)
    } else if (e.kind === 'birth') {
      ctx.globalAlpha = 1 - p; ctx.fillStyle = '#f472b6'; ctx.font = `${10 + p * 6}px sans-serif`
      for (let i = 0; i < 3; i++) ctx.fillText('♥', e.x + Math.cos(i * 2.1 + p * 2) * p * 22, e.y - p * 25 + Math.sin(i * 2.1) * 6)
    } else if (e.kind === 'pet') {
      ctx.globalAlpha = 1 - p; ctx.fillStyle = '#fb7185'; ctx.font = `${8 + p * 4}px sans-serif`
      ctx.fillText('♡', e.x + Math.sin(p * 6 + e.x) * 5, e.y - p * 28)
    } else if (e.kind === 'death') {
      ctx.globalAlpha = (1 - p) * 0.9; ctx.font = '14px sans-serif'
      ctx.fillText('👻', e.x + Math.sin(p * 8) * 4, e.y - p * 40)
    } else if (e.kind === 'lightning' && e.t < 6) {
      ctx.globalAlpha = 1 - e.t / 6
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, 0, w.W, w.H)
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x, 0)
      let yy = 0, xx = e.x
      while (yy < w.H * 0.6) { yy += 30; xx += (Math.random() - 0.5) * 40; ctx.lineTo(xx, yy) }
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
  ctx.textAlign = 'start'

  // 마우스 오버 이름표 (은은하게)
  const hov = w.hover
  if (hov && hov !== selected && w.creatures.includes(hov)) {
    const r = hov.genes.size * 1.6
    ctx.textAlign = 'center'; ctx.font = '11px sans-serif'
    const tw = ctx.measureText(hov.name).width + 10
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    ctx.beginPath(); ctx.roundRect(hov.x - tw / 2, hov.y - r - 22, tw, 15, 8); ctx.fill()
    ctx.fillStyle = '#8a7f9e'; ctx.fillText(hov.name, hov.x, hov.y - r - 11)
    ctx.textAlign = 'start'
  }

  if (selected) {
    const r = selected.genes.size * 1.6
    ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(selected.x, selected.y, r + 5, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(244,114,182,.25)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(selected.x, selected.y, selected.genes.sight, 0, Math.PI * 2); ctx.stroke()
    // 이름표
    ctx.textAlign = 'center'; ctx.font = 'bold 11px sans-serif'
    const label = `♥ ${selected.name}`
    const tw = ctx.measureText(label).width + 12
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.roundRect(selected.x - tw / 2, selected.y - r - 24, tw, 16, 8); ctx.fill()
    ctx.fillStyle = '#f472b6'; ctx.fillText(label, selected.x, selected.y - r - 12)
    ctx.textAlign = 'start'
  }
}
