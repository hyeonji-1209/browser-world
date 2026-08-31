import type { Creature } from '../sim/creature'
import type { Ghost } from '../sim/types'
import type { World } from '../sim/world'

const isGhost = (x: Creature | Ghost): x is Ghost => 'died' in x

function Row({ icon, title, x, detail }: { icon: string; title: string; x: Creature | Ghost | null; detail: (x: Creature | Ghost) => string }) {
  if (!x) return null
  return (
    <div className="flex items-start gap-2 mb-1.5">
      <span>{icon}</span>
      <div>
        <div className="text-xs text-[#9a8fae]">{title}</div>
        <div>
          <b>{x.name}</b> <span className="text-xs text-[#9a8fae]">{x.gen}세대{isGhost(x) ? ' †' : ' (생존)'} · {detail(x)}</span>
        </div>
      </div>
    </div>
  )
}

export function HistoryBook({ world, onClose }: { world: World; onClose: () => void }) {
  const c = world.chronicle()
  return (
    <div className="card fixed bottom-16 left-3 w-[300px] px-4 py-3 text-[13px] leading-relaxed z-10">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">📖 이 세계의 역사책</span>
        <button className="text-[#9a8fae] hover:text-pink-500 cursor-pointer" onClick={onClose}>✕</button>
      </div>
      <Row icon="🕰" title="가장 오래 산" x={c.eldest} detail={(x) => `${('age' in x && x.age) || 0}틱을 살았어요`} />
      <Row icon="👶" title="가장 많은 아이를 남긴" x={c.parent} detail={(x) => `자식 ${x.children}명`} />
      <Row icon="💗" title="가장 사랑받은" x={c.beloved} detail={(x) => `쓰담 ${('petted' in x && x.petted) || 0}번`} />
      {c.extinct.length > 0 && (
        <>
          <hr className="border-pink-200 my-2" />
          <div className="text-xs text-[#9a8fae] mb-1">🕯 사라진 가문들</div>
          {c.extinct.map((g) => (
            <div key={g.family} className="text-xs">
              <b>{g.family}가</b> — 마지막 아이 {g.name}, {g.cause}로 (tick {g.died.toLocaleString()})
            </div>
          ))}
        </>
      )}
      {c.extinct.length === 0 && <div className="text-xs text-[#9a8fae]">아직 사라진 가문이 없어요. 평화롭네요 🍃</div>}
    </div>
  )
}
