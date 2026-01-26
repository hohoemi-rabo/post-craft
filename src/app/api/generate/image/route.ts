import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { geminiImageGen, geminiImageGenMultimodal } from '@/lib/gemini'
import { buildImagePrompt, buildMultimodalImagePrompt } from '@/lib/image-prompt'
import { IMAGE_STYLES, ASPECT_RATIOS, type ImageStyle, type AspectRatio } from '@/lib/image-styles'

export const maxDuration = 60 // Allow up to 60 seconds for image generation

interface GenerateImageRequest {
  style: ImageStyle
  aspectRatio: AspectRatio
  characterId?: string
  sceneDescription: string
  postId?: string
  useCharacterImage?: boolean
  catchphrase?: string // Text to display on the image
}

// POST /api/generate/image - Generate an image using Gemini
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: GenerateImageRequest = await request.json()
    const { style, aspectRatio, characterId, sceneDescription, postId, useCharacterImage, catchphrase } = body

    // Validation
    if (!style || !IMAGE_STYLES[style]) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 })
    }
    if (!aspectRatio || !ASPECT_RATIOS[aspectRatio]) {
      return NextResponse.json({ error: 'Invalid aspect ratio' }, { status: 400 })
    }
    if (!sceneDescription || sceneDescription.length < 5) {
      return NextResponse.json({ error: 'Scene description is required' }, { status: 400 })
    }

    const supabase = createServerClient()
    let characterDescription: string | undefined
    let characterImageUrl: string | undefined

    // Get character info if characterId is provided
    if (characterId) {
      const { data: character } = await supabase
        .from('characters')
        .select('description, image_url')
        .eq('id', characterId)
        .eq('user_id', session.user.id)
        .single()

      if (character) {
        characterDescription = character.description
        if (useCharacterImage && character.image_url) {
          characterImageUrl = character.image_url
        }
      }
    }

    let result
    let prompt: string

    // Use multimodal generation if character image is available
    if (useCharacterImage && characterImageUrl) {
      // Fetch the character image and convert to base64
      const imageResponse = await fetch(characterImageUrl)
      if (!imageResponse.ok) {
        console.error('Failed to fetch character image')
        // Fall back to text-only generation
        prompt = buildImagePrompt({
          style,
          aspectRatio,
          characterDescription,
          sceneDescription,
          catchphrase,
        })
        result = await geminiImageGen.generateContent(prompt)
      } else {
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString('base64')
        const mimeType = imageResponse.headers.get('content-type') || 'image/png'

        // Build multimodal prompt
        prompt = buildMultimodalImagePrompt({
          style,
          aspectRatio,
          sceneDescription,
          catchphrase,
        })

        // Generate with multimodal model (image + text)
        result = await geminiImageGenMultimodal.generateContent([
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          { text: prompt },
        ])
      }
    } else {
      // Standard text-only generation
      prompt = buildImagePrompt({
        style,
        aspectRatio,
        characterDescription,
        sceneDescription,
        catchphrase,
      })
      result = await geminiImageGen.generateContent(prompt)
    }

    const response = result.response
    const parts = response.candidates?.[0]?.content?.parts

    if (!parts || parts.length === 0) {
      console.error('No parts in response')
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    // Find the image part
    const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith('image/'))

    if (!imagePart?.inlineData) {
      console.error('No image in response parts:', parts)
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      )
    }

    // Convert base64 to buffer
    const base64Data = imagePart.inlineData.data
    const outputMimeType = imagePart.inlineData.mimeType || 'image/png'
    const buffer = Buffer.from(base64Data!, 'base64')

    // Determine file extension
    const ext = outputMimeType.includes('png') ? 'png' : outputMimeType.includes('webp') ? 'webp' : 'jpg'

    // Generate file path
    const timestamp = Date.now()
    const fileName = postId
      ? `${session.user.id}/${postId}/${timestamp}.${ext}`
      : `${session.user.id}/temp/${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, buffer, {
        contentType: outputMimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to save image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName)

    return NextResponse.json({
      imageUrl: urlData.publicUrl,
      prompt,
      style,
      aspectRatio,
      useCharacterImage: !!useCharacterImage && !!characterImageUrl,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
