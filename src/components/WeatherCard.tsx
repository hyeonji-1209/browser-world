import { describe, type Weather } from '../sim/weather'
import { Card } from './Card'

export function WeatherCard({ w }: { w: Weather | null }) {
  if (!w) return null
  const effects: string[] = []
  if (w.code >= 51 && !(w.code >= 71 && w.code <= 77)) effects.push('먹이 쑥쑥')
  if (w.code >= 71 && w.code <= 77) effects.push('눈 내림')
  if (w.code >= 95) effects.push('번개 ⚡')
  if (w.temp > 30) effects.push('더워서 지침')
  if (w.temp < 5) effects.push('추워서 지침')
  if (!w.isDay) effects.push('밤이라 잠')
  return (
    <Card id="weather" title={<>🌤 바깥 날씨 <span className="text-[#9a8fae] text-xs font-normal">{w.place}</span></>} className="w-full">
      <div>{describe(w.code)} · <b>{w.temp.toFixed(0)}°C</b> · 습도 {w.humidity}%</div>
      <div className="text-xs text-[#9a8fae]">{effects.length ? effects.join(' · ') : '평화로운 하루'}</div>
    </Card>
  )
}
