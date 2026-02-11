import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requireProfileOwnership } from '@/lib/api-utils'
import { toProfileDB } from '@/lib/profile-utils'

// GET /api/profiles/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError, profile } = await requireProfileOwnership(id, userId!)
  if (ownerError) return ownerError

  const supabase = createServerClient()
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('*, post_types(count)')
    .eq('id', profile!.id)
    .single()

  if (fetchError || !data) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  return NextResponse.json(toProfileDB(data))
}

// PUT /api/profiles/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError } = await requireProfileOwnership(id, userId!)
  if (ownerError) return ownerError

  try {
    const body = await request.json()
    const { name, icon, description } = body

    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name.trim()
    if (icon !== undefined) updateData.icon = icon
    if (description !== undefined) updateData.description = description || null

    const supabase = createServerClient()
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('*, post_types(count)')
      .single()

    if (updateError || !data) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(toProfileDB(data))
  } catch (err) {
    console.error('Profile PUT error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// DELETE /api/profiles/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError, profile } = await requireProfileOwnership(id, userId!)
  if (ownerError) return ownerError

  if (profile!.is_default) {
    return NextResponse.json(
      { error: 'Cannot delete the default profile' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting profile:', deleteError)
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
