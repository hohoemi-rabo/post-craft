import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createMediaContainer, waitAndPublish } from '@/lib/instagram'

export const maxDuration = 60 // Allow up to 60 seconds for publishing

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const image = formData.get('image') as File | null
    const caption = formData.get('caption') as string | null
    const igAccountId = formData.get('igAccountId') as string | null
    const accessToken = formData.get('accessToken') as string | null

    // Validation
    if (!image || !caption || !igAccountId || !accessToken) {
      return NextResponse.json(
        { error: '画像、キャプション、アカウント情報は必須です' },
        { status: 400 }
      )
    }

    // Validate image size (max 8MB)
    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: '画像サイズは8MB以下にしてください' },
        { status: 400 }
      )
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'JPEG、PNG、WebP形式の画像のみ対応しています' },
        { status: 400 }
      )
    }

    // Upload image to Supabase Storage
    const supabase = createServerClient()
    const timestamp = Date.now()
    const ext = image.type.split('/')[1] === 'jpeg' ? 'jpg' : image.type.split('/')[1]
    const fileName = `publish/${timestamp}.${ext}`

    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, buffer, {
        contentType: image.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: '画像のアップロードに失敗しました' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Create media container on Instagram
    const containerId = await createMediaContainer(
      igAccountId,
      imageUrl,
      caption,
      accessToken
    )

    // Wait for container to be ready and publish
    const mediaId = await waitAndPublish(
      igAccountId,
      containerId,
      accessToken
    )

    return NextResponse.json({
      success: true,
      mediaId,
    })
  } catch (error) {
    console.error('Instagram publish error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to publish to Instagram'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
