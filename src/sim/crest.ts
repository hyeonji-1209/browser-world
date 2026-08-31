/** 가문 문장: 가문 이름에서 결정적으로 생성되는 5×5 대칭 픽셀 문장 (identicon풍) */

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 5×5 좌우대칭 패턴 (25개 boolean) */
export function crestPattern(family: string): boolean[] {
  let h = hash(family)
  const next = () => { h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0; return h }
  const cells = new Array<boolean>(25).fill(false)
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x <= 2; x++) {
      const on = next() % 100 < 52
      cells[y * 5 + x] = on
      cells[y * 5 + (4 - x)] = on
    }
  }
  // 중앙은 항상 채워서 문장답게
  cells[12] = true
  return cells
}

export const crestHue = (family: string) => hash(family + '♥') % 360
