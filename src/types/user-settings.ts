// Phase 3: ユーザー設定型定義

/**
 * ユーザー設定（user_settings テーブル）
 */
export interface UserSettings {
  id: string
  userId: string
  requiredHashtags: string[]
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
