import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateSceneDescription } from '@/lib/image-prompt'
import type { PostType } from '@/types/post'

interface GenerateSceneRequest {
  caption: string
  postType: PostType
}

// POST /api/generate/scene - Generate scene description from caption
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: GenerateSceneRequest = await request.json()
    const { caption, postType } = body

    if (!caption || caption.length < 10) {
      return NextResponse.json(
        { error: 'Caption is required (min 10 characters)' },
        { status: 400 }
      )
    }

    if (!postType) {
      return NextResponse.json(
        { error: 'Post type is required' },
        { status: 400 }
      )
    }

    const sceneDescription = await generateSceneDescription(caption, postType)

    return NextResponse.json({ sceneDescription })
  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene description' },
      { status: 500 }
    )
  }
}
