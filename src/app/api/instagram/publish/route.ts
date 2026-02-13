import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createMediaContainer, waitAndPublish } from '@/lib/instagram'
import { IMAGE_UPLOAD } from '@/lib/constants'
import { requireAuth } from '@/lib/api-utils'

export const maxDuration = 60 // Allow up to 60 seconds for publishing

async function publishToInstagram(
  imageUrl: string,
  caption: string,
  igAccountId: string,
  accessToken: string
) {
  const containerId = await createMediaContainer(
    igAccountId,
    imageUrl,
    caption,
    accessToken
  )

  const mediaId = await waitAndPublish(igAccountId, containerId, accessToken)

  return mediaId
}

export async function POST(request: Request) {
  const { error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const contentType = request.headers.get('content-type') || ''

    let imageUrl: string
    let caption: string
    let igAccountId: string
    let accessToken: string

    if (contentType.includes('application/json')) {
      // Dashboard integration: image URL provided directly
      const body = await request.json()
      imageUrl = body.imageUrl
      caption = body.caption
      igAccountId = body.igAccountId
      accessToken = body.accessToken

      if (!imageUrl || !caption || !igAccountId || !accessToken) {
        return NextResponse.json(
          { error: '画像URL、キャプション、アカウント情報は必須です' },
          { status: 400 }
        )
      }
    } else {
      // Standalone /publish page: file upload
      const formData = await request.formData()

      const image = formData.get('image') as File | null
      const formCaption = formData.get('caption') as string | null
      const formIgAccountId = formData.get('igAccountId') as string | null
      const formAccessToken = formData.get('accessToken') as string | null

      if (!image || !formCaption || !formIgAccountId || !formAccessToken) {
        return NextResponse.json(
          { error: '画像、キャプション、アカウント情報は必須です' },
          { status: 400 }
        )
      }

      if (image.size > IMAGE_UPLOAD.MAX_SIZE) {
        return NextResponse.json(
          { error: '画像サイズは8MB以下にしてください' },
          { status: 400 }
        )
      }

      if (!IMAGE_UPLOAD.ALLOWED_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: 'JPEG、PNG、WebP形式の画像のみ対応しています' },
          { status: 400 }
        )
      }

      // Upload image to Supabase Storage
      const supabase = createServerClient()
      const timestamp = Date.now()
      const ext =
        image.type.split('/')[1] === 'jpeg' ? 'jpg' : image.type.split('/')[1]
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

      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(fileName)

      imageUrl = urlData.publicUrl
      caption = formCaption
      igAccountId = formIgAccountId
      accessToken = formAccessToken
    }

    const mediaId = await publishToInstagram(
      imageUrl,
      caption,
      igAccountId,
      accessToken
    )

    return NextResponse.json({
      success: true,
      mediaId,
    })
  } catch (error) {
    console.error('Instagram publish error:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to publish to Instagram'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
