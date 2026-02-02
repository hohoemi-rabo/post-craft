import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: postId } = await params
  const supabase = createServerClient()

  // Check post ownership
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .single()

  if (fetchError || !post || post.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Parse FormData
  const formData = await request.formData()
  const file = formData.get('image') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'JPEG、PNG、WebP形式の画像を選択してください' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: '画像サイズは8MB以下にしてください' },
      { status: 400 }
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const fileName = `${session.user.id}/uploaded/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Create post_images record
    const { error: insertError } = await supabase
      .from('post_images')
      .insert({
        post_id: postId,
        image_url: imageUrl,
        style: 'uploaded',
        aspect_ratio: '1:1',
        prompt: '',
      })

    if (insertError) {
      console.error('post_images insert error:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('generated-images').remove([fileName])
      return NextResponse.json(
        { error: 'Failed to save image record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
