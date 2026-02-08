import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'
import type { PostType } from '@/types/post'

// GET /api/posts - List posts with pagination
export async function GET(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const postType = searchParams.get('postType') as PostType | null

  const supabase = createServerClient()

  try {
    let query = supabase
      .from('posts')
      .select('*, post_images(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (postType) {
      query = query.eq('post_type', postType)
    }

    const { data, error, count } = await query.range(
      (page - 1) * limit,
      page * limit - 1
    )

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new post
export async function POST(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const {
      postType,
      inputText,
      sourceUrl,
      generatedCaption,
      generatedHashtags,
      imageUrl,
      imageStyle,
      aspectRatio,
      relatedPostId,
    } = body

    // Validation
    if (!postType || !generatedCaption) {
      return NextResponse.json(
        { error: 'Post type and caption are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Create post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        post_type: postType,
        input_text: inputText,
        source_url: sourceUrl || null,
        generated_caption: generatedCaption,
        generated_hashtags: generatedHashtags || [],
        related_post_id: relatedPostId || null,
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    // Create post image if provided
    if (imageUrl) {
      const { error: imageError } = await supabase.from('post_images').insert({
        post_id: post.id,
        image_url: imageUrl,
        style: imageStyle || 'manga_male',
        aspect_ratio: aspectRatio || '1:1',
        prompt: '', // Prompt is stored in the image, not tracked separately
      })

      if (imageError) {
        console.error('Error creating post image:', imageError)
        // Don't fail the whole request, just log the error
      }
    }

    // Fetch the complete post with images
    const { data: completePost } = await supabase
      .from('posts')
      .select('*, post_images(*)')
      .eq('id', post.id)
      .single()

    return NextResponse.json(completePost)
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
