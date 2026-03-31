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
    basePrompt: `日本のマンガ・アニメ調のイラストスタイルで描かれた、テック・ビジネス系のSNSサムネイル画像。
鮮やかでカラフルな配色とグラデーション背景で、プロフェッショナルだけど親しみやすい雰囲気を演出。
ミディアムショットの構図で、キャラクターを画面の中央に配置。
ソフトボックスを使ったスタジオ風のフラットな照明で、顔や表情がはっきり見えるようにする。`,
    supportsCharacter: true,
  },
  manga_female: {
    id: 'manga_female',
    name: 'マンガ風（女性）',
    description: 'クリエイティブ系、パステル調',
    icon: '👩‍💼',
    basePrompt: `日本のマンガ・アニメ調のイラストスタイルで描かれた、クリエイティブ系のSNSサムネイル画像。
パステル調やソフトなグラデーション背景で、スタイリッシュでトレンド感のある雰囲気を演出。
ミディアムショットの構図で、キャラクターを画面の中央に配置。
柔らかく明るい自然光風の照明で、温かみのある仕上がりにする。`,
    supportsCharacter: true,
  },
  pixel_art: {
    id: 'pixel_art',
    name: 'ピクセルアート',
    description: 'レトロゲーム風、サイバー背景',
    icon: '👾',
    basePrompt: `ピクセルアート・ドット絵スタイルで描かれた、レトロゲーム風のSNSサムネイル画像。
かわいいちびキャラクターが画面中央にいる、サイバー・デジタルな世界観。
8bit/16bitゲームの雰囲気で、ネオンブルーのグリッド背景と光るエフェクト。`,
    supportsCharacter: true,
  },
  illustration: {
    id: 'illustration',
    name: 'イラスト（人物なし）',
    description: 'フラットデザイン、図形のみ',
    icon: '🎨',
    basePrompt: `フラットデザインのイラスト風で描かれた、ポップで明るい色使いのSNSサムネイル画像。
シンプルでかわいらしい雰囲気の2Dイラストスタイルで、アイコン・シンボル・抽象的な図形・風景イラストのみで表現。
人物、キャラクター、顔、手、体は絶対に含めない。テキストも含めない。`,
    supportsCharacter: false,
  },
  realistic: {
    id: 'realistic',
    name: 'リアル（写真風）',
    description: '写真のようなリアルな画像',
    icon: '📷',
    basePrompt: `プロの写真家が撮影したような、高品質でフォトリアリスティックな画像。
自然光とリアルな質感で、実際の写真のように見える仕上がり。
ミディアムショットの構図で、被写界深度を浅くして背景をぼかし、被写体を際立たせる。`,
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
