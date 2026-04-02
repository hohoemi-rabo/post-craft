import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { POST_TYPE_MAX_COUNT } from '@/lib/post-type-utils'
import { PostTypesContent } from '@/components/settings/post-types-content'
import { PostTypeListSkeleton } from '@/components/settings/post-type-list'
import { PostTypesFilter } from '@/components/settings/post-types-filter'

export default async function PostTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const selectedProfileId = params.profileId || null

  // Fetch profiles for filter tabs (lightweight query)
  const supabase = createServerClient()
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name, icon')
    .eq('user_id', session.user.id)
    .order('sort_order', { ascending: true })

  const profiles = profilesData || []

  // Get total count for the "new" button disabled state
  const { count: totalCount } = await supabase
    .from('post_types')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  const newTypeHref = selectedProfileId
    ? `/settings/post-types/new?profileId=${selectedProfileId}`
    : '/settings/post-types/new'

  const isMaxReached = (totalCount || 0) >= POST_TYPE_MAX_COUNT

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
          <span>/</span>
          <span className="text-white">📝 投稿タイプ管理</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">投稿タイプ管理</h1>
            <p className="text-slate-400">投稿テンプレートの追加・編集・並び替え</p>
          </div>
          <Link
            href={newTypeHref}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
              isMaxReached
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed pointer-events-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            aria-disabled={isMaxReached}
          >
            + 新規作成
          </Link>
        </div>
      </div>

      {/* Profile Tab Filter */}
      {profiles.length > 1 && (
        <PostTypesFilter
          profiles={profiles}
          selectedProfileId={selectedProfileId}
        />
      )}

      {/* List */}
      <Suspense key={selectedProfileId || 'all'} fallback={<PostTypeListSkeleton />}>
        <PostTypesContent userId={session.user.id} profileId={selectedProfileId} />
      </Suspense>
    </div>
  )
}
