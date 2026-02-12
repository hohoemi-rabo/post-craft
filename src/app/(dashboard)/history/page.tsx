import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { HistoryPostList } from '@/components/history/history-post-list'
import { HistoryFilter } from '@/components/history/history-filter'
import { HistorySkeleton } from '@/components/history/history-skeleton'

interface HistoryPageProps {
  searchParams: Promise<{ page?: string; postType?: string }>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const postType = params.postType || ''

  // フィルター用の投稿タイプを取得（軽量クエリ、Suspense外で実行）
  const supabase = createServerClient()
  const { data: postTypeData } = await supabase
    .from('post_types')
    .select('id, name, slug, icon')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const activePostTypes = (postTypeData || []).map((pt) => ({
    id: pt.id as string,
    name: pt.name as string,
    slug: pt.slug as string,
    icon: pt.icon as string,
  }))

  return (
    <div className="space-y-6">
      {/* ヘッダー + フィルター: Suspense外、即表示 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            投稿履歴
          </h1>
          <p className="text-slate-400">過去に作成した投稿を確認できます</p>
        </div>
        <HistoryFilter currentFilter={postType} postTypes={activePostTypes} />
      </div>

      {/* 投稿一覧: Suspense内、データフェッチ中はスケルトン表示 */}
      <Suspense key={`${page}-${postType}`} fallback={<HistorySkeleton />}>
        <HistoryPostList
          userId={session.user.id}
          page={page}
          postType={postType}
        />
      </Suspense>
    </div>
  )
}
