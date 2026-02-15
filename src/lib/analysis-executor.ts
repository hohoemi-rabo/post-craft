import { createServerClient } from '@/lib/supabase'
import { analyzeInstagramPosts, analyzeBlogPosts } from '@/lib/analysis-prompts'
import type { InstagramProfileData, BlogAnalysisInput } from '@/types/analysis'
import type { Json } from '@/types/supabase'

/**
 * 分析ステータスを更新するヘルパー
 */
async function updateAnalysisStatus(
  supabase: ReturnType<typeof createServerClient>,
  analysisId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  await supabase
    .from('competitor_analyses')
    .update({
      status,
      error_message: errorMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', analysisId)
}

/**
 * 分析を実行する
 * raw_data からソースタイプに応じた AI 分析を実行し、結果を保存する
 * fire-and-forget で呼び出されることを想定
 */
export async function executeAnalysis(analysisId: string): Promise<void> {
  const supabase = createServerClient()

  // 1. 分析レコードを取得
  const { data: analysis, error: fetchError } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', analysisId)
    .single()

  if (fetchError || !analysis) {
    console.error(`Analysis not found: ${analysisId}`, fetchError)
    return
  }

  // 2. raw_data の存在確認
  if (!analysis.raw_data) {
    await updateAnalysisStatus(supabase, analysisId, 'failed', 'ソースデータが見つかりません')
    return
  }

  // 3. ステータスを analyzing に更新
  await updateAnalysisStatus(supabase, analysisId, 'analyzing')

  try {
    let analysisResult: unknown

    // 4. ソースタイプに応じて AI 分析を実行
    if (analysis.source_type === 'instagram') {
      // raw_data には { profile, posts } が格納されている
      const rawData = analysis.raw_data as Record<string, unknown>
      const profileData: InstagramProfileData = rawData.profile
        ? (rawData.profile as unknown as InstagramProfileData)
        : {
            username: analysis.source_identifier || '',
            display_name: analysis.source_display_name || '',
            bio: '',
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            posts: (rawData.posts as unknown as InstagramProfileData['posts']) || [],
          }

      // posts が profile の外にある場合はマージ
      if (profileData.posts.length === 0 && Array.isArray(rawData.posts)) {
        profileData.posts = rawData.posts as unknown as InstagramProfileData['posts']
      }

      analysisResult = await analyzeInstagramPosts(profileData)
    } else if (analysis.source_type === 'blog') {
      const blogInput = analysis.raw_data as unknown as BlogAnalysisInput
      analysisResult = await analyzeBlogPosts(blogInput)
    } else {
      throw new Error(`Unknown source type: ${analysis.source_type}`)
    }

    // 5. 分析結果を保存、ステータスを completed に更新
    const { error: updateError } = await supabase
      .from('competitor_analyses')
      .update({
        analysis_result: analysisResult as unknown as Json,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error(`Failed to save analysis result for ${analysisId}:`, updateError)
      await updateAnalysisStatus(supabase, analysisId, 'failed', '分析結果の保存に失敗しました')
    }
  } catch (error) {
    // 6. エラー時はステータスを failed に更新
    const errorMessage = error instanceof Error ? error.message : '分析中にエラーが発生しました'
    console.error(`Analysis ${analysisId} failed:`, error)
    await updateAnalysisStatus(supabase, analysisId, 'failed', errorMessage)
  }
}
