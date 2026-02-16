import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import type {
  InstagramAnalysisResult,
  BlogAnalysisResult,
  GeneratedProfile,
  GeneratedPostType,
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
  "required_hashtags": ["（必須ハッシュタグ1〜4個。#記号なし。ブランド名、地域、業種を含む）"]
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

// ─── 投稿タイプ生成 ───

/**
 * 分析結果から投稿タイプを自動生成する（3〜5種）
 */
export async function generatePostTypes(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): Promise<GeneratedPostType[]> {
  if (!instagram && !blog) {
    throw new Error('少なくとも1つの分析結果が必要です')
  }

  const prompt = buildPostTypeGenerationPrompt(instagram, blog, sourceDisplayName)
  const text = await generateWithRetry(prompt, 3, 60000)
  const postTypes = parseJsonResponse<GeneratedPostType[]>(text)

  if (postTypes.length < 3) {
    throw new Error('生成された投稿タイプが3個未満です')
  }

  return postTypes.slice(0, 5).map((pt) => ({
    ...pt,
    slug: validateSlug(pt.slug),
    input_mode: pt.input_mode === 'fields' || pt.input_mode === 'memo' ? pt.input_mode : 'memo',
  }))
}

function validateSlug(slug: string): string {
  let cleaned = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!cleaned) {
    cleaned = `custom-type-${Date.now()}`
  }
  return cleaned
}

function buildPostTypeGenerationPrompt(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): string {
  const sections: string[] = []

  sections.push(
    'あなたはSNSマーケティングの専門家です。以下の分析結果に基づいて、Instagram投稿用の投稿タイプ（テンプレート）を3〜5種類生成してください。'
  )
  sections.push(`対象: ${sourceDisplayName}`)

  if (instagram) {
    const sortedTypes = [...instagram.post_type_distribution.types]
      .sort((a, b) => b.avg_engagement - a.avg_engagement)

    sections.push(`
【Instagram競合分析 - 投稿タイプ傾向】
${sortedTypes.map((t, i) => `${i + 1}. ${t.category}（${t.percentage}% / エンゲージメント: ${t.avg_engagement}%）
   代表例: ${t.example_caption}`).join('\n')}

推奨配分: ${instagram.post_type_distribution.recommendation}

【トーン・文体の参考】
- トーン: ${instagram.tone_analysis.primary_tone}
- 文体: ${instagram.tone_analysis.sentence_style}
- CTA形式: ${instagram.tone_analysis.call_to_action_style}`)
  }

  if (blog) {
    sections.push(`
【ブログ分析 - コンテンツの強み】
- 主要テーマ: ${blog.content_strengths.main_topics.join('、')}
- 独自の価値: ${blog.content_strengths.unique_value}
- ターゲット読者: ${blog.content_strengths.target_audience}

【SNS転用可能なコンテンツ例】
${blog.reusable_content.slice(0, 5).map((c, i) => `${i + 1}. 「${c.original_title}」→ ${c.suggested_post_type}`).join('\n')}`)
  }

  sections.push(`
【PostCraft テンプレート構造の参考例】

■ 商品紹介タイプの例:
\`\`\`
【{title}】

{product_description}

✨ ポイント
{point1}
{point2}
{point3}

---
📍{footer_message}
\`\`\`

■ お役立ちタイプの例:
\`\`\`
【{title}】

{topic}を使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
📍{footer_message}
\`\`\`

【出力要件】
以下のJSON配列形式で3〜5個の投稿タイプを出力してください。JSONのみを出力し、説明文やマークダウンは含めないでください。

[
  {
    "name": "（日本語の投稿タイプ名。10文字以内）",
    "slug": "（英語のURL安全なスラッグ。ハイフン区切り）",
    "description": "（投稿タイプの用途説明。50文字以内）",
    "icon": "（業種と内容に合った絵文字1つ）",
    "template_structure": "（テンプレート本体。プレースホルダーは {key} 形式。改行を含む。絵文字を適度に使用）",
    "placeholders": [
      {
        "key": "（テンプレート内の変数名。snake_case）",
        "label": "（UIに表示するラベル。日本語）",
        "placeholder": "（入力欄のプレースホルダー。具体例を含む）",
        "required": true
      }
    ],
    "input_mode": "memo または fields",
    "min_length": 200,
    "max_length": 400,
    "type_prompt": "（キャプション生成時のAIへの追加指示。このタイプ特有の注意点やスタイルを100〜200文字で）"
  }
]

【生成ルール】
1. エンゲージメントが高い投稿カテゴリを優先して投稿タイプを生成する
2. template_structure はPostCraftの既存テンプレート形式に従う（絵文字、区切り線 --- 、フッター📍を含む）
3. placeholders の key は template_structure 内の {key} と一致させる
4. input_mode は、フィールドが4個以上なら 'fields'、3個以下または自由記述が適切なら 'memo' にする
5. type_prompt はキャプション生成AI（Gemini Flash）への追加指示として使用される。テンプレートの意図やトーンの注意点を含める
6. slug は業種に関連する英語で、グローバルにユニークになるようにする
7. min_length は 200〜300、max_length は 300〜500 の範囲で設定する
8. 各投稿タイプの template_structure にハッシュタグ行を含めないこと（ハッシュタグは別途自動生成される）`)

  return sections.join('\n')
}
