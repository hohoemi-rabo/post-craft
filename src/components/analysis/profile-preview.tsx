'use client'

import { useState } from 'react'
import type { GeneratedProfile } from '@/types/analysis'

interface ProfilePreviewProps {
  profile: GeneratedProfile
}

export function ProfilePreview({ profile }: ProfilePreviewProps) {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
      {/* アイコン + 名前 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{profile.icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
          <p className="text-sm text-white/60">{profile.description}</p>
        </div>
      </div>

      {/* 必須ハッシュタグ */}
      <div className="mb-4">
        <p className="text-sm text-white/60 mb-2">必須ハッシュタグ</p>
        <div className="flex flex-wrap gap-2">
          {profile.required_hashtags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* メモ */}
      {profile.system_prompt_memo && (
        <div className="mb-4">
          <p className="text-sm text-white/60 mb-1">分析サマリー</p>
          <p className="text-sm text-white/80">{profile.system_prompt_memo}</p>
        </div>
      )}

      {/* システムプロンプト（展開/折りたたみ） */}
      <div>
        <button
          onClick={() => setIsPromptExpanded(!isPromptExpanded)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors min-h-[44px]"
        >
          <span>{isPromptExpanded ? '▼' : '▶'}</span>
          <span>システムプロンプト</span>
        </button>
        {isPromptExpanded && (
          <div className="mt-2 p-4 bg-slate-900/50 rounded-lg">
            <p className="text-sm text-white/70 whitespace-pre-wrap">
              {profile.system_prompt}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
