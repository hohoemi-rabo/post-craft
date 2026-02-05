'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'

interface HashtagManagerProps {
  /** AI生成されたハッシュタグ */
  aiHashtags: string[]
  /** 選択変更時のコールバック */
  onSelectionChange?: (selected: Set<string>) => void
  /** 初期選択状態（デフォルトは全選択） */
  initialSelected?: Set<string>
}

export function HashtagManager({
  aiHashtags,
  onSelectionChange,
  initialSelected,
}: HashtagManagerProps) {
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(
    initialSelected ?? new Set(aiHashtags)
  )
  const [customHashtags, setCustomHashtags] = useState<string[]>([])
  const [newHashtagInput, setNewHashtagInput] = useState('')
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [hashtagError, setHashtagError] = useState('')

  // All hashtags (AI generated + custom)
  const allHashtags = useMemo(
    () => [...aiHashtags, ...customHashtags],
    [aiHashtags, customHashtags]
  )

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedHashtags)
  }, [selectedHashtags, onSelectionChange])

  const handleCopyHashtags = useCallback(async () => {
    const selectedArray = Array.from(selectedHashtags)
    const hashtagsText = selectedArray
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join('\n')
    await navigator.clipboard.writeText(hashtagsText)
    setCopiedHashtags(true)
    setTimeout(() => setCopiedHashtags(false), 2000)
  }, [selectedHashtags])

  const toggleHashtag = useCallback((tag: string) => {
    setSelectedHashtags((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(tag)) {
        newSelected.delete(tag)
      } else {
        newSelected.add(tag)
      }
      return newSelected
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedHashtags(new Set(allHashtags))
  }, [allHashtags])

  const handleDeselectAll = useCallback(() => {
    setSelectedHashtags(new Set())
  }, [])

  const handleAddHashtag = useCallback(() => {
    const input = newHashtagInput.trim().replace(/^#+/, '')
    if (!input) return

    if (allHashtags.includes(input) || allHashtags.includes(`#${input}`)) {
      setHashtagError('このハッシュタグは既に追加されています')
      setTimeout(() => setHashtagError(''), 2000)
      return
    }

    const newTag = input.startsWith('#') ? input : `#${input}`
    setCustomHashtags((prev) => [...prev, newTag])
    setSelectedHashtags((prev) => new Set([...prev, newTag]))
    setNewHashtagInput('')
  }, [newHashtagInput, allHashtags])

  const handleRemoveCustomHashtag = useCallback((tag: string) => {
    setCustomHashtags((prev) => prev.filter((t) => t !== tag))
    setSelectedHashtags((prev) => {
      const newSelected = new Set(prev)
      newSelected.delete(tag)
      return newSelected
    })
  }, [])

  const handleHashtagInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddHashtag()
      }
    },
    [handleAddHashtag]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">
          ハッシュタグ
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            全選択
          </button>
          <span className="text-slate-500">|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            全解除
          </button>
          <button
            type="button"
            onClick={handleCopyHashtags}
            className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors ml-2"
          >
            {copiedHashtags ? '✅ コピーしました' : '📋 コピー'}
          </button>
        </div>
      </div>

      {/* Add hashtag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newHashtagInput}
          onChange={(e) => setNewHashtagInput(e.target.value)}
          onKeyDown={handleHashtagInputKeyDown}
          placeholder="ハッシュタグを追加（例: ブログ更新）"
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleAddHashtag}
          disabled={!newHashtagInput.trim()}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg border border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          追加
        </button>
      </div>
      {hashtagError && <p className="text-xs text-red-400">{hashtagError}</p>}

      {/* AI generated hashtags */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500">AI生成</p>
        <div className="flex flex-wrap gap-2">
          {aiHashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleHashtag(tag)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedHashtags.has(tag)
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* Custom hashtags */}
      {customHashtags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">追加したハッシュタグ</p>
          <div className="flex flex-wrap gap-2">
            {customHashtags.map((tag) => (
              <div
                key={tag}
                className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedHashtags.has(tag)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleHashtag(tag)}
                  className="hover:opacity-80"
                >
                  {tag}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomHashtag(tag)}
                  className="ml-1 hover:text-red-400 transition-colors"
                  aria-label="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        {selectedHashtags.size} / {allHashtags.length} 個選択中
      </p>
    </div>
  )
}

/**
 * 選択されたハッシュタグをフォーマットして返すヘルパー関数
 */
export function formatHashtags(selected: Set<string>): string {
  return Array.from(selected)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join('\n')
}
