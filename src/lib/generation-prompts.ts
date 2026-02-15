import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import type {
  InstagramAnalysisResult,
  BlogAnalysisResult,
  GeneratedProfile,
} from '@/types/analysis'

/**
 * 分析結果からプロフィールを自動生成する
 */
export async function generateProfile(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): Promise<GeneratedProfile> {
  if (!instagram && !blog) {
    throw new Error('少なくとも1つの分析結果が必要です')
  }

  const prompt = buildProfileGenerationPrompt(instagram, blog, sourceDisplayName)
  const text = await generateWithRetry(prompt, 3, 60000)
  return parseJsonResponse<GeneratedProfile>(text)
}

function buildProfileGenerationPrompt(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): string {
  const sections: string[] = []

  sections.push(
    'あなたはSNSマーケティングの専門家です。以下の分析結果に基づいて、Instagram投稿用のプロフィール設定を生成してください。'
  )
  sections.push(`対象: ${sourceDisplayName}`)

  if (instagram) {
    sections.push(`
【Instagram競合分析結果】
- トーン・文体: ${instagram.tone_analysis.primary_tone}（フォーマル度: ${instagram.tone_analysis.formality_level}/5）
- 文体の特徴: ${instagram.tone_analysis.sentence_style}
- 一人称: ${instagram.tone_analysis.first_person}
- 特徴的フレーズ: ${instagram.tone_analysis.sample_phrases.join('、')}
- CTA形式: ${instagram.tone_analysis.call_to_action_style}
- 絵文字使用: ${instagram.tone_analysis.emoji_usage}
- 推奨ハッシュタグ: ${instagram.hashtag_strategy.recommended_tags.join(', ')}
- 高エンゲージメントタグ: ${instagram.hashtag_strategy.top_performing_tags.join(', ')}
- 成功要因: ${instagram.key_success_factors.join('、')}
- 総合サマリー: ${instagram.summary}`)
  }

  if (blog) {
    sections.push(`
【ブログ分析結果】
- 主要テーマ: ${blog.content_strengths.main_topics.join('、')}
- 独自の価値: ${blog.content_strengths.unique_value}
- ターゲット読者: ${blog.content_strengths.target_audience}
- 文体の特徴: ${blog.content_strengths.writing_style}
- 専門分野: ${blog.profile_material.expertise_areas.join('、')}
- トーンキーワード: ${blog.profile_material.tone_keywords.join('、')}
- ブランドメッセージ案: ${blog.profile_material.brand_message}
- 総合サマリー: ${blog.summary}`)
  }

  sections.push(`
【出力要件】
以下のJSON形式で出力してください。JSONのみを出力し、説明文やマークダウンは含めないでください。

{
  "name": "（表示名 + Instagram など用途を含む短い名前。15文字以内）",
  "icon": "（業種・雰囲気に合った絵文字1つ）",
  "description": "（プロフィールの説明。何のためのプロフィールか50文字以内で）",
  "system_prompt_memo": "（分析結果のサマリー。業種、強み、ターゲット、トーンを簡潔に200文字以内で）",
  "system_prompt": "（AI用のシステムプロンプト。以下の要素を含む詳細な指示文、300〜600文字）",
  "required_hashtags": ["（必須ハッシュタグ3〜5個。#記号なし。ブランド名、地域、業種を含む）"]
}

【system_prompt に含めるべき要素】
1. 業種・専門分野の明示（例: 「あなたは飯田市の和菓子店のInstagram投稿を作成するAIアシスタントです」）
2. トーン・文体の指定（分析結果のtone_analysisを反映。フォーマル度、絵文字使用量、文体の特徴）
3. ターゲット層の明示（Instagram分析とブログ分析の結果を統合）
4. ブランドメッセージの反映（ブログ分析のprofile_materialから）
5. 投稿の基本構造指示（共感→情報→CTAの流れなど、分析で判明した成功パターン）
6. 禁止事項（捏造禁止、過度な誇張禁止）

【注意】
- system_prompt は PostCraft のキャプション生成AI（Gemini Flash）への指示文として使用される
- required_hashtags は毎回の投稿に自動で付与される必須タグ
- 分析結果に含まれる具体的な数値やフレーズを活用すること`)

  return sections.join('\n')
}
