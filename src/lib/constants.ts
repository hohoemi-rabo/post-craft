/**
 * プロジェクト共通定数
 */

/** ハッシュタグの合計数（必須タグ + 生成タグ） */
export const TOTAL_HASHTAG_COUNT = 10

/** 画像アップロード制限 */
export const IMAGE_UPLOAD = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
  MAX_SIZE: 8 * 1024 * 1024, // 8MB
  ACCEPT_STRING: 'image/jpeg,image/png,image/webp',
} as const
