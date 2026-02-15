import type { ProfileDB } from '@/types/profile'

/**
 * DB Row (snake_case) → ProfileDB (camelCase) 変換
 */
export function toProfileDB(row: {
  id: string
  user_id: string
  name: string
  icon: string
  description: string | null
  system_prompt_memo: string | null
  system_prompt: string | null
  required_hashtags: string[]
  is_default: boolean
  sort_order: number
  source_analysis_id?: string | null
  created_at: string | null
  updated_at: string | null
  post_types?: { count: number }[]
}): ProfileDB {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    description: row.description ?? null,
    systemPromptMemo: row.system_prompt_memo ?? null,
    systemPrompt: row.system_prompt ?? null,
    requiredHashtags: row.required_hashtags ?? [],
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    sourceAnalysisId: row.source_analysis_id ?? null,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    postTypeCount: row.post_types?.[0]?.count ?? undefined,
  }
}
