import type { PostTypeDB, Placeholder } from '@/types/post-type'
import type { PostTypeRow } from '@/types/supabase'

/**
 * DB Row (snake_case) → PostTypeDB (camelCase) 変換
 */
export function toPostTypeDB(row: PostTypeRow & { profile_ref?: { id: string; name: string; icon: string } | null }): PostTypeDB {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    icon: row.icon,
    templateStructure: row.template_structure,
    placeholders: row.placeholders as unknown as Placeholder[],
    minLength: row.min_length ?? 200,
    maxLength: row.max_length ?? 400,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    userMemo: row.user_memo ?? null,
    typePrompt: row.type_prompt ?? null,
    inputMode: (row.input_mode === 'memo' ? 'memo' : 'fields') as 'fields' | 'memo',
    profileId: row.profile_id ?? null,
    sourceAnalysisId: row.source_analysis_id ?? null,
    profileRef: row.profile_ref ?? null,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

/** 投稿タイプの上限数 */
export const POST_TYPE_MAX_COUNT = 10
