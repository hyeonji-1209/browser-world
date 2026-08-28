export interface Genes {
  speed: number
  size: number
  sight: number
  hue: number
}

export interface Food {
  x: number
  y: number
}

/** 죽은 개체의 족보용 기록 */
export interface Ghost {
  id: number
  parentId: number | null
  gen: number
  genes: Genes
  died: number
  children: number
}

export interface WorldStats {
  tick: number
  population: number
  food: number
  maxGen: number
  avgSpeed: number
  avgSize: number
  avgSight: number
}

export const CFG = {
  startPop: 40,
  foodRate: 1.0, // 틱당 먹이 생성 확률
  maxFood: 400,
  foodEnergy: 25,
  reproduceAt: 120,
  birthCost: 60,
  mutation: 0.12,
  maxAge: 3000,
}
