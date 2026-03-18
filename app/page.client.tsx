'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import type { DailyWeather } from '@/lib/weather'
import type { WardrobeItem } from '@/lib/wardrobe'
import { recommendations } from '@/lib/mock-data'

type OutfitRecommendation = {
  title: string
  image: string
  items: string[]
  reason: string
}

const scenes = ['通勤', '休闲', '约会', '运动']
const emptyForm = { name: '', category: '上衣', season: '春秋', style: '通勤', image: '' }

function parseTemperatureRange(text: string) {
  const matches = text.match(/-?\d+/g)?.map(Number) || []
  return { low: matches[0] ?? 14, high: matches[1] ?? 22 }
}

function seasonFitScore(season: string, low: number, high: number) {
  const avg = (low + high) / 2
  if (avg <= 12) return season === '冬季' ? 4 : season === '春秋' ? 2 : 1
  if (avg <= 22) return season === '春秋' ? 4 : season === '四季' ? 3 : season === '春夏' ? 2 : 1
  return season === '春夏' ? 4 : season === '四季' ? 3 : 1
}

function styleFitScore(style: string, scene: string) {
  if (style === scene) return 4
  if (style === '百搭') return 3
  if (scene === '约会' && style === '通勤') return 2
  if (scene === '休闲' && style === '基础') return 2
  return 1
}

function weatherReason(condition: string, low: number, high: number) {
  const reasons: string[] = []
  if (high - low >= 7) reasons.push('早晚温差偏大，所以保留分层穿法。')
  if (/雨|雷/.test(condition)) reasons.push('天气可能有降雨，尽量选择更稳妥耐穿的鞋子。')
  if (high >= 26) reasons.push('白天偏热，优先轻薄透气。')
  if (low <= 12) reasons.push('体感偏凉，建议增加外套或针织。')
  return reasons[0] || '天气温和，重点考虑场景和舒适度。'
}

function rankItems(items: WardrobeItem[], category: string, scene: string, low: number, high: number) {
  return items
    .filter(item => item.category === category)
    .map(item => ({ item, score: styleFitScore(item.style, scene) + seasonFitScore(item.season, low, high) }))
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item)
}

function buildOutfit(scene: string, weather: DailyWeather, selectedItems: WardrobeItem[], fallbackImage: string, variant = 0): OutfitRecommendation {
  const { low, high } = parseTemperatureRange(weather.temperature)
  const tops = rankItems(selectedItems, '上衣', scene, low, high)
  const outers = rankItems(selectedItems, '外套', scene, low, high)
  const bottoms = rankItems(selectedItems, '裤子', scene, low, high)
  const shoes = rankItems(selectedItems, '鞋子', scene, low, high)
  const top = tops[variant] || tops[0]
  const bottom = bottoms[variant] || bottoms[0]
  const shoe = shoes[variant] || shoes[0]
  const shouldUseOuter = low <= 15 || high - low >= 7 || /雨|雷/.test(weather.condition)
  const outer = shouldUseOuter ? (outers[variant] || outers[0]) : undefined
  const chosen = [top, outer, bottom, shoe].filter(Boolean) as WardrobeItem[]

  const titleMap: Record<string, string[]> = {
    '通勤': ['你的通勤推荐搭配', '你的通勤备选搭配', '你的轻商务备选'],
    '休闲': ['你的休闲推荐搭配', '你的休闲备选搭配', '你的周末轻松备选'],
    '约会': ['你的约会推荐搭配', '你的约会备选搭配', '你的好感度备选'],
    '运动': ['你的轻运动推荐搭配', '你的运动备选搭配', '你的舒适活动备选'],
  }

  return {
    title: titleMap[scene]?.[variant] || '你的今日推荐',
    image: chosen.find(item => item.image)?.image || fallbackImage,
    items: chosen.length ? chosen.map(item => item.name) : ['请先从衣橱里选择至少 1 件上衣、1 条裤子和 1 双鞋'],
    reason: chosen.length >= 3
      ? `${variant === 0 ? '主推荐：' : `备选 ${variant}：`}${weatherReason(weather.condition, low, high)} 同时优先匹配「${scene}」场景和你当前已勾选的单品。`
      : '你当前选中的衣服还不够完整，建议至少准备上衣、裤子和鞋子。',
  }
}

