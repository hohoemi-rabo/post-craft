import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { executeAnalysis } from '@/lib/analysis-executor'
import {
  fetchInstagramPostsViaBrightData,
  isBrightDataConfigured,
  BrightDataError,
} from '@/lib/brightdata'
import type { Json } from '@/types/supabase'

// Bright Data はジョブ完了まで数分かかるため上限を引き上げる
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  let analysisId: string | undefined

  try {
    const body = await request.json()
    const { accountName, numOfPosts } = body
    analysisId = body.analysisId

    if (!accountName) {
      return NextResponse.json({ error: 'アカウント名が必要です' }, { status: 400 })
    }
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId が必要です' }, { status: 400 })
    }
    if (!isBrightDataConfigured()) {
      return NextResponse.json(
        { error: 'Bright Data API が設定されていません。CSVアップロードをご利用ください' },
        { status: 503 }
      )
    }

    const { error: ownerError } = await requireAnalysisOwnership(analysisId, userId)
    if (ownerError) return ownerError

    const supabase = createServerClient()

    // ステータスを analyzing に更新
    await supabase
      .from('competitor_analyses')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', analysisId)

    // Bright Data からリアルタイム取得
    const result = await fetchInstagramPostsViaBrightData(accountName, {
      numOfPosts: typeof numOfPosts === 'number' ? numOfPosts : undefined,
    })

    const rawData = {
      profile: result.profile,
      posts: result.posts,
    } as unknown as Json

    const { error: updateError } = await supabase
      .from('competitor_analyses')
      .update({
        raw_data: rawData,
        post_count: result.posts.length,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('Failed to save Bright Data result:', updateError)
      return NextResponse.json({ error: 'データの保存に失敗しました' }, { status: 500 })
    }

    // AI 分析をバックグラウンドで実行（fire-and-forget）
    executeAnalysis(analysisId).catch((err) => {
      console.error(`Background analysis ${analysisId} failed:`, err)
    })

    return NextResponse.json({
      success: true,
      postCount: result.posts.length,
      profile: result.profile
        ? {
            username: result.profile.username,
            displayName: result.profile.display_name,
            followersCount: result.profile.followers_count,
          }
        : null,
      warnings: result.warnings,
    })
  } catch (error) {
    const message =
      error instanceof BrightDataError
        ? error.message
        : 'Instagram データの取得に失敗しました'
    console.error('Bright Data fetch error:', error)

    // エラー時にステータスを failed に更新
    if (analysisId) {
      try {
        const supabase = createServerClient()
        await supabase
          .from('competitor_analyses')
          .update({
            status: 'failed',
            error_message: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', analysisId)
      } catch {
        // ステータス更新失敗は無視
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
