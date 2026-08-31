import { useEffect, useRef, useState } from 'react'
import type { Creature } from './sim/creature'
import type { Sample, WorldStats } from './sim/types'
import { World } from './sim/world'
import { dryOf, fetchSystem, heatOf, nightOf, pollutionOf, windOf, type SystemStats } from './sim/system'
import { cloudOf, fetchWeather, rainOf, realNightOf, snowOf, tempStressOf, thunderOf, type Weather } from './sim/weather'
import { defaultUser, fetchActivity, foodMulOf, saveUser, type Activity } from './sim/activity'
import { fmtSize, scanJunk } from './sim/cleaner'
import { play, setSoundEnabled, soundEnabled, unlock } from './sim/sound'

export function useWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const selectedRef = useRef<Creature | null>(null)
  const pausedRef = useRef(false)
  const speedRef = useRef(1)

  const [stats, setStats] = useState<WorldStats | null>(null)
  const [history, setHistory] = useState<Sample[]>([])
  const [event, setEvent] = useState('')
  const [feed, setFeed] = useState<string[]>([])
  const [activity, setActivity] = useState<Activity | null>(null)
  const [system, setSystem] = useState<SystemStats | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [survey, setSurvey] = useState({ active: false, total: 0, bySource: {} as Record<string, number> })
  const [away, setAway] = useState<{ ms: number; ticks: number } | null>(null)
  const ffRef = useRef(0)
  const [sound, setSoundState] = useState(soundEnabled)
  const [snapshots, setSnapshots] = useState<{ tick: number; season: string; pop: number }[]>([])
  const systemNightRef = useRef<number | null>(null)
  const weatherNightRef = useRef(0)
  const [selected, setSelected] = useState<Creature | null>(null)
  const [paused, setPausedState] = useState(false)
  const [speed, setSpeedState] = useState(1)
  const [, bump] = useState(0) // 선택 개체 패널 갱신용

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const world = (worldRef.current = new World(innerWidth, innerHeight))
    const SAVE_KEY = 'bw:world'
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved && world.restore(saved) && world.lastSavedAt) {
        const ms = Date.now() - world.lastSavedAt
        if (ms > 10 * 60 * 1000) setAway({ ms, ticks: Math.min(15000, Math.floor(ms / 60000) * 100) })
      }
    } catch { /* 저장소 없음 */ }
    const save = () => { try { localStorage.setItem(SAVE_KEY, world.serialize()) } catch { /* 용량 초과 등 */ } }
    const saveTimer = setInterval(save, 5000)
    addEventListener('beforeunload', save)
    addEventListener('visibilitychange', () => document.hidden && save())

    const resize = () => {
      canvas.width = innerWidth
      canvas.height = innerHeight
      world.resize(innerWidth, innerHeight)
    }
    resize()
    addEventListener('resize', resize)

    let raf = 0
    let lastHud = 0
    let frameNo = 0
    let ecoSaid = false
    const loop = (t: number) => {
      frameNo++
      // 절전 모드: 컴퓨터가 뜨거우면 이 앱부터 CPU를 아낌 (프레임 절반 쉬기)
      const eco = world.heat > 0.7
      if (eco && !ecoSaid) { ecoSaid = true; world.say('컴퓨터가 뜨거워서 세계도 쉬엄쉬엄… 전기를 아낄게요 🍃') }
      if (!eco) ecoSaid = false
      if (eco && frameNo % 2 === 1) { raf = requestAnimationFrame(loop); return }
      // 다녀온 만큼 빨리 감기
      if (ffRef.current > 0) {
        const n = Math.min(300, ffRef.current)
        for (let i = 0; i < n; i++) world.step()
        ffRef.current -= n
        if (ffRef.current === 0) world.say('세월이 다 흘렀어요 — 다시 지금이에요 ✨')
      }
      if (!pausedRef.current) for (let i = 0; i < speedRef.current; i++) world.step()
      // 소리 재생 (빨리 감기 중엔 조용히)
      if (ffRef.current === 0) for (const k of world.sounds) play(k)
      world.sounds.length = 0
      // 선택 개체가 죽으면 해제
      const sel = selectedRef.current
      if (sel && !world.creatures.includes(sel)) { selectedRef.current = null; setSelected(null) }
      world.draw(ctx, selectedRef.current)
      if (t - lastHud > 100) { lastHud = t; setStats(world.stats()); setHistory([...world.history]); setEvent(world.lastEvent); setFeed([...world.feed]); setSurvey({ ...world.survey, bySource: { ...world.survey.bySource } }); setSnapshots(world.snapshots.map(({ tick, season, pop }) => ({ tick, season, pop }))); bump((n) => n + 1) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    loadActivity(defaultUser())
    const q = new URLSearchParams(location.search)
    if (q.has('wind')) world.wind = Math.min(1, Number(q.get('wind')) || 0)
    const pollWeather = async () => {
      const wx = await fetchWeather()
      if (!wx) return
      setWeather(wx)
      world.rain = rainOf(wx); world.snow = snowOf(wx); world.cloud = cloudOf(wx)
      world.thunder = thunderOf(wx); world.tempStress = tempStressOf(wx)
      weatherNightRef.current = realNightOf(wx)
      world.night = Math.max(systemNightRef.current ?? 0, weatherNightRef.current)
      if (world.rain > 0) world.lastEvent = `비가 와서 먹이가 잘 자라요 (x${(1 + world.rain * 1.5).toFixed(1)})`
    }
    pollWeather()
    const wxTimer = setInterval(pollWeather, 10 * 60 * 1000)
    const pollSystem = async () => {
      const st = await fetchSystem().catch(() => null)
      if (!st) return
      setSystem(st)
      world.heat = heatOf(st)
      world.pollution = pollutionOf(st)
      world.wind = windOf(st)
      world.dry = dryOf(st)
      systemNightRef.current = st.battery_pct == null ? null : nightOf(st)
      world.night = Math.max(systemNightRef.current ?? 0, weatherNightRef.current)
    }
    pollSystem()
    const sysTimer = setInterval(pollSystem, 3000)
    return () => { cancelAnimationFrame(raf); clearInterval(sysTimer); clearInterval(wxTimer); clearInterval(saveTimer); removeEventListener('beforeunload', save); removeEventListener('resize', resize) }
  }, [])

  const loadActivity = async (user: string) => {
    const a = await fetchActivity(user)
    setActivity(a)
    const w = worldRef.current
    if (!w) return
    w.activityMul = foodMulOf(a)
    if (a.today > 0) w.rainFood(a.today * 10)
  }
  const setUser = (u: string) => { saveUser(u); loadActivity(u) }

  const fastForward = (ticks: number) => { ffRef.current = ticks; setAway(null) }
  const dismissAway = () => setAway(null)
  const toggleSound = () => { const v = !soundEnabled(); setSoundEnabled(v); setSoundState(v); if (v) unlock() }
  const travel = (tick: number) => worldRef.current?.travel(tick) ?? false

  /** 청소 조사 시작/중단 (읽기 전용 — 실제 삭제는 하지 않음) */
  const toggleSurvey = async () => {
    const w = worldRef.current
    if (!w) return
    if (w.survey.active || w.food.some((f) => f.trash)) return w.clearTrash()
    const chunks = await scanJunk()
    if (!chunks.length) return w.say('치울 만한 오래된 캐시가 없어요. 깨끗하네요 ✨')
    w.startSurvey(chunks.map((c) => ({ bytes: c.bytes, source: c.source })))
    w.say(`캐시 뭉치 ${chunks.length}개가 떨어져요! 젤리들이 조사할 거예요 🔍 (총 ${fmtSize(chunks.reduce((s, c) => s + c.bytes, 0))})`)
  }

  const petTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startPet = (x: number, y: number) => {
    unlock() // 첫 입력에서 오디오 잠금 해제
    stopPet()
    const w = worldRef.current
    const c = w?.nearest(x, y, 30)
    if (!w || !c) return
    petTimer.current = setInterval(() => {
      if (!w.creatures.includes(c)) return stopPet()
      w.pet(c)
    }, 120)
  }
  const stopPet = () => { if (petTimer.current) { clearInterval(petTimer.current); petTimer.current = null } }

  const hoverAt = (x: number, y: number) => {
    const w = worldRef.current
    if (w) w.hover = w.nearest(x, y, 25)
  }

  const select = (x: number, y: number) => {
    const c = worldRef.current?.nearest(x, y) ?? null
    selectedRef.current = c
    setSelected(c)
  }
  const setPaused = (v: boolean) => { pausedRef.current = v; setPausedState(v) }
  const setSpeed = (v: number) => { speedRef.current = v; setSpeedState(v) }
  const reset = () => { try { localStorage.removeItem('bw:world') } catch { /* */ } worldRef.current?.reset(); select(-999, -999) }
  const spawnFood = (n: number) => worldRef.current?.spawnFood(n)
  const spawnPredator = () => worldRef.current?.spawn('predator')
  const outbreak = () => worldRef.current?.outbreak()
  const lineage = (c: Creature) => worldRef.current?.lineage(c) ?? []

  return { canvasRef, worldRef, stats, history, event, feed, activity, system, weather, survey, toggleSurvey, away, fastForward, dismissAway, sound, toggleSound, snapshots, travel, hoverAt, startPet, stopPet, setUser, selected, spawnPredator, outbreak, paused, speed, select, setPaused, setSpeed, reset, spawnFood, lineage }
}
