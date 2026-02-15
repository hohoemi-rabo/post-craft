import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import type {
  InstagramPostData,
  InstagramProfileData,
  InstagramAnalysisResult,
  BlogAnalysisInput,
  BlogAnalysisResult,
} from '@/types/analysis'

/**
 * 投稿データをトリミングして分析に必要な件数に絞る
 * 先頭 maxRecent 件（最新順）+ エンゲージメント上位 topEngagement 件（重複除去）
 */
export function trimPostsForAnalysis(
  posts: InstagramPostData[],
  maxRecent = 100,
  topEngagement = 20
): InstagramPostData[] {
  if (posts.length <= maxRecent) return posts

  // 最新順に先頭 maxRecent 件
  const recentPosts = posts.slice(0, maxRecent)
  const recentIds = new Set(recentPosts.map((p) => p.post_id))

  // エンゲージメント上位（recentPosts に含まれないもの）
  const remaining = posts.filter((p) => !recentIds.has(p.post_id))
  const topByEngagement = remaining
    .sort((a, b) => {
      const engA = a.engagement_rate ?? a.likes_count + a.comments_count
      const engB = b.engagement_rate ?? b.likes_count + b.comments_count
      return engB - engA
    })
    .slice(0, topEngagement)

  return [...recentPosts, ...topByEngagement]
}

/**
 * 投稿データをプロンプト用に軽量化する
 */
function formatPostForPrompt(post: InstagramPostData) {
  return {
    post_id: post.post_id,
    post_type: post.post_type,
    caption: post.caption.length > 200 ? post.caption.slice(0, 200) + '...' : post.caption,
    hashtags: post.hashtags,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    posted_at: post.posted_at,
    engagement_rate: post.engagement_rate,
  }
}

/**
 * Instagram分析プロンプトを構築する
 */
