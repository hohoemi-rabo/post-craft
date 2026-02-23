/**
 * 投稿画像
 */
export interface PostImage {
  id: string
  image_url: string
  style: string | null
  aspect_ratio: string | null
  character_id: string | null
}

/**
 * 投稿タイプ参照データ（JOINデータ）
 */
export interface PostTypeRef {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

/**
 * プロフィール参照データ（JOINデータ）
 */
export interface ProfileRef {
  id: string
  name: string
  icon: string
}

/**
 * 投稿データ
 */
export interface Post {
  id: string
  post_type: string
  post_type_id: string | null
  post_type_ref: PostTypeRef | null
  profile_id: string | null
  profile_ref: ProfileRef | null
  input_text: string
  source_url: string | null
  generated_caption: string
  generated_hashtags: string[]
  created_at: string
  post_images: PostImage[]
  instagram_published: boolean
  instagram_published_at: string | null
  related_post_id: string | null
}

/**
 * 編集モードの状態
 */
export interface EditState {
  isEditing: boolean
  editedCaption: string
  editedHashtags: string[]
  editedInputText: string
  editedPostType: string
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
 * 日付を短くフォーマット（月日のみ）
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * ハッシュタグをフォーマット
 */
export function formatHashtag(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`
}

