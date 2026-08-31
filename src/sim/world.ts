import { Creature, getNextId, randomGenes, resetIds, rnd, setNextId } from './creature'
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
  /** 친근한 소식 피드 (최신이 앞) */
  feed: string[] = []
  /** 청소 조사 모드: 대기 중인 캐시 뭉치 (읽기 전용 조사, 삭제 없음) */
  junkQueue: { bytes: number; source: string }[] = []
  survey = { active: false, total: 0, bySource: {} as Record<string, number> }
  /** 외부 활동(GitHub 등)으로 인한 먹이 배율 */
  activityMul = 1
  /** 컴퓨터 CPU → 열 (0~1) */
  heat = 0
  /** 컴퓨터 메모리 압박 → 오염 (0~1) */
  pollution = 0
  /** 배터리 → 밤 (0~1). 밤엔 느려지고 먹이가 잘 안 자람 */
  night = 0
  /** 바깥 날씨 (0~1) */
  rain = 0
  snow = 0
  cloud = 0
  thunder = 0
  tempStress = 0
  /** 네트워크 → 바람 (0~1). 먹이가 날리고 가벼운 개체가 밀림 */
  wind = 0
  /** 디스크 부족 → 메마름 (0~1). 먹이가 잘 안 자람 */
  dry = 0
  /** 복원 시 이전 저장 시각 (브리핑용) */
  lastSavedAt: number | null = null
  /** 마우스가 올라가 있는 개체 (이름표) */
  hover: Creature | null = null
  private lastCrisisSay = -9999
  /** 렌더러가 소비하는 순간 이펙트 */
  effects: { kind: 'eat' | 'birth' | 'death' | 'lightning' | 'pet'; x: number; y: number; t: number; text?: string }[] = []
  /** 프론트가 꺼내 재생하는 소리 큐 */
  sounds: ('eat' | 'birth' | 'death' | 'lightning' | 'pet')[] = []
  /** 타임머신: 3000틱마다 자동 스냅샷 (메모리에만, 최근 8개) */
  snapshots: { tick: number; season: Season; pop: number; json: string }[] = []

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

  /** 조사 시작: 뭉치들을 쓰레기로 투하 (동시에 최대 8개) */
  startSurvey(chunks: { bytes: number; source: string }[]) {
    this.junkQueue = [...chunks]
    this.survey = { active: chunks.length > 0, total: 0, bySource: {} }
    this.spawnTrash()
  }

  spawnTrash() {
    const onField = this.food.filter((f) => f.trash).length
    for (let i = onField; i < 8; i++) {
      const chunk = this.junkQueue.shift()
      if (!chunk) break
      this.food.push({ x: rnd(40, Math.max(80, this.W - 40)), y: rnd(40, Math.max(80, this.H - 40)), trash: chunk })
    }
  }

  /** 조사 중단: 남은 쓰레기 회수 */
  clearTrash() {
    this.junkQueue = []
    this.survey.active = false
    this.food = this.food.filter((f) => !f.trash)
  }

  spawnFood(n: number) {
    for (let i = 0; i < n && this.food.length < CFG.maxFood; i++)
      this.food.push({ x: rnd(0, this.W), y: rnd(0, this.H) })
  }

  /** 쓰다듬기: 소량 회복 + 행복. 너무 자주는 안 통함 */
  pet(c: Creature) {
    if (!this.creatures.includes(c)) return
    c.happyTicks = 50
    c.energy = Math.min(c.energy + 2, CFG.reproduceAt * 0.95) // 번식 문턱은 못 넘게
    c.petted++
    this.effects.push({ kind: 'pet', x: c.x + rnd(-6, 6), y: c.y - c.genes.size * 2, t: 0 })
    this.sounds.push('pet')
  }

  /** 커밋 보상: 먹이 비 */
  rainFood(n: number) {
    this.spawnFood(n)
    this.lastEvent = `tick ${this.tick}: 커밋 보상 먹이 +${n}`
  }

  /** 무작위 개체 하나 감염시켜 발병 */
  outbreak() {
    const healthy = this.creatures.filter((c) => !c.infected && !c.immune)
    if (!healthy.length) return
    const sick = healthy[Math.floor(Math.random() * healthy.length)]
    sick.infected = CFG.diseaseDuration
    this.lastEvent = `tick ${this.tick}: 질병 발생`
    this.say(`${sick.name}가 콜록콜록… 🤒 거리를 두세요`)
  }

  say(msg: string) {
    this.feed.unshift(msg)
    if (this.feed.length > 4) this.feed.pop()
  }

  private bury(c: Creature, cause: string) {
    this.graveyard.set(c.id, {
      id: c.id, name: c.name, family: c.family, kind: c.kind, parentId: c.parentId, gen: c.gen, genes: c.genes,
      died: this.tick, children: c.children, cause, age: c.age, petted: c.petted,
    })
    // 묘지 상한: 오래된 기록부터 정리 (족보는 최근 조상만 있어도 충분)
    if (this.graveyard.size > 3000) {
      const it = this.graveyard.keys()
      for (let i = 0; i < 500; i++) this.graveyard.delete(it.next().value!)
    }
  }

  // ── 저장 / 복원 ──
  serialize() {
    return JSON.stringify({
      v: 1, savedAt: Date.now(), tick: this.tick, nextId: getNextId(), W: this.W, H: this.H,
      creatures: this.creatures, food: this.food, graveyard: [...this.graveyard.values()], history: this.history,
    })
  }
  restore(json: string): boolean {
    try {
      const d = JSON.parse(json)
      if (d.v !== 1) return false
      this.tick = d.tick
      this.lastSavedAt = d.savedAt ?? null
      setNextId(d.nextId)
      // 창 크기가 달라졌으면 좌표 스케일
      const sx = this.W / d.W, sy = this.H / d.H
      this.creatures = d.creatures.map((c: Parameters<typeof Creature.fromJSON>[0]) => { const o = Creature.fromJSON(c); o.x *= sx; o.y *= sy; return o })
      this.food = d.food.map((f: Food) => ({ x: f.x * sx, y: f.y * sy }))
      this.graveyard = new Map(d.graveyard.map((g: Ghost) => [g.id, g]))
      this.history = d.history
      this.lastEvent = `세계 복원 (tick ${this.tick})`
      return true
    } catch { return false }
  }

  step() {
    this.tick++
    if (this.wind > 0) {
      const wx = this.wind * 0.9, wy = Math.sin(this.tick * 0.01) * this.wind * 0.2
      for (const f of this.food) {
        f.x += wx; f.y += wy
        if (f.x > this.W) f.x -= this.W
        if (f.y > this.H) f.y -= this.H
        if (f.y < 0) f.y += this.H
      }
    }
    if (Math.random() < CFG.foodRate * this.foodMul * this.activityMul * (1 - this.pollution * 0.6) * (1 - this.night * 0.3) * (1 + this.rain * 1.5) * (1 - this.dry * 0.35)) this.spawnFood(1)
    if (this.thunder && Math.random() < 0.004) { this.effects.push({ kind: 'lightning', x: rnd(0, this.W), y: 0, t: 0 }); this.sounds.push('lightning') }
    if (this.tick % 3000 === 0 && this.creatures.length) {
      this.snapshots.push({ tick: this.tick, season: this.season, pop: this.creatures.filter((c) => !c.isPredator).length, json: this.serialize() })
      if (this.snapshots.length > 8) this.snapshots.shift()
    }
    if (Math.random() < CFG.outbreakChance * (1 + this.pollution * 8)) this.outbreak()

    const dead = new Set<Creature>()
    const born: Creature[] = []
    for (const c of this.creatures) {
      if (dead.has(c)) continue
      const r = c.update(this.food, this.creatures, this.W, this.H, this.heat, this.night, this.tempStress, this.wind)
      if (r.eaten?.trash) {
        const t2 = r.eaten.trash
        this.survey.total += t2.bytes
        this.survey.bySource[t2.source] = (this.survey.bySource[t2.source] ?? 0) + t2.bytes
        if (Math.random() < 0.4) this.say(`${c.name}가 캐시 뭉치를 조사했어요 🔍 (${Math.round(t2.bytes / 1e6)}MB)`)
        this.spawnTrash()
        if (this.survey.active && !this.junkQueue.length && !this.food.some((f) => f.trash)) {
          this.survey.active = false
          const gb = (this.survey.total / 1e9).toFixed(1)
          this.say(`조사 완료! 지울 수 있는 캐시 ${gb}GB를 찾았어요 — 💻 카드에서 결과 보기`)
        }
      }
      if (r.ate && Math.random() < 0.5) { this.effects.push({ kind: 'eat', x: c.x, y: c.y - c.genes.size * 2, t: 0, text: c.isPredator ? '앙' : '냠' }); this.sounds.push('eat') }
      if (r.child) { this.effects.push({ kind: 'birth', x: c.x, y: c.y, t: 0 }); if (Math.random() < 0.5) this.sounds.push('birth') }
      if (r.killed && !dead.has(r.killed)) {
        dead.add(r.killed); this.bury(r.killed, '포식'); this.effects.push({ kind: 'death', x: r.killed.x, y: r.killed.y, t: 0 })
        if (Math.random() < 0.25) this.say(`${r.killed.name}, ${c.family} 여우에게… 😢`)
      }
      if (!r.alive) { dead.add(c); this.bury(c, r.cause!); this.effects.push({ kind: 'death', x: c.x, y: c.y, t: 0 }); if (Math.random() < 0.3) this.sounds.push('death') }
      if (r.child) {
        born.push(r.child)
        if (Math.random() < 0.12) this.say(`${r.child.name}${r.child.isPredator ? ' 🦊' : ''} 태어났어요 🎉`)
      }
    }
    // 가문 멸종 감지
    if (dead.size) {
      const gone = new Set([...dead].filter((d) => !d.isPredator).map((d) => d.family))
      const alive = new Set(this.creatures.filter((c) => !dead.has(c) && !c.isPredator).map((c) => c.family))
      for (const b of born) if (!b.isPredator) alive.add(b.family)
      for (const f of gone) if (!alive.has(f)) this.say(`${f}가의 마지막 아이가 떠났어요 🕯`)
    }
    this.creatures = this.creatures.filter((c) => !dead.has(c)).concat(born)
    for (const e of this.effects) e.t++
    this.effects = this.effects.filter((e) => e.t < 60)
    if (this.effects.length > 200) this.effects.splice(0, this.effects.length - 200)

    // 전멸 방지
    if (!this.creatures.some((c) => !c.isPredator)) {
      for (let i = 0; i < 10; i++) this.spawn('prey')
      this.say('새로운 아이들이 이사 왔어요 🌱 이번엔 잘 부탁해요')
    }
    // 위기 안내: 세계가 먼저 도움을 청함
    const preyCount = this.creatures.reduce((n, c) => n + (c.isPredator ? 0 : 1), 0)
    if (preyCount > 0 && preyCount < 12 && this.tick - this.lastCrisisSay > 3000) {
      this.lastCrisisSay = this.tick
      this.say('아이들이 얼마 안 남았어요… 🌱 먹이 뿌리기로 도와줄 수 있어요')
    }
    if (!this.creatures.some((c) => c.isPredator) && this.tick % 1500 === 0) for (let i = 0; i < 2; i++) this.spawn('predator')

    if (this.tick % CFG.sampleEvery === 0) {
      const s = this.stats()
      this.history.push({ tick: s.tick, pop: s.population, pred: s.predators, speed: s.avgSpeed, size: s.avgSize, sight: s.avgSight })
      if (this.history.length > 400) this.history.shift()
    }
  }

  /** 타임머신: 과거 스냅샷으로 여행 (이후 스냅샷은 남겨둬서 다시 앞으로도 갈 수 있음) */
  travel(tick: number): boolean {
    const snap = this.snapshots.find((s) => s.tick === tick)
    if (!snap) return false
    const keep = this.snapshots
    const ok = this.restore(snap.json)
    if (ok) {
      this.snapshots = keep
      this.say(`시간을 거슬러 tick ${tick.toLocaleString()}으로 왔어요 🌀`)
    }
    return ok
  }

  /** 역사책: 명예의 전당 + 멸종 가문 */
  chronicle() {
    const all: (Creature | Ghost)[] = [...this.creatures, ...this.graveyard.values()]
    const by = <T extends Creature | Ghost>(list: T[], f: (x: T) => number) =>
      list.reduce<T | null>((m, x) => (m == null || f(x) > f(m) ? x : m), null)
    const eldest = by(all, (x) => ('age' in x && x.age) || 0)
    const parent = by(all, (x) => x.children)
    const beloved = by(all, (x) => ('petted' in x && x.petted) || 0)
    const livingFams = new Set(this.creatures.filter((c) => !c.isPredator).map((c) => c.family))
    const extinct = new Map<string, Ghost>()
    for (const g of this.graveyard.values())
      if (g.kind === 'prey' && !livingFams.has(g.family)) extinct.set(g.family, g) // 마지막(가장 늦게 죽은) 기록이 남음
    return { eldest, parent, beloved, extinct: [...extinct.values()].sort((a, b) => b.died - a.died).slice(0, 6) }
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
      night: this.night,
    }
  }

  draw(ctx: CanvasRenderingContext2D, selected: Creature | null) {
    drawWorld(ctx, this, selected)
  }
}
