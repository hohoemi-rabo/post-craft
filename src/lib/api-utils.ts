import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

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
 * 投稿の所有権チェック
 * 投稿が存在しないか、所有者でない場合はエラーレスポンスを返す
 */
export async function requirePostOwnership(postId: string, userId: string) {
  const supabase = createServerClient()
  const { data: post, error: dbError } = await supabase
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .single()

  if (dbError || !post) {
    return {
      error: NextResponse.json({ error: 'Post not found' }, { status: 404 }),
      post: null,
    }
  }

  if (post.user_id !== userId) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      post: null,
    }
  }

  return {
    error: null,
    post,
  }
}

/**
 * キャラクターの所有権チェック
 * キャラクターが存在しないか、所有者でない場合はエラーレスポンスを返す
 */
export async function requireCharacterOwnership(characterId: string, userId: string) {
  const supabase = createServerClient()
  const { data: character, error: dbError } = await supabase
    .from('characters')
    .select('id, user_id, image_url')
    .eq('id', characterId)
    .single()

  if (dbError || !character) {
    return {
      error: NextResponse.json({ error: 'Character not found' }, { status: 404 }),
      character: null,
    }
  }

  if (character.user_id !== userId) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      character: null,
    }
  }

  return {
    error: null,
    character,
  }
}
