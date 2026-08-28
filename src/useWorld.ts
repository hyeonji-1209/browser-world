import { useEffect, useRef, useState } from 'react'
import type { Creature } from './sim/creature'
import type { Sample, WorldStats } from './sim/types'
import { World } from './sim/world'
import { fetchSystem, heatOf, nightOf, pollutionOf, type SystemStats } from './sim/system'
import { defaultUser, fetchActivity, foodMulOf, saveUser, type Activity } from './sim/activity'

export function useWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const selectedRef = useRef<Creature | null>(null)
  const pausedRef = useRef(false)
  const speedRef = useRef(1)

  const [stats, setStats] = useState<WorldStats | null>(null)
  const [history, setHistory] = useState<Sample[]>([])
  const [event, setEvent] = useState('')
  const [activity, setActivity] = useState<Activity | null>(null)
  const [system, setSystem] = useState<SystemStats | null>(null)
  const [selected, setSelected] = useState<Creature | null>(null)
  const [paused, setPausedState] = useState(false)
  const [speed, setSpeedState] = useState(1)
  const [, bump] = useState(0) // 선택 개체 패널 갱신용

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const world = (worldRef.current = new World(innerWidth, innerHeight))
    const SAVE_KEY = 'bw:world'
    try { const saved = localStorage.getItem(SAVE_KEY); if (saved) world.restore(saved) } catch { /* 저장소 없음 */ }
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
    const loop = (t: number) => {
      if (!pausedRef.current) for (let i = 0; i < speedRef.current; i++) world.step()
      // 선택 개체가 죽으면 해제
      const sel = selectedRef.current
      if (sel && !world.creatures.includes(sel)) { selectedRef.current = null; setSelected(null) }
      world.draw(ctx, selectedRef.current)
      if (t - lastHud > 100) { lastHud = t; setStats(world.stats()); setHistory([...world.history]); setEvent(world.lastEvent); bump((n) => n + 1) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    loadActivity(defaultUser())
    const pollSystem = async () => {
      const st = await fetchSystem().catch(() => null)
      if (!st) return
      setSystem(st)
      world.heat = heatOf(st)
      world.pollution = pollutionOf(st)
      world.night = nightOf(st)
    }
    pollSystem()
    const sysTimer = setInterval(pollSystem, 3000)
    return () => { cancelAnimationFrame(raf); clearInterval(sysTimer); clearInterval(saveTimer); removeEventListener('beforeunload', save); removeEventListener('resize', resize) }
  }, [])

  const loadActivity = async (user: string) => {
    const a = await fetchActivity(user)
    setActivity(a)
    const w = worldRef.current
    if (!w) return
    w.activityMul = foodMulOf(a)
    if (a.today > 0) w.rain(a.today * 10)
  }
  const setUser = (u: string) => { saveUser(u); loadActivity(u) }

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

  return { canvasRef, stats, history, event, activity, system, setUser, selected, spawnPredator, outbreak, paused, speed, select, setPaused, setSpeed, reset, spawnFood, lineage }
}
