import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@/lib/auth'
import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import { POST_TYPES } from '@/lib/post-types'
import { TEMPLATES, applyTemplate } from '@/lib/templates'
import type { PostType, TemplateData } from '@/types/post'

interface GenerateCaptionRequest {
  postType: PostType
  inputText: string
  sourceUrl?: string
  imageBase64?: string
  imageMimeType?: string
}

interface GenerateCaptionResponse {
  caption: string
  hashtags: string[]
  templateData: TemplateData
}

// System prompt for caption generation
const SYSTEM_PROMPT = `あなたはパソコン教室「ほほ笑みラボ」の講師として、生徒さんに役立つInstagram投稿を作成します。入力メモが短文であっても、あなたの持つIT知識や一般的な情報を駆使して、読者がその場で実践できるレベルまで具体的に内容を膨らませてください。

【最重要ルール】
- 入力メモの主題・トピックを正確に反映すること
- 入力メモに不足している情報は、一般的なIT知識やGoogle検索の結果を用いて「AIが自ら補完して」作成すること
- 初心者でも理解できる、具体的で分かりやすい表現を使うこと

【文章スタイル】
- 指定されたテンプレート構造に従う
- 親しみやすく、分かりやすい文章
- 絵文字は適度に使用（多用しない）
- 日本語で出力`

// Type-specific prompts
const TYPE_PROMPTS: Record<PostType, string> = {
  solution: `質問と解決方法を紹介する投稿です。
入力メモの内容を分析し、不足している解決手順や補足情報は、一般的なIT知識やGoogle検索の結果を用いて「AIが自ら補完して」作成してください。
特に解決ステップは、初心者が迷わず実行できるよう、具体的なボタン名、設定項目、メニュー名を含めることが必須です。

【生成のルール】
- question: 入力メモから「よくある質問」を自然な疑問文で作成。ターゲットが共感しやすい表現に。
- step1, step2, step3: 入力メモに手順がなくても、世の中の一般的な解決方法を調べて「3ステップ」で詳しく記述してください。各ステップは40文字程度で具体的に。
- tip: 解決後に知っておくと便利なワンポイント情報を追加。入力メモになくても一般知識から補完してください。`,

  promotion: `サービスや商品の宣伝投稿です。
入力メモにあるサービス名や特徴を軸に、そのサービスが「誰のどんな悩みを解決するか」を「AIが自ら補完して」、共感を得られる3つの悩み（pain_point）を生成してください。
読み手が「自分のことだ」と感じる具体的な悩みや課題を描写することが必須です。

【生成のルール】
- headline: サービスの価値が一目で伝わるキャッチーな見出し。15文字以内。
- pain_point1〜3: ターゲットが日常的に感じている具体的な悩み・課題を3つ。入力メモにない場合は、ターゲット層の典型的な悩みを補完してください。各30文字程度。
- call_to_action: 読み手が次のアクションを起こしたくなる一言。「まずは〜」「お気軽に〜」など行動を促す表現で。`,

  tips: `AIの便利な使い方やTipsを紹介する投稿です。
入力メモの内容を分析し、不足しているメリットや活用例は、最新のAIツール知識や一般的な活用事例を用いて「AIが自ら補完して」作成してください。
AIに詳しくない人でも「使ってみたい」と思える具体的なシーンで表現することが必須です。

【生成のルール】
- title: 読み手の興味を引く魅力的なタイトル。「知らなきゃ損」「これ1つで」など訴求力のある表現。
- benefit1〜3: AIを使うことで得られる具体的なメリット。時間短縮、品質向上など実感しやすい表現で。各25文字程度。
- example: 日常業務での具体的な活用シーンを1つ。「例えば○○の時に△△するだけで…」のように臨場感を持たせてください。`,

  showcase: `制作実績や成功事例を紹介する投稿です。
入力メモの内容を分析し、不足している課題の背景や成果の詳細は、業界の一般的な課題やよくある改善効果を用いて「AIが自ら補完して」作成してください。
読み手が「自分も同じ課題がある」「こんな成果が出るなら頼みたい」と感じる具体性が必須です。

【生成のルール】
- deliverable_type: 成果物の種類を簡潔に（例：ホームページ、業務システム、チラシ）。
- challenge: お客様が抱えていた具体的な課題。業界のよくある悩みから補完してもOK。30文字程度。
- solution: 作ったもの・提供した解決策を具体的に。どんな機能・特徴があるか分かるように。30文字程度。
- result: 数値や変化が分かる成果。入力メモに数値がなくても「〜が改善」「〜が可能に」など効果が伝わる表現で。30文字程度。`,

  useful: `汎用的な便利情報やTipsを紹介する投稿です。
入力メモの内容を分析し、不足しているメリットや活用例は、一般的なIT知識やGoogle検索の結果を用いて「AIが自ら補完して」作成してください。
ITに詳しくない人でも「なるほど、便利！」「保存して後で見返したくなる」と感じる具体的なシーンで表現することが必須です。

【生成のルール】
- title: 読み手の興味を引く魅力的なタイトル。「意外と知らない」「今すぐ使える」など訴求力のある表現。
- topic: 主題を決定（例：Googleマップ、LINE、このアプリ）。
- benefit1〜3: その情報を知ることで得られる具体的なメリット。日常のどんな場面で役立つか想像しやすい表現で。各25文字程度。
- example: 日常生活での具体的な活用シーンを1つ。「例えば○○の時に…」のように臨場感を持たせてください。
- footer_message: 内容に合った締めの一言（例：ぜひお試しください、詳しくはプロフィールから）。`,

  howto: `便利情報と使い方手順を紹介する投稿です。
入力メモの内容を分析し、不足している具体的な手順やメリットは、一般的なIT知識やGoogle検索の結果を用いて「AIが自ら補完して」作成してください。
特に操作手順（step）は、初心者が画面を思い浮かべられるよう、具体的なボタン名、アイコン、メニュー名を含めることが必須です。

【生成のルール】
- topic: 主題を決定（例：Googleレンズ、LINE）。
- howto_title: 「〜の使い方」「〜の活用術」など魅力的な見出し。
- step1, step2, step3: 入力メモに手順がなくても、世の中の一般的な操作手順を調べて「3ステップ」で詳しく記述してください。各ステップは40文字程度で具体的に。
- benefit/example: その機能を使うことでユーザーがどう楽になるか、具体的なシーンを想像して作成してください。
- footer_message: 内容に合った締めの一言（例：ぜひお試しください）。`,

  image_read: `画像の内容を読み取り、ユーザーのメモを参考にしてInstagram投稿文を作成します。

【生成のルール】
- main_content: 画像から読み取った情報とユーザーのメモを組み合わせて、読者を惹きつける本文を作成。150-300文字程度。絵文字を効果的に使用。見出しは【】で囲む。
- key_points: 投稿の核となるポイントを箇条書き（✅や✨で装飾）で3-5個。
- call_to_action: 読者に次のアクションを促す一言。「詳細はプロフィールのリンクから」など。

【重要】
- 画像の内容を正確に反映すること
- ユーザーのメモで指定された方向性・トーンに従うこと
- 読者が「行ってみたい」「参加したい」と思える文章にすること`,
}

