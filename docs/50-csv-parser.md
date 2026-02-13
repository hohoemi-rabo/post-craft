# チケット #50: Bright Data CSV/JSONパーサー + アップロードAPI

> Phase 4A | 優先度: 高 | 依存: #49

## 概要

Bright Data からエクスポートされた Instagram 投稿データ（CSV/JSON形式）をパースし、内部データ構造に変換するパーサーライブラリと、ファイルアップロード用の API ルートを実装する。文字コード自動判定（Shift-JIS, UTF-8）、フィールドマッピング、バリデーション機能を含む。合わせて分析機能全体で使用する型定義ファイルも作成する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/types/analysis.ts` | 新規作成（分析関連の型定義） |
| `src/lib/csv-parser.ts` | 新規作成（CSV/JSONパーサー） |
| `src/app/api/analysis/upload/route.ts` | 新規作成（ファイルアップロードAPI） |

## 変更内容

### 1. 型定義 (`src/types/analysis.ts`)

SPEC-PHASE4.md Section 5.1.1 に基づく型定義:

```typescript
/**
 * Bright Data から取得した Instagram 投稿データ（共通データ構造）
 */
export interface InstagramPostData {
  post_id: string
  post_type: 'image' | 'carousel' | 'video' | 'reel'
  caption: string
  hashtags: string[]
  likes_count: number
  comments_count: number
  posted_at: string // ISO 8601
  engagement_rate?: number
  image_url?: string
}

/**
 * Instagram プロフィールデータ
 */
export interface InstagramProfileData {
  username: string
  display_name: string
  bio: string
  followers_count: number
  following_count: number
  posts_count: number
  posts: InstagramPostData[]
}

/**
 * ブログ記事データ（チケット #51 でも使用）
 */
export interface BlogPostData {
  url: string
  title: string
  content: string // 本文テキスト（HTML除去済み）
  published_at?: string
  categories?: string[]
  tags?: string[]
  word_count: number
}

/**
 * ブログ分析の入力データ
 */
export interface BlogAnalysisInput {
  blog_url: string
  blog_name: string
  posts: BlogPostData[]
}

/**
 * Instagram 分析結果（AI分析後の構造化データ）
 */
export interface InstagramAnalysisResult {
  post_type_distribution: {
    types: Array<{
      category: string
      percentage: number
      avg_engagement: number
      example_caption: string
    }>
    recommendation: string
  }
  tone_analysis: {
    primary_tone: string
    formality_level: number
    emoji_usage: string
    sentence_style: string
    first_person: string
    call_to_action_style: string
    sample_phrases: string[]
  }
  hashtag_strategy: {
    avg_count: number
    categories: Array<{
      type: string
      tags: string[]
      frequency: number
    }>
    top_performing_tags: string[]
    recommended_tags: string[]
  }
  posting_pattern: {
    avg_posts_per_week: number
    most_active_days: string[]
    most_active_hours: string[]
    posting_consistency: string
    recommendation: string
  }
  summary: string
  key_success_factors: string[]
}

/**
 * ブログ分析結果
 */
export interface BlogAnalysisResult {
  content_strengths: {
    main_topics: string[]
    unique_value: string
    target_audience: string
    writing_style: string
  }
  reusable_content: Array<{
    original_title: string
    original_url: string
    suggested_post_type: string
    suggested_caption_outline: string
    suggested_hashtags: string[]
  }>
  profile_material: {
    expertise_areas: string[]
    tone_keywords: string[]
    brand_message: string
  }
  summary: string
}

/**
 * CSV パース結果
 */
export interface CsvParseResult {
  profile: InstagramProfileData | null
  posts: InstagramPostData[]
  errors: string[]
  warnings: string[]
}

/**
 * 分析ソースの種別
 */
export type AnalysisSourceType = 'instagram' | 'blog'

/**
 * 分析ステータス
 */
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed'
```

### 2. CSVパーサー (`src/lib/csv-parser.ts`)

```typescript
import type { InstagramPostData, InstagramProfileData, CsvParseResult } from '@/types/analysis'

const MAX_POSTS = 200
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Bright Data CSV/JSON ファイルをパースして内部データ構造に変換する
 */
export async function parseBrightDataFile(file: File): Promise<CsvParseResult> {
  // 1. ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    return { profile: null, posts: [], errors: ['ファイルサイズが10MBを超えています'], warnings: [] }
  }

  // 2. ファイル形式判定
  const fileName = file.name.toLowerCase()
  if (fileName.endsWith('.json')) {
    return parseJsonFile(file)
  } else if (fileName.endsWith('.csv')) {
    return parseCsvFile(file)
  } else {
    return { profile: null, posts: [], errors: ['対応していないファイル形式です（CSV または JSON のみ）'], warnings: [] }
  }
}

