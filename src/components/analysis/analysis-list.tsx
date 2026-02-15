import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { AnalysisCard } from './analysis-card'

interface AnalysisListProps {
  userId: string
}

export async function AnalysisList({ userId }: AnalysisListProps) {
  const supabase = createServerClient()

  const { data: analyses, error } = await supabase
    .from('competitor_analyses')
    .select('id, source_type, source_identifier, source_display_name, status, post_count, error_message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">分析データの取得に失敗しました</p>
      </div>
    )
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-lg font-bold text-white mb-2">まだ分析がありません</p>
        <p className="text-white/60 text-sm mb-6">
          競合のInstagramアカウントや自社ブログを分析して、
          <br className="hidden sm:block" />
          最適な投稿テンプレートを自動生成しましょう
        </p>
        <Link
          href="/analysis/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600
                     hover:bg-blue-700 text-white text-sm font-medium rounded-xl
                     transition-colors min-h-[44px] cursor-pointer"
        >
          最初の分析を始める
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {analyses.map((analysis) => (
        <AnalysisCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  )
}
