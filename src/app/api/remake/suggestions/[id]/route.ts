import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requireRemakeSuggestionOwnership } from '@/lib/api-utils'

// PATCH /api/remake/suggestions/[id] - Update suggestion
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params
  const { error: ownerError } = await requireRemakeSuggestionOwnership(id, userId!)
  if (ownerError) return ownerError

  try {
    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.isUsed !== undefined) updateData.is_used = body.isUsed

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error: updateError } = await supabase
      .from('remake_suggestions')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating suggestion:', updateError)
      return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Suggestion update error:', err)
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
  }
}

// DELETE /api/remake/suggestions/[id] - Delete suggestion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params
  const { error: ownerError } = await requireRemakeSuggestionOwnership(id, userId!)
  if (ownerError) return ownerError

  const supabase = createServerClient()
  const { error: deleteError } = await supabase
    .from('remake_suggestions')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting suggestion:', deleteError)
    return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
