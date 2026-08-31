import { Hud } from './components/Hud'
import { ActivityCard } from './components/ActivityCard'
import { SystemCard } from './components/SystemCard'
import { WeatherCard } from './components/WeatherCard'
import { Graph } from './components/Graph'
import { Panel } from './components/Panel'
import { useState } from 'react'
import { GiftPanel } from './components/GiftPanel'
import { HistoryBook } from './components/HistoryBook'
import { TimeMachine } from './components/TimeMachine'
import { Welcome } from './components/Welcome'
import { WelcomeBack } from './components/WelcomeBack'
import { YearReport } from './components/YearReport'
import { shareCard } from './share'
import { useWorld } from './useWorld'

const btn = 'btn'

export default function App() {
  const w = useWorld()
  const [toast, setToast] = useState('')
  const [book, setBook] = useState(false)
  const [tm, setTm] = useState(false)
  const [gift, setGift] = useState(false)
  const [more, setMore] = useState(false)
  const snap = async () => {
    const world = w.worldRef.current, cv = w.canvasRef.current
    if (!world || !cv) return
    try { setToast(await shareCard(world, cv, w.weather)) } catch (e) { setToast(`저장 실패: ${e}`) }
    setTimeout(() => setToast(''), 4000)
  }
  return (
    <>
      <canvas
        ref={w.canvasRef}
        className="block cursor-crosshair"
        onClick={(e) => w.select(e.clientX, e.clientY)}
        onPointerMove={(e) => w.hoverAt(e.clientX, e.clientY)}
        onPointerDown={(e) => w.startPet(e.clientX, e.clientY)}
        onPointerUp={w.stopPet}
        onPointerLeave={w.stopPet}
      />
      <div className="fixed top-3 left-3 flex flex-col gap-2 w-[260px]">
        <Hud stats={w.stats} paused={w.paused} event={w.event} feed={w.feed} />
        <WeatherCard w={w.weather} />
      </div>
      <Graph history={w.history} />
      <ActivityCard a={w.activity} onUser={w.setUser} />
      <SystemCard s={w.system} survey={w.survey} onSurvey={w.toggleSurvey} />
      {w.selected && <Panel c={w.selected} lineage={w.lineage(w.selected)} />}
      <div className="fixed bottom-3 left-3 flex gap-1.5 items-center">
        <button className={btn} onClick={() => w.setPaused(!w.paused)} title={w.paused ? '다시 흐르게 해요' : '세계를 잠깐 멈춰요'}>{w.paused ? '▶' : '⏸'}</button>
        <button className={btn} onClick={() => w.setSpeed(w.speed === 1 ? 4 : w.speed === 4 ? 10 : 1)} title="시간을 빨리 감아요 (1→4→10배)">⏩ x{w.speed}</button>
        <button className={btn} onClick={() => w.spawnFood(60)} title="먹이 60개를 선물해요">🌱 먹이 주기</button>
        <button className={btn} onClick={w.toggleSound} title="귀여운 효과음 켜기/끄기">{w.sound ? '🔊' : '🔇'}</button>
        <button className={btn} onClick={() => { setMore((v) => !v); setBook(false); setTm(false); setGift(false) }} title="놀거리 더 보기">{more ? '✕' : '⋯ 더보기'}</button>
      </div>
      {more && (
        <div className="card fixed bottom-16 left-3 px-2 py-2 z-10 flex flex-col w-[190px]">
          {([
            ['🦊 여우 풀어놓기', () => w.spawnPredator()],
            ['🦠 질병 퍼뜨리기', () => w.outbreak()],
            ['📖 역사책', () => setBook(true)],
            ['⏪ 타임머신', () => setTm(true)],
            ['🎁 세계 선물하기', () => setGift(true)],
            ['📸 오늘의 세계 저장', () => snap()],
            ['🔄 새 세계 (초기화)', () => { if (window.confirm('정말 처음부터 다시 시작할까요?\n지금 세계와 저장이 사라져요.')) w.reset() }],
          ] as [string, () => void][]).map(([label, fn]) => (
            <button key={label} className="font-cute text-left text-[14px] px-3 py-1.5 rounded-xl hover:bg-pink-50 cursor-pointer" onClick={() => { fn(); setMore(false) }}>{label}</button>
          ))}
        </div>
      )}
      <Welcome />
      {book && w.worldRef.current && <HistoryBook world={w.worldRef.current} onClose={() => setBook(false)} />}
      {tm && <TimeMachine snapshots={w.snapshots} onTravel={w.travel} onClose={() => setTm(false)} />}
      {gift && <GiftPanel onExport={w.exportWorld} onImport={w.importWorld} onClose={() => setGift(false)} />}
      {w.away && <WelcomeBack away={w.away} onFF={w.fastForward} onClose={w.dismissAway} />}
      {w.yearReport && !w.away && <YearReport r={w.yearReport} onClose={w.dismissYearReport} />}
      {toast && <div className="card fixed bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 text-[13px]">{toast}</div>}
    </>
  )
}
