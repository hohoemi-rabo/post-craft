'use client'

import type { Placeholder } from '@/types/post-type'

interface GeneratedData {
  typePrompt: string
  templateStructure: string
  placeholders: Placeholder[]
  samplePost: string
}

interface PostTypePreviewModalProps {
  isOpen: boolean
  data: GeneratedData
  inputMode: 'fields' | 'memo'
  isSaving: boolean
  onClose: () => void
  onSave: () => void
}

export function PostTypePreviewModal({
  isOpen,
  data,
  inputMode,
  isSaving,
  onClose,
  onSave,
}: PostTypePreviewModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">AI生成結果プレビュー</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Type Prompt */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">タイプ別プロンプト</h3>
            <div className="p-4 bg-slate-800 rounded-xl text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {data.typePrompt}
            </div>
          </div>

          {/* Template Structure */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">テンプレート構造</h3>
            <div className="p-4 bg-slate-800 rounded-xl text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {data.templateStructure}
            </div>
          </div>

          {/* Placeholders (fields mode only) */}
          {inputMode === 'fields' && data.placeholders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">入力項目</h3>
              <div className="space-y-2">
                {data.placeholders.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-800 rounded-xl text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-mono">{`{${p.name}}`}</span>
                      <span className="text-white">{p.label}</span>
                      {p.required && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                          必須
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {p.inputType === 'textarea' ? 'テキストエリア' : 'テキスト'}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-slate-400 text-xs mt-1">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Post */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">サンプル投稿</h3>
            <div className="p-4 bg-slate-800 rounded-xl text-sm text-slate-300 whitespace-pre-wrap">
              {data.samplePost}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              メモ書きを修正して再生成
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {isSaving ? '保存中...' : 'この内容で保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
