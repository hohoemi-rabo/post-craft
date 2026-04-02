import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ProfilesList } from '@/components/settings/profiles-list'
import { ProfilesListSkeleton } from '@/components/settings/profiles-list-skeleton'

export default async function ProfilesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
          <span>/</span>
          <span className="text-white">👥 プロフィール管理</span>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">プロフィール管理</h1>
          <p className="text-slate-400">ターゲット別のプロフィールを管理します</p>
        </div>
      </div>

      <Suspense fallback={<ProfilesListSkeleton />}>
        <ProfilesList userId={session.user.id} />
      </Suspense>
    </div>
  )
}
