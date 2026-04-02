import { getReportData } from '@/lib/reports'
import type { PeriodFilter } from '@/types/reports'
import { ReportsContentClient } from './reports-content-client'

interface ReportsContentProps {
  userId: string
  period: PeriodFilter
}

export async function ReportsContent({ userId, period }: ReportsContentProps) {
  const data = await getReportData(userId, period)
  return <ReportsContentClient data={data} />
}
