// Image style definitions for AI image generation

export type ImageStyle = 'manga_male' | 'manga_female' | 'pixel_art' | 'illustration' | 'realistic'
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9'
export type BackgroundType = 'tech' | 'auto'

export const BACKGROUND_TYPES: Record<BackgroundType, { name: string; description: string; icon: string }> = {
  tech: {
    name: 'テクノロジー背景',
    description: 'PC、AI、デジタル要素',
    icon: '💻',
  },
  auto: {
    name: '内容に合わせる',
    description: 'シーン説明から自動判定',
    icon: '🎨',
  },
}

export interface StyleConfig {
  id: ImageStyle
  name: string
  description: string
  icon: string
  basePrompt: string
  supportsCharacter: boolean
}

export const IMAGE_STYLES: Record<ImageStyle, StyleConfig> = {
  manga_male: {
    id: 'manga_male',
    name: 'マンガ風（男性）',
    description: 'テック・ビジネス系、鮮やかな配色',
    icon: '👨‍💼',
    basePrompt: `日本のマンガ・アニメ調のイラストスタイル。
テック系・ビジネス系のサムネイル画像。
鮮やかでカラフルな配色、グラデーション背景。
プロフェッショナルだけど親しみやすい雰囲気。`,
    supportsCharacter: true,
  },
  manga_female: {
    id: 'manga_female',
    name: 'マンガ風（女性）',
    description: 'クリエイティブ系、パステル調',
    icon: '👩‍💼',
    basePrompt: `日本のマンガ・アニメ調のイラストスタイル。
クリエイティブ系・スタートアップ系のサムネイル画像。
パステル調やソフトなグラデーション背景。
スタイリッシュでトレンド感のある雰囲気。`,
    supportsCharacter: true,
  },
  pixel_art: {
    id: 'pixel_art',
    name: 'ピクセルアート',
    description: 'レトロゲーム風、サイバー背景',
    icon: '👾',
    basePrompt: `ピクセルアート・ドット絵スタイル。
レトロゲーム風のかわいいちびキャラクター。
サイバー・デジタルな背景。
8bit/16bitゲームの雰囲気。`,
    supportsCharacter: true,
  },
  illustration: {
    id: 'illustration',
    name: 'イラスト（人物なし）',
    description: 'フラットデザイン、図形のみ',
    icon: '🎨',
    basePrompt: `フラットデザインのイラスト風、ポップで明るい色使い。
テキストは含めない、ビジュアルのみ。
シンプルでかわいらしい雰囲気、2Dイラストスタイル。
人物、キャラクター、顔、手、体は絶対に含めないでください。
アイコン、シンボル、抽象的な図形、風景イラストのみで表現。`,
    supportsCharacter: false,
  },
  realistic: {
    id: 'realistic',
    name: 'リアル（写真風）',
    description: '写真のようなリアルな画像',
    icon: '📷',
    basePrompt: `Photorealistic, high quality, professional photography style.
Natural lighting and realistic textures.
The image should look like a real photograph.`,
    supportsCharacter: false,
  },
}

export const ASPECT_RATIOS: Record<AspectRatio, { name: string; width: number; height: number; description: string }> = {
  '1:1': {
    name: '正方形',
    width: 1080,
    height: 1080,
    description: 'フィード投稿用',
  },
  '4:5': {
    name: '縦長',
    width: 1080,
    height: 1350,
    description: 'フィード縦長',
  },
  '9:16': {
    name: 'リール',
    width: 1080,
    height: 1920,
    description: 'リール/ショート用',
  },
  '16:9': {
    name: '横長',
    width: 1080,
    height: 608,
    description: '横長フィード',
  },
}

/**
 * AspectRatio を Tailwind CSS クラスに変換
 * @param ratio アスペクト比 ('1:1' | '4:5' | '9:16' | '16:9')
 * @returns Tailwind CSS の aspect-* クラス
 */
export function getAspectClass(ratio: AspectRatio): string {
  switch (ratio) {
    case '1:1':
      return 'aspect-square'
    case '4:5':
      return 'aspect-[4/5]'
    case '9:16':
      return 'aspect-[9/16]'
    case '16:9':
      return 'aspect-[16/9]'
    default:
      return 'aspect-square'
  }
}
