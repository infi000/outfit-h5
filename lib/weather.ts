export type DailyWeather = {
  city: string
  date: string
  condition: string
  temperature: string
  wind: string
  tip: string
}

function buildTip(condition: string, high: number, low: number) {
  const tips: string[] = []

  if (high - low >= 7) tips.push('早晚温差较大，建议带一件外套。')
  if (/雨|雷/.test(condition)) tips.push('可能有降雨，优先选择防水或深色鞋子。')
  if (high >= 28) tips.push('白天偏热，建议选择轻薄透气单品。')
  if (high <= 15) tips.push('体感偏凉，建议增加针织或外套层次。')

  return tips[0] || '按舒适层次穿搭即可，优先兼顾通勤与体感。'
}

export async function getTomorrowWeather(city = 'Hangzhou'): Promise<DailyWeather> {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      next: { revalidate: 1800 },
    })

    if (!response.ok) throw new Error('weather request failed')

    const data = await response.json() as any
    const nearest = data?.nearest_area?.[0]
    const tomorrow = data?.weather?.[1]
    const hourly = tomorrow?.hourly?.[4] || tomorrow?.hourly?.[0]

    const cityName = nearest?.areaName?.[0]?.value || '杭州'
    const minTemp = Number(tomorrow?.mintempC ?? 14)
    const maxTemp = Number(tomorrow?.maxtempC ?? 22)
    const condition = hourly?.weatherDesc?.[0]?.value || '多云'
    const wind = `${hourly?.windspeedKmph || '10'} km/h`

    return {
      city: cityName,
      date: '明天',
      condition,
      temperature: `${minTemp}°C ~ ${maxTemp}°C`,
      wind,
      tip: buildTip(condition, maxTemp, minTemp),
    }
  } catch {
    return {
      city: '杭州',
      date: '明天',
      condition: '多云',
      temperature: '14°C ~ 22°C',
      wind: '10 km/h',
      tip: '天气接口暂时不可用，先按春季轻薄分层思路穿搭。',
    }
  }
}
