import { randomFamily, randomGiven } from './names'
import { CFG, type Food, type Genes, type Kind } from './types'

export const rnd = (a: number, b: number) => a + Math.random() * (b - a)
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const mutate = (v: number, lo: number, hi: number) =>
  clamp(v * (1 + rnd(-CFG.mutation, CFG.mutation)), lo, hi)

let nextId = 1
export const resetIds = () => (nextId = 1)

export function randomGenes(kind: Kind): Genes {
  return kind === 'prey'
    ? { speed: rnd(0.6, 1.6), size: rnd(2.5, 5), sight: rnd(40, 120), hue: rnd(60, 300) }
    : { speed: rnd(1.4, 2.4), size: rnd(5, 8), sight: rnd(100, 180), hue: rnd(-20, 20) }
}

export interface UpdateResult {
  alive: boolean
  cause?: string
  child?: Creature
  killed?: Creature
}

export class Creature {
  id = nextId++
  kind: Kind
  parentId: number | null
  gen: number
  energy = 80
  age = 0
  children = 0
  dir = rnd(0, Math.PI * 2)
  infected = 0 // 남은 감염 틱
  family: string
  given: string
  immune = false

  x: number
  y: number
  genes: Genes

  constructor(x: number, y: number, genes: Genes, kind: Kind, parent?: Creature) {
    this.x = x
    this.y = y
    this.genes = genes
    this.kind = kind
    this.parentId = parent?.id ?? null
    this.gen = parent ? parent.gen + 1 : 0
    this.family = parent?.family ?? randomFamily(kind === 'predator')
    this.given = randomGiven()
  }

  get name() { return `${this.family} ${this.given}` }

  get isPredator() { return this.kind === 'predator' }

  get color() {
    if (this.infected) return `hsl(${this.genes.hue},30%,45%)`
    return this.isPredator ? `hsl(${this.genes.hue},85%,50%)` : `hsl(${this.genes.hue},70%,60%)`
  }

  private nearest<T extends { x: number; y: number }>(list: T[], r: number, filter?: (t: T) => boolean) {
    let best: T | null = null
    let bd = r * r
    for (const t of list) {
      if (filter && !filter(t)) continue
      const d = (t.x - this.x) ** 2 + (t.y - this.y) ** 2
      if (d < bd) { bd = d; best = t }
    }
    return { best, bd }
  }

  update(food: Food[], creatures: Creature[], W: number, H: number): UpdateResult {
    const g = this.genes
    this.age++
    // 대사: 크고 빠르고 시야 넓을수록 비용 ↑ (포식자는 조금 더 효율적)
    const base = 0.05 + g.size * 0.02 + g.speed * g.speed * 0.03 + g.sight * 0.0005
    this.energy -= this.isPredator ? base * 0.55 : base
    if (this.infected > 0) {
      this.energy -= CFG.diseaseDrain
      if (--this.infected === 0) this.immune = true
    }

    let killed: Creature | undefined

    if (this.isPredator) {
      // 자기보다 너무 큰 피식자는 못 잡음
      const { best, bd } = this.nearest(creatures, g.sight, (c) => !c.isPredator && c.genes.size < g.size * 1.2)
      if (best) {
        this.dir = Math.atan2(best.y - this.y, best.x - this.x)
        if (bd < (g.size + best.genes.size) ** 2) {
          killed = best
          this.energy += best.genes.size * CFG.preyEnergyMul
        }
      } else this.dir += rnd(-0.3, 0.3)
    } else {
      // 포식자가 시야 절반 안으로 들어오면 도망 우선
      const threat = this.nearest(creatures, g.sight * 0.7, (c) => c.isPredator).best
      if (threat) {
        this.dir = Math.atan2(this.y - threat.y, this.x - threat.x)
      } else {
        const { best, bd } = this.nearest(food, g.sight)
        if (best) {
          this.dir = Math.atan2(best.y - this.y, best.x - this.x)
          if (bd < (g.size + 3) ** 2) {
            food.splice(food.indexOf(best), 1)
            this.energy += CFG.foodEnergy
          }
        } else this.dir += rnd(-0.3, 0.3)
      }
    }

    // 감염 전파: 감염자가 근처 비면역 개체에게
    if (this.infected > 0) {
      for (const c of creatures) {
        if (c === this || c.infected || c.immune) continue
        if ((c.x - this.x) ** 2 + (c.y - this.y) ** 2 < CFG.infectRadius ** 2 && Math.random() < CFG.infectChance)
          c.infected = CFG.diseaseDuration
      }
    }

    this.x += Math.cos(this.dir) * g.speed
    this.y += Math.sin(this.dir) * g.speed
    if (this.x < 0 || this.x > W) { this.dir = Math.PI - this.dir; this.x = clamp(this.x, 0, W) }
    if (this.y < 0 || this.y > H) { this.dir = -this.dir; this.y = clamp(this.y, 0, H) }

    // 번식
    let child: Creature | undefined
    const threshold = this.isPredator ? CFG.predReproduceAt : CFG.reproduceAt
    const cost = this.isPredator ? CFG.predBirthCost : CFG.birthCost
    if (this.energy > threshold) {
      this.energy -= cost
      this.children++
      const ng: Genes = {
        speed: mutate(g.speed, 0.2, this.isPredator ? 5 : 3.2),
        size: mutate(g.size, 1.5, 12),
        sight: mutate(g.sight, 10, 250),
        hue: (g.hue + rnd(-12, 12) + 360) % 360,
      }
      child = new Creature(this.x + rnd(-8, 8), this.y + rnd(-8, 8), ng, this.kind, this)
      child.energy = cost * 0.8
    }

    const maxAge = this.isPredator ? CFG.predMaxAge : CFG.maxAge
    const cause = this.energy <= 0 ? (this.infected ? '질병' : '굶주림') : this.age >= maxAge ? '노화' : undefined
    return { alive: !cause, cause, child, killed }
  }
}
