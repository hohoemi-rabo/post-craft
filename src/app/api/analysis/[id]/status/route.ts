import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('competitor_analyses')
    .select('id, status, post_count, error_message, updated_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
