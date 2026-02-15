# チケット #55: ブログ AI分析プロンプト設計

> Phase 4B | 優先度: 高 | 依存: #51

## 概要

ブログ記事群を分析するAIプロンプトと型定義を設計・実装する。ブログクローラー（#51）が取得した記事データ（タイトル、本文、カテゴリ、タグ等）をGemini Flashに渡し、コンテンツの強み・SNS転用可能なネタ・プロフィール生成用の素材を構造化JSONとして抽出する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/analysis-prompts.ts` | 更新（ブログ分析関数を追加） |
| `src/types/analysis.ts` | 更新（ブログ分析の型を追加） |

## 変更内容

### 1. 型定義の追加 (`src/types/analysis.ts`)

SPEC-PHASE4.md セクション 5.2.1 / 5.2.2 に準拠した型定義を追加する。

```typescript
// --- ブログ入力データ型 ---

export interface BlogPostData {
  url: string
  title: string
  content: string          // 本文テキスト（HTML除去済み）
  published_at?: string    // ISO 8601
  categories?: string[]
  tags?: string[]
  word_count: number
}

export interface BlogAnalysisInput {
  blog_url: string
  blog_name: string
  posts: BlogPostData[]
}

// --- ブログ分析結果型 ---

export interface BlogAnalysisResult {
  // 1. コンテンツの強み
  content_strengths: {
    main_topics: string[]     // 主要テーマ（最大5つ）
    unique_value: string      // 独自の価値・専門性
    target_audience: string   // 想定読者層
    writing_style: string     // 文体の特徴
  }

  // 2. SNS転用可能なネタ
  reusable_content: Array<{
    original_title: string
    original_url: string
    suggested_post_type: string        // PostCraftの投稿タイプにマッピング
    suggested_caption_outline: string  // キャプション案の概要
    suggested_hashtags: string[]       // 推奨ハッシュタグ
  }>

  // 3. プロフィール生成用の素材
  profile_material: {
    expertise_areas: string[]    // 専門分野
    tone_keywords: string[]      // トーンを表すキーワード
    brand_message: string        // ブランドメッセージ案
  }

  // 総合サマリー
  summary: string
}
```

### 2. ブログ分析プロンプト関数 (`src/lib/analysis-prompts.ts`)

```typescript
import type {
  BlogAnalysisInput,
  BlogAnalysisResult,
} from '@/types/analysis'

/**
 * ブログ記事群をAIで分析し、コンテンツの強み等を構造化JSONで抽出する
 *
 * @param input - ブログURL、名前、記事データの配列
 * @returns 構造化された分析結果
 * @throws Error - AI応答のパース失敗時
 */
export async function analyzeBlogPosts(
  input: BlogAnalysisInput
): Promise<BlogAnalysisResult> {
  const prompt = buildBlogAnalysisPrompt(input)

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()

  try {
    const parsed = parseJsonResponse<BlogAnalysisResult>(text)
    validateBlogAnalysisResult(parsed)
    return parsed
  } catch (error) {
    console.error('Blog analysis parse error:', error)
    console.error('Raw AI response:', text.slice(0, 500))
    throw new Error(
      `ブログ分析結果のパースに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
