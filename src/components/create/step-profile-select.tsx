'use client'

import { useEffect } from 'react'
import { useProfiles } from '@/hooks/useProfiles'
import type { ProfileDB } from '@/types/profile'

interface StepProfileSelectProps {
  onSelect: (profile: ProfileDB) => void
}

export function StepProfileSelect({ onSelect }: StepProfileSelectProps) {
  const { profiles, isLoading, error, defaultProfile, hasMultipleProfiles } = useProfiles()

  // Auto-select if only one profile
  useEffect(() => {
    if (!isLoading && !hasMultipleProfiles && defaultProfile) {
      onSelect(defaultProfile)
    }
  }, [isLoading, hasMultipleProfiles, defaultProfile, onSelect])

  // Show nothing while auto-selecting
  if (!isLoading && !hasMultipleProfiles) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          プロフィールを選択
        </h2>
        <p className="text-slate-400 text-sm">
          どのターゲット向けに投稿しますか？
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl animate-pulse"
            >
              <div className="w-10 h-10 bg-white/10 rounded mb-3" />
              <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-4 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile)}
              className="relative p-6 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              {profile.isDefault && (
                <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-blue-600/20 text-blue-400 text-[10px] rounded-full">
                  デフォルト
                </span>
              )}
              <div className="text-3xl mb-3">{profile.icon}</div>
              <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                {profile.name}
              </h3>
              {profile.description && (
                <p className="text-sm text-slate-400">{profile.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
