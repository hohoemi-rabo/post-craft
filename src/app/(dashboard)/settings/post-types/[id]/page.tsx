import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { toPostTypeDB } from '@/lib/post-type-utils'
import type { Placeholder } from '@/types/post-type'
import { PostTypeForm } from '@/components/settings/post-type-form'

export default async function EditPostTypePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('post_types')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !data) notFound()

  const postType = {
    ...toPostTypeDB(data),
    placeholders: (data.placeholders || []) as unknown as Placeholder[],
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
        <span>/</span>
        <Link href="/settings/post-types" className="hover:text-white transition-colors">📝 投稿タイプ</Link>
        <span>/</span>
        <span className="text-white">{postType.icon} {postType.name} を編集</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white">
        {postType.icon} {postType.name} を編集
      </h1>

      <PostTypeForm mode="edit" initialData={postType} />
    </div>
  )
}
