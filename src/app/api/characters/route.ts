import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// GET /api/characters - List all characters for current user
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching characters:', error)
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/characters - Create a new character
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isDefault = formData.get('isDefault') === 'true'
    const imageFile = formData.get('image') as File | null

    // Validation
    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: 'Name is required and must be under 50 characters' },
        { status: 400 }
      )
    }
    if (!description || description.length < 10 || description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 500 characters' },
        { status: 400 }
      )
    }

    let imageUrl: string | null = null

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
      const timestamp = Date.now()
      const ext = imageFile.name.split('.').pop()
      const fileName = `${session.user.id}/${timestamp}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('characters')
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        )
      }

      const { data: urlData } = supabase.storage
        .from('characters')
        .getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('characters')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
    }

    // Create character
    const { data, error } = await supabase
      .from('characters')
      .insert({
        user_id: session.user.id,
        name,
        description,
        image_url: imageUrl,
        is_default: isDefault,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating character:', error)
      return NextResponse.json(
        { error: 'Failed to create character' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Character creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    )
  }
}
