'use client'

import { POST_TYPES } from '@/lib/post-types'
import type { PostType } from '@/types/post'

interface StepPostTypeProps {
  onSelect: (type: PostType) => void
}

export function StepPostType({ onSelect }: StepPostTypeProps) {
  const types = Object.values(POST_TYPES)

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className="p-6 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div className="text-3xl mb-3">{type.icon}</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
              {type.name}
            </h3>
            <p className="text-sm text-slate-400">{type.description}</p>
            <p className="text-xs text-slate-500 mt-2">
              ターゲット: {type.target}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
