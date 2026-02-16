import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient, POST_SELECT_QUERY } from '@/lib/supabase'
import { PostDetailClient } from '@/components/history/post-detail-client'
import type { Post } from '@/types/history-detail'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT_QUERY)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !data) notFound()

  return <PostDetailClient initialPost={data as unknown as Post} />
}
