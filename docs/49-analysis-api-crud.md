# チケット #49: 分析API - CRUD実装

> Phase 4A | 優先度: 高 | 依存: #47

## 概要

分析機能の基本的な CRUD API ルートを実装する。分析一覧の取得（ページネーション付き）、新規分析レコードの作成、分析詳細の取得、分析の削除、ステータスのポーリング用エンドポイントを提供する。全ルートで `requireAuth()` による認証チェックを行い、所有権チェックも実装する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/analysis/route.ts` | 新規作成（GET: 一覧, POST: 作成） |
| `src/app/api/analysis/[id]/route.ts` | 新規作成（GET: 詳細, DELETE: 削除） |
| `src/app/api/analysis/[id]/status/route.ts` | 新規作成（GET: ステータス確認） |
| `src/lib/api-utils.ts` | 更新（`requireAnalysisOwnership` 追加） |

## 変更内容

### 1. ディレクトリ構造

```
src/app/api/analysis/
├── route.ts                 # GET (list), POST (create)
├── [id]/
│   ├── route.ts             # GET (detail), DELETE
│   └── status/route.ts      # GET (status polling)
```

### 2. GET `/api/analysis` - 分析一覧取得

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabase = createServerClient()

  // 総件数を取得
  const { count } = await supabase
    .from('competitor_analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // データ取得（generated_configs も JOIN）
  const { data, error } = await supabase
    .from('competitor_analyses')
    .select('*, generated_configs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }

  return NextResponse.json({
    analyses: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
```

### 3. POST `/api/analysis` - 新規分析作成

```typescript
export async function POST(request: Request) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const body = await request.json()
  const { sourceType, sourceIdentifier, sourceDisplayName, dataSource } = body

  // バリデーション
  if (!sourceType || !['instagram', 'blog'].includes(sourceType)) {
    return NextResponse.json({ error: 'Invalid source_type' }, { status: 400 })
  }
  if (!sourceIdentifier) {
    return NextResponse.json({ error: 'source_identifier is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('competitor_analyses')
    .insert({
      user_id: userId,
      source_type: sourceType,
      source_identifier: sourceIdentifier,
      source_display_name: sourceDisplayName || null,
      data_source: dataSource || 'upload',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### 4. GET `/api/analysis/[id]` - 分析詳細取得

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError, analysis } = await requireAnalysisOwnership(id, userId)
  if (ownerError) return ownerError

  // generated_configs も JOIN して返す
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('competitor_analyses')
    .select('*, generated_configs(*)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### 5. DELETE `/api/analysis/[id]` - 分析削除

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError } = await requireAnalysisOwnership(id, userId)
  if (ownerError) return ownerError

  const supabase = createServerClient()
  const { error } = await supabase
    .from('competitor_analyses')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### 6. GET `/api/analysis/[id]/status` - ステータスポーリング

軽量なエンドポイント。ウィザードの Step 3 から 2 秒間隔でポーリングされることを想定。

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('competitor_analyses')
    .select('id, status, post_count, error_message, updated_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
```

### 7. api-utils.ts に所有権チェック関数追加

```typescript
import type { Database } from '@/types/supabase'

type CompetitorAnalysisRow = Database['public']['Tables']['competitor_analyses']['Row']

/**
 * 分析の所有権チェック
 */
export async function requireAnalysisOwnership(analysisId: string, userId: string) {
  const result = await checkOwnership<CompetitorAnalysisRow>(
    'competitor_analyses', analysisId, userId, '*', 'Analysis'
  )
  if (result.error) return { error: result.error, analysis: null }
  return { error: null, analysis: result.data }
}
```

## 受入条件

- GET `/api/analysis` で認証済みユーザーの分析一覧が取得できる（ページネーション付き）
- POST `/api/analysis` で新規分析レコードが作成できる（status: 'pending'）
- POST `/api/analysis` で `sourceType` が `instagram` / `blog` 以外の場合に 400 エラーが返る
- GET `/api/analysis/[id]` で分析詳細（`generated_configs` 含む）が取得できる
- GET `/api/analysis/[id]` で他ユーザーの分析にアクセスした場合に 403 エラーが返る
- DELETE `/api/analysis/[id]` で分析と関連する `generated_configs` が削除される
- GET `/api/analysis/[id]/status` で軽量なステータス情報が取得できる
- 全エンドポイントで未認証の場合に 401 エラーが返る
- `requireAnalysisOwnership` が `api-utils.ts` に追加されている
- `npm run build` が成功する

## TODO

- [ ] `src/app/api/analysis/route.ts` を作成（GET: 一覧, POST: 作成）
- [ ] `src/app/api/analysis/[id]/route.ts` を作成（GET: 詳細, DELETE: 削除）
- [ ] `src/app/api/analysis/[id]/status/route.ts` を作成（GET: ステータス）
- [ ] `src/lib/api-utils.ts` に `requireAnalysisOwnership` を追加
- [ ] `api-utils.ts` の `TableName` 型に `competitor_analyses` が含まれることを確認
- [ ] バリデーションのテスト（不正な `sourceType`、必須フィールド欠落）
- [ ] ページネーションの動作確認
- [ ] 所有権チェックの動作確認（他ユーザーの分析にアクセス不可）
- [ ] `npm run build` 成功を確認
