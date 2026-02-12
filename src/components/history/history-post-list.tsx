import Link from 'next/link'
import { createServerClient, POST_SELECT_QUERY } from '@/lib/supabase'
import type { Post } from '@/types/history-detail'
import { HistoryPostCard } from './history-post-card'
import { HistoryPagination } from './history-pagination'

interface HistoryPostListProps {
  userId: string
  page: number
  postType: string
}

const LIMIT = 10

export async function HistoryPostList({ userId, page, postType }: HistoryPostListProps) {
  const supabase = createServerClient()

  let query = supabase
    .from('posts')
    .select(POST_SELECT_QUERY, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (postType) {
    query = query.eq('post_type', postType)
  }

  const { data, count, error } = await query.range(
    (page - 1) * LIMIT,
    page * LIMIT - 1
  )

  if (error) {
    console.error('Error fetching posts:', error)
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        投稿の取得に失敗しました
      </div>
    )
  }

  const posts = (data || []) as unknown as Post[]
  const totalPages = Math.ceil((count || 0) / LIMIT)

  if (posts.length === 0) {
    return (
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">📝</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          投稿がありません
        </h2>
        <p className="text-slate-400 mb-4">
          新しい投稿を作成してみましょう
        </p>
        <Link
          href="/create"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          新規作成
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => (
          <HistoryPostCard key={post.id} post={post} />
        ))}
      </div>
      {totalPages > 1 && (
        <HistoryPagination
          currentPage={page}
          totalPages={totalPages}
          postType={postType}
        />
      )}
    </>
  )
}
