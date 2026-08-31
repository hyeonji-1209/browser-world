export type Kind = 'prey' | 'predator'

export interface Genes {
  speed: number
  size: number
  sight: number
  hue: number
}

export interface Food {
  x: number
  y: number
  /** 청소 조사 모드: 실제 캐시 뭉치를 나타내는 쓰레기 (조사만, 삭제 안 함) */
  trash?: { bytes: number; source: string }
}

/** 죽은 개체의 족보용 기록 */
export interface Ghost {
  id: number
  name: string
  family: string
  kind: Kind
  parentId: number | null
  gen: number
  genes: Genes
  died: number
  children: number
  cause: string
  age?: number
  petted?: number
}

export type Season = '봄' | '여름' | '가을' | '겨울'

export interface WorldStats {
  tick: number
  population: number
  predators: number
  infected: number
  food: number
  maxGen: number
  avgSpeed: number
  avgSize: number
  avgSight: number
  season: Season
  foodMul: number
  activityMul: number
  /** 살아있는 피식자 가문 상위 3 */
  topFamilies: { family: string; count: number }[]
  heat: number
  pollution: number
  night: number
}

/** 그래프용 샘플 */
export interface Sample {
  tick: number
  pop: number
  pred: number
  speed: number
  size: number
  sight: number
}

export const CFG = {
  startPop: 40,
  startPredators: 3,
  foodRate: 1.0, // 틱당 먹이 생성 확률 (계절 배율 적용 전)
  maxFood: 400,
  foodEnergy: 25,
  reproduceAt: 120,
  birthCost: 60,
  mutation: 0.12,
  maxAge: 3000,
  // 포식자
  predReproduceAt: 260,
  predBirthCost: 120,
  predMaxAge: 4000,
  preyEnergyMul: 14, // 먹힌 피식자 크기 × 이 값 = 에너지
  // 계절
  seasonLength: 3000, // 한 계절 틱 수
  // 질병
  outbreakChance: 0.0004, // 틱당 발병 확률
  infectRadius: 10,
  infectChance: 0.02,
  diseaseDrain: 0.08,
  diseaseDuration: 600,
  sampleEvery: 60,
}
