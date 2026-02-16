import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { toProfileDB } from '@/lib/profile-utils'
import { ProfileDetailClient } from '@/components/settings/profile-detail-client'

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !data) notFound()

  const profile = toProfileDB(data)

  return <ProfileDetailClient profile={profile} />
}
