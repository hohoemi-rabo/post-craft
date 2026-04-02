import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import type { PeriodFilter } from '@/types/reports'
import { PeriodFilterComponent } from '@/components/reports/period-filter'
import { ReportsContent } from '@/components/reports/reports-content'
import { ReportsSkeleton } from '@/components/reports/reports-skeleton'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const period = (params.period || 'all') as PeriodFilter

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            投稿レポート
          </h1>
          <p className="text-slate-400 text-sm">投稿データの傾向を可視化します</p>
        </div>
        <PeriodFilterComponent value={period} />
      </div>

      <Suspense key={period} fallback={<ReportsSkeleton />}>
        <ReportsContent userId={session.user.id} period={period} />
      </Suspense>
    </div>
  )
}