```

### 3. プロンプト構築

プロンプトは以下の構成で設計する:

- **役割設定**: コンテンツマーケティングの専門家で、ブログからSNS素材を抽出するスペシャリスト
- **入力データ**: ブログ名、URL + 記事データ（タイトル、本文要約、カテゴリ、タグ）
- **分析指示**:
  - コンテンツの強み: 主要テーマは最大5つ、独自の価値を1文で要約
  - SNS転用可能なネタ: 最大10件、PostCraftの投稿タイプ（solution, tips, useful, howto, showcase, promotion）にマッピング
  - プロフィール生成用素材: 専門分野キーワード、トーンキーワード、ブランドメッセージ案
- **出力形式**: `BlogAnalysisResult` に準拠したJSON
- **制約**: 日本語出力

記事本文が長い場合のトリミング戦略:

```typescript
function prepareBlogDataForPrompt(input: BlogAnalysisInput): string {
  // 各記事を要約形式に変換（本文は先頭500文字に制限）
  const summarizedPosts = input.posts.map((post) => ({
    title: post.title,
    url: post.url,
    content_preview: post.content.slice(0, 500),
    word_count: post.word_count,
    categories: post.categories,
    tags: post.tags,
    published_at: post.published_at,
  }))

  // 最大50記事に制限（最新順）
  const limitedPosts = summarizedPosts.slice(0, 50)

  return JSON.stringify({
    blog_name: input.blog_name,
    blog_url: input.blog_url,
    total_posts: input.posts.length,
    analyzed_posts: limitedPosts.length,
    posts: limitedPosts,
  }, null, 2)
}
```

### 4. バリデーション

```typescript
function validateBlogAnalysisResult(
  result: unknown
): asserts result is BlogAnalysisResult {
  const r = result as Record<string, unknown>

  if (!r.content_strengths) {
    throw new Error('content_strengths が不足しています')
  }
  if (!Array.isArray(r.reusable_content)) {
    throw new Error('reusable_content が配列ではありません')
  }
  if (!r.profile_material) {
    throw new Error('profile_material が不足しています')
  }
  if (typeof r.summary !== 'string' || r.summary.length === 0) {
    throw new Error('summary が空です')
  }

  // content_strengths の詳細チェック
  const cs = r.content_strengths as Record<string, unknown>
  if (!Array.isArray(cs.main_topics) || cs.main_topics.length === 0) {
    throw new Error('main_topics が空です')
  }
  if (cs.main_topics.length > 5) {
    // 5つに切り詰め
    cs.main_topics = (cs.main_topics as string[]).slice(0, 5)
  }
}
```

### 5. PostCraft投稿タイプへのマッピング

SNS転用可能なネタの `suggested_post_type` は、PostCraftのビルトインタイプにマッピングする。プロンプトで以下の対応表を提供:

| ブログ内容の特徴 | マッピング先 |
|-----------------|-------------|
| FAQ、よくある質問、トラブルシューティング | `solution`（解決タイプ） |
| ノウハウ、便利な使い方 | `tips`（AI活用タイプ） |
| 一般的な情報、豆知識 | `useful`（お役立ちタイプ） |
| 手順、チュートリアル | `howto`（使い方タイプ） |
| 実績、事例紹介 | `showcase`（実績タイプ） |
| 告知、キャンペーン | `promotion`（宣伝タイプ） |

## 受入条件

- `BlogAnalysisInput` を受け取り `BlogAnalysisResult` を返す関数が動作する
- 3要素（コンテンツの強み、SNS転用可能なネタ、プロフィール生成用素材）が構造化JSONとして出力される
- `main_topics` が最大5つに制限される
- `reusable_content` の `suggested_post_type` がPostCraftのビルトインタイプにマッピングされる
- AIレスポンスが不正な場合にエラーメッセージが返される
- パフォーマンス目標: 30秒以内に分析完了
- 記事データが大量の場合に適切にトリミングされる（50記事、本文500文字）
- `geminiFlash` モデル（`gemini-3-flash-preview`）を使用している

## TODO

- [x] `src/types/analysis.ts` に `BlogPostData`, `BlogAnalysisInput`, `BlogAnalysisResult` 型を追加（#50 で実施済み）
- [x] `src/lib/analysis-prompts.ts` に `buildBlogAnalysisPrompt()` プロンプト構築関数を実装
- [x] `prepareBlogDataForPrompt()` トリミング関数を実装（50記事、本文500文字）
- [x] `analyzeBlogPosts()` 分析実行関数を実装
- [x] `validateBlogAnalysisResult()` バリデーション関数を実装
- [x] PostCraftビルトインタイプへのマッピング表をプロンプトに組み込み
- [ ] 実データ（ブログ記事）でのプロンプトチューニング
- [ ] エラーケースのテスト（不正JSON、空データ、記事0件）
