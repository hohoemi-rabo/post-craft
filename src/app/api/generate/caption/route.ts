import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import { POST_TYPES } from '@/lib/post-types'
import { TEMPLATES, applyTemplate } from '@/lib/templates'
import type { PostType, TemplateData } from '@/types/post'

interface GenerateCaptionRequest {
  postType: PostType
  inputText: string
  sourceUrl?: string
}

interface GenerateCaptionResponse {
  caption: string
  hashtags: string[]
  templateData: TemplateData
}

// System prompt for caption generation
const SYSTEM_PROMPT = `あなたはInstagram投稿文のライターです。
パソコン教室「ほほ笑みラボ」の投稿を作成します。

ルール：
- 指定されたテンプレート構造に従う
- 親しみやすく、分かりやすい文章
- 絵文字は適度に使用（多用しない）
- 各フィールドは簡潔に（1-2文程度）
- 日本語で出力`

// Type-specific prompts
const TYPE_PROMPTS: Record<PostType, string> = {
  solution: `シニアからの質問と解決方法を紹介する投稿です。
簡潔で分かりやすい手順を心がけてください。
ステップは3つ、それぞれ短く具体的に。`,
  promotion: `AI実務サポートサービスの宣伝投稿です。
ターゲットは業務効率化に興味があるビジネスパーソンです。
課題・悩みは共感を呼ぶものを選んでください。`,
  tips: `AIの便利な使い方を紹介する投稿です。
具体的な例を交えて説明してください。
メリットは明確で魅力的に。`,
  showcase: `制作実績や成功事例を紹介する投稿です。
Before/Afterや具体的な成果を強調してください。
結果は数字や具体的な変化で表現。`,
}

export async function POST(request: Request) {
  // Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: GenerateCaptionRequest = await request.json()
    const { postType, inputText, sourceUrl } = body

    // Validate request
    if (!postType || !inputText) {
      return NextResponse.json(
        { error: 'postType and inputText are required' },
        { status: 400 }
      )
    }

    if (!POST_TYPES[postType]) {
      return NextResponse.json(
        { error: 'Invalid postType' },
        { status: 400 }
      )
    }

    const typeConfig = POST_TYPES[postType]
    const template = TEMPLATES[postType]

    // Step 1: Generate template data
    const templateDataPrompt = `${SYSTEM_PROMPT}

${TYPE_PROMPTS[postType]}

以下のメモから、テンプレート変数を抽出・生成してください。

【テンプレート構造】
${template}

【必須変数】
${typeConfig.requiredFields.join(', ')}

【任意変数】
${typeConfig.optionalFields.length > 0 ? typeConfig.optionalFields.join(', ') : 'なし'}

【入力メモ】
${inputText}
${sourceUrl ? `\n【参照URL】\n${sourceUrl}` : ''}

【出力形式】
JSON形式で各変数の値を出力してください。
例: {"question": "○○", "step1": "○○", ...}
余計な説明は不要です。JSONのみ出力してください。`

    const templateDataText = await generateWithRetry(templateDataPrompt)
    const templateData = parseJsonResponse<TemplateData>(templateDataText)

    // Step 2: Apply template to generate caption
    const caption = applyTemplate(postType, templateData)

    // Step 3: Generate hashtags
    const hashtagPrompt = `以下のInstagram投稿に適したハッシュタグを10個生成してください。

【投稿タイプ】
${typeConfig.name}

【推奨ハッシュタグ】
${typeConfig.hashtagTrend.join(', ')}

【投稿内容】
${caption}

【ルール】
- 推奨タグから3-4個選択
- 残りは投稿内容に基づいて生成
- 日本語ハッシュタグを優先
- 各ハッシュタグは#なしで出力
- JSON配列形式で出力: ["タグ1", "タグ2", ...]
余計な説明は不要です。JSON配列のみ出力してください。`

    const hashtagsText = await generateWithRetry(hashtagPrompt)
    const hashtags = parseJsonResponse<string[]>(hashtagsText)

    const response: GenerateCaptionResponse = {
      caption,
      hashtags,
      templateData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    )
  }
}
