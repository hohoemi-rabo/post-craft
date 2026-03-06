import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requireProfileOwnership } from '@/lib/api-utils'
import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import { buildIdeaGenerationPrompt } from '@/lib/idea-prompts'
import { toPostIdea } from '@/types/idea'
import type { PostIdeaRow } from '@/types/idea'

// GET /api/ideas?profileId=xxx - List ideas
export async function GET(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profileId')

  const supabase = createServerClient()

  let query = supabase
    .from('post_ideas')
    .select('*')
    .eq('user_id', userId!)
    .order('created_at', { ascending: false })

  if (profileId) {
    query = query.eq('profile_id', profileId)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error('Error fetching ideas:', dbError)
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 })
  }

  const ideas = (data as PostIdeaRow[] || []).map(toPostIdea)
  return NextResponse.json({ ideas })
}

// POST /api/ideas - Generate new ideas
export async function POST(request: Request) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { profileId, aiInstructions } = body

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    // Check profile ownership
    const { error: ownerError, profile } = await requireProfileOwnership(profileId, userId!)
    if (ownerError) return ownerError

    const supabase = createServerClient()

    // Get post types for this profile
    const { data: postTypes } = await supabase
      .from('post_types')
      .select('icon, name, description')
      .eq('user_id', userId!)
      .eq('profile_id', profileId)
      .eq('is_active', true)

    // Get all past captions for this profile
    const { data: posts } = await supabase
      .from('posts')
      .select('generated_caption')
      .eq('user_id', userId!)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    // Get existing idea titles for dedup
    const { data: existingIdeas } = await supabase
      .from('post_ideas')
      .select('title')
      .eq('user_id', userId!)
      .eq('profile_id', profileId)

    // Build prompt
    const prompt = buildIdeaGenerationPrompt({
      profileName: profile!.name,
      profileDescription: profile!.description,
      systemPrompt: profile!.system_prompt,
      postTypes: (postTypes || []).map(pt => ({
        icon: pt.icon || '📝',
        name: pt.name,
        description: pt.description,
      })),
      pastCaptions: (posts || []).map(p => p.generated_caption || ''),
      existingIdeaTitles: (existingIdeas || []).map(i => i.title),
      aiInstructions: aiInstructions?.trim() || undefined,
    })

    // Generate ideas
    const responseText = await generateWithRetry(prompt, 3, 60000)
    const generatedIdeas = parseJsonResponse<{ title: string; description: string }[]>(responseText)

    // Validate response
    if (!Array.isArray(generatedIdeas) || generatedIdeas.length === 0) {
      return NextResponse.json({ error: 'AI generated invalid response' }, { status: 500 })
    }

    // Insert ideas
    const insertData = generatedIdeas.slice(0, 5).map(idea => ({
      user_id: userId!,
      profile_id: profileId,
      title: idea.title,
      description: idea.description,
      ai_instructions: aiInstructions?.trim() || null,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('post_ideas')
      .insert(insertData)
      .select()

    if (insertError) {
      console.error('Error inserting ideas:', insertError)
      return NextResponse.json({ error: 'Failed to save ideas' }, { status: 500 })
    }

    const ideas = (inserted as PostIdeaRow[] || []).map(toPostIdea)
    return NextResponse.json({ ideas })
  } catch (err) {
    console.error('Idea generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    )
  }
}
