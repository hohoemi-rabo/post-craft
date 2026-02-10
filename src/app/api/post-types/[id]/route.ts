import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requirePostTypeOwnership } from '@/lib/api-utils'
import { toPostTypeDB } from '@/lib/post-type-utils'

// GET /api/post-types/[id] - Get post type details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { id } = await params

  const { error: ownershipError, postType } = await requirePostTypeOwnership(id, userId!)
  if (ownershipError) return ownershipError

  return NextResponse.json(toPostTypeDB(postType!))
}

// PUT /api/post-types/[id] - Update post type
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params

  const { error: ownershipError } = await requirePostTypeOwnership(id, userId!)
  if (ownershipError) return ownershipError

  const supabase = createServerClient()

  try {
    const body = await request.json()

    // Validation
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      if (body.name.length > 50) {
        return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 })
      }
    }
    if (body.description !== undefined && body.description !== null && body.description.length > 200) {
      return NextResponse.json({ error: 'Description must be 200 characters or less' }, { status: 400 })
    }
    if (body.templateStructure !== undefined) {
      if (typeof body.templateStructure !== 'string' || body.templateStructure.trim().length === 0) {
        return NextResponse.json({ error: 'Template structure cannot be empty' }, { status: 400 })
      }
      if (body.templateStructure.length > 2000) {
        return NextResponse.json({ error: 'Template structure must be 2000 characters or less' }, { status: 400 })
      }
    }
    if (body.placeholders !== undefined && Array.isArray(body.placeholders) && body.placeholders.length > 10) {
      return NextResponse.json({ error: 'Placeholders must be 10 or less' }, { status: 400 })
    }

    // Build update data (slug is not updatable)
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.templateStructure !== undefined) updateData.template_structure = body.templateStructure.trim()
    if (body.placeholders !== undefined) updateData.placeholders = body.placeholders
    if (body.minLength !== undefined) updateData.min_length = body.minLength
    if (body.maxLength !== undefined) updateData.max_length = body.maxLength
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error: updateError } = await supabase
      .from('post_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating post type:', updateError)
      return NextResponse.json(
        { error: 'Failed to update post type' },
        { status: 500 }
      )
    }

    return NextResponse.json(toPostTypeDB(data))
  } catch (error) {
    console.error('Post type update error:', error)
    return NextResponse.json(
      { error: 'Failed to update post type' },
      { status: 500 }
    )
  }
}

// DELETE /api/post-types/[id] - Delete post type
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params

  const { error: ownershipError } = await requirePostTypeOwnership(id, userId!)
  if (ownershipError) return ownershipError

  const supabase = createServerClient()

  try {
    // Count affected posts
    const { count: affectedPosts } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('post_type_id', id)

    // Delete post type (ON DELETE SET NULL handles posts.post_type_id)
    const { error: deleteError } = await supabase
      .from('post_types')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting post type:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete post type' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      deleted: true,
      affectedPosts: affectedPosts || 0,
    })
  } catch (error) {
    console.error('Post type deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post type' },
      { status: 500 }
    )
  }
}
