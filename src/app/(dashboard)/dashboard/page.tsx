import { auth } from '@/lib/auth'
import { createServerClient, POST_SELECT_QUERY } from '@/lib/supabase'
import { IMAGE_STYLES } from '@/lib/image-styles'
import Link from 'next/link'

interface RecentPost {
  id: string
  post_type: string
  generated_caption: string
  created_at: string | null
  instagram_published: boolean
  post_images: Array<{ id: string; image_url: string; style: string | null }> | null
  post_type_ref: { id: string; name: string; icon: string } | null
  profile_ref: { id: string; name: string; icon: string } | null
}

export default async function DashboardPage() {
  const session = await auth()
  const supabase = createServerClient()

  // Get user stats
  let totalPosts = 0
  let recentPosts: RecentPost[] = []

  let profiles: Array<{ id: string; name: string; icon: string; is_default: boolean }> = []

  if (session?.user?.id) {
    // Get total posts count
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    totalPosts = count || 0

    // Get recent posts (with post_type_ref, profile_ref, post_images)
    const { data } = await supabase
      .from('posts')
      .select(POST_SELECT_QUERY)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    recentPosts = (data || []) as unknown as RecentPost[]

    // Get profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name, icon, is_default')
      .eq('user_id', session.user.id)
      .order('sort_order', { ascending: true })

    profiles = profileData || []
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          ようこそ、{session?.user?.name || 'ユーザー'}さん
        </h1>
        <p className="text-slate-400">
          Instagram投稿素材を簡単に作成できます
        </p>
      </div>

      {/* Profile Quick Select (only when multiple profiles) */}
      {profiles.length > 1 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3">プロフィールを選んで投稿作成</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/create?profileId=${profile.id}`}
                className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{profile.icon}</span>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors text-sm">
                      {profile.name}
                    </h3>
                    <p className="text-xs text-slate-400">投稿を作成 →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/create"
          className="group p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✏️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">新規作成</h3>
              <p className="text-blue-100 text-sm">投稿素材を作成する</p>
            </div>
          </div>
        </Link>

        <Link
          href="/characters"
          className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">キャラクター</h3>
              <p className="text-slate-400 text-sm">キャラクターを管理</p>
            </div>
          </div>
        </Link>

        <Link
          href="/history"
          className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">投稿履歴</h3>
              <p className="text-slate-400 text-sm">過去の投稿を確認</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm">総投稿数</p>
              <p className="text-3xl font-bold text-white">{totalPosts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">最近の投稿</h2>
          {recentPosts.length > 0 && (
            <Link
              href="/history"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              すべて見る →
            </Link>
          )}
        </div>

        {recentPosts.length === 0 ? (
          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
            <p className="text-slate-400 mb-4">まだ投稿がありません</p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <span>✏️</span>
              <span>最初の投稿を作成</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => {
              const typeIcon = post.post_type_ref?.icon || '📝'
              const typeName = post.post_type_ref?.name || post.post_type || '不明なタイプ'
              const firstImage = post.post_images?.[0]

              return (
                <Link
                  key={post.id}
                  href={`/history/${post.id}`}
                  className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-lg">{typeIcon}</span>
                        <span className="text-sm font-medium text-white">{typeName}</span>
                        {firstImage?.style && IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES] && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                            {IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES].icon}{' '}
                            {IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES].name}
                          </span>
                        )}
                        {post.profile_ref && (
                          <span className="px-2 py-0.5 bg-blue-600/15 text-blue-400 text-xs rounded-full">
                            {post.profile_ref.icon} {post.profile_ref.name}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {post.created_at && new Date(post.created_at).toLocaleDateString('ja-JP')}
                        </span>
                        {post.instagram_published ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            ✅ 投稿済み
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded-full">
                            ⏳ 未投稿
                          </span>
                        )}
                      </div>
                      <p className="text-white text-sm truncate">
                        {post.generated_caption.substring(0, 80)}...
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-slate-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
