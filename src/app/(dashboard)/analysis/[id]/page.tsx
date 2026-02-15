import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { AnalysisReport } from '@/components/analysis/analysis-report'
import type { InstagramAnalysisResult, BlogAnalysisResult } from '@/types/analysis'

export const metadata: Metadata = {
  title: '分析レポート | Post Craft',
}

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const supabase = createServerClient()

  const { data: analysis, error } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !analysis) {
    redirect('/analysis/new')
  }

  if (analysis.status !== 'completed' || !analysis.analysis_result) {
    redirect('/analysis/new')
  }

  const sourceLabel = analysis.source_type === 'instagram' ? 'Instagram' : 'Blog'

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            分析レポート
          </h1>
          <p className="text-white/60 text-sm">
            {analysis.source_display_name}
            {analysis.post_count && ` / ${analysis.post_count}件`}
            {' / '}
            {analysis.created_at && new Date(analysis.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full self-start ${
            analysis.source_type === 'instagram'
              ? 'bg-purple-500/20 text-purple-300'
              : 'bg-emerald-500/20 text-emerald-300'
          }`}
        >
          {analysis.source_type === 'instagram' ? '📸' : '📝'} {sourceLabel}
        </span>
      </div>

      {/* 分析レポート本体 */}
      <AnalysisReport
        sourceType={analysis.source_type}
        result={analysis.analysis_result as unknown as InstagramAnalysisResult | BlogAnalysisResult}
      />

      {/* CTA */}
      <div className="flex justify-center pt-4">
        <Link
          href={`/analysis/${id}/generate`}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium
                     rounded-xl transition-colors min-h-[44px] flex items-center gap-2 cursor-pointer"
        >
          この分析からテンプレートを生成
        </Link>
      </div>
    </div>
  )
}
