'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Profile {
  id: string
  name: string
  icon: string
}

interface IdeasFilterProps {
  profiles: Profile[]
}

export function IdeasFilter({ profiles }: IdeasFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentProfileId = searchParams.get('profileId')

  const handleFilter = (profileId: string | null) => {
    const params = new URLSearchParams()
    if (profileId) {
      params.set('profileId', profileId)
    }
    router.push(`/ideas${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleFilter(null)}
        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
          !currentProfileId
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
            : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
        }`}
      >
        すべて
      </button>
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => handleFilter(profile.id)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            currentProfileId === profile.id
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
          }`}
        >
          {profile.icon} {profile.name}
        </button>
      ))}
    </div>
  )
}
