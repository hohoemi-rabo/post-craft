import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requirePostOwnership } from '@/lib/api-utils'
import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import { buildDetailSuggestionPrompt, buildReportSuggestionPrompt } from '@/lib/remake-prompts'
import { toRemakeSuggestion } from '@/types/remake'
import type { RemakeSuggestionRow } from '@/types/supabase'

// GET /api/remake/suggestions - List suggestions
export async function GET(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const sourcePostId = searchParams.get('sourcePostId')
  const context = searchParams.get('context')
  const includeUsed = searchParams.get('includeUsed') === 'true'

  const supabase = createServerClient()

  let query = supabase
    .from('remake_suggestions')
    .select('*')
    .eq('user_id', userId!)
    .order('created_at', { ascending: false })

  if (sourcePostId) {
    query = query.eq('source_post_id', sourcePostId)
  }
  if (context) {
    query = query.eq('generated_from', context)
  }
  if (!includeUsed) {
    query = query.eq('is_used', false)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error('Error fetching suggestions:', dbError)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }

  const suggestions = await enrichSuggestions(supabase, (data || []) as RemakeSuggestionRow[], userId!)
  return NextResponse.json({ suggestions })
}

// Helper to enrich suggestions with type/profile names
async function enrichSuggestions(
  supabase: ReturnType<typeof createServerClient>,
  rows: RemakeSuggestionRow[],
  userId: string
) {
  // Fetch all post types and profiles for this user
  const [{ data: postTypes }, { data: profiles }] = await Promise.all([
    supabase.from('post_types').select('slug, name, icon').eq('user_id', userId),
    supabase.from('profiles').select('id, name, icon').eq('user_id', userId),
  ])

  const typeMap = new Map((postTypes || []).map(pt => [pt.slug, pt]))
  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  return rows.map(row => {
    const type = typeMap.get(row.suggested_type_slug)
    const profile = row.suggested_profile_id ? profileMap.get(row.suggested_profile_id) : null
    return toRemakeSuggestion(
      row,
      type?.name || row.suggested_type_slug,
      type?.icon || '📝',
      profile?.name || null
    )
  })
}

// POST /api/remake/suggestions - Generate suggestions
export async function POST(request: Request) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { sourcePostId, context } = body as {
      sourcePostId?: string
      context: 'detail' | 'report'
    }

    if (!context || !['detail', 'report'].includes(context)) {
      return NextResponse.json({ error: 'context must be "detail" or "report"' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch post types and profiles
    const [{ data: postTypes }, { data: profiles }] = await Promise.all([
      supabase.from('post_types').select('slug, name, icon, profile_id').eq('user_id', userId!).eq('is_active', true),
      supabase.from('profiles').select('id, name, icon').eq('user_id', userId!),
    ])

    let prompt: string

    if (context === 'detail' && sourcePostId) {
      // Check ownership
      const { error: ownerError } = await requirePostOwnership(sourcePostId, userId!)
      if (ownerError) return ownerError

      // Fetch the source post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id, post_type, post_type_id, profile_id, generated_caption, created_at')
        .eq('id', sourcePostId)
        .single()

      if (postError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const typeInfo = post.post_type_id ? (postTypes || []).find(pt => pt.slug === post.post_type || pt.name) : null
      const postTypeName = typeInfo?.name || post.post_type
      const profileInfo = post.profile_id ? (profiles || []).find(p => p.id === post.profile_id) : null
      const profileName = profileInfo?.name || null

      prompt = buildDetailSuggestionPrompt(
        {
          id: post.id,
          postType: post.post_type,
          postTypeName,
          profileName,
          caption: post.generated_caption,
          createdAt: post.created_at || '',
        },
        (postTypes || []).map(pt => ({ slug: pt.slug, name: pt.name, icon: pt.icon, profileId: pt.profile_id })),
        (profiles || []).map(p => ({ id: p.id, name: p.name, icon: p.icon }))
      )
    } else {
      // Report mode: fetch recent posts
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, post_type, post_type_id, profile_id, generated_caption, created_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(30)

      const typeMap = new Map((postTypes || []).map(pt => [pt.slug, pt]))
      const profileMap = new Map((profiles || []).map(p => [p.id, p]))

      const postSummaries = (recentPosts || []).map(p => ({
        id: p.id,
        postType: p.post_type,
        postTypeName: typeMap.get(p.post_type)?.name || p.post_type,
        profileName: p.profile_id ? profileMap.get(p.profile_id)?.name || null : null,
        caption: p.generated_caption,
        createdAt: p.created_at || '',
      }))

      prompt = buildReportSuggestionPrompt(
        postSummaries,
        (postTypes || []).map(pt => ({ slug: pt.slug, name: pt.name, icon: pt.icon, profileId: pt.profile_id })),
        (profiles || []).map(p => ({ id: p.id, name: p.name, icon: p.icon }))
      )
    }

    // Generate suggestions
    const responseText = await generateWithRetry(prompt, 3, 60000)
    const generated = parseJsonResponse<{
      sourcePostId?: string
      suggestedTypeSlug: string
      suggestedProfileId: string
      reason: string
      direction: string
    }[]>(responseText)

    if (!Array.isArray(generated) || generated.length === 0) {
      return NextResponse.json({ error: 'AI generated invalid response' }, { status: 500 })
    }

    // Insert suggestions
    const insertData = generated.slice(0, context === 'detail' ? 2 : 5).map(s => ({
      user_id: userId!,
      source_post_id: s.sourcePostId || sourcePostId!,
      suggested_type_slug: s.suggestedTypeSlug,
      suggested_profile_id: s.suggestedProfileId || null,
      reason: s.reason,
      direction: s.direction,
      generated_from: context,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('remake_suggestions')
      .insert(insertData)
      .select()

    if (insertError) {
      console.error('Error inserting suggestions:', insertError)
      return NextResponse.json({ error: 'Failed to save suggestions' }, { status: 500 })
    }

    const suggestions = await enrichSuggestions(supabase, inserted as RemakeSuggestionRow[], userId!)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('Suggestion generation error:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
