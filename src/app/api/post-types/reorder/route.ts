import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'

// PUT /api/post-types/reorder - Reorder post types
export async function PUT(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.id || typeof item.sortOrder !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have id and sortOrder' },
          { status: 400 }
        )
      }
    }

    // Verify all items belong to the user
    const ids = items.map((item: { id: string }) => item.id)
    const { data: ownedTypes, error: fetchError } = await supabase
      .from('post_types')
      .select('id')
      .eq('user_id', userId)
      .in('id', ids)

    if (fetchError) {
      console.error('Error verifying post type ownership:', fetchError)
      return NextResponse.json({ error: 'Failed to verify ownership' }, { status: 500 })
    }

    if (!ownedTypes || ownedTypes.length !== ids.length) {
      return NextResponse.json({ error: 'Some post types not found or not owned' }, { status: 403 })
    }

    // Batch update sort_order
    const updates = items.map((item: { id: string; sortOrder: number }) =>
      supabase
        .from('post_types')
        .update({ sort_order: item.sortOrder })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(r => r.error)

    if (hasError) {
      console.error('Error reordering post types:', results.filter(r => r.error))
      return NextResponse.json(
        { error: 'Failed to reorder post types' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post type reorder error:', error)
    return NextResponse.json(
      { error: 'Failed to reorder post types' },
      { status: 500 }
    )
  }
}
