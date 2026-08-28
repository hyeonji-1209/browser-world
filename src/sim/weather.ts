/** 실제 바깥 날씨 (Open-Meteo, 무료·키 불필요) → 세계의 하늘 */
export interface Weather {
  temp: number // °C
  code: number // WMO
  precip: number // mm
  isDay: boolean
  wind: number // km/h
  humidity: number
  place: string
  fetchedAt: number
}

export const describe = (code: number) =>
  code === 0 ? '맑음 ☀️' : code <= 2 ? '구름 조금 🌤' : code === 3 ? '흐림 ☁️'
  : code <= 48 ? '안개 🌫' : code <= 57 ? '이슬비 🌦' : code <= 67 ? '비 🌧'
  : code <= 77 ? '눈 ❄️' : code <= 82 ? '소나기 🌧' : code <= 86 ? '눈보라 🌨' : '천둥번개 ⛈'

/** 0~1 강수 세기 */
export const rainOf = (w: Weather | null) => {
  if (!w) return 0
  if (w.code >= 71 && w.code <= 77 || w.code >= 85 && w.code <= 86) return 0 // 눈은 따로
  if (w.code >= 51 || w.precip > 0) return Math.min(1, 0.3 + w.precip * 0.25)
  return 0
}
export const snowOf = (w: Weather | null) => (w && ((w.code >= 71 && w.code <= 77) || w.code >= 85 && w.code <= 86) ? 1 : 0)
export const cloudOf = (w: Weather | null) => (!w ? 0 : w.code === 0 ? 0 : w.code <= 2 ? 0.3 : w.code === 3 ? 0.7 : w.code <= 48 ? 0.8 : 0.9)
export const thunderOf = (w: Weather | null) => (w && w.code >= 95 ? 1 : 0)
/** 기온 스트레스: 5°C 아래·30°C 위에서 대사 증가 (0~1) */
export const tempStressOf = (w: Weather | null) => (!w ? 0 : w.temp < 5 ? Math.min(1, (5 - w.temp) / 15) : w.temp > 30 ? Math.min(1, (w.temp - 30) / 8) : 0)
/** 실제 밤 (배터리 없을 때 밤의 근거) */
export const realNightOf = (w: Weather | null) => (w && !w.isDay ? 1 : 0)

async function locate(): Promise<{ lat: number; lon: number; place: string }> {
  const fallback = { lat: 37.57, lon: 126.98, place: '서울' }
  try {
    const cached = localStorage.getItem('bw:geo')
    if (cached) return JSON.parse(cached)
  } catch { /* */ }
  return new Promise((res) => {
    if (!navigator.geolocation) return res(fallback)
    navigator.geolocation.getCurrentPosition(
      (p) => { const g = { lat: p.coords.latitude, lon: p.coords.longitude, place: '내 위치' }; try { localStorage.setItem('bw:geo', JSON.stringify(g)) } catch { /* */ } res(g) },
      () => res(fallback), { timeout: 5000 },
    )
  })
}

export async function fetchWeather(): Promise<Weather | null> {
  try {
    const { lat, lon, place } = await locate()
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,is_day,wind_speed_10m,relative_humidity_2m&timezone=auto`
    const r = await fetch(u)
    if (!r.ok) return null
    const c = (await r.json()).current
    // 미리보기: ?wx=95 (WMO 코드) &temp=35 &night=1
    const q = new URLSearchParams(location.search)
    if (q.has('wx')) c.weather_code = Number(q.get('wx')), c.precipitation = c.weather_code >= 51 ? 3 : 0
    if (q.has('temp')) c.temperature_2m = Number(q.get('temp'))
    if (q.has('night')) c.is_day = 0
    return { temp: c.temperature_2m, code: c.weather_code, precip: c.precipitation, isDay: !!c.is_day, wind: c.wind_speed_10m, humidity: c.relative_humidity_2m, place, fetchedAt: Date.now() }
  } catch { return null }
}
