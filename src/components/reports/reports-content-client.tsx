'use client'

import dynamic from 'next/dynamic'
import type { ReportData } from '@/types/reports'
import { SummaryCards } from './summary-cards'
import { HashtagRanking } from './hashtag-ranking'
import { RemakeSuggestionsReport } from '@/components/remake/remake-suggestions-report'

const PostTypeChart = dynamic(() => import('./post-type-chart'), { ssr: false })
const ProfileChart = dynamic(() => import('./profile-chart'), { ssr: false })
const FrequencyChart = dynamic(() => import('./frequency-chart'), { ssr: false })

interface ReportsContentClientProps {
  data: ReportData
}

export function ReportsContentClient({ data }: ReportsContentClientProps) {
  return (
    <div className="space-y-6">
      <SummaryCards summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostTypeChart data={data.postTypeBreakdown} />
        <ProfileChart data={data.profileBreakdown} />
      </div>

      <FrequencyChart data={data.frequency} />
      <HashtagRanking data={data.hashtagRanking} />
      <RemakeSuggestionsReport />
    </div>
  )
}
