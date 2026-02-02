import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// GET /api/posts/[id] - Get post details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerClient()

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, post_images(*)')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Post fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PATCH /api/posts/[id] - Update Instagram publish status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { instagram_published, instagram_media_id } = body

    // Check ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !post || post.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        instagram_published,
        instagram_media_id: instagram_media_id || null,
        instagram_published_at: instagram_published ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Post update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post update error:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerClient()

  try {
    // Check ownership and get images
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id, post_images(image_url)')
      .eq('id', id)
      .single()

    if (fetchError || !post || post.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Delete images from storage
    if (post.post_images && post.post_images.length > 0) {
      const imagePaths = post.post_images
        .map((img: { image_url: string }) => {
          // Extract path from URL: .../generated-images/userId/...
          const match = img.image_url.match(/generated-images\/(.+)$/)
          return match ? match[1] : null
        })
        .filter(Boolean) as string[]

      if (imagePaths.length > 0) {
        await supabase.storage.from('generated-images').remove(imagePaths)
      }
    }

    // Delete post (cascade will delete post_images)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
