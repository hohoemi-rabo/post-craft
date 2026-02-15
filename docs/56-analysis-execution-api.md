# チケット #56: 分析実行ロジック統合

> Phase 4B | 優先度: 高 | 依存: #54, #55

## 概要

分析APIルート（#49 で作成した `POST /api/analysis`）にAI分析の実行ロジックを統合する。新規分析作成時に、ソースタイプ（Instagram / ブログ）に応じて適切なAI分析プロンプト（#54, #55）を呼び出し、分析結果を `competitor_analyses.analysis_result` にJSONBとして保存する。Instagram + ブログの両方が指定された場合は2つの `competitor_analyses` レコードを作成し、それぞれ分析を実行する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/analysis/route.ts` | 更新（POST に分析実行ロジックを追加） |
| `src/app/api/analysis/[id]/status/route.ts` | 新規作成（ステータスポーリング用） |
| `src/lib/analysis-executor.ts` | 新規作成（分析実行のオーケストレーション） |

## 変更内容

### 1. 分析実行オーケストレーター (`src/lib/analysis-executor.ts`)

分析のライフサイクル管理を担う関数群を実装する。

```typescript
import { createServerClient } from '@/lib/supabase'
import { analyzeInstagramPosts } from '@/lib/analysis-prompts'
import { analyzeBlogPosts } from '@/lib/analysis-prompts'
import type {
  InstagramProfileData,
  BlogAnalysisInput,
} from '@/types/analysis'

/**
 * 分析を実行する
 * ステータスを analyzing → completed (or failed) に更新しながらAI分析を実行
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
    throw new Error(`Analysis not found: ${analysisId}`)
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

    // 4. ソースタイプに応じてAI分析を実行
    if (analysis.source_type === 'instagram') {
      const profileData = analysis.raw_data as unknown as InstagramProfileData
      analysisResult = await analyzeInstagramPosts(profileData)
    } else if (analysis.source_type === 'blog') {
      const blogInput = analysis.raw_data as unknown as BlogAnalysisInput
      analysisResult = await analyzeBlogPosts(blogInput)
    } else {
      throw new Error(`Unknown source type: ${analysis.source_type}`)
    }

    // 5. 分析結果を保存、ステータスを completed に更新
    await supabase
      .from('competitor_analyses')
      .update({
        analysis_result: analysisResult,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

  } catch (error) {
    // 6. エラー時はステータスを failed に更新
    const errorMessage = error instanceof Error ? error.message : '分析中にエラーが発生しました'
    console.error(`Analysis ${analysisId} failed:`, error)
    await updateAnalysisStatus(supabase, analysisId, 'failed', errorMessage)
  }
}

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
```

### 2. POST `/api/analysis` の更新

既存の POST エンドポイント（#49）に分析実行の起動を追加する。

```typescript
import { requireAuth } from '@/lib/api-utils'
import { executeAnalysis } from '@/lib/analysis-executor'

export async function POST(request: Request) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const body = await request.json()
  // body: { sources: [{ type: 'instagram' | 'blog', ... }] }

  const supabase = createServerClient()
  const analysisIds: string[] = []

  // ソースごとに competitor_analyses レコードを作成
  for (const source of body.sources) {
    const { data, error } = await supabase
      .from('competitor_analyses')
      .insert({
        user_id: userId,
        source_type: source.type,
        source_identifier: source.identifier,
        source_display_name: source.displayName,
        raw_data: source.rawData,
        status: 'pending',
        data_source: source.dataSource || 'upload',
        post_count: source.postCount,
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
    }
    analysisIds.push(data.id)
  }

  // 各分析を非同期で実行開始（レスポンスは先に返す）
  for (const id of analysisIds) {
    // fire-and-forget: バックグラウンドで実行
    executeAnalysis(id).catch((err) => {
      console.error(`Background analysis ${id} failed:`, err)
    })
  }

  return NextResponse.json({ analysisIds })
}
```

**重要**: `executeAnalysis()` は `await` せずに呼び出す（fire-and-forget パターン）。クライアントはステータスポーリングで進捗を追跡する。

### 3. ステータスポーリング API (`/api/analysis/[id]/status`)

```typescript
// src/app/api/analysis/[id]/status/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('competitor_analyses')
    .select('id, status, error_message, post_count, updated_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
```

### 4. 両方（Instagram + ブログ）の同時分析

ウィザードで「両方」を選択した場合のリクエスト例:

```json
{
  "sources": [
    {
      "type": "instagram",
      "identifier": "@wagashi_tokyo",
      "displayName": "東京和菓子店",
      "rawData": { "username": "wagashi_tokyo", "posts": [...] },
      "dataSource": "upload",
      "postCount": 87
    },
    {
      "type": "blog",
      "identifier": "https://example.com/blog",
      "displayName": "〇〇和菓子店ブログ",
      "rawData": { "blog_url": "...", "blog_name": "...", "posts": [...] },
      "dataSource": "upload",
      "postCount": 43
    }
  ]
}
```

レスポンスは `analysisIds` の配列を返し、クライアントは各IDに対してステータスポーリングを行う。

### 5. Vercel maxDuration の設定

AI分析は最大30秒かかるため、APIルートに `maxDuration` を設定:

```typescript
// route.ts の先頭
export const maxDuration = 60 // 秒
```

ただし fire-and-forget パターンを使用するため、POST 自体はすぐにレスポンスを返す。`executeAnalysis()` がバックグラウンドで実行される。Vercel の Serverless Function のライフサイクルに注意し、必要に応じて Edge Function や外部ジョブキューの検討を記録しておく。

## 受入条件

- `POST /api/analysis` でソースデータ付きのリクエストを受け取ると `competitor_analyses` レコードが作成される
- レコード作成後、バックグラウンドでAI分析が実行される
- Instagram ソースタイプの場合 `analyzeInstagramPosts()` が呼ばれる
- ブログソースタイプの場合 `analyzeBlogPosts()` が呼ばれる
- 分析成功時に `status` が `completed`、`analysis_result` にJSON結果が保存される
- 分析失敗時に `status` が `failed`、`error_message` にエラー内容が保存される
- 両方のソースが指定された場合、2つの `competitor_analyses` レコードが作成されそれぞれ分析される
- `GET /api/analysis/[id]/status` でステータスをポーリングできる
- 認証チェック（`requireAuth()`）が全エンドポイントで実装されている
- 所有権チェック（`user_id` 一致）がステータスAPIで実装されている

## TODO

- [x] `src/lib/analysis-executor.ts` を新規作成
- [x] `executeAnalysis()` 関数を実装（ソースタイプ分岐 + エラーハンドリング）
- [x] `updateAnalysisStatus()` ヘルパー関数を実装
- [x] `POST /api/analysis/upload` に fire-and-forget 実行を統合
- [x] `POST /api/analysis/blog-crawl` に fire-and-forget 実行を統合
- [x] `GET /api/analysis/[id]/status` ステータスポーリングAPI（#49 で作成済み）
- [x] 両方のソース同時分析のフロー（各ルートで個別に executeAnalysis が呼ばれる）
- [x] `raw_data` が存在しない場合のエラーハンドリング
- [ ] Vercel デプロイ時の `maxDuration` 設定を確認
- [ ] fire-and-forget パターンの動作検証（Vercel 環境での制約確認）
