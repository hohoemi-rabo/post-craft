'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { ReportData, PeriodFilter } from '@/types/reports'
import { PeriodFilterComponent } from './period-filter'
import { SummaryCards } from './summary-cards'
import { PostTypeChart } from './post-type-chart'
import { ProfileChart } from './profile-chart'
import { FrequencyChart } from './frequency-chart'
import { HashtagRanking } from './hashtag-ranking'
import { ReportsSkeleton } from './reports-skeleton'

export function ReportsPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const period = (searchParams.get('period') || 'all') as PeriodFilter

  const [data, setData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async (p: PeriodFilter) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports?period=${p}`)
      if (!res.ok) throw new Error('レポートの取得に失敗しました')
      const reportData = await res.json()
      setData(reportData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レポートの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport(period)
  }, [period, fetchReport])

  const handlePeriodChange = (newPeriod: PeriodFilter) => {
    const params = new URLSearchParams()
    if (newPeriod !== 'all') params.set('period', newPeriod)
    router.push(`/reports${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            投稿レポート
          </h1>
          <p className="text-slate-400 text-sm">投稿データの傾向を可視化します</p>
        </div>
        <PeriodFilterComponent value={period} onChange={handlePeriodChange} />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isLoading || !data ? (
        <ReportsSkeleton />
      ) : (
        <div className="space-y-6">
          <SummaryCards summary={data.summary} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PostTypeChart data={data.postTypeBreakdown} />
            <ProfileChart data={data.profileBreakdown} />
          </div>

          <FrequencyChart data={data.frequency} />
          <HashtagRanking data={data.hashtagRanking} />
        </div>
      )}
    </div>
  )
}
