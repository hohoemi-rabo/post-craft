'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePostTypes } from '@/hooks/usePostTypes'
import { useProfiles } from '@/hooks/useProfiles'
import { PostTypeList, PostTypeListSkeleton } from '@/components/settings/post-type-list'

export default function PostTypesPage() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const { profiles } = useProfiles()

  const {
    postTypes,
    count,
    maxCount,
    isLoading,
    error,
    toggleActive,
    duplicatePostType,
    deletePostType,
    reorderPostTypes,
  } = usePostTypes(selectedProfileId)

  const newTypeHref = selectedProfileId
    ? `/settings/post-types/new?profileId=${selectedProfileId}`
    : '/settings/post-types/new'

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
          <span>/</span>
          <span className="text-white">📝 投稿タイプ管理</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">投稿タイプ管理</h1>
            <p className="text-slate-400">投稿テンプレートの追加・編集・並び替え</p>
          </div>
          <Link
            href={newTypeHref}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
              count >= maxCount
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed pointer-events-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            aria-disabled={count >= maxCount}
          >
            + 新規作成
          </Link>
        </div>
      </div>

      {/* Profile Tab Filter */}
      {profiles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedProfileId(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedProfileId === null
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            すべて
          </button>
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfileId(profile.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedProfileId === profile.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {profile.icon} {profile.name}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <PostTypeListSkeleton />
      ) : (
        <PostTypeList
          postTypes={postTypes}
          onToggleActive={toggleActive}
          onDuplicate={duplicatePostType}
          onDelete={deletePostType}
          onReorder={reorderPostTypes}
        />
      )}

      {/* Footer - Usage counter */}
      {!isLoading && postTypes.length > 0 && (
        <div className="text-center text-sm text-slate-500 pt-2">
          📊 {count} / {maxCount} タイプ使用中
        </div>
      )}
    </div>
  )
}
