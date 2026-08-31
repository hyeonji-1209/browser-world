/** 파일 없는 귀여운 효과음 (WebAudio 합성) */
export type SoundKind = 'eat' | 'birth' | 'death' | 'pet' | 'lightning'

let ctx: AudioContext | null = null
let lastPlay = 0
let playedThisSec = 0

const KEY = 'bw:sound'
export const soundEnabled = () => { try { return localStorage.getItem(KEY) !== '0' } catch { return true } }
export const setSoundEnabled = (v: boolean) => { try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* */ } }

/** 첫 사용자 입력에서 호출 — 브라우저 오디오 잠금 해제 */
export function unlock() {
  if (!ctx) { try { ctx = new AudioContext() } catch { return } }
  if (ctx.state === 'suspended') ctx.resume()
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, sweepTo?: number, delay = 0) {
  if (!ctx) return
  const t0 = ctx.currentTime + delay
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur)
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(ctx.destination)
  o.start(t0); o.stop(t0 + dur + 0.02)
}

function noise(dur: number, vol: number) {
  if (!ctx) return
  const n = ctx.sampleRate * dur
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'; f.frequency.value = 300
  const g = ctx.createGain(); g.gain.value = vol
  src.connect(f).connect(g).connect(ctx.destination)
  src.start()
}

export function play(kind: SoundKind) {
  if (!ctx || !soundEnabled()) return
  // 초당 8개로 제한 (대가족 시대의 귀 보호)
  const now = performance.now()
  if (now - lastPlay > 1000) { lastPlay = now; playedThisSec = 0 }
  if (++playedThisSec > 8) return

  const r = 1 + (Math.random() - 0.5) * 0.15 // 살짝 다른 음정
  switch (kind) {
    case 'eat': tone(620 * r, 0.07, 'sine', 0.06, 950 * r); break
    case 'birth': tone(880 * r, 0.12, 'triangle', 0.07); tone(1320 * r, 0.18, 'triangle', 0.06, undefined, 0.09); break
    case 'death': tone(420 * r, 0.35, 'sine', 0.04, 180 * r); break
    case 'pet': tone(1100 * r, 0.09, 'triangle', 0.05, 1500 * r); break
    case 'lightning': noise(0.6, 0.12); tone(80, 0.5, 'sine', 0.06, 40); break
  }
}
