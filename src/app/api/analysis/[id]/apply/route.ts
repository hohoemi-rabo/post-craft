import { NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import type { GeneratedProfile, GeneratedPostType } from '@/types/analysis'
import type { Json } from '@/types/supabase'

interface ApplyRequestBody {
  configId: string
  profile?: Partial<GeneratedProfile>
  postTypes?: GeneratedPostType[]
}

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  slug: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('post_types')
    .select('slug')
    .eq('user_id', userId)
    .like('slug', `${slug}%`)

  if (!existing || existing.length === 0) return slug

  const existingSlugs = new Set(existing.map((e) => e.slug))
  if (!existingSlugs.has(slug)) return slug

  let counter = 2
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++
  }
  return `${slug}-${counter}`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. 認証チェック
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  // 2. 分析の所有権チェック
  const { id: analysisId } = await params
  const { error: ownerError } = await requireAnalysisOwnership(analysisId, userId)
  if (ownerError) return ownerError

  // 3. リクエストボディ取得
  const body: ApplyRequestBody = await request.json()
  const { configId, profile: profileOverride, postTypes: postTypesOverride } = body

  if (!configId) {
    return NextResponse.json(
      { error: 'configId は必須です' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // 4. generated_configs を取得
  const { data: config, error: configError } = await supabase
    .from('generated_configs')
    .select('*')
    .eq('id', configId)
    .eq('user_id', userId)
    .single()

  if (configError || !config) {
    return NextResponse.json(
      { error: '生成設定が見つかりません' },
      { status: 404 }
    )
  }

  if (config.status !== 'draft' && config.status !== 'applied') {
    return NextResponse.json(
      { error: '無効なステータスです: ' + config.status },
      { status: 400 }
    )
  }

  const generationConfig = config.generation_config as unknown as {
    profile: GeneratedProfile
    postTypes: GeneratedPostType[]
  }

  if (!generationConfig?.profile || !generationConfig?.postTypes) {
    return NextResponse.json(
      { error: '生成設定のデータが不正です' },
      { status: 400 }
    )
  }

  // 5. 適用するデータを決定（オーバーライドがあればマージ）
  const profileData: GeneratedProfile = profileOverride
    ? { ...generationConfig.profile, ...profileOverride }
    : generationConfig.profile

  const postTypesData: GeneratedPostType[] = postTypesOverride
    || generationConfig.postTypes

  try {
    // 6. 既存プロフィールの最大 sort_order を取得
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextProfileSortOrder = (existingProfiles?.[0]?.sort_order ?? -1) + 1

    // 7. プロフィールを作成
    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        name: profileData.name,
        icon: profileData.icon,
        description: profileData.description,
        system_prompt_memo: profileData.system_prompt_memo,
        system_prompt: profileData.system_prompt,
        required_hashtags: profileData.required_hashtags,
        is_default: false,
        sort_order: nextProfileSortOrder,
        source_analysis_id: analysisId,
      })
      .select()
      .single()

    if (profileError || !createdProfile) {
      console.error('Failed to create profile:', profileError)
      return NextResponse.json(
        { error: 'プロフィールの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 8. 既存投稿タイプの最大 sort_order を取得
    const { data: existingPostTypes } = await supabase
      .from('post_types')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const basePostTypeSortOrder = (existingPostTypes?.[0]?.sort_order ?? -1) + 1

    // 9. slug 重複チェック + 投稿タイプを一括作成
    const postTypeInserts = await Promise.all(
      postTypesData.map(async (pt, index) => {
        const uniqueSlug = await ensureUniqueSlug(supabase, userId, pt.slug)
        return {
          user_id: userId,
          name: pt.name,
          slug: uniqueSlug,
          description: pt.description || '',
          icon: pt.icon,
          template_structure: pt.template_structure,
          placeholders: pt.placeholders as unknown as Json,
          input_mode: pt.input_mode,
          min_length: pt.min_length,
          max_length: pt.max_length,
          type_prompt: pt.type_prompt,
          profile_id: createdProfile.id,
          sort_order: basePostTypeSortOrder + index,
          is_active: true,
          source_analysis_id: analysisId,
        }
      })
    )

    const { data: createdPostTypes, error: postTypesError } = await supabase
      .from('post_types')
      .insert(postTypeInserts)
      .select()

    if (postTypesError || !createdPostTypes) {
      console.error('Failed to create post types:', postTypesError)
      // ロールバック: プロフィールを削除
      await supabase.from('profiles').delete().eq('id', createdProfile.id)
      return NextResponse.json(
        { error: '投稿タイプの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 10. generated_configs を更新
    const postTypeIds = createdPostTypes.map((pt) => pt.id)
    await supabase
      .from('generated_configs')
      .update({
        generated_profile_id: createdProfile.id,
        generated_post_type_ids: postTypeIds,
        status: 'applied',
      })
      .eq('id', configId)

    // 11. レスポンス
    return NextResponse.json({
      profileId: createdProfile.id,
      profileName: createdProfile.name,
      postTypeIds,
      postTypeCount: createdPostTypes.length,
    })
  } catch (error) {
    console.error('Apply failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '適用に失敗しました' },
      { status: 500 }
    )
  }
}
