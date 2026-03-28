import { useState, useCallback } from 'react'
import type { RemakeSuggestion } from '@/types/remake'

interface UseRemakeSuggestionsOptions {
  sourcePostId?: string
  context?: 'detail' | 'report'
}

export function useRemakeSuggestions({ sourcePostId, context = 'detail' }: UseRemakeSuggestionsOptions = {}) {
  const [suggestions, setSuggestions] = useState<RemakeSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (sourcePostId) params.set('sourcePostId', sourcePostId)
      if (context) params.set('context', context)
      params.set('includeUsed', 'true')

      const res = await fetch(`/api/remake/suggestions?${params}`)
      if (!res.ok) throw new Error('提案の取得に失敗しました')
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setHasFetched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提案の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [sourcePostId, context])

  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/remake/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePostId, context }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '提案の生成に失敗しました')
      }
      const data = await res.json()
      setSuggestions(prev => [...(data.suggestions || []), ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : '提案の生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }, [sourcePostId, context])

  const deleteSuggestion = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/remake/suggestions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      setSuggestions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }, [])

  const markAsUsed = useCallback(async (id: string) => {
    try {
      await fetch(`/api/remake/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUsed: true }),
      })
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, isUsed: true } : s))
    } catch {
      // Silent fail for marking as used
    }
  }, [])

  return {
    suggestions,
    isLoading,
    isGenerating,
    error,
    hasFetched,
    fetchSuggestions,
    generateSuggestions,
    deleteSuggestion,
    markAsUsed,
  }
}
