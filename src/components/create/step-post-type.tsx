'use client'

import Link from 'next/link'
import { usePostTypes } from '@/hooks/usePostTypes'
import type { Placeholder } from '@/types/post-type'

interface StepPostTypeProps {
  profileId?: string | null
  onSelect: (postTypeId: string, slug: string, name: string, inputMode: 'fields' | 'memo', placeholders: Placeholder[]) => void
}

export function StepPostType({ profileId, onSelect }: StepPostTypeProps) {
  const { activePostTypes, isLoading, error } = usePostTypes(profileId)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          どんな投稿を作りますか？
        </h2>
        <p className="text-slate-400 text-sm">
          投稿の目的に合わせてタイプを選択してください
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl animate-pulse"
            >
              <div className="w-10 h-10 bg-white/10 rounded mb-3" />
              <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-4 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activePostTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelect(type.id, type.slug, type.name, type.inputMode, type.placeholders)}
              className="p-6 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <div className="text-3xl mb-3">{type.icon}</div>
              <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {type.name}
              </h3>
              <p className="text-sm text-slate-400">{type.description}</p>
            </button>
          ))}
        </div>
      )}

      <div className="text-center">
        <Link
          href="/settings/post-types"
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          投稿タイプは設定画面でカスタマイズできます →
        </Link>
      </div>
    </div>
  )
}
