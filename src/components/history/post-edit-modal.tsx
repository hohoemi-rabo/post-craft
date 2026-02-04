'use client'

import { useState } from 'react'
import { POST_TYPES } from '@/lib/post-types'
import type { PostType } from '@/types/post'

interface PostTypeChangeModalProps {
  open: boolean
  onClose: () => void
  currentType: PostType
  onChangeType: (newType: PostType, regenerateCaption: boolean) => void
  isRegenerating?: boolean
}

export function PostTypeChangeModal({
  open,
  onClose,
  currentType,
  onChangeType,
  isRegenerating = false,
}: PostTypeChangeModalProps) {
  const [selectedType, setSelectedType] = useState<PostType>(currentType)

  if (!open) return null

  const handleChangeOnly = () => {
    onChangeType(selectedType, false)
  }

  const handleChangeAndRegenerate = () => {
    onChangeType(selectedType, true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4">投稿タイプを変更</h3>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {(Object.entries(POST_TYPES) as [PostType, (typeof POST_TYPES)[PostType]][]).map(
            ([typeId, config]) => (
              <button
                key={typeId}
                type="button"
                onClick={() => setSelectedType(typeId)}
                disabled={isRegenerating}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedType === typeId
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                } disabled:opacity-50`}
              >
                <div className="text-xl mb-1">{config.icon}</div>
                <div className="text-sm font-medium text-white">{config.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{config.description}</div>
              </button>
            )
          )}
        </div>

        {selectedType !== currentType && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
            <p className="text-xs text-blue-300">
              {POST_TYPES[currentType].icon} {POST_TYPES[currentType].name} →{' '}
              {POST_TYPES[selectedType].icon} {POST_TYPES[selectedType].name}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {selectedType !== currentType && (
            <>
              <button
                onClick={handleChangeAndRegenerate}
                disabled={isRegenerating}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {isRegenerating ? '再生成中...' : '変更してキャプションを再生成'}
              </button>
              <button
                onClick={handleChangeOnly}
                disabled={isRegenerating}
                className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                タイプのみ変更
              </button>
            </>
          )}
          <button
            onClick={onClose}
            disabled={isRegenerating}
            className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
