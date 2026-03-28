import type { ReportSummary } from '@/types/reports'

interface SummaryCardsProps {
  summary: ReportSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: '総投稿数', value: summary.totalPosts, icon: '📝', color: 'text-white' },
    { label: '投稿済み', value: summary.publishedPosts, icon: '✅', color: 'text-green-400' },
    { label: '未投稿', value: summary.unpublishedPosts, icon: '⏳', color: 'text-slate-400' },
    { label: '今月の投稿', value: summary.thisMonthPosts, icon: '📅', color: 'text-blue-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="p-4 bg-white/5 border border-white/10 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{card.icon}</span>
            <span className="text-xs text-slate-400">{card.label}</span>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
