import { IMAGE_STYLES, type ImageStyle, type AspectRatio, type BackgroundType } from './image-styles'
import { geminiFlash, geminiFlashLite, parseJsonResponse } from './gemini'
import type { PostType } from '@/types/post'

export interface ImagePromptOptions {
  style: ImageStyle
  aspectRatio: AspectRatio
  characterDescription?: string
  sceneDescription: string
  catchphrase?: string
  backgroundType?: BackgroundType
}

export interface MultimodalImagePromptOptions {
  style: ImageStyle
  aspectRatio: AspectRatio
  sceneDescription: string
  catchphrase?: string
  backgroundType?: BackgroundType
}

/**
 * Get aspect ratio instruction for image prompt
 */
function getAspectRatioInstruction(aspectRatio: AspectRatio): string {
  switch (aspectRatio) {
    case '1:1':
      return '正方形のフィード投稿用画像（1:1アスペクト比）。'
    case '4:5':
      return '縦長のフィード投稿用画像（4:5アスペクト比）。'
    case '9:16':
      return '縦長のショート動画用画像（9:16アスペクト比）。'
    case '16:9':
      return '横長のフィード投稿用画像（16:9アスペクト比）。'
    default:
      return '正方形のフィード投稿用画像（1:1アスペクト比）。'
  }
}

/**
 * Get background instruction based on style and background type
 */
function getBackgroundInstruction(style: ImageStyle, backgroundType: BackgroundType = 'tech', sceneDescription: string): string {
  if (backgroundType === 'auto') {
    // 内容に合わせる場合は、シーン説明に関連した背景
    return `背景はシーンの内容（${sceneDescription}）に合わせた要素を含める。`
  }

  // テクノロジー背景の場合
  switch (style) {
    case 'manga_male':
      return '背景にはPC、コード、AI、テクノロジー要素を含める。'
    case 'manga_female':
      return '背景にはPC、デザイン、SNS、クリエイティブ要素を含める。'
    case 'pixel_art':
      return '背景にはデジタル空間、グリッド、テクノロジー要素を含める。'
    default:
      return ''
  }
}

export interface IllustrationPromptOptions {
  aspectRatio: AspectRatio
  sceneDescription: string
  catchphrase: string
}

/**
 * Build image generation prompt from options
 */
export function buildImagePrompt(options: ImagePromptOptions): string {
  const styleConfig = IMAGE_STYLES[options.style]

  const parts: string[] = []

  // Aspect ratio instruction
  parts.push(getAspectRatioInstruction(options.aspectRatio))

  // Base style prompt
  parts.push(styleConfig.basePrompt)

  // Background instruction based on type
  const backgroundInstruction = getBackgroundInstruction(options.style, options.backgroundType, options.sceneDescription)
  if (backgroundInstruction) {
    parts.push(backgroundInstruction)
  }

  // Character description (if supported)
  if (styleConfig.supportsCharacter) {
    if (options.characterDescription) {
      parts.push(`メインの人物キャラクター（${options.characterDescription}）を中央に配置。`)
    } else {
      // Default character based on style
      if (options.style === 'manga_male') {
        parts.push('メインの人物キャラクター（30-40代の親しみやすい男性、カジュアルビジネススタイル）を中央に配置。')
      } else if (options.style === 'manga_female') {
        parts.push('メインの人物キャラクター（20-30代の明るい雰囲気の女性、スマートカジュアルスタイル）を中央に配置。')
      } else if (options.style === 'pixel_art') {
        parts.push('メインのピクセルキャラクター（かわいいちびキャラ）を中央に配置。')
      }
    }
  }

  // Scene description
  parts.push(`シーン: ${options.sceneDescription}`)

  // Catchphrase text instruction
  if (options.catchphrase) {
    parts.push('')
    parts.push('【重要】以下のテキストを画像内に目立つように配置してください:')
    parts.push(`「${options.catchphrase}」`)
    parts.push('')
    parts.push('テキストの条件:')
    parts.push('- 読みやすい日本語フォント')
    parts.push('- 画像の上部または中央に大きく配置')
    parts.push('- 背景とコントラストがはっきりした色')
    parts.push('- 文字が切れないように余白を確保')
  }

  return parts.join('\n')
}

