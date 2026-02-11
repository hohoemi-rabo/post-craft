'use client'

import Link from 'next/link'
import { useProfiles } from '@/hooks/useProfiles'

export default function ProfilesPage() {
  const { profiles, count, maxCount, isLoading } = useProfiles()

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
          <span>/</span>
          <span className="text-white">👥 プロフィール管理</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">プロフィール管理</h1>
            <p className="text-slate-400">ターゲット別のプロフィールを管理します</p>
          </div>
          {count < maxCount && (
            <Link
              href="/settings/profiles/new"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>新規作成</span>
            </Link>
          )}
        </div>
      </div>

      {/* Profile List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          プロフィールがありません。新規作成してください。
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/settings/profiles/${profile.id}`}
              className="block p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{profile.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {profile.name}
                      </h2>
                      {profile.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                          デフォルト
                        </span>
                      )}
                    </div>
                    {profile.description && (
                      <p className="text-sm text-slate-400 mt-1">{profile.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      投稿タイプ: {profile.postTypeCount ?? 0}件
                    </p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-white transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Count info */}
      <p className="text-sm text-slate-500 text-center">
        {count} / {maxCount} プロフィール
      </p>
    </div>
  )
}
