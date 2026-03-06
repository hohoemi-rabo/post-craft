import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { IdeasList } from '@/components/ideas/ideas-list'
import { IdeasFilter } from '@/components/ideas/ideas-filter'
import { IdeasSkeleton } from '@/components/ideas/ideas-skeleton'

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const profileId = params.profileId

  // Fetch profiles for filter
  const supabase = createServerClient()
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name, icon')
    .eq('user_id', session.user.id)
    .order('sort_order', { ascending: true })

  const profiles = (profilesData || []).map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon || '📋',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">アイデア</h1>
        <Link
          href="/ideas/generate"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          新しいアイデアを生成
        </Link>
      </div>

      {/* Profile filter */}
      {profiles.length > 1 && <IdeasFilter profiles={profiles} />}

      {/* Ideas list */}
      <Suspense key={profileId || 'all'} fallback={<IdeasSkeleton />}>
        <IdeasList userId={session.user.id} profileId={profileId} />
      </Suspense>
    </div>
  )
}
