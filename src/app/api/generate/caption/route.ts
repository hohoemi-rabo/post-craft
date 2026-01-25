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

【最重要ルール】
- 入力メモの内容のみを使用すること
- 入力メモにない情報を絶対に捏造・追加しないこと
- 入力メモの主題・トピックを正確に反映すること

【文章スタイル】
- 指定されたテンプレート構造に従う
- 親しみやすく、分かりやすい文章
- 絵文字は適度に使用（多用しない）
- 各フィールドは簡潔に（1-2文程度）
- 日本語で出力`

// Type-specific prompts
const TYPE_PROMPTS: Record<PostType, string> = {
  solution: `質問と解決方法を紹介する投稿です。
入力メモに書かれた具体的な質問・問題と解決方法を使ってください。
ステップは3つ、入力内容から抽出してください。`,
  promotion: `サービスや商品の宣伝投稿です。
入力メモに書かれた具体的なサービス・商品情報を使ってください。
課題や特徴は入力内容から抽出してください。`,
  tips: `便利な使い方やTipsを紹介する投稿です。
入力メモに書かれた具体的なTips・知識を使ってください。
メリットや例は入力内容から抽出してください。`,
  showcase: `制作実績や成功事例を紹介する投稿です。
入力メモに書かれた具体的な実績・成果を使ってください。
課題・解決策・結果は入力内容から抽出してください。`,
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

以下の入力メモから、テンプレート変数を**抽出**してください。
※ 入力メモにない情報は絶対に追加しないでください。

【テンプレート構造】
${template}

【必須変数】
${typeConfig.requiredFields.join(', ')}

【任意変数】
${typeConfig.optionalFields.length > 0 ? typeConfig.optionalFields.join(', ') : 'なし'}

【入力メモ（この内容のみを使用）】
${inputText}
${sourceUrl ? `\n【参照URL】\n${sourceUrl}` : ''}

【重要な注意】
- 上記の入力メモの内容だけを使って変数を埋めてください
- 入力メモに書かれていない具体例や数字を捏造しないでください
- 入力メモの主題（何についての話か）を正確に反映してください

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