export default function HomePageClient({ weather, initialWardrobe }: { weather: DailyWeather, initialWardrobe: WardrobeItem[] }) {
  const [scene, setScene] = useState('通勤')
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(initialWardrobe)
  const [selectedIds, setSelectedIds] = useState<number[]>(initialWardrobe.map(item => item.id))
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const fallbackRecommendation = useMemo(() => recommendations.find(item => item.scene === scene) || recommendations[0], [scene])
  const selectedWardrobe = useMemo(() => wardrobe.filter(item => selectedIds.includes(item.id)), [wardrobe, selectedIds])
  const outfitRecommendations = useMemo(() => [0, 1, 2].map((variant) => buildOutfit(scene, weather, selectedWardrobe, fallbackRecommendation.image, variant)), [scene, weather, selectedWardrobe, fallbackRecommendation.image])
  const mainRecommendation = outfitRecommendations[0]
  const backupRecommendations = outfitRecommendations.slice(1)

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  const handleFileChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, image: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }

  const handleEdit = (item: WardrobeItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      category: item.category,
      season: item.season,
      style: item.style,
      image: item.image || '',
    })
  }

  const handleDelete = async (id: number) => {
    const response = await fetch(`/api/wardrobe?id=${id}`, { method: 'DELETE' })
    const data = await response.json()
    if (data.success) {
      setWardrobe(data.items)
      setSelectedIds((prev) => prev.filter((item) => item !== id))
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const response = await fetch('/api/wardrobe', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: { id: editingId, ...form } }),
        })
        const data = await response.json()
        if (data.success) {
          setWardrobe(data.items)
          setEditingId(null)
          setForm(emptyForm)
        }
        return
      }

      const response = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: Date.now() }),
      })
      const data = await response.json()
      if (data.success) {
        setWardrobe(data.items)
        setSelectedIds(data.items.map((item: WardrobeItem) => item.id))
        setForm(emptyForm)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-5">
      <div className="mx-auto max-w-md space-y-4 pb-8">
        <section className="ios-card ios-card-strong overflow-hidden rounded-[32px] p-6">
          <div className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-500">
            Tomorrow Outfit · iOS Preview
          </div>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="ios-section-title text-[32px] font-semibold leading-tight text-slate-900">明天怎么穿，我替你想好</h1>
              <p className="mt-3 max-w-xs text-sm leading-6 ios-muted">基于明天天气、你的衣橱和出门场景，给你一套主推荐和两套备选方案。</p>
            </div>
            <div className="rounded-[24px] bg-gradient-to-br from-sky-400 to-blue-600 px-4 py-5 text-3xl shadow-lg">👔</div>
          </div>
        </section>

        <section className="ios-card rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm ios-muted">{weather.city} · {weather.date}</div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-900">{weather.condition}</div>
              <div className="mt-1 text-base text-slate-700">{weather.temperature}</div>
              <div className="mt-1 text-sm ios-muted">{weather.wind}</div>
            </div>
            <div className="max-w-[132px] rounded-[22px] bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700 shadow-sm">{weather.tip}</div>
          </div>
        </section>

        <section className="ios-card rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="ios-section-title text-[20px] font-semibold text-slate-900">场景</h2>
            <span className="text-sm ios-muted">选择明天的状态</span>
          </div>
          <div className="ios-segment grid grid-cols-4 gap-1 rounded-2xl p-1">
            {scenes.map((item) => (
              <button
                key={item}
                onClick={() => setScene(item)}
                className={`rounded-[14px] px-3 py-2 text-sm font-medium transition ${scene === item ? 'ios-segment-active' : 'text-slate-500'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="ios-card rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="ios-section-title text-[20px] font-semibold text-slate-900">{editingId ? '编辑衣服' : '录入衣服'}</h2>
            <span className="text-sm ios-muted">支持真实图片</span>
          </div>
          <div className="space-y-3">
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="例如：灰色卫衣 / 米色风衣" className="ios-input w-full rounded-2xl px-4 py-3" />
            <div className="grid grid-cols-3 gap-3">
              <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="ios-select rounded-2xl px-3 py-3"><option>上衣</option><option>外套</option><option>裤子</option><option>鞋子</option></select>
              <select value={form.season} onChange={(e) => setForm((prev) => ({ ...prev, season: e.target.value }))} className="ios-select rounded-2xl px-3 py-3"><option>春秋</option><option>春夏</option><option>四季</option><option>冬季</option></select>
              <select value={form.style} onChange={(e) => setForm((prev) => ({ ...prev, style: e.target.value }))} className="ios-select rounded-2xl px-3 py-3"><option>通勤</option><option>休闲</option><option>百搭</option><option>约会</option></select>
            </div>
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/60 p-4">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0])} className="block w-full text-sm text-slate-600" />
              <p className="mt-2 text-xs ios-muted">图片会保存到服务端本地文件，后面换浏览器也能继续看到。</p>
              {form.image && <div className="relative mt-3 h-40 w-full overflow-hidden rounded-[20px] bg-white"><Image src={form.image} alt="preview" fill className="object-cover" /></div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSave} disabled={saving} className="ios-primary-btn rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60">{saving ? '保存中...' : editingId ? '保存修改' : '加入我的衣橱'}</button>
              {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm) }} className="ios-secondary-btn rounded-2xl px-4 py-3 text-sm font-semibold">取消编辑</button>}
            </div>
          </div>
        </section>

        <section className="ios-card rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="ios-section-title text-[20px] font-semibold text-slate-900">你的衣橱</h2>
            <span className="text-sm ios-muted">已选 {selectedIds.length} 件</span>
          </div>
          <div className="space-y-3">
            {wardrobe.map((item) => {
              const active = selectedIds.includes(item.id)
              return (
                <div key={item.id} className={`rounded-[24px] border p-3 transition ${active ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-white/70'}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleItem(item.id)} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-slate-100">
                      {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">👕</div>}
                    </button>
                    <button onClick={() => toggleItem(item.id)} className="flex-1 text-left">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="mt-1 text-xs ios-muted">{item.category} · {item.season} · {item.style}</div>
                    </button>
                    <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{active ? '已选' : '未选'}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button onClick={() => handleEdit(item)} className="ios-secondary-btn rounded-2xl px-3 py-2 text-sm font-medium">编辑</button>
                    <button onClick={() => handleDelete(item.id)} className="ios-danger-btn rounded-2xl px-3 py-2 text-sm font-medium">删除</button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="ios-card ios-card-strong overflow-hidden rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="ios-section-title text-[20px] font-semibold text-slate-900">今日推荐</h2>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">主推荐</span>
          </div>
          <div className="mt-2 text-sm ios-muted">按天气、场景、季节与风格权重，从你勾选的衣橱中生成推荐。</div>
          <div className="relative mt-4 h-56 overflow-hidden rounded-[24px] bg-white">
            <Image src={mainRecommendation.image} alt={mainRecommendation.title} fill className="object-cover" />
          </div>
          <div className="mt-4">
            <div className="text-[22px] font-semibold tracking-tight text-slate-900">{mainRecommendation.title}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {mainRecommendation.items.map((item) => <span key={item} className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 border border-slate-200">{item}</span>)}
            </div>
            <p className="mt-4 text-sm leading-6 ios-muted">{mainRecommendation.reason}</p>
          </div>
        </section>

        <section className="ios-card rounded-[28px] p-5">
          <h2 className="ios-section-title text-[20px] font-semibold text-slate-900">备选搭配</h2>
          <div className="mt-4 space-y-3">
            {backupRecommendations.map((rec) => (
              <div key={rec.title} className="rounded-[22px] bg-white/70 p-4 border border-slate-200">
                <div className="font-semibold text-slate-900">{rec.title}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rec.items.map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 border border-slate-200">{item}</span>)}
                </div>
                <p className="mt-3 text-sm leading-6 ios-muted">{rec.reason}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
