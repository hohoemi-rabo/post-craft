import { createServerClient } from '@/lib/supabase'
import { toPostTypeDB, POST_TYPE_MAX_COUNT } from '@/lib/post-type-utils'
import { PostTypesContentClient } from './post-types-content-client'

interface PostTypesContentProps {
  userId: string
  profileId: string | null
}

export async function PostTypesContent({ userId, profileId }: PostTypesContentProps) {
  const supabase = createServerClient()

  let query = supabase
    .from('post_types')
    .select('*, profile_ref:profiles(id, name, icon)')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (profileId) {
    query = query.eq('profile_id', profileId)
  }

  const { data, error } = await query

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        投稿タイプの取得に失敗しました
      </div>
    )
  }

  const postTypes = (data || []).map(toPostTypeDB)

  return (
    <PostTypesContentClient
      postTypes={postTypes}
      count={postTypes.length}
      maxCount={POST_TYPE_MAX_COUNT}
    />
  )
}
