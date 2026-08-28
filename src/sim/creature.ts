import { CFG, type Food, type Genes } from './types'

export const rnd = (a: number, b: number) => a + Math.random() * (b - a)
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const mutate = (v: number, lo: number, hi: number) =>
  clamp(v * (1 + rnd(-CFG.mutation, CFG.mutation)), lo, hi)

let nextId = 1
export const resetIds = () => (nextId = 1)

export function randomGenes(): Genes {
  return { speed: rnd(0.6, 1.6), size: rnd(2.5, 5), sight: rnd(40, 120), hue: rnd(0, 360) }
}

export class Creature {
  id = nextId++
  parentId: number | null
  gen: number
  energy = 80
  age = 0
  children = 0
  dir = rnd(0, Math.PI * 2)

  x: number
  y: number
  genes: Genes

  constructor(x: number, y: number, genes: Genes, parent?: Creature) {
    this.x = x
    this.y = y
    this.genes = genes
    this.parentId = parent?.id ?? null
    this.gen = parent ? parent.gen + 1 : 0
  }

  get color() {
    return `hsl(${this.genes.hue},70%,60%)`
  }

  /** 한 틱 진행. 살아있으면 true. 자식이 생기면 반환. */
  update(food: Food[], W: number, H: number): { alive: boolean; child?: Creature } {
    const g = this.genes
    this.age++
    // 대사: 크고 빠르고 시야 넓을수록 비용 ↑
    this.energy -= 0.05 + g.size * 0.02 + g.speed * g.speed * 0.03 + g.sight * 0.0005

    // 시야 안 가장 가까운 먹이
    let best: Food | null = null
    let bd = g.sight * g.sight
    for (const f of food) {
      const d = (f.x - this.x) ** 2 + (f.y - this.y) ** 2
      if (d < bd) { bd = d; best = f }
    }
    if (best) this.dir = Math.atan2(best.y - this.y, best.x - this.x)
    else this.dir += rnd(-0.3, 0.3)

    this.x += Math.cos(this.dir) * g.speed
    this.y += Math.sin(this.dir) * g.speed
    if (this.x < 0 || this.x > W) { this.dir = Math.PI - this.dir; this.x = clamp(this.x, 0, W) }
    if (this.y < 0 || this.y > H) { this.dir = -this.dir; this.y = clamp(this.y, 0, H) }

    // 먹기
    if (best && bd < (g.size + 3) ** 2) {
      food.splice(food.indexOf(best), 1)
      this.energy += CFG.foodEnergy
    }

    // 번식
    let child: Creature | undefined
    if (this.energy > CFG.reproduceAt) {
      this.energy -= CFG.birthCost
      this.children++
      const ng: Genes = {
        speed: mutate(g.speed, 0.2, 4),
        size: mutate(g.size, 1.5, 10),
        sight: mutate(g.sight, 10, 250),
        hue: (g.hue + rnd(-12, 12) + 360) % 360,
      }
      child = new Creature(this.x + rnd(-8, 8), this.y + rnd(-8, 8), ng, this)
      child.energy = CFG.birthCost * 0.8
    }

    return { alive: this.energy > 0 && this.age < CFG.maxAge, child }
  }
}
