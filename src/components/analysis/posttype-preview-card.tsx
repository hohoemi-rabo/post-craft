'use client'

import { useState } from 'react'
import type { GeneratedPostType } from '@/types/analysis'

interface PostTypePreviewCardProps {
  postType: GeneratedPostType
}

export function PostTypePreviewCard({ postType }: PostTypePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
      {/* ヘッダー（クリックで展開） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left min-h-[44px]"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{postType.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{postType.name}</h3>
            <p className="text-sm text-white/60">{postType.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
            {postType.input_mode === 'fields' ? 'フィールド入力' : 'メモ入力'}
          </span>
          <span className="text-white/40">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {/* 展開時の詳細 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {/* テンプレート構造 */}
          <div className="mt-4">
            <p className="text-sm text-white/60 mb-2">テンプレート構造</p>
            <pre className="p-3 bg-slate-900/50 rounded-lg text-sm text-white/70 whitespace-pre-wrap overflow-x-auto">
              {postType.template_structure}
            </pre>
          </div>

          {/* プレースホルダー一覧 */}
          <div>
            <p className="text-sm text-white/60 mb-2">
              入力フィールド（{postType.placeholders.length}個）
            </p>
            <div className="space-y-2">
              {postType.placeholders.map((ph) => (
                <div
                  key={ph.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-white/40 font-mono text-xs">{`{${ph.key}}`}</span>
                  <span className="text-white">{ph.label}</span>
                  {ph.required && (
                    <span className="text-red-400 text-xs">必須</span>
                  )}
                  <span className="text-white/30 text-xs ml-auto">{ph.placeholder}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 文字数設定 */}
          <div className="text-sm text-white/60">
            文字数: {postType.min_length}〜{postType.max_length}文字
          </div>

          {/* type_prompt */}
          <details className="text-sm">
            <summary className="text-white/50 cursor-pointer hover:text-white/70 min-h-[44px] flex items-center">
              AIプロンプト（type_prompt）
            </summary>
            <p className="mt-2 p-3 bg-slate-900/50 rounded-lg text-white/70 whitespace-pre-wrap">
              {postType.type_prompt}
            </p>
          </details>
        </div>
      )}
    </div>
  )
}
