import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type TableName = keyof Database['public']['Tables']
type PostTypeRow = Database['public']['Tables']['post_types']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type CompetitorAnalysisRow = Database['public']['Tables']['competitor_analyses']['Row']

/**
 * API認証チェック
 * セッションがない場合は 401 エラーレスポンスを返す
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
      userId: null,
    }
  }
  return {
    error: null,
    session,
    userId: session.user.id,
  }
}

/**
 * リソースの所有権チェック（内部ヘルパー）
 * テーブルからリソースを取得し、user_id を検証する
 */
async function checkOwnership<T extends Record<string, unknown>>(
  table: TableName,
  resourceId: string,
  userId: string,
  select: string,
  resourceName: string
): Promise<{ error: NextResponse; data: null } | { error: null; data: T }> {
  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from(table)
    .select(select)
    .eq('id', resourceId)
    .single()

  if (dbError || !data) {
    return {
      error: NextResponse.json({ error: `${resourceName} not found` }, { status: 404 }),
      data: null,
    }
  }

  if ((data as unknown as Record<string, unknown>).user_id !== userId) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      data: null,
    }
  }

  return { error: null, data: data as unknown as T }
}

/**
 * 投稿の所有権チェック
 * 投稿が存在しないか、所有者でない場合はエラーレスポンスを返す
 */
export async function requirePostOwnership(postId: string, userId: string) {
  const result = await checkOwnership<{ id: string; user_id: string }>(
    'posts', postId, userId, 'id, user_id', 'Post'
  )
  if (result.error) return { error: result.error, post: null }
  return { error: null, post: result.data }
}

/**
 * キャラクターの所有権チェック
 * キャラクターが存在しないか、所有者でない場合はエラーレスポンスを返す
 */
export async function requireCharacterOwnership(characterId: string, userId: string) {
  const result = await checkOwnership<{ id: string; user_id: string; image_url: string | null }>(
    'characters', characterId, userId, 'id, user_id, image_url', 'Character'
  )
  if (result.error) return { error: result.error, character: null }
  return { error: null, character: result.data }
}

/**
 * プロフィールの所有権チェック
 * プロフィールが存在しないか、所有者でない場合はエラーレスポンスを返す
 */
export async function requireProfileOwnership(profileId: string, userId: string) {
  const result = await checkOwnership<ProfileRow>(
    'profiles', profileId, userId, '*', 'Profile'
  )
  if (result.error) return { error: result.error, profile: null }
  return { error: null, profile: result.data }
}

/**
 * 投稿タイプの所有権チェック
 * 投稿タイプが存在しないか、所有者でない場合はエラーレスポンスを返す
 */
export async function requirePostTypeOwnership(postTypeId: string, userId: string) {
  const result = await checkOwnership<PostTypeRow>(
    'post_types', postTypeId, userId, '*', 'Post type'
  )
  if (result.error) return { error: result.error, postType: null }
  return { error: null, postType: result.data }
}

/**
 * 分析の所有権チェック
 * 分析が存在しないか、所有者でない場合はエラーレスポンスを返す
 */
export async function requireAnalysisOwnership(analysisId: string, userId: string) {
  const result = await checkOwnership<CompetitorAnalysisRow>(
    'competitor_analyses', analysisId, userId, '*', 'Analysis'
  )
  if (result.error) return { error: result.error, analysis: null }
  return { error: null, analysis: result.data }
}
