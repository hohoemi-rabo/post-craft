import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="space-y-8">
      {/* Welcome - renders immediately */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          ようこそ、{session.user.name || 'ユーザー'}さん
        </h1>
        <p className="text-slate-400">
          Instagram投稿素材を簡単に作成できます
        </p>
      </div>

      {/* Quick Actions - renders immediately (static links) */}
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

      {/* Data-dependent content - streamed via Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userId={session.user.id} />
      </Suspense>
    </div>
  )
}
