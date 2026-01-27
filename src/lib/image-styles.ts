// Image style definitions for AI image generation

export type ImageStyle = 'manga_male' | 'manga_female' | 'pixel_art' | 'illustration'
export type AspectRatio = '1:1' | '9:16'
export type BackgroundType = 'tech' | 'auto'

export const BACKGROUND_TYPES: Record<BackgroundType, { name: string; description: string }> = {
  tech: {
    name: 'テクノロジー背景',
    description: 'PC、AI、デジタル要素',
  },
  auto: {
    name: '内容に合わせる',
    description: 'シーン説明から自動判定',
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
}

export const ASPECT_RATIOS: Record<AspectRatio, { name: string; width: number; height: number; description: string }> = {
  '1:1': {
    name: '正方形',
    width: 1080,
    height: 1080,
    description: 'フィード投稿用',
  },
  '9:16': {
    name: '縦長',
    width: 1080,
    height: 1920,
    description: 'リール/ショート用',
  },
}
