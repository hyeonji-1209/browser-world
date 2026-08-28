import { Creature, randomGenes, resetIds, rnd } from './creature'
import { drawWorld } from './render'
import { CFG, type Food, type Ghost, type Sample, type Season, type WorldStats } from './types'

const SEASONS: Season[] = ['봄', '여름', '가을', '겨울']
const SEASON_FOOD: Record<Season, number> = { 봄: 1.3, 여름: 1.0, 가을: 0.8, 겨울: 0.3 }

export class World {
  creatures: Creature[] = []
  food: Food[] = []
  graveyard = new Map<number, Ghost>()
  history: Sample[] = []
  tick = 0
  W = 0
  H = 0
  lastEvent = ''
  /** 외부 활동(GitHub 등)으로 인한 먹이 배율 */
  activityMul = 1
  /** 컴퓨터 CPU → 열 (0~1) */
  heat = 0
  /** 컴퓨터 메모리 압박 → 오염 (0~1) */
  pollution = 0

  constructor(W: number, H: number) {
    this.resize(W, H)
    this.reset()
  }

  resize(W: number, H: number) { this.W = W; this.H = H }

  get season(): Season {
    return SEASONS[Math.floor(this.tick / CFG.seasonLength) % 4]
  }
  get foodMul() { return SEASON_FOOD[this.season] }

  reset() {
    resetIds()
    this.creatures = []
    this.food = []
    this.graveyard.clear()
    this.history = []
    this.tick = 0
    this.lastEvent = ''
    for (let i = 0; i < CFG.startPop; i++) this.spawn('prey')
    for (let i = 0; i < CFG.startPredators; i++) this.spawn('predator')
    this.spawnFood(150)
  }

  spawn(kind: 'prey' | 'predator') {
    this.creatures.push(new Creature(rnd(0, this.W), rnd(0, this.H), randomGenes(kind), kind))
  }

  spawnFood(n: number) {
    for (let i = 0; i < n && this.food.length < CFG.maxFood; i++)
      this.food.push({ x: rnd(0, this.W), y: rnd(0, this.H) })
  }

  /** 커밋 보상: 먹이 비 */
  rain(n: number) {
    this.spawnFood(n)
    this.lastEvent = `tick ${this.tick}: 커밋 보상 먹이 +${n}`
  }

  /** 무작위 개체 하나 감염시켜 발병 */
  outbreak() {
    const healthy = this.creatures.filter((c) => !c.infected && !c.immune)
    if (!healthy.length) return
    healthy[Math.floor(Math.random() * healthy.length)].infected = CFG.diseaseDuration
    this.lastEvent = `tick ${this.tick}: 질병 발생`
  }

  private bury(c: Creature, cause: string) {
    this.graveyard.set(c.id, {
      id: c.id, name: c.name, family: c.family, kind: c.kind, parentId: c.parentId, gen: c.gen, genes: c.genes,
      died: this.tick, children: c.children, cause,
    })
  }

  step() {
    this.tick++
    if (Math.random() < CFG.foodRate * this.foodMul * this.activityMul * (1 - this.pollution * 0.6)) this.spawnFood(1)
    if (Math.random() < CFG.outbreakChance * (1 + this.pollution * 8)) this.outbreak()

    const dead = new Set<Creature>()
    const born: Creature[] = []
    for (const c of this.creatures) {
      if (dead.has(c)) continue
      const r = c.update(this.food, this.creatures, this.W, this.H, this.heat)
      if (r.killed && !dead.has(r.killed)) { dead.add(r.killed); this.bury(r.killed, '포식') }
      if (!r.alive) { dead.add(c); this.bury(c, r.cause!) }
      if (r.child) born.push(r.child)
    }
    this.creatures = this.creatures.filter((c) => !dead.has(c)).concat(born)

    // 전멸 방지
    if (!this.creatures.some((c) => !c.isPredator)) for (let i = 0; i < 10; i++) this.spawn('prey')
    if (!this.creatures.some((c) => c.isPredator) && this.tick % 1500 === 0) for (let i = 0; i < 2; i++) this.spawn('predator')

    if (this.tick % CFG.sampleEvery === 0) {
      const s = this.stats()
      this.history.push({ tick: s.tick, pop: s.population, pred: s.predators, speed: s.avgSpeed, size: s.avgSize, sight: s.avgSight })
      if (this.history.length > 400) this.history.shift()
    }
  }

  find(id: number): Creature | Ghost | undefined {
    return this.creatures.find((c) => c.id === id) ?? this.graveyard.get(id)
  }

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
    const prey = this.creatures.filter((c) => !c.isPredator)
    const n = prey.length || 1
    const avg = (k: 'speed' | 'size' | 'sight') => prey.reduce((s, c) => s + c.genes[k], 0) / n
    const fam = new Map<string, number>()
    for (const c of prey) fam.set(c.family, (fam.get(c.family) ?? 0) + 1)
    const topFamilies = [...fam].map(([family, count]) => ({ family, count })).sort((a, b) => b.count - a.count).slice(0, 3)
    return {
      tick: this.tick,
      population: prey.length,
      predators: this.creatures.length - prey.length,
      infected: this.creatures.filter((c) => c.infected > 0).length,
      food: this.food.length,
      maxGen: this.creatures.reduce((m, c) => Math.max(m, c.gen), 0),
      avgSpeed: avg('speed'),
      avgSize: avg('size'),
      avgSight: avg('sight'),
      season: this.season,
      foodMul: this.foodMul,
      activityMul: this.activityMul,
      topFamilies,
      heat: this.heat,
      pollution: this.pollution,
    }
  }

  draw(ctx: CanvasRenderingContext2D, selected: Creature | null) {
    drawWorld(ctx, this, selected)
  }
}
