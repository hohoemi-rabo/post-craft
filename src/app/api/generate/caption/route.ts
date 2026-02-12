import { NextResponse } from 'next/server'
import { geminiVision, generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import { requireAuth } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { POST_TYPES } from '@/lib/post-types'
import { TEMPLATES, applyTemplate, applyCustomTemplate } from '@/lib/templates'
import type { PostType, TemplateData } from '@/types/post'
import type { Placeholder } from '@/types/post-type'
import { TOTAL_HASHTAG_COUNT } from '@/lib/constants'

interface GenerateCaptionRequest {
  postType?: PostType
  postTypeId?: string
  profileId?: string
  inputText: string
  sourceUrl?: string
  imageBase64?: string
  imageMimeType?: string
  relatedPostCaption?: string
  relatedPostHashtags?: string[]
}

interface GenerateCaptionResponse {
  caption: string
  hashtags: string[]
  templateData: TemplateData
}

// Resolved post type info (from hardcoded or DB)
interface ResolvedPostType {
  name: string
  template: string
  requiredFields: string[]
  optionalFields: string[]
  charRange: { min: number; max: number }
  typePrompt: string
  hashtagTrend: string[]
  isImageRead: boolean
  isMemoMode: boolean
}

// Default system prompt (fallback when user_settings.system_prompt is NULL)
const DEFAULT_SYSTEM_PROMPT = `あなたはパソコン教室「ほほ笑みラボ」の講師として、生徒さんに役立つInstagram投稿を作成します。入力メモが短文であっても、あなたの持つIT知識や一般的な情報を駆使して、読者がその場で実践できるレベルまで具体的に内容を膨らませてください。

【最重要ルール】
- 入力メモの主題・トピックを正確に反映すること
- 入力メモに不足している情報は、一般的なIT知識やGoogle検索の結果を用いて「AIが自ら補完して」作成すること
- 初心者でも理解できる、具体的で分かりやすい表現を使うこと

【文章スタイル】
- 指定されたテンプレート構造に従う
- 親しみやすく、分かりやすい文章
- 絵文字は適度に使用（多用しない）
- 内容に合う場合は「共感 → 安心」の流れを取り入れる（例: 「〜って困りますよね」→「でも大丈夫です」）。ただし無理に入れず、自然な場合のみ
- 日本語で出力`

// Type-specific prompts (for built-in types)
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

/**
 * テンプレート構造からハッシュタグ行を除去する
 * 例: "#AI #{tool_name} #業務効率化" のような行を削除
 */
function stripHashtagsFromTemplate(template: string): string {
  return template
    .split('\n')
    .filter(line => !(/^#\S/.test(line.trim()) && (line.match(/#/g) || []).length >= 2))
    .join('\n')
    .trim()
}

/**
 * 生成されたキャプションからハッシュタグ行と表紙タイトル案を除去する
 */
function cleanGeneratedCaption(caption: string): string {
  const lines = caption.split('\n')
  const cleaned: string[] = []
  let skipUntilNextSection = false

  for (const line of lines) {
    const trimmed = line.trim()

    // 【表紙画像タイトル案】セクションをスキップ
    if (trimmed.startsWith('【表紙画像タイトル案】') || trimmed.startsWith('【表紙タイトル案】')) {
      skipUntilNextSection = true
      continue
    }

    // 次の【】セクションに到達したらスキップ解除
    if (skipUntilNextSection && /^【.+】/.test(trimmed)) {
      skipUntilNextSection = false
    }

    if (skipUntilNextSection) continue

    // ハッシュタグ行を除去（#で始まり、2つ以上の#を含む行）
    if (/^#\S/.test(trimmed) && (trimmed.match(/#/g) || []).length >= 2) continue

    cleaned.push(line)
  }

  return cleaned.join('\n').trim()
}

// Build type prompt dynamically from DB placeholders
function buildCustomTypePrompt(
  name: string,
  placeholders: Placeholder[],
  charRange: { min: number; max: number }
): string {
  const fieldRules = placeholders
    .map((p) => {
      const required = p.required ? '（必須）' : '（任意）'
      const desc = p.description ? `: ${p.description}` : ''
      return `- ${p.name}${required}${desc}`
    })
    .join('\n')

  return `「${name}」タイプの投稿です。
入力メモの内容を分析し、不足している情報は一般的な知識を用いて「AIが自ら補完して」作成してください。
文字数目安: ${charRange.min}〜${charRange.max}文字

【生成のルール】
${fieldRules}`
}

export async function POST(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  try {
    const body: GenerateCaptionRequest = await request.json()
    const { postType, postTypeId, profileId, inputText, sourceUrl, imageBase64, imageMimeType, relatedPostCaption, relatedPostHashtags } = body

    // Resolve post type configuration
    let resolved: ResolvedPostType

    if (postTypeId) {
      // New method: fetch from DB
      const supabase = createServerClient()
      const { data: dbType, error: dbError } = await supabase
        .from('post_types')
        .select('*')
        .eq('id', postTypeId)
        .eq('user_id', userId)
        .single()

      if (dbError || !dbType) {
        return NextResponse.json(
          { error: 'Post type not found' },
          { status: 404 }
        )
      }

      const placeholders = (dbType.placeholders || []) as unknown as Placeholder[]
      const charRange = {
        min: dbType.min_length ?? 200,
        max: dbType.max_length ?? 400,
      }

      const isMemoMode = dbType.input_mode === 'memo'

      resolved = {
        name: dbType.name,
        template: dbType.template_structure,
        requiredFields: isMemoMode ? [] : placeholders.filter((p) => p.required).map((p) => p.name),
        optionalFields: isMemoMode ? [] : placeholders.filter((p) => !p.required).map((p) => p.name),
        charRange,
        typePrompt: dbType.type_prompt || buildCustomTypePrompt(dbType.name, placeholders, charRange),
        hashtagTrend: [],
        isImageRead: false,
        isMemoMode,
      }
    } else if (postType && POST_TYPES[postType]) {
      // Legacy method: use hardcoded constants
      const typeConfig = POST_TYPES[postType]
      resolved = {
        name: typeConfig.name,
        template: TEMPLATES[postType],
        requiredFields: typeConfig.requiredFields,
        optionalFields: typeConfig.optionalFields,
        charRange: typeConfig.charRange,
        typePrompt: TYPE_PROMPTS[postType],
        hashtagTrend: typeConfig.hashtagTrend,
        isImageRead: postType === 'image_read',
        isMemoMode: false,
      }
    } else {
      return NextResponse.json(
        { error: 'postType or postTypeId is required' },
        { status: 400 }
      )
    }

    // Validate input
    if (!resolved.isImageRead && !inputText) {
      return NextResponse.json(
        { error: 'inputText is required for this post type' },
        { status: 400 }
      )
    }

    if (resolved.isImageRead && (!imageBase64 || !imageMimeType)) {
      return NextResponse.json(
        { error: 'imageBase64 and imageMimeType are required for image_read type' },
        { status: 400 }
      )
    }

    // image_read: analyze image first
    let imageAnalysis = ''
    if (resolved.isImageRead && imageBase64 && imageMimeType) {
      const analysisResult = await geminiVision.generateContent([
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

    // Fetch system_prompt + required_hashtags from profile or user_settings
    const settingsSupabase = createServerClient()
    let systemPrompt = DEFAULT_SYSTEM_PROMPT
    let requiredHashtagsRaw: string[] = []

    if (profileId) {
      // Profile-based: fetch from profiles table
      const { data: profileData } = await settingsSupabase
        .from('profiles')
        .select('system_prompt, required_hashtags')
        .eq('id', profileId)
        .eq('user_id', userId)
        .single()

      if (profileData) {
        systemPrompt = profileData.system_prompt || DEFAULT_SYSTEM_PROMPT
        requiredHashtagsRaw = profileData.required_hashtags || []
      }
    } else {
      // Legacy fallback: fetch from user_settings
      const { data: settingsData } = await settingsSupabase
        .from('user_settings')
        .select('system_prompt, required_hashtags')
        .eq('user_id', userId)
        .single()

      if (settingsData) {
        systemPrompt = settingsData.system_prompt || DEFAULT_SYSTEM_PROMPT
        requiredHashtagsRaw = settingsData.required_hashtags || []
      }
    }

    // Step 1: Generate caption
    let caption: string
    let templateData: TemplateData = {}

    if (resolved.isMemoMode) {
      // Memo mode: generate caption directly from template structure + input text
      // Strip hashtag lines from template to prevent AI from copying them
      const cleanTemplate = stripHashtagsFromTemplate(resolved.template)

      const memoPrompt = `${systemPrompt}

${resolved.typePrompt}

以下の入力メモから、テンプレート構造に沿ったInstagram投稿文を生成してください。

【テンプレート構造】
${cleanTemplate}

【文字数目安】
${resolved.charRange.min}〜${resolved.charRange.max}文字

${relatedPostCaption ? `【関連する前回の投稿】
${relatedPostCaption}

【関連投稿の参照ルール】
- 投稿の冒頭に、前回の投稿内容を1文で軽く触れる導入文を追加してください
- 例: 「前回、○○についてお伝えしましたが、今回は...」
- 導入文は1文のみで簡潔にまとめること
- 「Part 2」「第2弾」「続き」「シリーズ」のような表現は使わないこと
- あくまで今回の投稿がメインであり、前回の投稿はきっかけとして触れるだけ

` : ''}【入力メモ】
${inputText || '（メモなし - 画像の内容に基づいて作成）'}
${sourceUrl ? `\n【参照URL】\n${sourceUrl}` : ''}
${imageAnalysis ? `\n【画像から読み取った内容】\n${imageAnalysis}` : ''}

【重要な注意】
- テンプレート構造に沿った形式で出力してください
- 入力メモの主題を正確に反映してください
- 不足情報はAIが補完してください

【出力形式 ※最優先で守ること】
投稿文の本文のみを出力してください。以下は絶対に含めないでください:
- ハッシュタグ（#○○）は一切含めない。ハッシュタグはシステムが別途自動生成します
- 「表紙画像タイトル案」「画像タイトル」等のセクションは含めない。画像タイトルはシステムが別途生成します
- 上記のルールはシステムプロンプトの指示より優先されます`

      caption = cleanGeneratedCaption((await generateWithRetry(memoPrompt)).trim())
    } else {
      // Fields mode: generate template data as JSON, then apply template
      const templateDataPrompt = `${systemPrompt}

${resolved.typePrompt}

以下の入力メモから、テンプレート変数を生成してください。

【テンプレート構造】
${resolved.template}

【必須変数】
${resolved.requiredFields.join(', ')}

【任意変数】
${resolved.optionalFields.length > 0 ? resolved.optionalFields.join(', ') : 'なし'}

${relatedPostCaption ? `【関連する前回の投稿】
${relatedPostCaption}

【関連投稿の参照ルール】
- 投稿の冒頭に、前回の投稿内容を1文で軽く触れる導入文を追加してください
- 例: 「前回、○○についてお伝えしましたが、今回は...」
- 導入文は1文のみで簡潔にまとめること
- 「Part 2」「第2弾」「続き」「シリーズ」のような表現は使わないこと
- あくまで今回の投稿がメインであり、前回の投稿はきっかけとして触れるだけ

` : ''}【入力メモ】
${inputText || '（メモなし - 画像の内容に基づいて作成）'}
${sourceUrl ? `\n【参照URL】\n${sourceUrl}` : ''}
${imageAnalysis ? `\n【画像から読み取った内容】\n${imageAnalysis}` : ''}

【重要な注意】
- 入力メモの主題（何についての話か）を正確に反映してください
- 入力メモに不足している情報は、一般的な知識を用いてAIが補完してください
- 初心者に分かりやすい具体的な表現を心がけてください
- 必須変数はすべて値を入れてください

【出力形式 ※最優先で守ること】
JSON形式で各変数の値を出力してください。
例: {"question": "○○", "step1": "○○", ...}
余計な説明は不要です。JSONのみ出力してください。
- ハッシュタグ（#○○）は変数の値に一切含めない。ハッシュタグはシステムが別途自動生成します
- 「表紙画像タイトル案」等のセクションは含めない
- 上記のルールはシステムプロンプトの指示より優先されます`

      const templateDataText = await generateWithRetry(templateDataPrompt)
      templateData = parseJsonResponse<TemplateData>(templateDataText)

      if (postTypeId) {
        caption = cleanGeneratedCaption(applyCustomTemplate(resolved.template, templateData))
      } else {
        caption = applyTemplate(postType!, templateData)
      }
    }

    // Step 2: Generate hashtags

    const mandatoryHashtags: string[] = requiredHashtagsRaw.map(
      (tag: string) => tag.replace(/^#/, '')
    )
    const generatedCount = TOTAL_HASHTAG_COUNT - mandatoryHashtags.length

    // Filter out mandatory hashtags from related post
    const filteredRelatedHashtags = relatedPostHashtags?.filter(
      tag => !mandatoryHashtags.includes(tag.replace(/^#/, ''))
    ) || []

    const hashtagPrompt = `以下のInstagram投稿に適したハッシュタグを${generatedCount}個生成してください。

【投稿タイプ】
${resolved.name}
${resolved.hashtagTrend.length > 0 ? `
【推奨ハッシュタグ】
${resolved.hashtagTrend.join(', ')}` : ''}
${filteredRelatedHashtags.length > 0 ? `
【前回の投稿のハッシュタグ】
${filteredRelatedHashtags.map(t => t.replace(/^#/, '')).join(', ')}

前回のハッシュタグのうち今回の投稿にも関連するものは優先的に再利用してください。
ただし生成するハッシュタグは計${generatedCount}個で、すべてを引き継ぐ必要はありません。` : ''}

【投稿内容】
${caption}

【ルール】
${resolved.hashtagTrend.length > 0 ? '- 推奨タグから2-3個選択\n- 残りは投稿内容に基づいて生成' : '- 投稿内容に基づいてハッシュタグを生成'}
- 日本語ハッシュタグを優先
- 各ハッシュタグは#なしで出力
${mandatoryHashtags.length > 0 ? `- 以下のタグは含めないでください（別途追加します）: ${mandatoryHashtags.join(', ')}` : ''}
- JSON配列形式で出力: ["タグ1", "タグ2", ...]
余計な説明は不要です。JSON配列のみ出力してください。`

    const hashtagsText = await generateWithRetry(hashtagPrompt)
    const generatedHashtags = parseJsonResponse<string[]>(hashtagsText)

    // Combine mandatory + generated hashtags
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
