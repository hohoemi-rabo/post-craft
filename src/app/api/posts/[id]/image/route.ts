import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requirePostOwnership } from '@/lib/api-utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 8 * 1024 * 1024 // 8MB

// Helper: delete old image from Storage
async function deleteOldImage(
  supabase: ReturnType<typeof createServerClient>,
  imageUrl: string
) {
  const match = imageUrl.match(/generated-images\/(.+)$/)
  if (match) {
    await supabase.storage.from('generated-images').remove([match[1]])
  }
}

// POST /api/posts/[id]/image - Upload image (with optional replace)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id: postId } = await params

  // Check post ownership
  const { error: ownershipError } = await requirePostOwnership(postId, userId!)
  if (ownershipError) return ownershipError

  const supabase = createServerClient()

  // Parse FormData
  const formData = await request.formData()
  const file = formData.get('image') as File | null
  const replace = formData.get('replace') === 'true'
  const aspectRatio = (formData.get('aspectRatio') as string) || '1:1'

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
    // If replace mode, delete existing image first
    if (replace) {
      const { data: existingImages } = await supabase
        .from('post_images')
        .select('id, image_url')
        .eq('post_id', postId)

      if (existingImages && existingImages.length > 0) {
        for (const img of existingImages) {
          await deleteOldImage(supabase, img.image_url)
        }
        const ids = existingImages.map((img) => img.id)
        await supabase.from('post_images').delete().in('id', ids)
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const fileName = `${userId}/uploaded/${Date.now()}.${ext}`

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
        aspect_ratio: aspectRatio,
        prompt: '',
      })

    if (insertError) {
      console.error('post_images insert error:', insertError)
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

// PUT /api/posts/[id]/image - Update image record (for AI regeneration)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id: postId } = await params

  // Check post ownership
  const { error: ownershipError } = await requirePostOwnership(postId, userId!)
  if (ownershipError) return ownershipError

  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { imageUrl, style, aspectRatio, prompt } = body

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    // Find existing post_images
    const { data: existingImages } = await supabase
      .from('post_images')
      .select('id, image_url')
      .eq('post_id', postId)

    if (existingImages && existingImages.length > 0) {
      // Delete old images from Storage
      for (const img of existingImages) {
        await deleteOldImage(supabase, img.image_url)
      }

      // Update the first record
      const { error: updateError } = await supabase
        .from('post_images')
        .update({
          image_url: imageUrl,
          style: style || 'manga_male',
          aspect_ratio: aspectRatio || '1:1',
          prompt: prompt || '',
        })
        .eq('id', existingImages[0].id)

      if (updateError) {
        console.error('post_images update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update image record' },
          { status: 500 }
        )
      }

      // Delete extra records if any
      if (existingImages.length > 1) {
        const extraIds = existingImages.slice(1).map((img) => img.id)
        await supabase.from('post_images').delete().in('id', extraIds)
      }
    } else {
      // No existing image, insert new record
      const { error: insertError } = await supabase
        .from('post_images')
        .insert({
          post_id: postId,
          image_url: imageUrl,
          style: style || 'manga_male',
          aspect_ratio: aspectRatio || '1:1',
          prompt: prompt || '',
        })

      if (insertError) {
        console.error('post_images insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create image record' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image update error:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}
