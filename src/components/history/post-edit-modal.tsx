'use client'

import { useState } from 'react'
import { usePostTypes } from '@/hooks/usePostTypes'

interface SelectedType {
  slug: string
  id: string
  icon: string
  name: string
}

interface PostTypeChangeModalProps {
  open: boolean
  onClose: () => void
  currentTypeSlug: string
  currentTypeIcon?: string
  currentTypeName?: string
  onChangeType: (slug: string, postTypeId: string, icon: string, name: string, regenerateCaption: boolean) => void
  isRegenerating?: boolean
}

export function PostTypeChangeModal({
  open,
  onClose,
  currentTypeSlug,
  currentTypeIcon = '📝',
  currentTypeName = '不明なタイプ',
  onChangeType,
  isRegenerating = false,
}: PostTypeChangeModalProps) {
  const { activePostTypes, isLoading } = usePostTypes()
  const [selectedType, setSelectedType] = useState<SelectedType>({
    slug: currentTypeSlug,
    id: '',
    icon: currentTypeIcon,
    name: currentTypeName,
  })

  if (!open) return null

  const isChanged = selectedType.slug !== currentTypeSlug

  const handleChangeOnly = () => {
    onChangeType(selectedType.slug, selectedType.id, selectedType.icon, selectedType.name, false)
  }

  const handleChangeAndRegenerate = () => {
    onChangeType(selectedType.slug, selectedType.id, selectedType.icon, selectedType.name, true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4">投稿タイプを変更</h3>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-white/10 bg-white/5 animate-pulse"
              >
                <div className="w-8 h-8 bg-white/10 rounded mb-2" />
                <div className="h-4 bg-white/10 rounded w-2/3 mb-1" />
                <div className="h-3 bg-white/10 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {activePostTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  setSelectedType({
                    slug: type.slug,
                    id: type.id,
                    icon: type.icon,
                    name: type.name,
                  })
                }
                disabled={isRegenerating}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedType.slug === type.slug
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                } disabled:opacity-50`}
              >
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-sm font-medium text-white">{type.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{type.description}</div>
              </button>
            ))}
          </div>
        )}

        {isChanged && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
            <p className="text-xs text-blue-300">
              {currentTypeIcon} {currentTypeName} →{' '}
              {selectedType.icon} {selectedType.name}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isChanged && (
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
