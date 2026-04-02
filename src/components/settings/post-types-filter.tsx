'use client'

import { useRouter } from 'next/navigation'

interface PostTypesFilterProps {
  profiles: Array<{ id: string; name: string; icon: string }>
  selectedProfileId: string | null
}

export function PostTypesFilter({ profiles, selectedProfileId }: PostTypesFilterProps) {
  const router = useRouter()

  const handleSelect = (profileId: string | null) => {
    if (profileId) {
      router.push(`/settings/post-types?profileId=${profileId}`)
    } else {
      router.push('/settings/post-types')
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleSelect(null)}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          selectedProfileId === null
            ? 'bg-blue-600 text-white'
            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
        }`}
      >
        すべて
      </button>
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => handleSelect(profile.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedProfileId === profile.id
              ? 'bg-blue-600 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          {profile.icon} {profile.name}
        </button>
      ))}
    </div>
  )
}
