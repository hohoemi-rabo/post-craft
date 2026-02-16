'use client'

import { useState } from 'react'
import type { GeneratedProfile } from '@/types/analysis'

interface ProfilePreviewProps {
  profile: GeneratedProfile
  isEditMode?: boolean
  onUpdate?: (updated: GeneratedProfile) => void
}

export function ProfilePreview({ profile, isEditMode = false, onUpdate }: ProfilePreviewProps) {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)

  // 編集モード
  if (isEditMode && onUpdate) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-blue-500/30 p-6 space-y-4">
        {/* 名前 + アイコン */}
        <div className="flex gap-3">
          <div>
            <label className="block text-sm text-white/60 mb-1">アイコン</label>
            <input
              type="text"
              value={profile.icon}
              onChange={(e) => onUpdate({ ...profile, icon: e.target.value })}
              className="w-16 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-2xl text-center text-white"
              maxLength={2}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-white/60 mb-1">プロフィール名</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => onUpdate({ ...profile, name: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-sm text-white/60 mb-1">説明</label>
          <input
            type="text"
            value={profile.description}
            onChange={(e) => onUpdate({ ...profile, description: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>

        {/* 必須ハッシュタグ */}
        <div>
          <label className="block text-sm text-white/60 mb-1">必須ハッシュタグ</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {profile.required_hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full"
              >
                #{tag}
                <button
                  onClick={() => {
                    const updated = profile.required_hashtags.filter((_, i) => i !== index)
                    onUpdate({ ...profile, required_hashtags: updated })
                  }}
                  className="ml-1 text-blue-300 hover:text-red-400 transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                  aria-label={`${tag} を削除`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <HashtagInput
            onAdd={(tag) => {
              onUpdate({
                ...profile,
                required_hashtags: [...profile.required_hashtags, tag],
              })
            }}
          />
        </div>

        {/* システムプロンプト */}
        <div>
          <label className="block text-sm text-white/60 mb-1">システムプロンプト</label>
          <textarea
            value={profile.system_prompt}
            onChange={(e) => onUpdate({ ...profile, system_prompt: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[200px] resize-y"
          />
        </div>
      </div>
    )
  }

  // 表示モード（既存）
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

// ハッシュタグ入力（プロフィール編集専用）
function HashtagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [value, setValue] = useState('')

  function handleAdd() {
    const tag = value.trim().replace(/^#/, '')
    if (tag) {
      onAdd(tag)
      setValue('')
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
          }
        }}
        placeholder="タグを追加..."
        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30"
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim()}
        className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-sm rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 min-h-[36px]"
      >
        追加
      </button>
    </div>
  )
}
