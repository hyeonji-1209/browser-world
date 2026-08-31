import { useRef, useState } from 'react'

export function GiftPanel({ onExport, onImport, onClose }: {
  onExport: () => Promise<string>
  onImport: (file: File) => Promise<string>
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  return (
    <div className="card fixed bottom-16 left-3 w-[290px] px-4 py-3 text-[13px] leading-relaxed z-10">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">🎁 세계 선물하기</span>
        <button className="text-[#9a8fae] hover:text-pink-500 cursor-pointer" onClick={onClose}>✕</button>
      </div>
      <div className="text-xs text-[#8a7f9e] mb-2">
        지금 세계를 파일로 내보내 친구에게 보내면, 친구는 웹에서 불러와 이어 키울 수 있어요.
      </div>
      <div className="flex gap-2">
        <button className="btn flex-1" onClick={async () => setMsg(await onExport())}>📤 내보내기</button>
        <button className="btn flex-1" onClick={() => fileRef.current?.click()}>📥 불러오기</button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) setMsg(await onImport(f))
          e.target.value = ''
        }}
      />
      {msg && <div className="text-xs text-emerald-600 mt-2">{msg}</div>}
      <div className="text-[11px] text-[#9a8fae] mt-1">불러오기 전의 세계는 ⏪ 타임머신에 남겨둬요</div>
    </div>
  )
}
