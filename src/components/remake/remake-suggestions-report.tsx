'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRemakeSuggestions } from '@/hooks/useRemakeSuggestions'
import { RemakeSuggestionCard } from './remake-suggestion-card'

export function RemakeSuggestionsReport() {
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
  } = useRemakeSuggestions({ context: 'report' })

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">🔄 リメイクおすすめ</h3>
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

      <p className="text-xs text-slate-500">
        過去の投稿からリメイクすると効果的な投稿をAIが提案します。
      </p>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {isLoading && !hasFetched ? (
        <div className="flex justify-center py-6">
          <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">
          「AIで提案を生成」ボタンでリメイク候補を提案できます
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="space-y-2">
              <RemakeSuggestionCard
                suggestion={suggestion}
                onDelete={deleteSuggestion}
                onUse={markAsUsed}
                showSourcePost
              />
              <div className="pl-4">
                <Link
                  href={`/history/${suggestion.sourcePostId}`}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  元投稿を見る →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
