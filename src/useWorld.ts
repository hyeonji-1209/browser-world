import { useEffect, useRef, useState } from 'react'
import type { Creature } from './sim/creature'
import type { WorldStats } from './sim/types'
import { World } from './sim/world'

export function useWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const selectedRef = useRef<Creature | null>(null)
  const pausedRef = useRef(false)
  const speedRef = useRef(1)

  const [stats, setStats] = useState<WorldStats | null>(null)
  const [selected, setSelected] = useState<Creature | null>(null)
  const [paused, setPausedState] = useState(false)
  const [speed, setSpeedState] = useState(1)
  const [, bump] = useState(0) // 선택 개체 패널 갱신용

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const world = (worldRef.current = new World(innerWidth, innerHeight))

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
      if (t - lastHud > 100) { lastHud = t; setStats(world.stats()); bump((n) => n + 1) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize) }
  }, [])

  const select = (x: number, y: number) => {
    const c = worldRef.current?.nearest(x, y) ?? null
    selectedRef.current = c
    setSelected(c)
  }
  const setPaused = (v: boolean) => { pausedRef.current = v; setPausedState(v) }
  const setSpeed = (v: number) => { speedRef.current = v; setSpeedState(v) }
  const reset = () => { worldRef.current?.reset(); select(-999, -999) }
  const spawnFood = (n: number) => worldRef.current?.spawnFood(n)
  const lineage = (c: Creature) => worldRef.current?.lineage(c) ?? []

  return { canvasRef, stats, selected, paused, speed, select, setPaused, setSpeed, reset, spawnFood, lineage }
}