/**
 * JSON形式のパース
 */
async function parseJsonFile(file: File): Promise<CsvParseResult> { ... }

/**
 * CSV形式のパース（文字コード自動判定付き）
 */
async function parseCsvFile(file: File): Promise<CsvParseResult> { ... }

/**
 * 文字コード判定（UTF-8 / Shift-JIS）
 * TextDecoder を使用し、BOM やバイトパターンで判定
 */
function detectEncoding(buffer: ArrayBuffer): string { ... }

/**
 * Bright Data のフィールド名を内部フィールドにマッピング
 * 例: 'likesCount' | 'likes_count' | 'Likes' → likes_count
 */
function mapFieldName(fieldName: string): string | null { ... }

/**
 * CSV行からInstagramPostDataに変換
 */
function rowToPostData(row: Record<string, string>): InstagramPostData | null { ... }

/**
 * キャプションからハッシュタグを抽出
 */
function extractHashtags(caption: string): string[] { ... }

/**
 * 投稿数の制限チェック
 */
function validatePostCount(posts: InstagramPostData[]): {
  posts: InstagramPostData[]
  warning: string | null
} { ... }
```

主な処理フロー:
1. ファイルサイズチェック（10MB上限）
2. ファイル形式判定（拡張子）
3. 文字コード自動判定（`TextDecoder` で UTF-8 / Shift-JIS を判定）
4. CSV の場合はヘッダー行解析 → 行パース → フィールドマッピング
5. JSON の場合はそのままパース → フィールドマッピング
6. バリデーション（必須フィールド: `post_id` or 代替ID, `caption`）
7. 投稿数制限（200件超過時はワーニング付きで先頭200件を使用）
8. ハッシュタグ抽出（キャプションから `#` で始まる文字列を抽出）

### 3. アップロードAPI (`src/app/api/analysis/upload/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { parseBrightDataFile } from '@/lib/csv-parser'

export async function POST(request: NextRequest) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const analysisId = formData.get('analysisId') as string | null

    // バリデーション
    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
    }
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId が必要です' }, { status: 400 })
    }

    // 所有権チェック
    const { error: ownerError } = await requireAnalysisOwnership(analysisId, userId)
    if (ownerError) return ownerError

    // ファイルパース
    const parseResult = await parseBrightDataFile(file)

    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        error: 'ファイルのパースに失敗しました',
        details: parseResult.errors,
      }, { status: 400 })
    }

    // 分析レコードを更新（raw_data, post_count）
    const supabase = createServerClient()
    const rawData = {
      profile: parseResult.profile,
      posts: parseResult.posts,
    }

    const { error: updateError } = await supabase
      .from('competitor_analyses')
      .update({
        raw_data: rawData,
        post_count: parseResult.posts.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
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
```

## 受入条件

- `src/types/analysis.ts` に全ての分析関連型が定義されている
- Bright Data の CSV ファイル（UTF-8）が正しくパースできる
- Bright Data の CSV ファイル（Shift-JIS）が正しくパースできる
- Bright Data の JSON ファイルが正しくパースできる
- 10MB を超えるファイルでエラーが返る
- CSV/JSON 以外のファイル形式でエラーが返る
- 200件を超える投稿がある場合、先頭200件のみ使用されワーニングが返る
- キャプションからハッシュタグが正しく抽出される
- POST `/api/analysis/upload` でファイルアップロード後に `competitor_analyses` の `raw_data` と `post_count` が更新される
- 認証・所有権チェックが正しく機能する
- `npm run build` が成功する

## TODO

- [ ] `src/types/analysis.ts` を作成（InstagramPostData, InstagramProfileData, BlogPostData 等）
- [ ] `src/lib/csv-parser.ts` を作成
- [ ] 文字コード自動判定の実装（UTF-8 / Shift-JIS）
- [ ] CSV パース処理の実装（ヘッダー解析 + フィールドマッピング）
- [ ] JSON パース処理の実装
- [ ] バリデーション処理の実装（ファイルサイズ、形式、必須フィールド）
- [ ] ハッシュタグ抽出ロジックの実装
- [ ] 投稿数制限の実装（200件上限）
- [ ] `src/app/api/analysis/upload/route.ts` を作成
- [ ] FormData からのファイル取得・バリデーション
- [ ] パース結果の `competitor_analyses` への保存
- [ ] エラーハンドリング（パースエラー、DBエラー）
- [ ] `npm run build` 成功を確認
