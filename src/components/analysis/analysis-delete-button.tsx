'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface AnalysisDeleteButtonProps {
  analysisId: string
}

export function AnalysisDeleteButton({ analysisId }: AnalysisDeleteButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/analysis/${analysisId}`, { method: 'DELETE' })
      if (response.ok) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error)
    }
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowConfirm(true)
        }}
        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors min-h-[28px]"
      >
        削除
      </button>

      {showConfirm && (
        <div
          className="absolute inset-0 bg-slate-900/95 rounded-xl flex flex-col items-center justify-center p-4 z-10"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <p className="text-white text-sm text-center mb-4">
            この分析データを削除しますか？
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg disabled:opacity-50 min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50 min-h-[44px]"
            >
              {isPending ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
