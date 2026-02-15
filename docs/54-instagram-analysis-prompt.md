# チケット #54: Instagram AI分析プロンプト設計

> Phase 4B | 優先度: 高 | 依存: #50

## 概要

Instagram競合分析用のAIプロンプトと型定義を設計・実装する。Bright DataからエクスポートしたInstagram投稿データ（キャプション、ハッシュタグ、エンゲージメント、投稿日時等）をGemini Flashに渡し、4要素（投稿タイプの傾向、トーン・文体、ハッシュタグ戦略、投稿頻度・タイミング）を構造化JSONとして抽出する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/analysis-prompts.ts` | 新規作成 |
| `src/types/analysis.ts` | 新規作成 |

## 変更内容

### 1. 型定義 (`src/types/analysis.ts`)

SPEC-PHASE4.md セクション 5.1.1 / 5.1.2 に準拠した型定義を作成する。

```typescript
// --- 入力データ型 ---

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

export interface InstagramProfileData {
  username: string
  display_name: string
  bio: string
  followers_count: number
  following_count: number
  posts_count: number
  posts: InstagramPostData[]
}

// --- 分析結果型 ---

export interface InstagramAnalysisResult {
  // 1. 投稿タイプの傾向
  post_type_distribution: {
    types: Array<{
      category: string       // 例: '商品紹介', '日常風景', '豆知識'
      percentage: number      // 全投稿に対する割合 (0-100)
      avg_engagement: number  // 平均エンゲージメント率
      example_caption: string // 代表的なキャプション（要約）
    }>
    recommendation: string    // 推奨される投稿タイプ配分
  }

  // 2. トーン・文体
  tone_analysis: {
    primary_tone: string           // 例: 'カジュアル・親しみやすい'
    formality_level: number        // 1-5（1: くだけた, 5: フォーマル）
    emoji_usage: string            // 例: '多用（1投稿平均5個）'
    sentence_style: string         // 例: '短文中心、体言止め多用'
    first_person: string           // 例: '私たち'
    call_to_action_style: string   // 例: 'プロフィールリンク誘導'
    sample_phrases: string[]       // 特徴的なフレーズ集（5-10個）
  }

  // 3. ハッシュタグ戦略
  hashtag_strategy: {
    avg_count: number // 平均ハッシュタグ数
    categories: Array<{
      type: string       // 'brand' | 'region' | 'genre' | 'trend'
      tags: string[]
      frequency: number  // 使用頻度（0-100%）
    }>
    top_performing_tags: string[]  // エンゲージメントが高いタグ
    recommended_tags: string[]     // 類似業種向け推奨タグ
  }

  // 4. 投稿頻度・タイミング
  posting_pattern: {
    avg_posts_per_week: number
    most_active_days: string[]    // 例: ['月', '木', '土']
    most_active_hours: string[]   // 例: ['12:00', '18:00']
    posting_consistency: string   // 例: '非常に規則的'
    recommendation: string        // 推奨投稿スケジュール
  }

  // 総合サマリー
  summary: string                 // 300文字以内の総合分析
  key_success_factors: string[]   // 成功要因トップ3
}
```

### 2. 分析プロンプト関数 (`src/lib/analysis-prompts.ts`)

```typescript
import { geminiFlash, parseJsonResponse } from '@/lib/gemini'
import type {
  InstagramProfileData,
  InstagramAnalysisResult,
} from '@/types/analysis'

/**
 * Instagram投稿データをAIで分析し、4要素を構造化JSONで抽出する
 *
 * @param profileData - Instagram プロフィール + 投稿データ
 * @returns 構造化された分析結果
 * @throws Error - AI応答のパース失敗時
 */
export async function analyzeInstagramPosts(
  profileData: InstagramProfileData
): Promise<InstagramAnalysisResult> {
  const prompt = buildInstagramAnalysisPrompt(profileData)

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()

  try {
    const parsed = parseJsonResponse<InstagramAnalysisResult>(text)
    validateInstagramAnalysisResult(parsed)
    return parsed
  } catch (error) {
    console.error('Instagram analysis parse error:', error)
    console.error('Raw AI response:', text.slice(0, 500))
    throw new Error(
      `Instagram分析結果のパースに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
```

### 3. プロンプト構築

プロンプトは以下の構成で設計する:

- **役割設定**: SNSマーケティング分析の専門家
- **入力データ**: アカウント情報 + 投稿データ（最大200件の要約）
- **分析指示**: 4要素それぞれの抽出基準を明示
- **出力形式**: `InstagramAnalysisResult` に準拠したJSON
- **制約**: 日本語出力、summary は300文字以内、key_success_factors は3項目

プロンプト内で投稿データが大量の場合、先頭100件 + エンゲージメント上位20件を渡すようトリミングする。

### 4. バリデーション

AIレスポンスのバリデーション関数を実装:

```typescript
function validateInstagramAnalysisResult(
  result: unknown
): asserts result is InstagramAnalysisResult {
  const r = result as Record<string, unknown>

  if (!r.post_type_distribution || !r.tone_analysis ||
      !r.hashtag_strategy || !r.posting_pattern) {
    throw new Error('必須フィールドが不足しています')
  }
  if (typeof r.summary !== 'string' || r.summary.length === 0) {
    throw new Error('summary が空です')
  }
  if (!Array.isArray(r.key_success_factors) || r.key_success_factors.length === 0) {
    throw new Error('key_success_factors が空です')
  }
}
```

## 受入条件

- `InstagramProfileData` を受け取り `InstagramAnalysisResult` を返す関数が動作する
- 4要素（投稿タイプ傾向、トーン・文体、ハッシュタグ戦略、投稿パターン）が構造化JSONとして出力される
- summary が300文字以内で出力される
- key_success_factors が3項目で出力される
- AIレスポンスが不正な場合にエラーメッセージが返される
- パフォーマンス目標: 30秒以内に分析完了
- `geminiFlash` モデル（`gemini-3-flash-preview`）を使用している

## TODO

- [x] `src/types/analysis.ts` に `InstagramPostData`, `InstagramProfileData`, `InstagramAnalysisResult` 型を定義（#50 で実施済み）
- [x] `src/lib/analysis-prompts.ts` を新規作成
- [x] `buildInstagramAnalysisPrompt()` プロンプト構築関数を実装
- [x] `analyzeInstagramPosts()` 分析実行関数を実装
- [x] `validateInstagramAnalysisResult()` バリデーション関数を実装
- [x] 投稿データが大量の場合のトリミングロジックを実装（100件 + エンゲージメント上位20件）
- [ ] 実データ（Bright Data CSV）でのプロンプトチューニング
- [ ] エラーケースのテスト（不正JSON、空データ、タイムアウト）
