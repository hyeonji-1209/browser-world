const PREY_FAMILY = ['몽글', '토실', '뽀송', '찹찹', '달콤', '포동', '말랑', '쫀득', '보들', '푸딩', '솜솜', '꼬물', '동글', '방울', '옹기', '살랑', '두근', '반짝', '뭉치', '콩콩']
const PRED_FAMILY = ['여우', '붉은', '날쌘', '으르', '번개', '그림자', '송곳', '바람']
const GIVEN = ['이', '아', '우', '오', '미', '루', '나', '리', '모', '삐', '뿅', '콩', '별', '봄', '눈', '달', '해', '꿀', '밤', '숲', '봉', '쥬', '피', '요', '츄', '뽀', '까', '띠', '냥', '쿠']

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export const randomFamily = (predator: boolean) => pick(predator ? PRED_FAMILY : PREY_FAMILY)
export const randomGiven = () => pick(GIVEN) + pick(GIVEN)
