import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { crawlBlog } from '@/lib/blog-crawler'
import { executeAnalysis } from '@/lib/analysis-executor'
import type { Json } from '@/types/supabase'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  let analysisId: string | undefined

  try {
    const body = await request.json()
    const { blogUrl, blogName } = body
    analysisId = body.analysisId

    if (!blogUrl) {
      return NextResponse.json({ error: 'ブログURLが必要です' }, { status: 400 })
    }
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId が必要です' }, { status: 400 })
    }

    const { error: ownerError } = await requireAnalysisOwnership(analysisId, userId)
    if (ownerError) return ownerError

    const supabase = createServerClient()

    // ステータスを analyzing に更新
    await supabase
      .from('competitor_analyses')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', analysisId)

    // ブログクロール実行
    const result = await crawlBlog(blogUrl)

    if (result.posts.length === 0) {
      await supabase
        .from('competitor_analyses')
        .update({
          status: 'failed',
          error_message: result.errors.join(', ') || '記事を取得できませんでした',
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId)

      return NextResponse.json({
        error: '記事を取得できませんでした',
        details: result.errors,
      }, { status: 400 })
    }

    // raw_data を保存
    const rawData = {
      blog_url: blogUrl,
      blog_name: blogName || '',
      posts: result.posts,
      strategy: result.strategy,
      totalFound: result.totalFound,
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
      console.error('Failed to save crawl result:', updateError)
      return NextResponse.json({ error: 'データの保存に失敗しました' }, { status: 500 })
    }

    // AI 分析をバックグラウンドで実行（fire-and-forget）
    executeAnalysis(analysisId).catch((err) => {
      console.error(`Background analysis ${analysisId} failed:`, err)
    })

    return NextResponse.json({
      success: true,
      postCount: result.posts.length,
      totalFound: result.totalFound,
      strategy: result.strategy,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Blog crawl error:', error)

    // エラー時にステータスを更新
    if (analysisId) {
      try {
        const supabase = createServerClient()
        await supabase
          .from('competitor_analyses')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'クロール処理に失敗しました',
            updated_at: new Date().toISOString(),
          })
          .eq('id', analysisId)
      } catch {
        // ステータス更新失敗は無視
      }
    }

    return NextResponse.json({ error: 'ブログのクロールに失敗しました' }, { status: 500 })
  }
}
