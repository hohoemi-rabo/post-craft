'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PostTypeDB, PostTypeFormData } from '@/types/post-type'

export function usePostTypes() {
  const [postTypes, setPostTypes] = useState<PostTypeDB[]>([])
  const [count, setCount] = useState(0)
  const [maxCount, setMaxCount] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPostTypes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/post-types')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch post types')
      }
      const data = await res.json()
      setPostTypes(data.postTypes)
      setCount(data.count)
      setMaxCount(data.maxCount)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch post types'
      setError(message)
      console.error('usePostTypes fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPostTypes()
  }, [fetchPostTypes])

  const createPostType = useCallback(async (data: PostTypeFormData): Promise<PostTypeDB> => {
    const res = await fetch('/api/post-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create post type')
    }
    const created = await res.json()
    await fetchPostTypes()
    return created
  }, [fetchPostTypes])

  const updatePostType = useCallback(async (id: string, data: Partial<PostTypeFormData>): Promise<void> => {
    const res = await fetch(`/api/post-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update post type')
    }
    await fetchPostTypes()
  }, [fetchPostTypes])

  const deletePostType = useCallback(async (id: string): Promise<{ affectedPosts: number }> => {
    const res = await fetch(`/api/post-types/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to delete post type')
    }
    const result = await res.json()
    await fetchPostTypes()
    return { affectedPosts: result.affectedPosts }
  }, [fetchPostTypes])

  const duplicatePostType = useCallback(async (id: string): Promise<PostTypeDB> => {
    const res = await fetch(`/api/post-types/${id}/duplicate`, {
      method: 'POST',
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to duplicate post type')
    }
    const duplicated = await res.json()
    await fetchPostTypes()
    return duplicated
  }, [fetchPostTypes])

  const reorderPostTypes = useCallback(async (items: { id: string; sortOrder: number }[]): Promise<void> => {
    const res = await fetch('/api/post-types/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to reorder post types')
    }
    await fetchPostTypes()
  }, [fetchPostTypes])

  const toggleActive = useCallback(async (id: string, isActive: boolean): Promise<void> => {
    await updatePostType(id, { isActive })
  }, [updatePostType])

  const activePostTypes = useMemo(
    () => postTypes.filter(pt => pt.isActive),
    [postTypes]
  )

  return {
    postTypes,
    count,
    maxCount,
    isLoading,
    error,
    refresh: fetchPostTypes,
    createPostType,
    updatePostType,
    deletePostType,
    duplicatePostType,
    reorderPostTypes,
    toggleActive,
    activePostTypes,
  }
}
