import { useState } from 'react'

const seen = () => { try { return localStorage.getItem('bw:welcomed') === '1' } catch { return true } }

export function Welcome() {
  const [open, setOpen] = useState(() => !seen())
  if (!open) return null
  const close = () => { try { localStorage.setItem('bw:welcomed', '1') } catch { /* */ } setOpen(false) }
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/20" onClick={close}>
      <div className="card px-6 py-5 w-[340px] text-[14px] leading-relaxed" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-bold mb-2">작은 세계에 어서 오세요 🌱</div>
        <div className="space-y-1.5 text-[#6b5b7b]">
          <div>🐣 젤리들은 먹고, 자라고, 아이를 낳아요. 아이는 부모를 닮되 조금씩 달라요 — 세대가 지나면 진화가 보여요</div>
          <div>👆 <b>클릭</b>하면 이름과 족보를, <b>꾹 누르면</b> 쓰다듬을 수 있어요</div>
          <div>🌦 바깥 날씨가 이 세계의 날씨예요. 커밋을 하면 먹이가 풍성해져요</div>
        </div>
        <button className="btn mt-4 w-full" onClick={close}>구경하러 가기</button>
      </div>
    </div>
  )
}
