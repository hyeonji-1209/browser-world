import { Hud } from './components/Hud'
import { Panel } from './components/Panel'
import { useWorld } from './useWorld'

const btn = 'bg-[#161b26] hover:bg-[#1f2634] border border-[#2a3140] px-2.5 py-1 text-[13px] cursor-pointer'

export default function App() {
  const w = useWorld()
  return (
    <>
      <canvas
        ref={w.canvasRef}
        className="block cursor-crosshair"
        onClick={(e) => w.select(e.clientX, e.clientY)}
      />
      <Hud stats={w.stats} paused={w.paused} />
      {w.selected && <Panel c={w.selected} lineage={w.lineage(w.selected)} />}
      <div className="fixed bottom-3 left-3 flex gap-1.5">
        <button className={btn} onClick={() => w.setPaused(!w.paused)}>⏯ 일시정지</button>
        <button className={btn} onClick={() => w.setSpeed(w.speed === 1 ? 4 : w.speed === 4 ? 10 : 1)}>⏩ x{w.speed}</button>
        <button className={btn} onClick={() => w.spawnFood(60)}>🌱 먹이 뿌리기</button>
        <button className={btn} onClick={w.reset}>🔄 리셋</button>
      </div>
    </>
  )
}
