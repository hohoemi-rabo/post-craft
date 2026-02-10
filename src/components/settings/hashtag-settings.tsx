'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useToast } from '@/components/ui/toast'

const MAX_REQUIRED = 4
const TOTAL = 10

export function HashtagSettings() {
  const { requiredHashtags, isLoading, error, updateHashtags } = useUserSettings()
  const { showToast } = useToast()

  const [localTags, setLocalTags] = useState<string[]>([])
  const [savedTags, setSavedTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  // Sync from hook on initial load
  useEffect(() => {
    if (!isLoading && requiredHashtags) {
      setLocalTags(requiredHashtags)
      setSavedTags(requiredHashtags)
    }
  }, [isLoading, requiredHashtags])

  const hasChanges = useMemo(
    () => JSON.stringify(localTags) !== JSON.stringify(savedTags),
    [localTags, savedTags]
  )

  const generatedCount = TOTAL - localTags.length

  const handleAdd = () => {
    setInputError(null)
    const raw = inputValue.trim()
    if (!raw) return

    const tag = raw.startsWith('#') ? raw : `#${raw}`

    if (localTags.includes(tag)) {
      setInputError('このハッシュタグは既に追加されています')
      return
    }
    if (localTags.length >= MAX_REQUIRED) {
      setInputError(`最大${MAX_REQUIRED}個までです`)
      return
    }

    setLocalTags([...localTags, tag])
    setInputValue('')
  }

  const handleRemove = (index: number) => {
    setLocalTags(localTags.filter((_, i) => i !== index))
    setInputError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleSave = async () => {
    if (!hasChanges) return
    setIsSaving(true)
    try {
      await updateHashtags(localTags)
      setSavedTags(localTags)
      showToast('ハッシュタグ設定を保存しました', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      showToast(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="h-6 w-48 bg-slate-700 rounded animate-pulse" />
          <div className="h-10 w-full bg-slate-700 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-32 bg-slate-700 rounded-full animate-pulse" />
            <div className="h-8 w-28 bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Required Hashtags */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">必須ハッシュタグ</h2>
          <p className="text-sm text-slate-400">
            投稿ごとに必ず含まれるハッシュタグを設定します（最大{MAX_REQUIRED}個）
          </p>
        </div>

        {/* Current tags */}
        {localTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {localTags.map((tag, index) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="hover:text-red-400 transition-colors"
                  aria-label={`${tag} を削除`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-2">
            必須ハッシュタグが設定されていません
          </p>
        )}

        {/* Add form */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">#</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setInputError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="ハッシュタグを入力"
              disabled={localTags.length >= MAX_REQUIRED}
              className="w-full pl-7 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={localTags.length >= MAX_REQUIRED || !inputValue.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:bg-slate-700 disabled:text-slate-400 whitespace-nowrap"
          >
            追加
          </button>
        </div>
        {inputError && (
          <p className="text-xs text-red-400">{inputError}</p>
        )}
        <p className="text-xs text-slate-500">
          残り{MAX_REQUIRED - localTags.length}個追加可能
        </p>
      </div>

      {/* Section 2: Generation Info */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">生成情報</h2>
        <p className="text-sm text-slate-300">
          合計: {TOTAL}個（必須{localTags.length}個 + 自動生成{generatedCount}個）
        </p>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left px-4 py-2 text-slate-400 font-medium">必須タグ数</th>
                <th className="text-left px-4 py-2 text-slate-400 font-medium">自動生成数</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAX_REQUIRED + 1 }, (_, i) => {
                const isCurrent = i === localTags.length
                return (
                  <tr
                    key={i}
                    className={isCurrent ? 'bg-blue-600/15' : 'bg-transparent hover:bg-white/5'}
                  >
                    <td className={`px-4 py-2 border-t border-white/5 ${isCurrent ? 'text-blue-400 font-medium' : 'text-slate-300'}`}>
                      {i}個{isCurrent && ' (現在)'}
                    </td>
                    <td className={`px-4 py-2 border-t border-white/5 ${isCurrent ? 'text-blue-400 font-medium' : 'text-slate-300'}`}>
                      {TOTAL - i}個
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
