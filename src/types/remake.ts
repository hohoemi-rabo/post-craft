import type { RemakeSuggestionRow } from '@/types/supabase'

/**
 * リメイク提案（アプリ用 camelCase）
 */
export interface RemakeSuggestion {
  id: string
  userId: string
  sourcePostId: string
  suggestedTypeSlug: string
  suggestedTypeName: string
  suggestedTypeIcon: string
  suggestedProfileId: string | null
  suggestedProfileName: string | null
  reason: string
  direction: string
  isUsed: boolean
  generatedFrom: 'detail' | 'report'
  createdAt: string
  updatedAt: string
}

/**
 * DB Row → RemakeSuggestion 変換
 */
export function toRemakeSuggestion(
  row: RemakeSuggestionRow,
  typeName: string,
  typeIcon: string,
  profileName: string | null
): RemakeSuggestion {
  return {
    id: row.id,
    userId: row.user_id,
    sourcePostId: row.source_post_id,
    suggestedTypeSlug: row.suggested_type_slug,
    suggestedTypeName: typeName,
    suggestedTypeIcon: typeIcon,
    suggestedProfileId: row.suggested_profile_id,
    suggestedProfileName: profileName,
    reason: row.reason,
    direction: row.direction,
    isUsed: row.is_used,
    generatedFrom: (row.generated_from === 'report' ? 'report' : 'detail') as 'detail' | 'report',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}
