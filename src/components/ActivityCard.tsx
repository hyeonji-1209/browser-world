import { useState } from 'react'
import { foodMulOf, type Activity } from '../sim/activity'

export function ActivityCard({ a, onUser }: { a: Activity | null; onUser: (u: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(a?.user ?? '')
  if (!a) return null
  return (
    <div className="card fixed bottom-[120px] right-3 z-10 px-4 py-3 text-[13px] leading-relaxed w-[300px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold">🐙 GitHub 연동</span>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); onUser(val.trim()); setEditing(false) }}>
            <input className="border border-pink-200 rounded-full px-2 py-0.5 text-xs w-[130px]" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
          </form>
        ) : (
          <button className="text-xs text-[#9a8fae] hover:text-pink-500 cursor-pointer" onClick={() => { setVal(a.user); setEditing(true) }}>@{a.user} ✎</button>
        )}
      </div>
      {a.error ? (
        <div className="text-xs text-rose-400">{a.error}</div>
      ) : (
        <>
          <div>오늘 커밋 <b>{a.today}</b> · 이번 주 <b>{a.week}</b></div>
          <div className="text-xs text-[#9a8fae]">
            먹이 생성 x{foodMulOf(a).toFixed(2)}
            {a.today > 0 && ` · 접속 보상 먹이 +${a.today * 10}`}
          </div>
          <div className="text-[11px] text-[#9a8fae] mt-1">코딩한 만큼 세계가 풍요로워져요 🌱</div>
        </>
      )}
    </div>
  )
}
