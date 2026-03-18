import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '明天穿什么',
  description: '基于天气、场景与衣橱的每日穿搭推荐 H5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="ios-shell">{children}</body>
    </html>
  )
}
