import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'
import type {
  PeriodFilter,
  ReportData,
  TypeBreakdown,
  ProfileBreakdown,
  WeeklyFrequency,
  MonthlyFrequency,
  HashtagRank,
} from '@/types/reports'

function getPeriodStartDate(period: PeriodFilter): string | null {
  if (period === 'all') return null
  const now = new Date()
  const days = period === '1m' ? 30 : 90
  now.setDate(now.getDate() - days)
  return now.toISOString()
}

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekLabel(start: Date, end: Date): string {
  return `${start.getMonth() + 1}/${start.getDate()}〜${end.getMonth() + 1}/${end.getDate()}`
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}

export async function GET(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') || 'all') as PeriodFilter

  const supabase = createServerClient()
  const periodStart = getPeriodStartDate(period)

  try {
    // Fetch all posts for the user (within period)
    let query = supabase
      .from('posts')
      .select('id, post_type, post_type_id, profile_id, instagram_published, generated_hashtags, created_at')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })

    if (periodStart) {
      query = query.gte('created_at', periodStart)
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    const allPosts = posts || []

    // This month posts (always current month, ignoring period filter)
    const monthStart = getMonthStart()
    const { count: thisMonthCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId!)
      .gte('created_at', monthStart)

    // Fetch post types and profiles for name resolution
    const [{ data: postTypes }, { data: profiles }] = await Promise.all([
      supabase.from('post_types').select('id, slug, name, icon').eq('user_id', userId!),
      supabase.from('profiles').select('id, name, icon, required_hashtags').eq('user_id', userId!),
    ])

    const typeMap = new Map((postTypes || []).map(pt => [pt.id, pt]))
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    // === Summary ===
    const totalPosts = allPosts.length
    const publishedPosts = allPosts.filter(p => p.instagram_published).length

    // === Post Type Breakdown ===
    const typeCounts = new Map<string | null, number>()
    for (const post of allPosts) {
      const key = post.post_type_id
      typeCounts.set(key, (typeCounts.get(key) || 0) + 1)
    }

    const postTypeBreakdown: TypeBreakdown[] = Array.from(typeCounts.entries()).map(([typeId, count]) => {
      const type = typeId ? typeMap.get(typeId) : null
      return {
        typeId,
        typeName: type?.name || 'その他',
        typeIcon: type?.icon || '📝',
        count,
        percentage: totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0,
      }
    }).sort((a, b) => b.count - a.count)

    // === Profile Breakdown ===
    const profileCounts = new Map<string | null, number>()
    for (const post of allPosts) {
      const key = post.profile_id
      profileCounts.set(key, (profileCounts.get(key) || 0) + 1)
    }

    const profileBreakdown: ProfileBreakdown[] = Array.from(profileCounts.entries()).map(([profId, count]) => {
      const prof = profId ? profileMap.get(profId) : null
      return {
        profileId: profId,
        profileName: prof?.name || '未分類',
        profileIcon: prof?.icon || '📝',
        count,
        percentage: totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0,
      }
    }).sort((a, b) => b.count - a.count)

    // === Frequency ===
    // Weekly
    const weekMap = new Map<string, { start: Date; end: Date; count: number }>()
    for (const post of allPosts) {
      if (!post.created_at) continue
      const date = new Date(post.created_at)
      const weekStart = getWeekStart(date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const key = weekStart.toISOString().split('T')[0]
      const existing = weekMap.get(key)
      if (existing) {
        existing.count++
      } else {
        weekMap.set(key, { start: weekStart, end: weekEnd, count: 1 })
      }
    }

    const weekly: WeeklyFrequency[] = Array.from(weekMap.entries())
      .map(([, v]) => ({
        weekStart: v.start.toISOString().split('T')[0],
        weekEnd: v.end.toISOString().split('T')[0],
        weekLabel: formatWeekLabel(v.start, v.end),
        count: v.count,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))

    // Monthly
    const monthMap = new Map<string, number>()
    for (const post of allPosts) {
      if (!post.created_at) continue
      const date = new Date(post.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    }

    const monthly: MonthlyFrequency[] = Array.from(monthMap.entries())
      .map(([month, count]) => ({
        month,
        monthLabel: formatMonthLabel(month),
        count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // === Hashtag Ranking ===
    const requiredTags = new Set<string>()
    for (const prof of (profiles || [])) {
      for (const tag of (prof.required_hashtags || [])) {
        requiredTags.add(tag.startsWith('#') ? tag : `#${tag}`)
      }
    }

    const hashtagCounts = new Map<string, number>()
    for (const post of allPosts) {
      for (const tag of (post.generated_hashtags || [])) {
        const normalized = tag.startsWith('#') ? tag : `#${tag}`
        hashtagCounts.set(normalized, (hashtagCounts.get(normalized) || 0) + 1)
      }
    }

    const hashtagRanking: HashtagRank[] = Array.from(hashtagCounts.entries())
      .map(([hashtag, count]) => ({
        hashtag,
        count,
        isRequired: requiredTags.has(hashtag),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    // === Response ===
    const reportData: ReportData = {
      summary: {
        totalPosts,
        publishedPosts,
        unpublishedPosts: totalPosts - publishedPosts,
        thisMonthPosts: thisMonthCount || 0,
      },
      postTypeBreakdown,
      profileBreakdown,
      frequency: { weekly, monthly },
      hashtagRanking,
    }

    return NextResponse.json(reportData)
  } catch (err) {
    console.error('Reports API error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
