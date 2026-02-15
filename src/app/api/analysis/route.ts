import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabase = createServerClient()

  const [countResult, dataResult] = await Promise.all([
    supabase
      .from('competitor_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('competitor_analyses')
      .select('*, generated_configs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
  ])

  if (dataResult.error) {
    console.error('Failed to fetch analyses:', dataResult.error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }

  return NextResponse.json({
    analyses: dataResult.data,
    pagination: {
      page,
      limit,
      total: countResult.count || 0,
      totalPages: Math.ceil((countResult.count || 0) / limit),
    },
  })
}

export async function POST(request: Request) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const body = await request.json()
  const { sourceType, sourceIdentifier, sourceDisplayName, dataSource } = body

  if (!sourceType || !['instagram', 'blog'].includes(sourceType)) {
    return NextResponse.json({ error: 'Invalid source_type' }, { status: 400 })
  }
  if (!sourceIdentifier) {
    return NextResponse.json({ error: 'source_identifier is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('competitor_analyses')
    .insert({
      user_id: userId,
      source_type: sourceType,
      source_identifier: sourceIdentifier,
      source_display_name: sourceDisplayName || null,
      data_source: dataSource || 'upload',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create analysis:', error)
    return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
