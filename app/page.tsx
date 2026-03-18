import HomePageClient from '@/app/page.client'
import { getTomorrowWeather } from '@/lib/weather'
import { getWardrobeItems } from '@/lib/wardrobe'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const weather = await getTomorrowWeather('Hangzhou')
  const wardrobe = getWardrobeItems()
  return <HomePageClient weather={weather} initialWardrobe={wardrobe} />
}
