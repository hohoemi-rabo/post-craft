import { NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError } = await requireAnalysisOwnership(id, userId)
  if (ownerError) return ownerError

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('competitor_analyses')
    .select('*, generated_configs(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch analysis:', error)
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError } = await requireAnalysisOwnership(id, userId)
  if (ownerError) return ownerError

  const supabase = createServerClient()
  const { error } = await supabase
    .from('competitor_analyses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete analysis:', error)
    return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
