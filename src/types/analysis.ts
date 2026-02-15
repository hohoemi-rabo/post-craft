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
