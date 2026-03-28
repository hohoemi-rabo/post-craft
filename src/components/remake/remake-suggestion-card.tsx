'use client'

import { useRouter } from 'next/navigation'
import type { RemakeSuggestion } from '@/types/remake'

interface RemakeSuggestionCardProps {
  suggestion: RemakeSuggestion
  onDelete: (id: string) => void
  onUse?: (id: string) => void
  showSourcePost?: boolean
  sourcePostCaption?: string
}

export function RemakeSuggestionCard({
  suggestion,
  onDelete,
  onUse,
  showSourcePost,
  sourcePostCaption,
}: RemakeSuggestionCardProps) {
  const router = useRouter()

  const handleRemake = () => {
    onUse?.(suggestion.id)
    const params = new URLSearchParams({
      remakeFrom: suggestion.sourcePostId,
      suggestedType: suggestion.suggestedTypeSlug,
    })
    if (suggestion.suggestedProfileId) {
      params.set('suggestedProfile', suggestion.suggestedProfileId)
    }
    router.push(`/create?${params}`)
  }

  return (
    <div className={`p-4 border rounded-xl space-y-3 ${
      suggestion.isUsed
        ? 'bg-white/[0.02] border-white/5 opacity-60'
        : 'bg-white/5 border-white/10'
    }`}>
      {/* 元投稿（レポートモード用） */}
      {showSourcePost && sourcePostCaption && (
        <div className="text-xs text-slate-500">
          📌 元の投稿: {sourcePostCaption.slice(0, 60)}...
        </div>
      )}

      {/* 提案先タイプ × プロフィール */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg">{suggestion.suggestedTypeIcon}</span>
        <span className="text-sm font-medium text-white">{suggestion.suggestedTypeName}</span>
        {suggestion.suggestedProfileName && (
          <>
            <span className="text-slate-500">×</span>
            <span className="text-sm text-blue-400">{suggestion.suggestedProfileName}</span>
          </>
        )}
        {suggestion.isUsed && (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
            使用済み
          </span>
        )}
      </div>

      {/* 提案理由 */}
      <div className="space-y-1">
        <p className="text-xs text-slate-400 font-medium">提案理由</p>
        <p className="text-sm text-slate-300">{suggestion.reason}</p>
      </div>

      {/* 方向性 */}
      <div className="space-y-1">
        <p className="text-xs text-slate-400 font-medium">リメイクの方向性</p>
        <p className="text-sm text-slate-300">{suggestion.direction}</p>
      </div>

      {/* アクション */}
      <div className="flex gap-2 pt-1">
        {!suggestion.isUsed && (
          <button
            onClick={handleRemake}
            className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs rounded-lg transition-colors"
          >
            この案でリメイク
          </button>
        )}
        <button
          onClick={() => onDelete(suggestion.id)}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs rounded-lg transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  )
}
