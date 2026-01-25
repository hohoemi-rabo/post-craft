import { IMAGE_STYLES, type ImageStyle, type AspectRatio } from './image-styles'
import { geminiFlash, parseJsonResponse } from './gemini'
import type { PostType } from '@/types/post'

export interface ImagePromptOptions {
  style: ImageStyle
  aspectRatio: AspectRatio
  characterDescription?: string
  sceneDescription: string
}

/**
 * Build image generation prompt from options
 */
export function buildImagePrompt(options: ImagePromptOptions): string {
  const styleConfig = IMAGE_STYLES[options.style]

  const parts: string[] = []

  // Aspect ratio instruction
  if (options.aspectRatio === '9:16') {
    parts.push('縦長のショート動画用画像（9:16アスペクト比）。')
  } else {
    parts.push('正方形のフィード投稿用画像（1:1アスペクト比）。')
  }

  // Base style prompt
  parts.push(styleConfig.basePrompt)

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
    tips: 'Tips/知識タイプ',
    showcase: '実績/事例タイプ',
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
    tips: 'Tips/知識タイプ',
    showcase: '実績/事例タイプ',
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
