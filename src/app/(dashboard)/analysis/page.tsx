import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AnalysisList } from '@/components/analysis/analysis-list'
import { AnalysisSkeleton } from '@/components/analysis/analysis-skeleton'

export const metadata: Metadata = {
  title: '分析 | Post Craft',
}

export default async function AnalysisPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="space-y-6">
      {/* ヘッダー: Suspense 外、即表示 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">分析</h1>
          <p className="text-white/60 text-sm">
            競合Instagram・自社ブログの分析結果を管理できます
          </p>
        </div>
        <Link
          href="/analysis/new"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                     rounded-xl transition-colors min-h-[44px] flex items-center gap-2
                     w-fit cursor-pointer"
        >
          新規分析
        </Link>
      </div>

      {/* 分析一覧: Suspense 内 */}
      <Suspense fallback={<AnalysisSkeleton />}>
        <AnalysisList userId={session.user.id} />
      </Suspense>
    </div>
  )
}
