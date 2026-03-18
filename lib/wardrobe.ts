import fs from 'fs'
import path from 'path'
import { wardrobe as defaultWardrobe } from '@/lib/mock-data'

export type WardrobeItem = {
  id: number
  name: string
  category: string
  season: string
  style: string
  image?: string
}

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'wardrobe.json')

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]', 'utf8')
}

export function getWardrobeItems(): WardrobeItem[] {
  ensureStore()
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw) as WardrobeItem[]
    return parsed.length ? parsed : defaultWardrobe
  } catch {
    return defaultWardrobe
  }
}

export function saveWardrobeItems(items: WardrobeItem[]) {
  ensureStore()
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8')
}
