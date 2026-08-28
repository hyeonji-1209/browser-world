import { Hud } from './components/Hud'
import { ActivityCard } from './components/ActivityCard'
import { Graph } from './components/Graph'
import { Panel } from './components/Panel'
import { useWorld } from './useWorld'

const btn = 'btn'

export default function App() {
  const w = useWorld()
  return (
    <>
      <canvas
        ref={w.canvasRef}
        className="block cursor-crosshair"
        onClick={(e) => w.select(e.clientX, e.clientY)}
      />
      <Hud stats={w.stats} paused={w.paused} event={w.event} />
      <Graph history={w.history} />
      <ActivityCard a={w.activity} onUser={w.setUser} />
      {w.selected && <Panel c={w.selected} lineage={w.lineage(w.selected)} />}
      <div className="fixed bottom-3 left-3 flex gap-1.5">
        <button className={btn} onClick={() => w.setPaused(!w.paused)}>⏯ 일시정지</button>
        <button className={btn} onClick={() => w.setSpeed(w.speed === 1 ? 4 : w.speed === 4 ? 10 : 1)}>⏩ x{w.speed}</button>
        <button className={btn} onClick={() => w.spawnFood(60)}>🌱 먹이 뿌리기</button>
        <button className={btn} onClick={w.spawnPredator}>🦊 포식자 추가</button>
        <button className={btn} onClick={w.outbreak}>🦠 질병 퍼뜨리기</button>
        <button className={btn} onClick={w.reset}>🔄 리셋</button>
      </div>
    </>
  )
}
