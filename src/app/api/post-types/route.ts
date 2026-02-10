import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'
import { toPostTypeDB, POST_TYPE_MAX_COUNT } from '@/lib/post-type-utils'

// GET /api/post-types - List post types
export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const { data, error: dbError } = await supabase
      .from('post_types')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (dbError) {
      console.error('Error fetching post types:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch post types' },
        { status: 500 }
      )
    }

    const postTypes = (data || []).map(toPostTypeDB)

    return NextResponse.json({
      postTypes,
      count: postTypes.length,
      maxCount: POST_TYPE_MAX_COUNT,
    })
  } catch (error) {
    console.error('Post types fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post types' },
      { status: 500 }
    )
  }
}

// POST /api/post-types - Create a new post type
export async function POST(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      icon,
      templateStructure,
      placeholders,
      minLength,
      maxLength,
      isActive,
    } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 })
    }
    if (description && description.length > 200) {
      return NextResponse.json({ error: 'Description must be 200 characters or less' }, { status: 400 })
    }
    if (!templateStructure || typeof templateStructure !== 'string' || templateStructure.trim().length === 0) {
      return NextResponse.json({ error: 'Template structure is required' }, { status: 400 })
    }
    if (templateStructure.length > 2000) {
      return NextResponse.json({ error: 'Template structure must be 2000 characters or less' }, { status: 400 })
    }
    if (placeholders && Array.isArray(placeholders) && placeholders.length > 10) {
      return NextResponse.json({ error: 'Placeholders must be 10 or less' }, { status: 400 })
    }

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

    // Generate slug if not provided
    const finalSlug = slug && slug.trim().length > 0
      ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `type-${Date.now()}`

    // Get max sort_order for this user
    const { data: maxOrderData } = await supabase
      .from('post_types')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = maxOrderData && maxOrderData.length > 0
      ? maxOrderData[0].sort_order + 1
      : 0

    // Insert
    const { data, error: insertError } = await supabase
      .from('post_types')
      .insert({
        user_id: userId,
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        icon: icon || '📝',
        template_structure: templateStructure.trim(),
        placeholders: placeholders || [],
        min_length: minLength ?? 200,
        max_length: maxLength ?? 400,
        sort_order: nextSortOrder,
        is_active: isActive ?? true,
      })
      .select()
      .single()

    if (insertError) {
      // Check for unique constraint violation (slug duplicate)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A post type with this slug already exists' },
          { status: 409 }
        )
      }
      console.error('Error creating post type:', insertError)
      return NextResponse.json(
        { error: 'Failed to create post type' },
        { status: 500 }
      )
    }

    return NextResponse.json(toPostTypeDB(data))
  } catch (error) {
    console.error('Post type creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create post type' },
      { status: 500 }
    )
  }
}
