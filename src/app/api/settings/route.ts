import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'
import type { UserSettings } from '@/types/user-settings'
import type { UserSettingsRow } from '@/types/supabase'

function toUserSettings(row: UserSettingsRow): UserSettings {
  return {
    id: row.id,
    userId: row.user_id,
    requiredHashtags: row.required_hashtags,
    settings: row.settings as Record<string, unknown>,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

// GET /api/settings - Get user settings (auto-create if not exists)
export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    // Try to get existing settings
    const { data, error: fetchError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      return NextResponse.json(toUserSettings(data))
    }

    // Not found - create with defaults via UPSERT
    if (fetchError?.code === 'PGRST116') {
      const { data: created, error: createError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          required_hashtags: [],
          settings: {},
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (createError || !created) {
        console.error('Error creating user settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create user settings' },
          { status: 500 }
        )
      }

      return NextResponse.json(toUserSettings(created))
    }

    console.error('Error fetching user settings:', fetchError)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update general settings
export async function PUT(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { settings } = body

    if (settings === undefined) {
      return NextResponse.json({ error: 'Settings field is required' }, { status: 400 })
    }

    const { data, error: upsertError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings,
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (upsertError || !data) {
      console.error('Error updating settings:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(toUserSettings(data))
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
