import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  createMediaContainer,
  waitAndPublish,
  publishCarousel,
} from '@/lib/instagram'
import { IMAGE_UPLOAD } from '@/lib/constants'
import { requireAuth } from '@/lib/api-utils'

export const maxDuration = 60 // Allow up to 60 seconds for publishing

async function publishToInstagram(
  imageUrls: string[],
  caption: string,
  igAccountId: string,
  accessToken: string
) {
  // 2枚以上はカルーセル（複数画像）投稿
  if (imageUrls.length > 1) {
    return publishCarousel(igAccountId, imageUrls, caption, accessToken)
  }

  const containerId = await createMediaContainer(
    igAccountId,
    imageUrls[0],
    caption,
    accessToken
  )

  return waitAndPublish(igAccountId, containerId, accessToken)
}

export async function POST(request: Request) {
  const { error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const contentType = request.headers.get('content-type') || ''

    let imageUrls: string[]
    let caption: string
    let igAccountId: string
    let accessToken: string

    if (contentType.includes('application/json')) {
      // Dashboard integration: image URL(s) provided directly
      const body = await request.json()
      // 複数画像（imageUrls）優先、後方互換で単一の imageUrl も受け付ける
      imageUrls =
        Array.isArray(body.imageUrls) && body.imageUrls.length > 0
          ? body.imageUrls.filter((url: unknown): url is string => !!url)
          : body.imageUrl
            ? [body.imageUrl]
            : []
      caption = body.caption
      igAccountId = body.igAccountId
      accessToken = body.accessToken

      if (imageUrls.length === 0 || !caption || !igAccountId || !accessToken) {
        return NextResponse.json(
          { error: '画像URL、キャプション、アカウント情報は必須です' },
          { status: 400 }
        )
      }

      if (imageUrls.length > 10) {
        return NextResponse.json(
          { error: 'カルーセル投稿は最大10枚までです' },
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

      imageUrls = [urlData.publicUrl]
      caption = formCaption
      igAccountId = formIgAccountId
      accessToken = formAccessToken
    }

    const mediaId = await publishToInstagram(
      imageUrls,
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
