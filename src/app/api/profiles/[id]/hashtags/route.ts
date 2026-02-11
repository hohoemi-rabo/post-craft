import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requireProfileOwnership } from '@/lib/api-utils'
import { TOTAL_HASHTAG_COUNT } from '@/lib/constants'

const MAX_REQUIRED_HASHTAGS = 4

// GET /api/profiles/[id]/hashtags
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError, profile } = await requireProfileOwnership(id, userId!)
  if (ownerError) return ownerError

  return NextResponse.json({
    requiredHashtags: profile!.required_hashtags ?? [],
    generatedCount: TOTAL_HASHTAG_COUNT - (profile!.required_hashtags?.length ?? 0),
  })
}

// PUT /api/profiles/[id]/hashtags
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

    const supabase = createServerClient()
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({
        required_hashtags: normalized,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('required_hashtags')
      .single()

    if (updateError || !data) {
      console.error('Error updating profile hashtags:', updateError)
      return NextResponse.json(
        { error: 'Failed to update hashtags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requiredHashtags: data.required_hashtags,
      generatedCount: TOTAL_HASHTAG_COUNT - data.required_hashtags.length,
    })
  } catch (err) {
    console.error('Profile hashtags PUT error:', err)
    return NextResponse.json(
      { error: 'Failed to update hashtags' },
      { status: 500 }
    )
  }
}
