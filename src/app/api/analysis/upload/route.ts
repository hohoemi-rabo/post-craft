import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { parseBrightDataFile } from '@/lib/csv-parser'
import type { Json } from '@/types/supabase'

export async function POST(request: NextRequest) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const analysisId = formData.get('analysisId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
    }
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId が必要です' }, { status: 400 })
    }

    const { error: ownerError } = await requireAnalysisOwnership(analysisId, userId)
    if (ownerError) return ownerError

    const parseResult = await parseBrightDataFile(file)

    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        error: 'ファイルのパースに失敗しました',
        details: parseResult.errors,
      }, { status: 400 })
    }

    const supabase = createServerClient()
    const rawData = {
      profile: parseResult.profile,
      posts: parseResult.posts,
    } as unknown as Json

    const { error: updateError } = await supabase
      .from('competitor_analyses')
      .update({
        raw_data: rawData,
        post_count: parseResult.posts.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('Failed to save parse result:', updateError)
      return NextResponse.json({ error: 'データの保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      postCount: parseResult.posts.length,
      profile: parseResult.profile
        ? {
            username: parseResult.profile.username,
            displayName: parseResult.profile.display_name,
            followersCount: parseResult.profile.followers_count,
          }
        : null,
      warnings: parseResult.warnings,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'アップロード処理に失敗しました' }, { status: 500 })
  }
}
