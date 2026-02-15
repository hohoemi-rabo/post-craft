/**
 * DB管理のプロフィール（profiles テーブル）
 */
export interface ProfileDB {
  id: string
  userId: string
  name: string
  icon: string
  description: string | null
  systemPromptMemo: string | null
  systemPrompt: string | null
  requiredHashtags: string[]
  isDefault: boolean
  sortOrder: number
  sourceAnalysisId: string | null
  createdAt: string
  updatedAt: string
  // JOIN で取得される投稿タイプ数（オプション）
  postTypeCount?: number
}

/**
 * プロフィール作成・編集用のフォームデータ
 */
export interface ProfileFormData {
  name: string
  icon: string
  description?: string
}

/** プロフィールの上限数 */
export const PROFILE_MAX_COUNT = 5
