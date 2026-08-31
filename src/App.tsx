import { Hud } from './components/Hud'
import { ActivityCard } from './components/ActivityCard'
import { SystemCard } from './components/SystemCard'
import { WeatherCard } from './components/WeatherCard'
import { Graph } from './components/Graph'
import { Panel } from './components/Panel'
import { useState } from 'react'
import { HistoryBook } from './components/HistoryBook'
import { TimeMachine } from './components/TimeMachine'
import { Welcome } from './components/Welcome'
import { WelcomeBack } from './components/WelcomeBack'
import { shareCard } from './share'
import { useWorld } from './useWorld'

const btn = 'btn'

export default function App() {
  const w = useWorld()
  const [toast, setToast] = useState('')
  const [book, setBook] = useState(false)
  const [tm, setTm] = useState(false)
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
        onPointerDown={(e) => w.startPet(e.clientX, e.clientY)}
        onPointerUp={w.stopPet}
        onPointerLeave={w.stopPet}
      />
      <Hud stats={w.stats} paused={w.paused} event={w.event} feed={w.feed} />
      <Graph history={w.history} />
      <ActivityCard a={w.activity} onUser={w.setUser} />
      <SystemCard s={w.system} survey={w.survey} onSurvey={w.toggleSurvey} />
      <WeatherCard w={w.weather} />
      {w.selected && <Panel c={w.selected} lineage={w.lineage(w.selected)} />}
      <div className="fixed bottom-3 left-3 flex gap-1.5">
        <button className={btn} onClick={() => w.setPaused(!w.paused)} title="세계를 잠깐 멈춰요">⏯ 일시정지</button>
        <button className={btn} onClick={() => w.setSpeed(w.speed === 1 ? 4 : w.speed === 4 ? 10 : 1)} title="시간을 빨리 감아요 (1→4→10배)">⏩ x{w.speed}</button>
        <button className={btn} onClick={() => w.spawnFood(60)} title="먹이 60개를 선물해요">🌱 먹이 뿌리기</button>
        <button className={btn} onClick={w.spawnPredator} title="여우 한 마리를 풀어놔요">🦊 포식자 추가</button>
        <button className={btn} onClick={w.outbreak} title="무작위 한 마리가 병에 걸려요">🦠 질병 퍼뜨리기</button>
        <button className={btn} onClick={() => setBook((b) => !b)} title="명예의 전당과 사라진 가문들">📖 역사책</button>
        <button className={btn} onClick={() => { setTm((v) => !v); setBook(false) }} title="과거의 세계로 돌아가요 (3,000틱마다 자동 기록)">⏪ 타임머신</button>
        <button className={btn} onClick={w.toggleSound} title="귀여운 효과음 켜기/끄기">{w.sound ? '🔊' : '🔇'}</button>
        <button className={btn} onClick={snap} title="지금 세계를 카드로 저장해요">📸 오늘의 세계</button>
        <button className={btn} onClick={w.reset} title="저장을 지우고 처음부터! 신중히…">🔄 새 세계</button>
      </div>
      <Welcome />
      {book && w.worldRef.current && <HistoryBook world={w.worldRef.current} onClose={() => setBook(false)} />}
      {tm && <TimeMachine snapshots={w.snapshots} onTravel={w.travel} onClose={() => setTm(false)} />}
      {w.away && <WelcomeBack away={w.away} onFF={w.fastForward} onClose={w.dismissAway} />}
      {toast && <div className="card fixed bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 text-[13px]">{toast}</div>}
    </>
  )
}
