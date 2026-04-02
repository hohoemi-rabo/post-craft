import { createServerClient } from '@/lib/supabase'
import { toProfileDB } from '@/lib/profile-utils'
import { PROFILE_MAX_COUNT } from '@/types/profile'
import { ProfilesListClient } from './profiles-list-client'

interface ProfilesListProps {
  userId: string
}

export async function ProfilesList({ userId }: ProfilesListProps) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*, post_types(count)')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        プロフィールの取得に失敗しました
      </div>
    )
  }

  const profiles = (data ?? []).map(toProfileDB)

  return (
    <ProfilesListClient
      profiles={profiles}
      count={profiles.length}
      maxCount={PROFILE_MAX_COUNT}
    />
  )
}
