import { useState, type ReactNode } from 'react'

const load = (id: string) => { try { return localStorage.getItem('bw:fold:' + id) === '1' } catch { return false } }

/** 접을 수 있는 카드 — 접힘 상태 기억 */
export function Card({ id, title, className = '', children }: { id: string; title: ReactNode; className?: string; children: ReactNode }) {
  const [folded, setFolded] = useState(() => load(id))
  const toggle = () => {
    const v = !folded
    setFolded(v)
    try { localStorage.setItem('bw:fold:' + id, v ? '1' : '0') } catch { /* */ }
  }
  return (
    <div className={`card text-[13px] leading-relaxed ${folded ? 'px-3 py-1.5' : 'px-4 py-3'} ${className}`}>
      <button className="w-full text-left font-semibold cursor-pointer flex justify-between items-center gap-2" onClick={toggle} title={folded ? '펼치기' : '접기'}>
        <span>{title}</span>
        <span className="text-[#c4b8d4] text-xs">{folded ? '▸' : '▾'}</span>
      </button>
      {!folded && <div className="mt-1">{children}</div>}
    </div>
  )
}
