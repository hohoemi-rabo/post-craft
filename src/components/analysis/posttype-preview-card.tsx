'use client'

import { useState } from 'react'
import type { GeneratedPostType } from '@/types/analysis'

interface PostTypePreviewCardProps {
  postType: GeneratedPostType
  isEditMode?: boolean
  onUpdate?: (updated: GeneratedPostType) => void
  onDelete?: () => void
}

export function PostTypePreviewCard({
  postType,
  isEditMode = false,
  onUpdate,
  onDelete,
}: PostTypePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(isEditMode)

  return (
    <div className={`bg-slate-800/50 rounded-xl border ${isEditMode ? 'border-blue-500/30' : 'border-white/10'} overflow-hidden`}>
      {/* ヘッダー（クリックで展開） */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded) } }}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left min-h-[44px] cursor-pointer"
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
          {isEditMode && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="px-2 py-0.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs rounded transition-colors min-h-[28px]"
            >
              削除
            </button>
          )}
          <span className="text-white/40">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* 展開時の詳細（編集モード） */}
      {isExpanded && isEditMode && onUpdate && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {/* 名前・アイコン */}
          <div className="mt-4 flex gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1">アイコン</label>
              <input
                type="text"
                value={postType.icon}
                onChange={(e) => onUpdate({ ...postType, icon: e.target.value })}
                className="w-16 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xl text-center text-white"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1">名前</label>
              <input
                type="text"
                value={postType.name}
                onChange={(e) => onUpdate({ ...postType, name: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm text-white/60 mb-1">説明</label>
            <input
              type="text"
              value={postType.description}
              onChange={(e) => onUpdate({ ...postType, description: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          {/* テンプレート構造 */}
          <div>
            <label className="block text-sm text-white/60 mb-1">テンプレート構造</label>
            <textarea
              value={postType.template_structure}
              onChange={(e) => onUpdate({ ...postType, template_structure: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono min-h-[200px] resize-y"
            />
          </div>

          {/* プレースホルダー */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              プレースホルダー（{postType.placeholders.length}個）
            </label>
            <div className="space-y-2">
              {postType.placeholders.map((ph, phIndex) => (
                <div key={phIndex} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ph.key}
                    onChange={(e) => {
                      const updated = [...postType.placeholders]
                      updated[phIndex] = { ...ph, key: e.target.value }
                      onUpdate({ ...postType, placeholders: updated })
                    }}
                    className="w-24 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-white/80"
                    placeholder="key"
                  />
                  <input
                    type="text"
                    value={ph.label}
                    onChange={(e) => {
                      const updated = [...postType.placeholders]
                      updated[phIndex] = { ...ph, label: e.target.value }
                      onUpdate({ ...postType, placeholders: updated })
                    }}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white"
                    placeholder="ラベル"
                  />
                  <input
                    type="text"
                    value={ph.placeholder}
                    onChange={(e) => {
                      const updated = [...postType.placeholders]
                      updated[phIndex] = { ...ph, placeholder: e.target.value }
                      onUpdate({ ...postType, placeholders: updated })
                    }}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/60 hidden sm:block"
                    placeholder="プレースホルダー"
                  />
                  <button
                    onClick={() => {
                      const updated = postType.placeholders.filter((_, i) => i !== phIndex)
                      onUpdate({ ...postType, placeholders: updated })
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                    aria-label="プレースホルダーを削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const updated = [
                  ...postType.placeholders,
                  { key: '', label: '', placeholder: '', required: false },
                ]
                onUpdate({ ...postType, placeholders: updated })
              }}
              className="mt-2 text-sm text-blue-300 hover:text-blue-200 transition-colors min-h-[36px]"
            >
              + プレースホルダーを追加
            </button>
          </div>

          {/* 文字数設定 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1">最小文字数</label>
              <input
                type="number"
                value={postType.min_length}
                onChange={(e) => onUpdate({ ...postType, min_length: parseInt(e.target.value) || 200 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                min={100}
                max={500}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">最大文字数</label>
              <input
                type="number"
                value={postType.max_length}
                onChange={(e) => onUpdate({ ...postType, max_length: parseInt(e.target.value) || 400 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                min={200}
                max={1000}
              />
            </div>
          </div>

          {/* type_prompt */}
          <div>
            <label className="block text-sm text-white/60 mb-1">AIプロンプト（type_prompt）</label>
            <textarea
              value={postType.type_prompt}
              onChange={(e) => onUpdate({ ...postType, type_prompt: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[100px] resize-y"
            />
          </div>
        </div>
      )}

      {/* 展開時の詳細（表示モード） */}
      {isExpanded && !isEditMode && (
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
