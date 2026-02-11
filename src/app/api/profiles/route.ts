import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'
import { toProfileDB } from '@/lib/profile-utils'
import { PROFILE_MAX_COUNT } from '@/types/profile'

// GET /api/profiles - List profiles with post type count
export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*, post_types(count)')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    const profiles = (data ?? []).map(toProfileDB)

    return NextResponse.json({
      profiles,
      count: profiles.length,
      maxCount: PROFILE_MAX_COUNT,
    })
  } catch (err) {
    console.error('Profiles GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

// POST /api/profiles - Create a new profile
export async function POST(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { name, icon, description } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Check profile count limit
    const { count: existingCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('Error counting profiles:', countError)
      return NextResponse.json(
        { error: 'Failed to check profile count' },
        { status: 500 }
      )
    }

    if ((existingCount ?? 0) >= PROFILE_MAX_COUNT) {
      return NextResponse.json(
        { error: `Profile limit reached (max ${PROFILE_MAX_COUNT})` },
        { status: 400 }
      )
    }

    // Get next sort_order
    const { data: maxOrder } = await supabase
      .from('profiles')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (maxOrder?.sort_order ?? -1) + 1

    const { data, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        name: name.trim(),
        icon: icon || '📋',
        description: description || null,
        is_default: (existingCount ?? 0) === 0,
        sort_order: nextSortOrder,
      })
      .select('*, post_types(count)')
      .single()

    if (insertError || !data) {
      console.error('Error creating profile:', insertError)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(toProfileDB(data), { status: 201 })
  } catch (err) {
    console.error('Profiles POST error:', err)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}
