import { NextResponse } from 'next/server'
import { generateCatchphrase } from '@/lib/image-prompt'
import { requireAuth } from '@/lib/api-utils'

interface GenerateCatchphraseRequest {
  caption: string
}

// POST /api/generate/catchphrase - Generate a catchphrase for image text
export async function POST(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body: GenerateCatchphraseRequest = await request.json()
    const { caption } = body

    if (!caption || caption.length < 10) {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      )
    }

    const catchphrase = await generateCatchphrase(caption)

    return NextResponse.json({ catchphrase })
  } catch (error) {
    console.error('Catchphrase generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate catchphrase' },
      { status: 500 }
    )
  }
}
