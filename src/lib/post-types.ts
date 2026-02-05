import type { PostType, PostTypeConfig } from '@/types/post'
import { type ImageStyle, IMAGE_STYLES as IMAGE_STYLE_CONFIGS } from '@/lib/image-styles'

export const POST_TYPES: Record<PostType, PostTypeConfig> = {
  solution: {
    id: 'solution',
    name: '解決タイプ',
    icon: '🔧',
    description: 'よくある質問と解決方法を紹介',
    target: '全般',
    charRange: { min: 200, max: 300 },
    requiredFields: ['question', 'step1', 'step2', 'step3', 'tip'],
    optionalFields: [],
    hashtagTrend: [
      '#お悩み解決',
      '#困りごと解決',
      '#スマホ操作',
      '#パソコン初心者',
      '#デジタル活用',
      '#IT初心者',
      '#飯田市',
      '#ほほ笑みラボ',
    ],
  },
  promotion: {
    id: 'promotion',
    name: '宣伝タイプ',
    icon: '📢',
    description: 'AI実務サポートサービスの告知',
    target: 'ビジネス層',
    charRange: { min: 200, max: 400 },
    requiredFields: ['headline', 'pain_point1', 'pain_point2', 'pain_point3', 'call_to_action'],
    optionalFields: [],
    hashtagTrend: [
      '#AI活用',
      '#業務効率化',
      '#生成AI',
      '#ChatGPT',
      '#ビジネス',
      '#DX',
      '#働き方改革',
      '#飯田市',
    ],
  },
  tips: {
    id: 'tips',
    name: 'AI活用タイプ',
    icon: '💡',
    description: 'AIの便利な使い方やTipsを紹介',
    target: 'ビジネス層',
    charRange: { min: 200, max: 350 },
    requiredFields: ['title', 'benefit1', 'benefit2', 'benefit3', 'example'],
    optionalFields: [],
    hashtagTrend: [
      '#AI活用術',
      '#仕事効率化',
      '#生成AI',
      '#ChatGPT活用',
      '#時短',
      '#ライフハック',
      '#便利ツール',
      '#AIツール',
    ],
  },
  showcase: {
    id: 'showcase',
    name: '実績タイプ',
    icon: '✨',
    description: '成果物や事例を紹介',
    target: 'ビジネス層',
    charRange: { min: 200, max: 400 },
    requiredFields: ['deliverable_type', 'challenge', 'solution', 'result'],
    optionalFields: [],
    hashtagTrend: [
      '#制作実績',
      '#AI制作',
      '#成果物',
      '#ビフォーアフター',
      '#生成AI活用',
      '#事例紹介',
      '#お客様の声',
      '#飯田市',
    ],
  },
  useful: {
    id: 'useful',
    name: 'お役立ちタイプ',
    icon: '📝',
    description: '汎用的な便利情報・Tipsを紹介',
    target: '全般',
    charRange: { min: 200, max: 350 },
    requiredFields: ['title', 'topic', 'benefit1', 'benefit2', 'benefit3', 'example', 'footer_message'],
    optionalFields: [],
    hashtagTrend: [
      '#お役立ち情報',
      '#便利',
      '#知って得する',
      '#ライフハック',
      '#暮らしの知恵',
      '#情報シェア',
      '#豆知識',
      '#飯田市',
    ],
  },
  howto: {
    id: 'howto',
    name: '使い方タイプ',
    icon: '📖',
    description: '便利情報＋使い方手順を紹介',
    target: '全般',
    charRange: { min: 300, max: 500 },
    requiredFields: ['title', 'topic', 'benefit1', 'benefit2', 'benefit3', 'example', 'howto_title', 'step1', 'step2', 'step3', 'footer_message'],
    optionalFields: [],
    hashtagTrend: [
      '#使い方',
      '#操作方法',
      '#やり方',
      '#便利',
      '#知って得する',
      '#ライフハック',
      '#初心者向け',
      '#飯田市',
    ],
  },
  image_read: {
    id: 'image_read',
    name: '画像読み取りタイプ',
    icon: '📷',
    description: '画像をAIで読み取り、投稿文を自動生成',
    target: '全般',
    charRange: { min: 200, max: 400 },
    requiredFields: ['main_content', 'key_points', 'call_to_action'],
    optionalFields: [],
    hashtagTrend: [
      '#お知らせ',
      '#告知',
      '#イベント',
      '#無料',
      '#勉強会',
      '#セミナー',
      '#飯田市',
      '#ほほ笑みラボ',
    ],
  },
}

// Re-export IMAGE_STYLES from image-styles.ts for backwards compatibility
// Note: For image-related constants, prefer importing directly from @/lib/image-styles
export { IMAGE_STYLES as IMAGE_STYLE_DETAILS } from '@/lib/image-styles'

// Helper functions
export function getPostTypeConfig(type: PostType): PostTypeConfig {
  return POST_TYPES[type]
}

export function getImageStyleConfig(style: ImageStyle) {
  return IMAGE_STYLE_CONFIGS[style]
}