export function buildInstagramAnalysisPrompt(
  profileData: InstagramProfileData
): string {
  const trimmedPosts = trimPostsForAnalysis(profileData.posts)
  const formattedPosts = trimmedPosts.map(formatPostForPrompt)

  return `あなたはSNSマーケティング分析の専門家です。以下のInstagramアカウントの投稿データを分析し、4つの観点から構造化されたレポートを生成してください。

## 分析対象アカウント

- ユーザー名: @${profileData.username}
- 表示名: ${profileData.display_name}
- 自己紹介: ${profileData.bio}
- フォロワー数: ${profileData.followers_count.toLocaleString()}
- フォロー数: ${profileData.following_count.toLocaleString()}
- 総投稿数: ${profileData.posts_count}

## 投稿データ（${formattedPosts.length}件）

${JSON.stringify(formattedPosts, null, 2)}

## 分析指示

以下の4つの観点で分析してください。

### 1. 投稿タイプの傾向 (post_type_distribution)
- 投稿の内容カテゴリ（例: 商品紹介、日常風景、豆知識、お客様の声、イベント告知等）を特定
- 各カテゴリの割合（percentage, 合計100）と平均エンゲージメント率（avg_engagement）を算出
- 最もエンゲージメントが高いカテゴリを特定し、推奨配分を提案（recommendation）
- example_caption は各カテゴリの代表的な投稿を30文字程度に要約

### 2. トーン・文体 (tone_analysis)
- 全体的なトーン（primary_tone: 例「カジュアル・親しみやすい」）
- フォーマル度（formality_level: 1=くだけた 〜 5=フォーマル）
- 絵文字の使用傾向（emoji_usage: 例「多用（1投稿平均5個）」）
- 文体の特徴（sentence_style: 例「短文中心、体言止め多用」）
- 一人称（first_person: 例「私たち」）
- CTA（行動喚起）のスタイル（call_to_action_style: 例「プロフィールリンク誘導」）
- 特徴的なフレーズ集（sample_phrases: 5〜10個）

### 3. ハッシュタグ戦略 (hashtag_strategy)
- 平均ハッシュタグ数（avg_count）
- カテゴリ別分類（categories）: type は brand/region/genre/trend のいずれか、各タグリストと使用頻度
- エンゲージメントが高い投稿で使われるタグ（top_performing_tags: 上位10個）
- 類似業種向けの推奨タグ（recommended_tags: 10個）

### 4. 投稿頻度・タイミング (posting_pattern)
- 週あたりの平均投稿数（avg_posts_per_week）
- 最も活発な曜日（most_active_days: 例 ["月", "木", "土"]）
- 最も活発な時間帯（most_active_hours: 例 ["12:00", "18:00"]）
- 投稿の規則性（posting_consistency: 例「非常に規則的」「やや不規則」等）
- 推奨投稿スケジュール（recommendation）

### 総合 (summary, key_success_factors)
- summary: このアカウントの強みと特徴を300文字以内で総合分析
- key_success_factors: 成功要因トップ3（文字列の配列）

## 出力形式

以下のJSON形式で出力してください。JSONのみ出力してください。説明や補足テキストは不要です。

{
  "post_type_distribution": {
    "types": [
      {
        "category": "カテゴリ名",
        "percentage": 30,
        "avg_engagement": 3.5,
        "example_caption": "代表的な投稿の要約"
      }
    ],
    "recommendation": "推奨される投稿タイプ配分の提案"
  },
  "tone_analysis": {
    "primary_tone": "トーンの説明",
    "formality_level": 2,
    "emoji_usage": "絵文字使用の傾向",
    "sentence_style": "文体の特徴",
    "first_person": "一人称",
    "call_to_action_style": "CTAのスタイル",
    "sample_phrases": ["フレーズ1", "フレーズ2"]
  },
  "hashtag_strategy": {
    "avg_count": 10,
    "categories": [
      {
        "type": "brand",
        "tags": ["タグ1", "タグ2"],
        "frequency": 80
      }
    ],
    "top_performing_tags": ["タグ1", "タグ2"],
    "recommended_tags": ["タグ1", "タグ2"]
  },
  "posting_pattern": {
    "avg_posts_per_week": 3,
    "most_active_days": ["月", "木"],
    "most_active_hours": ["12:00", "18:00"],
    "posting_consistency": "規則性の評価",
    "recommendation": "推奨投稿スケジュール"
  },
  "summary": "300文字以内の総合分析",
  "key_success_factors": ["要因1", "要因2", "要因3"]
}`
}

/**
 * AI分析結果のバリデーション
 */
function validateInstagramAnalysisResult(
  result: unknown
): asserts result is InstagramAnalysisResult {
  const r = result as Record<string, unknown>

  if (!r.post_type_distribution || !r.tone_analysis || !r.hashtag_strategy || !r.posting_pattern) {
    throw new Error('必須フィールドが不足しています')
  }
  if (typeof r.summary !== 'string' || r.summary.length === 0) {
    throw new Error('summary が空です')
  }
  if (!Array.isArray(r.key_success_factors) || r.key_success_factors.length === 0) {
    throw new Error('key_success_factors が空です')
  }
}

/**
 * Instagram投稿データをAIで分析する
 */
