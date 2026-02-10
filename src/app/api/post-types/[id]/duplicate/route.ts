import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requirePostTypeOwnership } from '@/lib/api-utils'
import { toPostTypeDB, POST_TYPE_MAX_COUNT } from '@/lib/post-type-utils'

// POST /api/post-types/[id]/duplicate - Duplicate a post type
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params

  const { error: ownershipError, postType } = await requirePostTypeOwnership(id, userId!)
  if (ownershipError) return ownershipError

  const supabase = createServerClient()

  try {
    // Check count limit
    const { count, error: countError } = await supabase
      .from('post_types')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('Error counting post types:', countError)
      return NextResponse.json({ error: 'Failed to check post type count' }, { status: 500 })
    }

    if ((count || 0) >= POST_TYPE_MAX_COUNT) {
      return NextResponse.json(
        { error: `Post types limit reached (max: ${POST_TYPE_MAX_COUNT})` },
        { status: 400 }
      )
    }

    // Get max sort_order
    const { data: maxOrderData } = await supabase
      .from('post_types')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = maxOrderData && maxOrderData.length > 0
      ? maxOrderData[0].sort_order + 1
      : 0

    // Insert duplicate
    const { data, error: insertError } = await supabase
      .from('post_types')
      .insert({
        user_id: userId,
        name: `${postType!.name}のコピー`,
        slug: `${postType!.slug}-copy-${Date.now()}`,
        description: postType!.description,
        icon: postType!.icon,
        template_structure: postType!.template_structure,
        placeholders: postType!.placeholders,
        min_length: postType!.min_length,
        max_length: postType!.max_length,
        sort_order: nextSortOrder,
        is_active: postType!.is_active,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error duplicating post type:', insertError)
      return NextResponse.json(
        { error: 'Failed to duplicate post type' },
        { status: 500 }
      )
    }

    return NextResponse.json(toPostTypeDB(data))
  } catch (error) {
    console.error('Post type duplication error:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate post type' },
      { status: 500 }
    )
  }
}
