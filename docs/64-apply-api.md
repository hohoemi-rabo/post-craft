# チケット #64: 適用API実装

> Phase 4C | 優先度: 高 | 依存: #62, #48

## 概要

生成プレビューで承認された内容を実際に `profiles` テーブルと `post_types` テーブルに保存する API エンドポイント `POST /api/analysis/[id]/apply` を実装する。生成済みの `generated_configs` からデータを取得し、オプションで編集済みデータによるオーバーライドを受け付ける。適用後は `generated_configs` のステータスを `applied` に更新し、作成されたプロフィール ID と投稿タイプ ID を記録する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/analysis/[id]/apply/route.ts` | 新規作成 |

## 変更内容

### 1. 適用API ルート

`src/app/api/analysis/[id]/apply/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import type { GeneratedProfile, GeneratedPostType } from '@/types/analysis'

interface ApplyRequestBody {
  configId: string
  profile?: Partial<GeneratedProfile>   // 編集済みオーバーライド（オプション）
  postTypes?: GeneratedPostType[]       // 編集済みオーバーライド（オプション）
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
  const { error: ownerError } = await requireAnalysisOwnership(analysisId, userId!)
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
    .eq('user_id', userId!)
    .single()

  if (configError || !config) {
    return NextResponse.json(
      { error: '生成設定が見つかりません' },
      { status: 404 }
    )
  }

  // ステータスチェック（draft または applied の再適用を許可）
  if (config.status !== 'draft' && config.status !== 'applied') {
    return NextResponse.json(
      { error: '無効なステータスです: ' + config.status },
      { status: 400 }
    )
  }

  const generationConfig = config.generation_config as {
    profile: GeneratedProfile
    postTypes: GeneratedPostType[]
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
      .eq('user_id', userId!)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextProfileSortOrder = (existingProfiles?.[0]?.sort_order ?? -1) + 1

    // 7. プロフィールを作成
    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId!,
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
      .eq('user_id', userId!)
      .order('sort_order', { ascending: false })
      .limit(1)

    const basePostTypeSortOrder = (existingPostTypes?.[0]?.sort_order ?? -1) + 1

    // 9. 投稿タイプを一括作成
    const postTypeInserts = postTypesData.map((pt, index) => ({
      user_id: userId!,
      name: pt.name,
      slug: pt.slug,
      description: pt.description || '',
      icon: pt.icon,
      template_structure: pt.template_structure,
      placeholders: pt.placeholders,
      input_mode: pt.input_mode,
      min_length: pt.min_length,
      max_length: pt.max_length,
      type_prompt: pt.type_prompt,
      profile_id: createdProfile.id,
      sort_order: basePostTypeSortOrder + index,
      is_active: true,
      is_builtin: false,
      source_analysis_id: analysisId,
    }))

    const { data: createdPostTypes, error: postTypesError } = await supabase
      .from('post_types')
      .insert(postTypeInserts)
      .select()

    if (postTypesError || !createdPostTypes) {
      console.error('Failed to create post types:', postTypesError)
      // プロフィールは作成済みなのでロールバック
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
```

### 2. レスポンス形式

```json
{
  "profileId": "uuid-of-created-profile",
  "profileName": "〇〇和菓子店 Instagram",
  "postTypeIds": ["uuid-1", "uuid-2", "uuid-3", "uuid-4"],
  "postTypeCount": 4
}
```

### 3. エラーレスポンス

| ステータス | ケース |
|-----------|--------|
| 401 | 未認証 |
| 403 | 他ユーザーの分析 |
| 404 | 分析が存在しない / 生成設定が存在しない |
| 400 | `configId` 未指定 / 無効なステータス |
| 500 | プロフィール作成失敗 / 投稿タイプ作成失敗 |

### 4. トランザクション的な安全性

- 投稿タイプの作成に失敗した場合、作成済みのプロフィールを削除してロールバック
- `generated_configs` の更新は最後に実行（プロフィール・投稿タイプの作成が成功してから）
- slug の重複を考慮（同じユーザーの既存 slug と被る場合はサフィックス付与）

### 5. slug 重複対応

```typescript
// slug の重複チェックとサフィックス付与
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
```

## 受入条件

- `POST /api/analysis/[id]/apply` が認証済みユーザーで正常に動作する
- `profiles` テーブルに新しいプロフィールが作成される
  - `source_analysis_id` が正しく設定されている
  - `is_default` が `false` に設定されている
  - `sort_order` が既存プロフィールの最後に設定されている
- `post_types` テーブルに 3〜5 個の投稿タイプが作成される
  - `profile_id` が新しいプロフィールの ID に設定されている
  - `source_analysis_id` が正しく設定されている
  - `is_active` が `true`、`is_builtin` が `false` に設定されている
  - `sort_order` が既存投稿タイプの最後から順番に設定されている
- `generated_configs` のステータスが `applied` に更新される
- `generated_configs` に `generated_profile_id` と `generated_post_type_ids` が記録される
- オーバーライドデータが正しくマージされる
- 投稿タイプ作成失敗時にプロフィールがロールバックされる
- slug 重複時にサフィックスが付与される
- `npm run build` が成功する

## TODO

- [x] `src/app/api/analysis/[id]/apply/route.ts` を新規作成
- [x] 認証 + 所有権チェックを実装
- [x] `generated_configs` の取得とステータスチェックを実装
- [x] オーバーライドデータのマージロジックを実装
- [x] `profiles` テーブルへの挿入を実装（`source_analysis_id` 含む）
- [x] `post_types` テーブルへの一括挿入を実装（`profile_id`, `source_analysis_id` 含む）
- [x] `sort_order` の自動計算を実装
- [x] slug 重複チェック + サフィックス付与を実装
- [x] `generated_configs` のステータス更新を実装
- [x] 投稿タイプ作成失敗時のプロフィール削除（ロールバック）を実装
- [x] 各エラーケースの動作を検証
- [x] `npm run build` 成功を確認
