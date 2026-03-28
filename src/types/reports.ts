export type PeriodFilter = '1m' | '3m' | 'all'

export interface ReportSummary {
  totalPosts: number
  publishedPosts: number
  unpublishedPosts: number
  thisMonthPosts: number
}

export interface TypeBreakdown {
  typeId: string | null
  typeName: string
  typeIcon: string
  count: number
  percentage: number
}

export interface ProfileBreakdown {
  profileId: string | null
  profileName: string
  profileIcon: string
  count: number
  percentage: number
}

export interface WeeklyFrequency {
  weekStart: string
  weekEnd: string
  weekLabel: string
  count: number
}

export interface MonthlyFrequency {
  month: string
  monthLabel: string
  count: number
}

export interface FrequencyData {
  weekly: WeeklyFrequency[]
  monthly: MonthlyFrequency[]
}

export interface HashtagRank {
  hashtag: string
  count: number
  isRequired: boolean
}

export interface ReportData {
  summary: ReportSummary
  postTypeBreakdown: TypeBreakdown[]
  profileBreakdown: ProfileBreakdown[]
  frequency: FrequencyData
  hashtagRanking: HashtagRank[]
}
