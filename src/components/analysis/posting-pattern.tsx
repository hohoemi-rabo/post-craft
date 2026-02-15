import type { InstagramAnalysisResult } from '@/types/analysis'
import { InfoItem } from './analysis-report'

interface PostingPatternProps {
  pattern: InstagramAnalysisResult['posting_pattern']
}

const DAYS_OF_WEEK = ['月', '火', '水', '木', '金', '土', '日']

export function PostingPattern({ pattern }: PostingPatternProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">投稿頻度・タイミング</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <InfoItem label="週間投稿数" value={`平均 ${pattern.avg_posts_per_week}回/週`} />
        <InfoItem label="投稿の規則性" value={pattern.posting_consistency} />
      </div>

      {/* 曜日別 */}
      <div className="mb-5">
        <p className="text-sm font-medium text-white/80 mb-2">投稿が多い曜日:</p>
        <div className="flex gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium ${
                pattern.most_active_days.includes(day)
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-white/5 text-white/30'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* 時間帯 */}
      <div className="mb-5">
        <p className="text-sm font-medium text-white/80 mb-2">投稿が多い時間帯:</p>
        <div className="flex flex-wrap gap-2">
          {pattern.most_active_hours.map((hour, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-yellow-500/15 text-yellow-300 text-sm rounded-full"
            >
              {hour}
            </span>
          ))}
        </div>
      </div>

      {/* 推奨 */}
      {pattern.recommendation && (
        <div className="pt-4 border-t border-white/10">
          <p className="text-sm text-white/80">
            <span className="text-blue-400 font-medium">推奨: </span>
            {pattern.recommendation}
          </p>
        </div>
      )}
    </section>
  )
}
