'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { UserSettings } from '@/types/user-settings'
import { TOTAL_HASHTAG_COUNT } from '@/lib/constants'

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch settings')
      }
      const data = await res.json()
      setSettings(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings'
      setError(message)
      console.error('useUserSettings fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateHashtags = useCallback(async (hashtags: string[]): Promise<{ generatedCount: number }> => {
    const res = await fetch('/api/settings/hashtags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requiredHashtags: hashtags }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update hashtags')
    }
    const result = await res.json()
    await fetchSettings()
    return { generatedCount: result.generatedCount }
  }, [fetchSettings])

  const updateSettings = useCallback(async (data: Partial<UserSettings>): Promise<void> => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: data }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update settings')
    }
    await fetchSettings()
  }, [fetchSettings])

  const requiredHashtags = useMemo(
    () => settings?.requiredHashtags ?? [],
    [settings]
  )

  const generatedHashtagCount = useMemo(
    () => TOTAL_HASHTAG_COUNT - requiredHashtags.length,
    [requiredHashtags]
  )

  return {
    settings,
    isLoading,
    error,
    refresh: fetchSettings,
    updateHashtags,
    updateSettings,
    requiredHashtags,
    generatedHashtagCount,
  }
}
