'use client'

import Link from 'next/link'
import type { ProfileDB } from '@/types/profile'

interface ProfilesListClientProps {
  profiles: ProfileDB[]
  count: number
  maxCount: number
}

export function ProfilesListClient({ profiles, count, maxCount }: ProfilesListClientProps) {
  return (
    <>
      {/* New button (shown here for count awareness) */}
      {count < maxCount && (
        <div className="flex justify-end -mt-2 mb-4">
          <Link
            href="/settings/profiles/new"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>新規作成</span>
          </Link>
        </div>
      )}

      {/* Profile List */}
      {profiles.length === 0 ? (
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
      <p className="text-sm text-slate-500 text-center mt-6">
        {count} / {maxCount} プロフィール
      </p>
    </>
  )
}
