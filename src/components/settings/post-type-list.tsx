'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { PostTypeDB } from '@/types/post-type'
import { useToast } from '@/components/ui/toast'
import Modal from '@/components/ui/modal'

interface PostTypeListProps {
  postTypes: PostTypeDB[]
  onToggleActive: (id: string, isActive: boolean) => Promise<void>
  onDuplicate: (id: string) => Promise<PostTypeDB>
  onDelete: (id: string) => Promise<{ affectedPosts: number }>
  onReorder: (items: { id: string; sortOrder: number }[]) => Promise<void>
}

export function PostTypeList({
  postTypes,
  onToggleActive,
  onDuplicate,
  onDelete,
  onReorder,
}: PostTypeListProps) {
  const { showToast } = useToast()
  const [deleteTarget, setDeleteTarget] = useState<PostTypeDB | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Drag and drop state
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleToggle = useCallback(async (id: string, currentActive: boolean) => {
    setProcessingId(id)
    try {
      await onToggleActive(id, !currentActive)
    } catch {
      showToast('切り替えに失敗しました', 'error')
    } finally {
      setProcessingId(null)
    }
  }, [onToggleActive, showToast])

  const handleDuplicate = useCallback(async (id: string) => {
    setProcessingId(id)
    try {
      await onDuplicate(id)
      showToast('複製しました', 'success')
    } catch {
      showToast('複製に失敗しました', 'error')
    } finally {
      setProcessingId(null)
    }
  }, [onDuplicate, showToast])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const result = await onDelete(deleteTarget.id)
      if (result.affectedPosts > 0) {
        showToast(`削除しました（${result.affectedPosts}件の投稿のタイプ情報が解除されました）`, 'info')
      } else {
        showToast('削除しました', 'success')
      }
      setDeleteTarget(null)
    } catch {
      showToast('削除に失敗しました', 'error')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, onDelete, showToast])

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverItem.current = index
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback(async () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) {
      setIsDragging(false)
      setDragOverIndex(null)
      return
    }

    const reordered = [...postTypes]
    const [removed] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOverItem.current, 0, removed)

    const items = reordered.map((pt, i) => ({ id: pt.id, sortOrder: i }))

    setIsDragging(false)
    setDragOverIndex(null)
    dragItem.current = null
    dragOverItem.current = null

    try {
      await onReorder(items)
    } catch {
      showToast('並び替えに失敗しました', 'error')
    }
  }, [postTypes, onReorder, showToast])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setDragOverIndex(null)
    dragItem.current = null
    dragOverItem.current = null
  }, [])

  if (postTypes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-lg mb-4">投稿タイプがありません</p>
        <Link
          href="/settings/post-types/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          + 新規作成
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {postTypes.map((pt, index) => (
          <div
            key={pt.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`p-4 bg-white/5 border rounded-2xl transition-all duration-200 ${
              dragOverIndex === index && isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10'
            } ${
              isDragging && dragItem.current === index ? 'opacity-50' : ''
            } ${
              !pt.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 select-none">
                <span className="text-lg">≡</span>
              </div>

              {/* Icon + Name + Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{pt.icon}</span>
                  <h3 className="text-white font-bold truncate">{pt.name}</h3>
                  {!pt.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">無効</span>
                  )}
                </div>
                {pt.description && (
                  <p className="text-sm text-slate-400 truncate">{pt.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  {pt.minLength}〜{pt.maxLength}文字 | 変数 {pt.placeholders.length}個
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(pt.id, pt.isActive)}
                  disabled={processingId === pt.id}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    pt.isActive ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                  title={pt.isActive ? '無効にする' : '有効にする'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      pt.isActive ? 'translate-x-5' : ''
                    }`}
                  />
                </button>

                {/* Edit */}
                <Link
                  href={`/settings/post-types/${pt.id}`}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>

                {/* Duplicate */}
                <button
                  onClick={() => handleDuplicate(pt.id)}
                  disabled={processingId === pt.id}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="複製"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(pt)}
                  disabled={processingId === pt.id}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="投稿タイプを削除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-bold">{deleteTarget?.icon} {deleteTarget?.name}</span> を削除しますか？
          </p>
          <p className="text-sm text-gray-500">
            このタイプを使用している投稿がある場合、投稿のタイプ情報が解除されます（投稿自体は削除されません）。
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? '削除中...' : '削除する'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/** ローディングスケルトン */
export function PostTypeListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-slate-700 rounded" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-slate-700 rounded" />
                <div className="h-5 w-32 bg-slate-700 rounded" />
              </div>
              <div className="h-4 w-48 bg-slate-700/50 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="w-11 h-6 bg-slate-700 rounded-full" />
              <div className="w-8 h-8 bg-slate-700 rounded" />
              <div className="w-8 h-8 bg-slate-700 rounded" />
              <div className="w-8 h-8 bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
