'use client'

import type { PostType } from '@/types/post'
import { POST_TYPES } from '@/lib/post-types'

interface PostTypeSelectorProps {
  selected: PostType | null
  onSelect: (type: PostType) => void
}

export function PostTypeSelector({ selected, onSelect }: PostTypeSelectorProps) {
  const types = Object.values(POST_TYPES)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">投稿タイプを選択</h2>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {types.map((type) => {
          const isSelected = selected === type.id
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`p-4 md:p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="text-3xl md:text-4xl mb-2">{type.icon}</div>
              <h3 className="font-bold text-white mb-1">{type.name}</h3>
              <p className="text-xs md:text-sm text-slate-400 mb-2">{type.description}</p>
              <span className="inline-block px-2 py-0.5 bg-white/10 rounded-full text-xs text-slate-300">
                {type.target}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
