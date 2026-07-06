import Link from 'next/link'
import { PostTypeForm } from '@/components/settings/post-type-form'

export default async function NewPostTypePage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>
}) {
  const { profileId } = await searchParams

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
        <span>/</span>
        <Link href="/settings/post-types" className="hover:text-white transition-colors">📝 投稿タイプ</Link>
        <span>/</span>
        <span className="text-white">新規作成</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white">投稿タイプを作成</h1>

      <PostTypeForm mode="new" defaultProfileId={profileId} />
    </div>
  )
}