/**
 * Build image generation prompt for multimodal (with reference image)
 */
export function buildMultimodalImagePrompt(options: MultimodalImagePromptOptions): string {
  const styleConfig = IMAGE_STYLES[options.style]

  const parts: string[] = []

  // Instruction for using reference image
  parts.push('添付した画像のキャラクターを参考にして、同じ人物が登場する新しい画像を生成してください。')
  parts.push('キャラクターの顔の特徴、髪型、雰囲気をできるだけ維持してください。')
  parts.push('')

  // Aspect ratio instruction
  parts.push(getAspectRatioInstruction(options.aspectRatio))

  // Base style prompt
  parts.push(styleConfig.basePrompt)

  // Background instruction based on type
  const backgroundInstruction = getBackgroundInstruction(options.style, options.backgroundType, options.sceneDescription)
  if (backgroundInstruction) {
    parts.push(backgroundInstruction)
  }

  // Character placement
  if (styleConfig.supportsCharacter) {
    parts.push('参照画像のキャラクターを中央に配置。')
  }

  // Scene description
  parts.push(`シーン: ${options.sceneDescription}`)

  // Catchphrase text instruction
  if (options.catchphrase) {
    parts.push('')
    parts.push('【重要】以下のテキストを画像内に目立つように配置してください:')
    parts.push(`「${options.catchphrase}」`)
    parts.push('')
    parts.push('テキストの条件:')
    parts.push('- 読みやすい日本語フォント')
    parts.push('- 画像の上部または中央に大きく配置')
    parts.push('- 背景とコントラストがはっきりした色')
    parts.push('- 文字が切れないように余白を確保')
  }

  return parts.join('\n')
}

/**
 * Generate catchphrase for illustration style images
 */
