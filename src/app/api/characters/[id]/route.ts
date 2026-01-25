import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

// PUT /api/characters/[id] - Update a character
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerClient()

  try {
    // Check ownership
    const { data: existing } = await supabase
      .from('characters')
      .select('id, user_id, image_url')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

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

    let imageUrl = existing.image_url

    // Upload new image if provided
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

      // Delete old image
      if (existing.image_url) {
        const oldPath = existing.image_url.split('/').slice(-2).join('/')
        await supabase.storage.from('characters').remove([oldPath])
      }
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('characters')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
        .neq('id', id)
    }

    // Update character
    const { data, error } = await supabase
      .from('characters')
      .update({
        name,
        description,
        image_url: imageUrl,
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating character:', error)
      return NextResponse.json(
        { error: 'Failed to update character' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Character update error:', error)
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    )
  }
}

// DELETE /api/characters/[id] - Delete a character
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerClient()

  try {
    // Check ownership and get image URL
    const { data: existing } = await supabase
      .from('characters')
      .select('id, user_id, image_url')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete image from storage
    if (existing.image_url) {
      const path = existing.image_url.split('/').slice(-2).join('/')
      await supabase.storage.from('characters').remove([path])
    }

    // Delete character
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting character:', error)
      return NextResponse.json(
        { error: 'Failed to delete character' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Character deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    )
  }
}
