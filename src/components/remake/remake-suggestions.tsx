'use client'

import { useEffect } from 'react'
import { useRemakeSuggestions } from '@/hooks/useRemakeSuggestions'
import { RemakeSuggestionCard } from './remake-suggestion-card'

interface RemakeSuggestionsProps {
  sourcePostId: string
}

export function RemakeSuggestions({ sourcePostId }: RemakeSuggestionsProps) {
  const {
    suggestions,
    isLoading,
    isGenerating,
    error,
    hasFetched,
    fetchSuggestions,
    generateSuggestions,
    deleteSuggestion,
    markAsUsed,
  } = useRemakeSuggestions({ sourcePostId, context: 'detail' })

  // 初回マウント時に既存提案を取得
  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">🔄 リメイク提案</h3>
        <button
          onClick={generateSuggestions}
          disabled={isGenerating}
          className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs rounded-lg transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="flex items-center gap-1.5">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
              生成中...
            </span>
          ) : (
            'AIで提案を生成'
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {isLoading && !hasFetched ? (
        <div className="flex justify-center py-4">
          <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">
          「AIで提案を生成」ボタンで、この投稿のリメイク提案を生成できます
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map(suggestion => (
            <RemakeSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDelete={deleteSuggestion}
              onUse={markAsUsed}
            />
          ))}
        </div>
      )}
    </div>
  )
}
