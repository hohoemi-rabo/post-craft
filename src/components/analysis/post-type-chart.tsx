import type { InstagramAnalysisResult } from '@/types/analysis'

interface PostTypeChartProps {
  distribution: InstagramAnalysisResult['post_type_distribution']
}

const BAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']

export function PostTypeChart({ distribution }: PostTypeChartProps) {
  const sorted = [...distribution.types].sort((a, b) => b.percentage - a.percentage)

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">投稿タイプの傾向</h2>

      <div className="space-y-4">
        {sorted.map((type, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-white font-medium">{type.category}</span>
              <span className="text-white/60">{type.percentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${Math.max(type.percentage, 2)}%`,
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                }}
              />
            </div>
            <p className="text-xs text-white/50">
              平均エンゲージメント: {type.avg_engagement.toFixed(1)}%
              {type.example_caption && ` | 例: ${type.example_caption.slice(0, 50)}...`}
            </p>
          </div>
        ))}
      </div>

      {distribution.recommendation && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-sm text-white/80">
            <span className="text-blue-400 font-medium">推奨: </span>
            {distribution.recommendation}
          </p>
        </div>
      )}
    </section>
  )
}
