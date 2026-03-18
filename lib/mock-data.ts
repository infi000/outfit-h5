export const wardrobe = [
  { id: 1, name: '白色基础 T 恤', category: '上衣', season: '春夏', style: '基础' },
  { id: 2, name: '浅蓝牛仔衬衫', category: '上衣', season: '春秋', style: '休闲' },
  { id: 3, name: '米色针织开衫', category: '外套', season: '春秋', style: '通勤' },
  { id: 4, name: '深灰西装外套', category: '外套', season: '春秋', style: '通勤' },
  { id: 5, name: '黑色九分西裤', category: '裤子', season: '四季', style: '通勤' },
  { id: 6, name: '蓝色直筒牛仔裤', category: '裤子', season: '四季', style: '休闲' },
  { id: 7, name: '小白鞋', category: '鞋子', season: '四季', style: '百搭' },
  { id: 8, name: '乐福鞋', category: '鞋子', season: '春秋', style: '通勤' },
]

export const recommendations = [
  {
    scene: '通勤',
    title: '轻通勤稳妥搭配',
    image: '/looks/commute.svg',
    items: ['白色基础 T 恤', '米色针织开衫', '黑色九分西裤', '乐福鞋'],
    reason: '气温温和但早晚偏凉，这套兼顾通勤感和保暖度，雨天也不显累赘。',
  },
  {
    scene: '休闲',
    title: '周末轻松出门搭配',
    image: '/looks/casual.svg',
    items: ['浅蓝牛仔衬衫', '蓝色直筒牛仔裤', '小白鞋'],
    reason: '适合温度舒适的白天，颜色清爽，出门拍照也比较自然。',
  },
  {
    scene: '约会',
    title: '干净利落的好感搭配',
    image: '/looks/date.svg',
    items: ['白色基础 T 恤', '深灰西装外套', '蓝色直筒牛仔裤', '乐福鞋'],
    reason: '既不会太正式，也保留一点精致感，适合晚饭和散步场景。',
  },
  {
    scene: '运动',
    title: '轻运动舒展搭配',
    image: '/looks/casual.svg',
    items: ['白色基础 T 恤', '蓝色直筒牛仔裤', '小白鞋'],
    reason: '先用舒适轻便的组合承载运动场景，后面可继续补录专门运动单品。',
  },
]
