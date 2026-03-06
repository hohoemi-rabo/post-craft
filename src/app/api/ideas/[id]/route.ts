import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requireIdeaOwnership } from '@/lib/api-utils'
import { toPostIdea } from '@/types/idea'
import type { PostIdeaRow } from '@/types/idea'

// PATCH /api/ideas/[id] - Update idea
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params
  const { error: ownerError } = await requireIdeaOwnership(id, userId!)
  if (ownerError) return ownerError

  try {
    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.isUsed !== undefined) updateData.is_used = body.isUsed

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error: updateError } = await supabase
      .from('post_ideas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating idea:', updateError)
      return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 })
    }

    return NextResponse.json(toPostIdea(data as PostIdeaRow))
  } catch (err) {
    console.error('Idea update error:', err)
    return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 })
  }
}

// DELETE /api/ideas/[id] - Delete idea
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params
  const { error: ownerError } = await requireIdeaOwnership(id, userId!)
  if (ownerError) return ownerError

  const supabase = createServerClient()
  const { error: deleteError } = await supabase
    .from('post_ideas')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting idea:', deleteError)
    return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
