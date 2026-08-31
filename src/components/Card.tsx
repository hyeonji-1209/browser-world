import { useState, type ReactNode } from 'react'

const load = (id: string, def: boolean) => {
  try {
    const v = localStorage.getItem('bw:fold:' + id)
    return v == null ? def : v === '1'
  } catch { return def }
}

/** 접을 수 있는 카드 — 접힘 상태 기억 */
export function Card({ id, title, className = '', defaultFolded = false, children }: { id: string; title: ReactNode; className?: string; defaultFolded?: boolean; children: ReactNode }) {
  const [folded, setFolded] = useState(() => load(id, defaultFolded))
  const toggle = () => {
    const v = !folded
    setFolded(v)
    try { localStorage.setItem('bw:fold:' + id, v ? '1' : '0') } catch { /* */ }
  }
  return (
    <div className={`card text-[13px] leading-relaxed ${folded ? 'px-3 py-1.5' : 'px-4 py-3'} ${className}`}>
      <button className="font-cute w-full text-left font-bold text-[15px] cursor-pointer flex justify-between items-center gap-2" onClick={toggle} title={folded ? '펼치기' : '접기'}>
        <span>{title}</span>
        <span className="text-[#c4b8d4] text-xs">{folded ? '▸' : '▾'}</span>
      </button>
      {!folded && <div className="mt-1">{children}</div>}
    </div>
  )
}
