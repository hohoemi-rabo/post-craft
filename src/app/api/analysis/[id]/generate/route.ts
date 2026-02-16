import { NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { generateProfile, generatePostTypes } from '@/lib/generation-prompts'
import type { InstagramAnalysisResult, BlogAnalysisResult } from '@/types/analysis'
import type { Json } from '@/types/supabase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id: analysisId } = await params
  const { error: ownerError, analysis } = await requireAnalysisOwnership(analysisId, userId)
  if (ownerError) return ownerError

  if (analysis.status !== 'completed') {
    return NextResponse.json(
      { error: '分析が完了していません。ステータス: ' + analysis.status },
      { status: 400 }
    )
  }

  if (!analysis.analysis_result) {
    return NextResponse.json(
      { error: '分析結果がありません' },
      { status: 400 }
    )
  }

  try {
    const sourceType = analysis.source_type
    const sourceDisplayName = analysis.source_display_name || analysis.source_identifier

    let instagramResult: InstagramAnalysisResult | null = null
    let blogResult: BlogAnalysisResult | null = null

    if (sourceType === 'instagram') {
      instagramResult = analysis.analysis_result as unknown as InstagramAnalysisResult
    } else if (sourceType === 'blog') {
      blogResult = analysis.analysis_result as unknown as BlogAnalysisResult
    }

    // プロフィール生成 + 投稿タイプ生成
    const [generatedProfile, generatedPostTypes] = await Promise.all([
      generateProfile(instagramResult, blogResult, sourceDisplayName),
      generatePostTypes(instagramResult, blogResult, sourceDisplayName),
    ])

    // 必須ハッシュタグを最大4個に制限
    if (generatedProfile.required_hashtags.length > 4) {
      generatedProfile.required_hashtags = generatedProfile.required_hashtags.slice(0, 4)
    }

    const supabase = createServerClient()

    // 既存の draft を削除（再生成対応）
    await supabase
      .from('generated_configs')
      .delete()
      .eq('analysis_id', analysisId)
      .eq('user_id', userId)
      .eq('status', 'draft')

    // generated_configs に保存
    const { data: config, error: insertError } = await supabase
      .from('generated_configs')
      .insert({
        user_id: userId,
        analysis_id: analysisId,
        generation_config: {
          profile: generatedProfile,
          postTypes: generatedPostTypes,
        } as unknown as Json,
        status: 'draft',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save generated config:', insertError)
      return NextResponse.json(
        { error: '生成結果の保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      configId: config.id,
      profile: generatedProfile,
      postTypes: generatedPostTypes,
    })
  } catch (error) {
    console.error('Generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成に失敗しました' },
      { status: 500 }
    )
  }
}
