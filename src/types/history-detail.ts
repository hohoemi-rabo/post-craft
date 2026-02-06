import type { PostType } from '@/types/post'

/**
 * 投稿画像
 */
export interface PostImage {
  id: string
  image_url: string
  image_style: string | null
  aspect_ratio: string | null
}

/**
 * 投稿データ
 */
export interface Post {
  id: string
  post_type: PostType
  input_text: string
  source_url: string | null
  generated_caption: string
  generated_hashtags: string[]
  created_at: string
  post_images: PostImage[]
  instagram_published: boolean
  instagram_published_at: string | null
}

/**
 * 編集モードの状態
 */
export interface EditState {
  isEditing: boolean
  editedCaption: string
  editedHashtags: string[]
  editedInputText: string
  editedPostType: PostType
  newHashtagInput: string
  isSaving: boolean
  isRegeneratingCaption: boolean
}

/**
 * 日付をフォーマット
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * ハッシュタグをフォーマット
 */
export function formatHashtag(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`
}

/**
 * アスペクト比からCSSクラスを取得
 */
export function getAspectClass(ratio: string): string {
  switch (ratio) {
    case '1:1': return 'aspect-square'
    case '4:5': return 'aspect-[4/5]'
    case '9:16': return 'aspect-[9/16]'
    case '16:9': return 'aspect-[16/9]'
    default: return 'aspect-square'
  }
}