export async function analyzeInstagramPosts(
  profileData: InstagramProfileData
): Promise<InstagramAnalysisResult> {
  const prompt = buildInstagramAnalysisPrompt(profileData)

  const text = await generateWithRetry(prompt, 3, 60000)

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

// ─── ブログ分析 ─────────────────────────────────────

/**
 * ブログ記事データをプロンプト用に軽量化する
 * 本文500文字トランケート、最大50記事
 */
function prepareBlogDataForPrompt(input: BlogAnalysisInput): string {
  const summarizedPosts = input.posts.map((post) => ({
    title: post.title,
    url: post.url,
    content_preview: post.content.length > 500 ? post.content.slice(0, 500) + '...' : post.content,
    word_count: post.word_count,
    categories: post.categories,
    tags: post.tags,
    published_at: post.published_at,
  }))

  const limitedPosts = summarizedPosts.slice(0, 50)

  return JSON.stringify({
    blog_name: input.blog_name,
    blog_url: input.blog_url,
    total_posts: input.posts.length,
    analyzed_posts: limitedPosts.length,
    posts: limitedPosts,
  }, null, 2)
}

/**
 * ブログ分析プロンプトを構築する
 */
export function buildBlogAnalysisPrompt(input: BlogAnalysisInput): string {
  const blogData = prepareBlogDataForPrompt(input)

  return `あなたはコンテンツマーケティングの専門家で、ブログ記事からSNS投稿素材を抽出するスペシャリストです。以下のブログの記事データを分析し、3つの観点から構造化されたレポートを生成してください。

## ブログデータ

${blogData}

## 分析指示

### 1. コンテンツの強み (content_strengths)
- **main_topics**: ブログの主要テーマを最大5つ抽出（例: "AI活用", "業務効率化", "Web制作"）
- **unique_value**: このブログの独自の価値・専門性を1文で要約
- **target_audience**: 想定読者層を具体的に記述（例: "中小企業の経営者・個人事業主"）
- **writing_style**: 文体の特徴を記述（例: "親しみやすい口調、具体例が豊富"）

### 2. SNS転用可能なネタ (reusable_content)
記事の中からInstagram投稿に転用できるネタを最大10件抽出してください。

各ネタについて以下を提示:
- **original_title**: 元記事のタイトル
- **original_url**: 元記事のURL
- **suggested_post_type**: PostCraftの投稿タイプにマッピング（以下の対応表を参照）
- **suggested_caption_outline**: キャプション案の概要（50〜100文字）
- **suggested_hashtags**: 推奨ハッシュタグ5個

#### PostCraft投稿タイプ対応表
| ブログ内容の特徴 | suggested_post_type |
|-----------------|---------------------|
| FAQ、よくある質問、トラブルシューティング | solution |
| ノウハウ、便利な使い方、AIの活用法 | tips |
| 一般的な情報、豆知識、便利情報 | useful |
| 手順、チュートリアル、操作方法 | howto |
| 実績、事例紹介、ポートフォリオ | showcase |
| 告知、キャンペーン、サービス紹介 | promotion |

### 3. プロフィール生成用の素材 (profile_material)
- **expertise_areas**: 専門分野キーワード（5〜8個）
- **tone_keywords**: トーンを表すキーワード（3〜5個、例: "親しみやすい", "実践的", "丁寧"）
- **brand_message**: ブランドメッセージ案（30〜50文字、キャッチフレーズ風）

### 総合サマリー (summary)
このブログの特徴とSNS活用のポテンシャルを200文字以内で総合分析してください。

## 出力形式

以下のJSON形式で出力してください。JSONのみ出力してください。説明や補足テキストは不要です。

{
  "content_strengths": {
    "main_topics": ["テーマ1", "テーマ2"],
    "unique_value": "独自の価値の説明",
    "target_audience": "想定読者層",
    "writing_style": "文体の特徴"
  },
  "reusable_content": [
    {
      "original_title": "元記事タイトル",
      "original_url": "https://example.com/article",
      "suggested_post_type": "tips",
      "suggested_caption_outline": "キャプション案の概要",
      "suggested_hashtags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"]
    }
  ],
  "profile_material": {
    "expertise_areas": ["分野1", "分野2"],
    "tone_keywords": ["キーワード1", "キーワード2"],
    "brand_message": "ブランドメッセージ案"
  },
  "summary": "200文字以内の総合分析"
}`
}

/**
 * ブログ分析結果のバリデーション
 */
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

  const cs = r.content_strengths as Record<string, unknown>
  if (!Array.isArray(cs.main_topics) || cs.main_topics.length === 0) {
    throw new Error('main_topics が空です')
  }
  if (cs.main_topics.length > 5) {
    cs.main_topics = (cs.main_topics as string[]).slice(0, 5)
  }
}

/**
 * ブログ記事群をAIで分析する
 */
export async function analyzeBlogPosts(
  input: BlogAnalysisInput
): Promise<BlogAnalysisResult> {
  const prompt = buildBlogAnalysisPrompt(input)

  const text = await generateWithRetry(prompt, 3, 60000)

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
