import { NextResponse } from 'next/server'
import { getWardrobeItems, saveWardrobeItems, type WardrobeItem } from '@/lib/wardrobe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ success: true, items: getWardrobeItems() })
  } catch {
    return NextResponse.json({ success: false, error: '获取衣橱失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as WardrobeItem
    const items = getWardrobeItems()
    const next = [{ ...body, id: body.id || Date.now() }, ...items]
    saveWardrobeItems(next)
    return NextResponse.json({ success: true, items: next })
  } catch {
    return NextResponse.json({ success: false, error: '保存衣橱失败' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { items?: WardrobeItem[], item?: WardrobeItem }

    if (body.item) {
      const items = getWardrobeItems()
      const next = items.map((it) => it.id === body.item!.id ? body.item! : it)
      saveWardrobeItems(next)
      return NextResponse.json({ success: true, items: next })
    }

    saveWardrobeItems(body.items || [])
    return NextResponse.json({ success: true, items: body.items || [] })
  } catch {
    return NextResponse.json({ success: false, error: '更新衣橱失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    const items = getWardrobeItems().filter((item) => item.id !== id)
    saveWardrobeItems(items)
    return NextResponse.json({ success: true, items })
  } catch {
    return NextResponse.json({ success: false, error: '删除衣橱失败' }, { status: 500 })
  }
}
