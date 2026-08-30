import { Hud } from './components/Hud'
import { ActivityCard } from './components/ActivityCard'
import { SystemCard } from './components/SystemCard'
import { WeatherCard } from './components/WeatherCard'
import { Graph } from './components/Graph'
import { Panel } from './components/Panel'
import { useState } from 'react'
import { shareCard } from './share'
import { useWorld } from './useWorld'

const btn = 'btn'

export default function App() {
  const w = useWorld()
  const [toast, setToast] = useState('')
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
      <Hud stats={w.stats} paused={w.paused} event={w.event} />
      <Graph history={w.history} />
      <ActivityCard a={w.activity} onUser={w.setUser} />
      <SystemCard s={w.system} />
      <WeatherCard w={w.weather} />
      {w.selected && <Panel c={w.selected} lineage={w.lineage(w.selected)} />}
      <div className="fixed bottom-3 left-3 flex gap-1.5">
        <button className={btn} onClick={() => w.setPaused(!w.paused)}>⏯ 일시정지</button>
        <button className={btn} onClick={() => w.setSpeed(w.speed === 1 ? 4 : w.speed === 4 ? 10 : 1)}>⏩ x{w.speed}</button>
        <button className={btn} onClick={() => w.spawnFood(60)}>🌱 먹이 뿌리기</button>
        <button className={btn} onClick={w.spawnPredator}>🦊 포식자 추가</button>
        <button className={btn} onClick={w.outbreak}>🦠 질병 퍼뜨리기</button>
        <button className={btn} onClick={snap}>📸 오늘의 세계</button>
        <button className={btn} onClick={w.reset}>🔄 새 세계</button>
      </div>
      {toast && <div className="card fixed bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 text-[13px]">{toast}</div>}
    </>
  )
}
