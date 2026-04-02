'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { PostTypeDB } from '@/types/post-type'
import { PostTypeList } from './post-type-list'

interface PostTypesContentClientProps {
  postTypes: PostTypeDB[]
  count: number
  maxCount: number
}

export function PostTypesContentClient({ postTypes, count, maxCount }: PostTypesContentClientProps) {
  const router = useRouter()

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/post-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update')
    }
    router.refresh()
  }, [router])

  const duplicatePostType = useCallback(async (id: string) => {
    const res = await fetch(`/api/post-types/${id}/duplicate`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to duplicate')
    }
    const duplicated = await res.json()
    router.refresh()
    return duplicated
  }, [router])

  const deletePostType = useCallback(async (id: string) => {
    const res = await fetch(`/api/post-types/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to delete')
    }
    const result = await res.json()
    router.refresh()
    return { affectedPosts: result.affectedPosts }
  }, [router])

  const reorderPostTypes = useCallback(async (items: { id: string; sortOrder: number }[]) => {
    const res = await fetch('/api/post-types/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to reorder')
    }
    router.refresh()
  }, [router])

  return (
    <>
      <PostTypeList
        postTypes={postTypes}
        onToggleActive={toggleActive}
        onDuplicate={duplicatePostType}
        onDelete={deletePostType}
        onReorder={reorderPostTypes}
      />

      {/* Footer - Usage counter */}
      {postTypes.length > 0 && (
        <div className="text-center text-sm text-slate-500 pt-2">
          📊 {count} / {maxCount} タイプ使用中
        </div>
      )}
    </>
  )
}
