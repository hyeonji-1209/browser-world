import { useState } from 'react'
import { Card } from './Card'
import { cleanHint, fmtSize, sourceLabel } from '../sim/cleaner'
import { calmProcess, dryOf, fmtBps, fmtGB, heatOf, nightOf, pollutionOf, windOf, type SystemStats } from '../sim/system'

export interface Survey { active: boolean; total: number; bySource: Record<string, number> }

function Meter({ label, v, color, note }: { label: string; v: number; color: string; note: string }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-xs"><span>{label}</span><span className="text-[#9a8fae]">{note}</span></div>
      <div className="h-1.5 bg-pink-100 rounded-full mt-0.5">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, v * 100)}%`, background: color }} />
      </div>
    </div>
  )
}

export function SystemCard({ s, survey, onSurvey }: { s: SystemStats | null; survey: Survey; onSurvey: () => void }) {
  const [calmMsg, setCalmMsg] = useState('')
  if (!s) return null
  const heat = heatOf(s), pol = pollutionOf(s), night = nightOf(s), wind = windOf(s), dry = dryOf(s)
  const culprit = heat > 0.4 ? s.top_procs.find((p) => p.cpu > 50) : undefined
  const calm = async (pid: number, name: string) => {
    if (!window.confirm(`'${name}' 프로세스에 종료 요청을 보낼까요?\n저장 안 한 작업이 있다면 먼저 저장하세요!`)) return
    try { setCalmMsg(`${await calmProcess(pid, name)}를 재웠어요 💤 곧 시원해질 거예요`) }
    catch (e) { setCalmMsg(String(e)) }
    setTimeout(() => setCalmMsg(''), 5000)
  }
  return (
    <Card id="system" title="💻 내 컴퓨터가 곧 날씨" defaultFolded className="fixed top-3 left-1/2 -translate-x-1/2 w-[280px]">
      <Meter label={`🔥 열 (CPU ${s.cpu.toFixed(0)}%)`} v={heat} color="#fb7185"
        note={heat < 0.3 ? '쾌적' : heat < 0.7 ? '생명체가 빨라짐' : '폭염! 대사 폭증'} />
      {culprit && (
        <div className="text-xs mb-1.5 bg-rose-50 rounded-lg px-2 py-1 flex items-center justify-between gap-1">
          <span>🔥 열의 범인: <b>{culprit.name}</b> ({culprit.cpu.toFixed(0)}%)</span>
          <button className="text-[11px] border border-rose-200 rounded-full px-2 py-0.5 hover:bg-rose-100 cursor-pointer shrink-0" onClick={() => calm(culprit.pid, culprit.name)}>💤 재우기</button>
        </div>
      )}
      {calmMsg && <div className="text-xs text-rose-500 mb-1">{calmMsg}</div>}
      <Meter label={`🌫 오염 (RAM ${fmtGB(s.mem_used)}/${fmtGB(s.mem_total)})`} v={pol} color="#94a3b8"
        note={pol === 0 ? '맑음' : pol < 0.5 ? '질병 확률 ↑' : '먹이 감소·역병'} />
      <Meter label={`🌬 바람 (네트워크 ${fmtBps(s.net_bps)})`} v={wind} color="#38bdf8"
        note={wind === 0 ? '잔잔' : wind < 0.5 ? '산들바람 · 먹이가 날림' : '강풍! 다들 밀려감'} />
      <Meter label={`🏜 메마름 (디스크 여유 ${fmtGB(s.disk_free)})`} v={dry} color="#d4a373"
        note={dry === 0 ? '비옥' : dry < 0.5 ? '먹이가 덜 자람' : '가뭄! 디스크 정리 필요'} />
      {s.battery_pct != null && (
        <Meter label={`🌙 밤 (배터리 ${s.battery_pct.toFixed(0)}%${s.charging ? ' ⚡' : ''})`} v={night} color="#818cf8"
          note={s.charging ? '충전 중 · 낮' : night === 0 ? '낮' : night < 0.6 ? '저녁 · 느려짐' : '깊은 밤 · 잠'} />
      )}
      <button className="text-xs text-left mt-1 text-[#6b5b7b] hover:text-pink-500 cursor-pointer" onClick={onSurvey}>
        {survey.active ? '🔍 조사 중… (누르면 중단)' : '🧹 청소할 곳 조사하기 — 젤리들이 오래된 캐시를 찾아줘요 (삭제 안 함)'}
      </button>
      {!survey.active && survey.total > 0 && (
        <div className="text-xs mt-1 bg-pink-50 rounded-lg px-2 py-1.5">
          <div className="font-semibold">🧾 조사 결과: {fmtSize(survey.total)} 치울 수 있어요</div>
          {Object.entries(survey.bySource).map(([src, b]) => (
            <div key={src} className="text-[#8a7f9e]">
              {sourceLabel(src)} {fmtSize(b)} → <code className="text-[10px] bg-white rounded px-1">{cleanHint(src)}</code>
            </div>
          ))}
        </div>
      )}
      <div className="text-[11px] text-[#9a8fae]">프로세스 {s.process_count}개 · 켠 지 {(s.uptime_secs / 3600).toFixed(1)}시간</div>
    </Card>
  )
}