export async function POST(request: Request) {
  // Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: GenerateCaptionRequest = await request.json()
    const { postType, inputText, sourceUrl, imageBase64, imageMimeType } = body

    // Validate request
    // image_read タイプの場合は inputText は任意（メモなしでもOK）
    if (!postType) {
      return NextResponse.json(
        { error: 'postType is required' },
        { status: 400 }
      )
    }

    if (postType !== 'image_read' && !inputText) {
      return NextResponse.json(
        { error: 'inputText is required for this post type' },
        { status: 400 }
      )
    }

    // image_read タイプの場合は画像が必須
    if (postType === 'image_read' && (!imageBase64 || !imageMimeType)) {
      return NextResponse.json(
        { error: 'imageBase64 and imageMimeType are required for image_read type' },
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

    // image_read タイプの場合、まず画像を分析
    let imageAnalysis = ''
    if (postType === 'image_read' && imageBase64 && imageMimeType) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' })

      const analysisResult = await model.generateContent([
        `この画像の内容を詳しく説明してください:
- 何が写っているか（文字、イラスト、写真など）
- 文字が含まれていれば、その内容をすべて書き起こす
- イベント・告知であれば、日時・場所・内容・料金など
- 全体のメッセージや目的
日本語で詳細に説明してください。`,
        {
          inlineData: {
            mimeType: imageMimeType,
            data: imageBase64,
          },
        },
      ])
      imageAnalysis = analysisResult.response.text()
    }

    // Step 1: Generate template data
    const templateDataPrompt = `${SYSTEM_PROMPT}

${TYPE_PROMPTS[postType]}

以下の入力メモから、テンプレート変数を生成してください。

【テンプレート構造】
${template}

【必須変数】
${typeConfig.requiredFields.join(', ')}

【任意変数】
${typeConfig.optionalFields.length > 0 ? typeConfig.optionalFields.join(', ') : 'なし'}

【入力メモ】
${inputText || '（メモなし - 画像の内容に基づいて作成）'}
${sourceUrl ? `\n【参照URL】\n${sourceUrl}` : ''}
${imageAnalysis ? `\n【画像から読み取った内容】\n${imageAnalysis}` : ''}

【重要な注意】
- 入力メモの主題（何についての話か）を正確に反映してください
- 入力メモに不足している情報は、一般的な知識を用いてAIが補完してください
- 初心者に分かりやすい具体的な表現を心がけてください
- 必須変数はすべて値を入れてください

【出力形式】
JSON形式で各変数の値を出力してください。
例: {"question": "○○", "step1": "○○", ...}
余計な説明は不要です。JSONのみ出力してください。`

    const templateDataText = await generateWithRetry(templateDataPrompt)
    const templateData = parseJsonResponse<TemplateData>(templateDataText)

    // Step 2: Apply template to generate caption
    const caption = applyTemplate(postType, templateData)

    // Step 3: Generate hashtags
    // 必須ハッシュタグ（常に含める）
    const mandatoryHashtags = ['ほほ笑みラボ', '飯田市', 'パソコン教室', 'スマホ']

    const hashtagPrompt = `以下のInstagram投稿に適したハッシュタグを6個生成してください。

【投稿タイプ】
${typeConfig.name}

【推奨ハッシュタグ】
${typeConfig.hashtagTrend.join(', ')}

【投稿内容】
${caption}

【ルール】
- 推奨タグから2-3個選択
- 残りは投稿内容に基づいて生成
- 日本語ハッシュタグを優先
- 各ハッシュタグは#なしで出力
- 以下のタグは含めないでください（別途追加します）: ほほ笑みラボ, 飯田市, パソコン教室, スマホ
- JSON配列形式で出力: ["タグ1", "タグ2", ...]
余計な説明は不要です。JSON配列のみ出力してください。`

    const hashtagsText = await generateWithRetry(hashtagPrompt)
    const generatedHashtags = parseJsonResponse<string[]>(hashtagsText)

    // 必須タグ + 生成タグを結合（計10個）
    const hashtags = [...mandatoryHashtags, ...generatedHashtags]

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
