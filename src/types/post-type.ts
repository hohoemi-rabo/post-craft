// Phase 3: DB管理の投稿タイプ型定義
// 既存の PostType (string union) は src/types/post.ts に残す（後方互換性）

/**
 * テンプレート内のプレースホルダー変数
 */
export interface Placeholder {
  name: string
  label: string
  description?: string
  required: boolean
  inputType: 'text' | 'textarea'
}

/**
 * DB管理の投稿タイプ（post_types テーブル）
 */
export interface PostTypeDB {
  id: string
  userId: string
  name: string
  slug: string
  description: string
  icon: string
  templateStructure: string
  placeholders: Placeholder[]
  minLength: number
  maxLength: number
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 投稿タイプ作成・編集用のフォームデータ
 */
export interface PostTypeFormData {
  name: string
  slug?: string
  description?: string
  icon: string
  templateStructure: string
  placeholders: Placeholder[]
  minLength: number
  maxLength: number
  isActive: boolean
}
