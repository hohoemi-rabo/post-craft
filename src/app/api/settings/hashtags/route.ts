import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'

const MAX_REQUIRED_HASHTAGS = 4
const TOTAL_HASHTAG_COUNT = 10

// PUT /api/settings/hashtags - Update required hashtags
export async function PUT(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { requiredHashtags } = body

    if (!Array.isArray(requiredHashtags)) {
      return NextResponse.json(
        { error: 'requiredHashtags must be an array' },
        { status: 400 }
      )
    }

    if (requiredHashtags.length > MAX_REQUIRED_HASHTAGS) {
      return NextResponse.json(
        { error: `Required hashtags must be ${MAX_REQUIRED_HASHTAGS} or less` },
        { status: 400 }
      )
    }

    // Validate and normalize hashtags
    const normalized: string[] = []
    for (const tag of requiredHashtags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        return NextResponse.json(
          { error: 'Empty hashtags are not allowed' },
          { status: 400 }
        )
      }
      const trimmed = tag.trim()
      normalized.push(trimmed.startsWith('#') ? trimmed : `#${trimmed}`)
    }

    const { data, error: upsertError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        required_hashtags: normalized,
      }, { onConflict: 'user_id' })
      .select('required_hashtags')
      .single()

    if (upsertError || !data) {
      console.error('Error updating hashtags:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update hashtags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requiredHashtags: data.required_hashtags,
      generatedCount: TOTAL_HASHTAG_COUNT - data.required_hashtags.length,
    })
  } catch (error) {
    console.error('Hashtags update error:', error)
    return NextResponse.json(
      { error: 'Failed to update hashtags' },
      { status: 500 }
    )
  }
}
