import type { World } from './sim/world'
import { describe, type Weather } from './sim/weather'
import { isTauri } from './sim/system'

/** 세계 요약 카드를 PNG로 만들어 저장 (브라우저: 다운로드 / Tauri: 데스크톱 저장) */
export async function shareCard(world: World, worldCanvas: HTMLCanvasElement, weather: Weather | null): Promise<string> {
  const W = 720, H = 900
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const x = cv.getContext('2d')!

  // 배경
  const g = x.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#fdf2f8'); g.addColorStop(1, '#e9f8e6')
  x.fillStyle = g; x.fillRect(0, 0, W, H)

  // 세계 스냅샷 (중앙 크롭)
  const shotH = 400
  x.save()
  x.beginPath(); x.roundRect(30, 30, W - 60, shotH, 20); x.clip()
  const sc = Math.max((W - 60) / worldCanvas.width, shotH / worldCanvas.height)
  x.drawImage(worldCanvas, 30 + (W - 60 - worldCanvas.width * sc) / 2, 30 + (shotH - worldCanvas.height * sc) / 2, worldCanvas.width * sc, worldCanvas.height * sc)
  x.restore()
  x.strokeStyle = '#fbcfe8'; x.lineWidth = 3
  x.beginPath(); x.roundRect(30, 30, W - 60, shotH, 20); x.stroke()

  const s = world.stats()
  x.fillStyle = '#4a4458'
  x.textAlign = 'center'
  x.font = 'bold 30px -apple-system, sans-serif'
  x.fillText('나의 작은 세계 🌱', W / 2, shotH + 85)
  x.font = '15px -apple-system, sans-serif'
  x.fillStyle = '#9a8fae'
  const d = new Date()
  x.fillText(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} · tick ${s.tick.toLocaleString()} · ${s.season}${weather ? ` · 바깥은 ${describe(weather.code)} ${weather.temp.toFixed(0)}°C` : ''}`, W / 2, shotH + 112)

  // 스탯 줄
  const rows: [string, string][] = [
    ['🐣 피식자', `${s.population}마리`],
    ['🦊 포식자', `${s.predators}마리`],
    ['👑 최고 세대', `${s.maxGen}세대`],
    ['🏠 최대 가문', s.topFamilies[0] ? `${s.topFamilies[0].family}가 (${s.topFamilies[0].count}마리)` : '-'],
    ['💨 평균 속도', s.avgSpeed.toFixed(2)],
    ['👀 평균 시야', s.avgSight.toFixed(0)],
  ]
  x.font = '17px -apple-system, sans-serif'
  rows.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const cx = col === 0 ? W * 0.28 : W * 0.72
    const cy = shotH + 165 + row * 62
    x.fillStyle = '#9a8fae'; x.fillText(k, cx, cy)
    x.fillStyle = '#4a4458'; x.font = 'bold 21px -apple-system, sans-serif'
    x.fillText(v, cx, cy + 27)
    x.font = '17px -apple-system, sans-serif'
  })

  x.fillStyle = '#c4b8d4'; x.font = '13px -apple-system, sans-serif'
  x.fillText('browser-world · 픽셀 생명체들이 살고, 먹고, 번식하고, 진화하는 세계', W / 2, H - 40)

  const dataUrl = cv.toDataURL('image/png')
  const name = `world-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.png`
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core')
    const path = await invoke<string>('save_png', { name, base64: dataUrl.split(',')[1] })
    return `데스크톱에 저장됨: ${path}`
  }
  const a = document.createElement('a')
  a.href = dataUrl; a.download = name; a.click()
  return '다운로드 시작!'
}
