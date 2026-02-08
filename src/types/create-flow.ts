import type { ImageStyle, AspectRatio, BackgroundType } from '@/lib/image-styles'
import type { PostType } from '@/types/post'

/**
 * 投稿作成フォームの状態
 */
export interface CreateFormState {
  postType: PostType | null
  inputText: string
  sourceUrl: string
  imageStyle: ImageStyle
  aspectRatio: AspectRatio
  characterId: string | null
  skipImage: boolean
  useCharacterImage: boolean
  catchphrase: string
  backgroundType: BackgroundType
  // image_read タイプ用
  uploadedImageFile: File | null
  uploadedImageBase64: string
  uploadedImageMimeType: string
  imageReadAspectRatio: '1:1' | '4:5' | '16:9'
  // 関連投稿参照
  relatedPostId: string | null
  relatedPostCaption: string | null
  relatedPostHashtags: string[] | null
  relatedPostImageStyle: string | null
  relatedPostAspectRatio: string | null
  relatedPostBackgroundType: string | null
}

/**
 * 生成結果
 */
export interface GeneratedResult {
  caption: string
  hashtags: string[]
  imageUrl: string | null
}

/**
 * 生成ステップ
 */
export interface GenerationStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete' | 'error'
  error?: string
}

/**
 * フォームの初期状態
 */
export const INITIAL_FORM_STATE: CreateFormState = {
  postType: null,
  inputText: '',
  sourceUrl: '',
  imageStyle: 'manga_male',
  aspectRatio: '9:16',
  characterId: null,
  skipImage: false,
  useCharacterImage: false,
  catchphrase: '',
  backgroundType: 'tech',
  // image_read タイプ用
  uploadedImageFile: null,
  uploadedImageBase64: '',
  uploadedImageMimeType: '',
  imageReadAspectRatio: '1:1',
  // 関連投稿参照
  relatedPostId: null,
  relatedPostCaption: null,
  relatedPostHashtags: null,
  relatedPostImageStyle: null,
  relatedPostAspectRatio: null,
  relatedPostBackgroundType: null,
}
