import { Creature, randomGenes, resetIds, rnd } from './creature'
import { CFG, type Food, type Ghost, type WorldStats } from './types'

export class World {
  creatures: Creature[] = []
  food: Food[] = []
  graveyard = new Map<number, Ghost>()
  tick = 0
  W = 0
  H = 0

  constructor(W: number, H: number) {
    this.resize(W, H)
    this.reset()
  }

  resize(W: number, H: number) { this.W = W; this.H = H }

  reset() {
    resetIds()
    this.creatures = []
    this.food = []
    this.graveyard.clear()
    this.tick = 0
    for (let i = 0; i < CFG.startPop; i++)
      this.creatures.push(new Creature(rnd(0, this.W), rnd(0, this.H), randomGenes()))
    this.spawnFood(150)
  }

  spawnFood(n: number) {
    for (let i = 0; i < n && this.food.length < CFG.maxFood; i++)
      this.food.push({ x: rnd(0, this.W), y: rnd(0, this.H) })
  }

  step() {
    this.tick++
    if (Math.random() < CFG.foodRate) this.spawnFood(1)

    const next: Creature[] = []
    for (const c of this.creatures) {
      const { alive, child } = c.update(this.food, this.W, this.H)
      if (alive) next.push(c)
      else this.graveyard.set(c.id, { id: c.id, parentId: c.parentId, gen: c.gen, genes: c.genes, died: this.tick, children: c.children })
      if (child) next.push(child)
    }
    this.creatures = next

    // 전멸 시 새 개체 투입
    if (this.creatures.length === 0)
      for (let i = 0; i < 10; i++)
        this.creatures.push(new Creature(rnd(0, this.W), rnd(0, this.H), randomGenes()))
  }

  find(id: number): Creature | Ghost | undefined {
    return this.creatures.find((c) => c.id === id) ?? this.graveyard.get(id)
  }

  /** 부모 → 조상 순으로 최대 30대 */
  lineage(c: Creature): (Creature | Ghost)[] {
    const out: (Creature | Ghost)[] = []
    let pid = c.parentId
    while (pid != null && out.length < 30) {
      const p = this.find(pid)
      if (!p) break
      out.push(p)
      pid = p.parentId
    }
    return out
  }

  nearest(x: number, y: number, r = 20): Creature | null {
    let best: Creature | null = null
    let bd = r * r
    for (const c of this.creatures) {
      const d = (c.x - x) ** 2 + (c.y - y) ** 2
      if (d < bd) { bd = d; best = c }
    }
    return best
  }

  stats(): WorldStats {
    const n = this.creatures.length || 1
    const sum = (k: 'speed' | 'size' | 'sight') => this.creatures.reduce((s, c) => s + c.genes[k], 0) / n
    return {
      tick: this.tick,
      population: this.creatures.length,
      food: this.food.length,
      maxGen: this.creatures.reduce((m, c) => Math.max(m, c.gen), 0),
      avgSpeed: sum('speed'),
      avgSize: sum('size'),
      avgSight: sum('sight'),
    }
  }

  draw(ctx: CanvasRenderingContext2D, selected: Creature | null) {
    ctx.fillStyle = '#0b0e14'
    ctx.fillRect(0, 0, this.W, this.H)
    ctx.fillStyle = '#4ade80'
    for (const f of this.food) ctx.fillRect(f.x | 0, f.y | 0, 2, 2)
    for (const c of this.creatures) {
      const s = c.genes.size
      ctx.fillStyle = c.color
      ctx.fillRect((c.x - s) | 0, (c.y - s) | 0, (s * 2) | 0, (s * 2) | 0)
      ctx.fillStyle = '#000'
      ctx.fillRect((c.x + Math.cos(c.dir) * s * 0.6) | 0, (c.y + Math.sin(c.dir) * s * 0.6) | 0, 2, 2)
    }
    if (selected) {
      const s = selected.genes.size
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect((selected.x - s - 3) | 0, (selected.y - s - 3) | 0, (s * 2 + 6) | 0, (s * 2 + 6) | 0)
      ctx.strokeStyle = 'rgba(255,255,255,.15)'
      ctx.beginPath()
      ctx.arc(selected.x, selected.y, selected.genes.sight, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}
