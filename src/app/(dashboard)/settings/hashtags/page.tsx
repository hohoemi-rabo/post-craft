'use client'

import Link from 'next/link'
import { HashtagSettings } from '@/components/settings/hashtag-settings'

export default function HashtagSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
          <span>/</span>
          <span className="text-white">#️⃣ ハッシュタグ設定</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">ハッシュタグ設定</h1>
        <p className="text-slate-400">投稿に自動付与される必須ハッシュタグを管理</p>
      </div>

      <HashtagSettings />
    </div>
  )
}
