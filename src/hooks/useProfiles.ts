'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ProfileDB, ProfileFormData } from '@/types/profile'

export function useProfiles() {
  const [profiles, setProfiles] = useState<ProfileDB[]>([])
  const [count, setCount] = useState(0)
  const [maxCount, setMaxCount] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/profiles')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch profiles')
      }
      const data = await res.json()
      setProfiles(data.profiles)
      setCount(data.count)
      setMaxCount(data.maxCount)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profiles'
      setError(message)
      console.error('useProfiles fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const defaultProfile = useMemo(
    () => profiles.find(p => p.isDefault) ?? profiles[0] ?? null,
    [profiles]
  )

  const hasMultipleProfiles = useMemo(
    () => profiles.length > 1,
    [profiles]
  )

  const createProfile = useCallback(async (data: ProfileFormData): Promise<ProfileDB> => {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create profile')
    }
    const created = await res.json()
    await fetchProfiles()
    return created
  }, [fetchProfiles])

  const updateProfile = useCallback(async (id: string, data: Partial<ProfileFormData>): Promise<ProfileDB> => {
    const res = await fetch(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update profile')
    }
    const updated = await res.json()
    await fetchProfiles()
    return updated
  }, [fetchProfiles])

  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/profiles/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to delete profile')
    }
    await fetchProfiles()
  }, [fetchProfiles])

  return {
    profiles,
    count,
    maxCount,
    isLoading,
    error,
    defaultProfile,
    hasMultipleProfiles,
    refresh: fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
  }
}
