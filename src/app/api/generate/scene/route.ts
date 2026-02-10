import { NextResponse } from 'next/server'
import { generateSceneDescription } from '@/lib/image-prompt'
import { requireAuth } from '@/lib/api-utils'
import type { PostType } from '@/types/post'

interface GenerateSceneRequest {
  caption: string
  postType?: PostType
  postTypeName?: string
}

// POST /api/generate/scene - Generate scene description from caption
export async function POST(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body: GenerateSceneRequest = await request.json()
    const { caption, postType, postTypeName } = body

    if (!caption || caption.length < 10) {
      return NextResponse.json(
        { error: 'Caption is required (min 10 characters)' },
        { status: 400 }
      )
    }

    if (!postType && !postTypeName) {
      return NextResponse.json(
        { error: 'Post type is required' },
        { status: 400 }
      )
    }

    const sceneDescription = await generateSceneDescription(
      caption,
      postType || 'custom',
      postTypeName
    )

    return NextResponse.json({ sceneDescription })
  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene description' },
      { status: 500 }
    )
  }
}
