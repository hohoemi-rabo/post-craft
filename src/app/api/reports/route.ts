import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { getReportData } from '@/lib/reports'
import type { PeriodFilter } from '@/types/reports'

export async function GET(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') || 'all') as PeriodFilter

  try {
    const reportData = await getReportData(userId!, period)
    return NextResponse.json(reportData)
  } catch (err) {
    console.error('Reports API error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
