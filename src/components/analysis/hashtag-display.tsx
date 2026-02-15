import type { InstagramAnalysisResult } from '@/types/analysis'

interface HashtagDisplayProps {
  strategy: InstagramAnalysisResult['hashtag_strategy']
}

function getCategoryLabel(type: string): string {
  const labels: Record<string, string> = {
    brand: 'ブランド',
    region: '地域',
    genre: 'ジャンル',
    trend: 'トレンド',
    niche: 'ニッチ',
    community: 'コミュニティ',
  }
  return labels[type] || type
}

export function HashtagDisplay({ strategy }: HashtagDisplayProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">ハッシュタグ戦略</h2>

      <p className="text-sm text-white/60 mb-4">
        平均使用数: <span className="text-white font-medium">{strategy.avg_count}個/投稿</span>
      </p>

      {/* カテゴリ別タグ */}
      <div className="space-y-4">
        {strategy.categories.map((cat, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-white/80 mb-2">
              {getCategoryLabel(cat.type)}
              <span className="text-white/50 font-normal ml-1">（使用頻度: {cat.frequency}%）</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.tags.map((tag, j) => (
                <span
                  key={j}
                  className={`px-2.5 py-1 text-xs rounded-full ${
                    strategy.top_performing_tags.includes(tag)
                      ? 'bg-green-500/20 text-green-300 font-medium'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 推奨タグ */}
      {strategy.recommended_tags.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-blue-400 mb-2">推奨ハッシュタグ:</p>
          <div className="flex flex-wrap gap-2">
            {strategy.recommended_tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-blue-500/15 text-blue-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