export async function generateCatchphrase(caption: string): Promise<string> {
  const prompt = `以下の投稿内容から、画像に入れるキャッチコピーを1つ生成してください。

条件:
- 10〜20文字程度の短いフレーズ
- 見た人の興味を引く、インパクトのある表現
- 疑問形や「〜しませんか？」「〜できる！」などの形式も可
- 絵文字は使わない
- 日本語で出力

投稿内容:
${caption.slice(0, 500)}

キャッチコピーのみを出力してください（説明や補足は不要）:`

  const result = await geminiFlashLite.generateContent(prompt)
  const text = result.response.text().trim()

  // Remove quotes if present
  return text.replace(/^[「『"']|[」』"']$/g, '')
}

/**
 * Build image prompt for illustration style with text
 */
export function buildIllustrationWithTextPrompt(options: IllustrationPromptOptions): string {
  const parts: string[] = []

  // Aspect ratio instruction
  parts.push(getAspectRatioInstruction(options.aspectRatio))

  // Base style
  parts.push('フラットデザインのイラスト風、ポップで明るい色使い。')
  parts.push('シンプルでかわいらしい雰囲気、2Dイラストスタイル。')
  parts.push('人物、キャラクター、顔、手、体は絶対に含めないでください。')
  parts.push('アイコン、シンボル、抽象的な図形、風景イラストのみで表現。')

  // Scene description
  parts.push(`テーマ: ${options.sceneDescription}`)

  // Text instruction
  parts.push('')
  parts.push('【重要】以下のテキストを画像内に目立つように配置してください:')
  parts.push(`「${options.catchphrase}」`)
  parts.push('')
  parts.push('テキストの条件:')
  parts.push('- 読みやすい日本語フォント')
  parts.push('- 画像の中央または上部に大きく配置')
  parts.push('- 背景とコントラストがはっきりした色')
  parts.push('- 文字が切れないように余白を確保')

  return parts.join('\n')
}

export interface RealisticImagePromptOptions {
  aspectRatio: AspectRatio
  sceneDescription: string
  catchphrase?: string
}

/**
 * Build image generation prompt for realistic background (OpenAI)
 */
export function buildRealisticImagePrompt(options: RealisticImagePromptOptions): string {
  const parts: string[] = []

  // Aspect ratio instruction
  switch (options.aspectRatio) {
    case '1:1':
      parts.push('Create a square image (1:1 aspect ratio) for social media feed post.')
      break
    case '4:5':
      parts.push('Create a vertical image (4:5 aspect ratio) for social media feed post.')
      break
    case '9:16':
      parts.push('Create a vertical image (9:16 aspect ratio) for social media stories/reels.')
      break
    case '16:9':
      parts.push('Create a horizontal image (16:9 aspect ratio) for social media feed post.')
      break
    default:
      parts.push('Create a square image (1:1 aspect ratio) for social media feed post.')
  }

  parts.push('')
  parts.push('Style: Photorealistic, high quality, professional photography style.')
  parts.push('The image should look like a real photograph with natural lighting and realistic textures.')
  parts.push('')

  // Scene description
  parts.push(`Scene: ${options.sceneDescription}`)
  parts.push('')

  // Important: No text in image for OpenAI (will overlay text separately if needed)
  parts.push('Important: Do NOT include any text, letters, words, or typography in the image.')
  parts.push('The image should be purely visual without any text elements.')

  return parts.join('\n')
}

/**
 * Generate scene description from post content
 */
export async function generateSceneDescription(
  caption: string,
  postType: PostType
): Promise<string> {
  const postTypeNames: Record<PostType, string> = {
    solution: '解決タイプ（シニア向け）',
    promotion: '宣伝タイプ',
    tips: 'AI活用タイプ',
    showcase: '実績/事例タイプ',
    useful: 'お役立ちタイプ',
    howto: '使い方タイプ',
    image_read: '画像読み取りタイプ',
  }

  const prompt = `以下の投稿内容から、画像のシーン説明を生成してください。
30-50文字程度で、具体的なビジュアルをイメージできる説明にしてください。
日本語で出力してください。シーンの説明のみ出力し、余計な説明は不要です。

投稿タイプ: ${postTypeNames[postType]}
投稿内容:
${caption.slice(0, 500)}

出力例:
- スマートフォンを操作する手と、画面に表示されたLINEアイコン
- ノートPCの前で笑顔で説明するビジネスパーソン
- AIアシスタントと会話している様子`

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text().trim()

  // Remove any leading dash or bullet
  return text.replace(/^[-・•]\s*/, '')
}

interface SceneSuggestion {
  scenes: string[]
}

/**
 * Generate multiple scene suggestions for user to choose
 */
export async function generateSceneSuggestions(
  caption: string,
  postType: PostType,
  count: number = 3
): Promise<string[]> {
  const postTypeNames: Record<PostType, string> = {
    solution: '解決タイプ（シニア向け）',
    promotion: '宣伝タイプ',
    tips: 'AI活用タイプ',
    showcase: '実績/事例タイプ',
    useful: 'お役立ちタイプ',
    howto: '使い方タイプ',
    image_read: '画像読み取りタイプ',
  }

  const prompt = `以下の投稿内容から、画像生成用のシーン説明を${count}個生成してください。
各シーンは30-50文字程度で、具体的なビジュアルをイメージできる説明にしてください。

投稿タイプ: ${postTypeNames[postType]}
投稿内容:
${caption.slice(0, 500)}

以下のJSON形式で出力してください：
{
  "scenes": [
    "シーン説明1",
    "シーン説明2",
    "シーン説明3"
  ]
}

JSONのみ出力し、余計な説明は不要です。`

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()

  try {
    const parsed = parseJsonResponse<SceneSuggestion>(text)
    return parsed.scenes
  } catch {
    // Fallback: generate single scene
    const singleScene = await generateSceneDescription(caption, postType)
    return [singleScene]
  }
}
