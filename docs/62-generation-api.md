# チケット #62: 生成API実装

> Phase 4C | 優先度: 高 | 依存: #60, #61

## 概要

分析結果からプロフィールと投稿タイプを自動生成する API エンドポイント `POST /api/analysis/[id]/generate` を実装する。分析結果（`competitor_analyses.analysis_result`）を入力として、#60 のプロフィール生成と #61 の投稿タイプ生成を呼び出し、生成結果を `generated_configs` テーブルに `draft` ステータスで保存する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/analysis/[id]/generate/route.ts` | 新規作成 |
| `src/lib/api-utils.ts` | 更新（`requireAnalysisOwnership` を追加） |

## 変更内容

### 1. 分析の所有権チェック関数を追加

`src/lib/api-utils.ts` に `requireAnalysisOwnership` を追加:

```typescript
type CompetitorAnalysisRow = Database['public']['Tables']['competitor_analyses']['Row']

/**
 * 競合分析の所有権チェック
 */
export async function requireAnalysisOwnership(analysisId: string, userId: string) {
  const result = await checkOwnership<CompetitorAnalysisRow>(
    'competitor_analyses', analysisId, userId, '*', 'Analysis'
  )
  if (result.error) return { error: result.error, analysis: null }
  return { error: null, analysis: result.data }
}
```

### 2. 生成API ルート

`src/app/api/analysis/[id]/generate/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { generateProfile, generatePostTypes } from '@/lib/generation-prompts'
import type { InstagramAnalysisResult, BlogAnalysisResult } from '@/types/analysis'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. 認証チェック
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  // 2. 分析の所有権チェック
  const { id: analysisId } = await params
  const { error: ownerError, analysis } = await requireAnalysisOwnership(analysisId, userId!)
  if (ownerError) return ownerError

  // 3. 分析が完了しているか確認
  if (analysis!.status !== 'completed') {
    return NextResponse.json(
      { error: '分析が完了していません。ステータス: ' + analysis!.status },
      { status: 400 }
    )
  }

  if (!analysis!.analysis_result) {
    return NextResponse.json(
      { error: '分析結果がありません' },
      { status: 400 }
    )
  }

  try {
    // 4. 分析結果を型に変換
    const analysisResult = analysis!.analysis_result as Record<string, unknown>
    const sourceType = analysis!.source_type
    const sourceDisplayName = analysis!.source_display_name || analysis!.source_identifier

    let instagramResult: InstagramAnalysisResult | null = null
    let blogResult: BlogAnalysisResult | null = null

    if (sourceType === 'instagram') {
      instagramResult = analysisResult as unknown as InstagramAnalysisResult
    } else if (sourceType === 'blog') {
      blogResult = analysisResult as unknown as BlogAnalysisResult
    }

    // 5. プロフィール生成
    const generatedProfile = await generateProfile(
      instagramResult,
      blogResult,
      sourceDisplayName
    )

    // 6. 投稿タイプ生成
    const generatedPostTypes = await generatePostTypes(
      instagramResult,
      blogResult,
      sourceDisplayName
    )

    // 7. generated_configs に保存
    const supabase = createServerClient()
    const { data: config, error: insertError } = await supabase
      .from('generated_configs')
      .insert({
        user_id: userId!,
        analysis_id: analysisId,
        generation_config: {
          profile: generatedProfile,
          postTypes: generatedPostTypes,
        },
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

    // 8. レスポンス
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
```

### 3. 既存の generated_configs を再利用

同じ分析に対して再生成を行った場合、既存の `draft` ステータスの `generated_configs` を削除（または上書き）する:

```typescript
// 既存の draft を削除（再生成に対応）
await supabase
  .from('generated_configs')
  .delete()
  .eq('analysis_id', analysisId)
  .eq('user_id', userId!)
  .eq('status', 'draft')
```

### 4. レスポンス形式

```json
{
  "configId": "uuid-of-generated-config",
  "profile": {
    "name": "〇〇和菓子店 Instagram",
    "icon": "🍡",
    "description": "和菓子店のInstagram投稿用プロフィール",
    "system_prompt_memo": "分析サマリー...",
    "system_prompt": "あなたは飯田市の和菓子店...",
    "required_hashtags": ["和菓子", "飯田市", "〇〇堂"]
  },
  "postTypes": [
    {
      "name": "商品紹介",
      "slug": "product-showcase",
      "description": "新商品や定番商品の紹介",
      "icon": "🍡",
      "template_structure": "...",
      "placeholders": [...],
      "input_mode": "fields",
      "min_length": 200,
      "max_length": 400,
      "type_prompt": "..."
    }
  ]
}
```

### 5. エラーレスポンス

| ステータス | ケース |
|-----------|--------|
| 401 | 未認証 |
| 403 | 他ユーザーの分析 |
| 404 | 分析が存在しない |
| 400 | 分析が未完了、または分析結果が空 |
| 500 | AI生成失敗、DB保存失敗 |

## 受入条件

- `POST /api/analysis/[id]/generate` が認証済みユーザーで正常に動作する
- 未認証の場合に 401 が返る
- 他ユーザーの分析に対して 403 が返る
- 存在しない分析IDに対して 404 が返る
- ステータスが `completed` でない分析に対して 400 が返る
- 生成結果が `generated_configs` テーブルに `draft` ステータスで保存される
- レスポンスに `configId`, `profile`, `postTypes` が含まれる
- 同じ分析に対して再生成した場合、古い `draft` が削除される
- AI生成失敗時に適切なエラーメッセージが返る
- `npm run build` が成功する

## TODO

- [x] `src/lib/api-utils.ts` に `requireAnalysisOwnership()` を追加 → 既に存在
- [x] `src/app/api/analysis/[id]/generate/route.ts` を新規作成
- [x] 認証 + 所有権チェックを実装（`requireAuth` + `requireAnalysisOwnership`）
- [x] 分析ステータスのバリデーションを実装（`completed` 以外は 400）
- [x] `generateProfile()` 呼び出しを実装
- [x] `generatePostTypes()` 呼び出しを実装
- [x] `generated_configs` への保存を実装（`as unknown as Json` キャスト）
- [x] 既存 `draft` の削除（再生成対応）を実装
- [x] エラーハンドリング（AI失敗、DB失敗）を実装
- [x] プロフィール生成と投稿タイプ生成を `Promise.all` で並行実行
- [x] `npm run build` 成功を確認
