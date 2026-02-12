'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface HistoryDeleteButtonProps {
  postId: string
}

export function HistoryDeleteButton({ postId }: HistoryDeleteButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (response.ok) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors"
      >
        削除
      </button>

      {showConfirm && (
        <div className="absolute inset-0 bg-slate-900/95 rounded-xl flex flex-col items-center justify-center p-4 z-10">
          <p className="text-white text-sm text-center mb-4">
            この投稿を削除しますか？
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {isPending ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
