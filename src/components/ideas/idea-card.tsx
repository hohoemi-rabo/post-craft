'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import type { PostIdea } from '@/types/idea'

interface IdeaCardProps {
  idea: PostIdea
}

export function IdeaCard({ idea: initialIdea }: IdeaCardProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [idea, setIdea] = useState(initialIdea)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(idea.title)
  const [editDescription, setEditDescription] = useState(idea.description)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  if (isDeleted) return null

  const handleToggleUsed = async () => {
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUsed: !idea.isUsed }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      showToast('更新に失敗しました', 'error')
    }
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setIdea(updated)
        setIsEditing(false)
        showToast('保存しました', 'success')
      }
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, { method: 'DELETE' })
      if (res.ok) {
        setIsDeleted(true)
        showToast('削除しました', 'success')
      }
    } catch {
      showToast('削除に失敗しました', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCreatePost = () => {
    sessionStorage.setItem(
      'reusePost',
      JSON.stringify({ inputText: idea.description })
    )
    router.push(`/create?profileId=${idea.profileId}`)
  }

  const descriptionLines = idea.description.split('\n')
  const shouldTruncate = descriptionLines.length > 4
  const displayDescription =
    !isExpanded && shouldTruncate
      ? descriptionLines.slice(0, 4).join('\n') + '...'
      : idea.description

  return (
    <div
      className={`p-5 border rounded-2xl transition-colors ${
        idea.isUsed
          ? 'bg-white/[0.02] border-white/5 opacity-60'
          : 'bg-white/5 border-white/10'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h3 className="text-base font-bold text-white">{idea.title}</h3>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleUsed}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              idea.isUsed
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {idea.isUsed ? '✅ 使用済み' : '⏳ 未使用'}
          </button>
        </div>
      </div>

      {/* Description */}
      {isEditing ? (
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y mb-3"
        />
      ) : (
        <div className="mb-3">
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {displayDescription}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              {isExpanded ? '折りたたむ' : '続きを読む'}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editTitle.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditTitle(idea.title)
                setEditDescription(idea.description)
              }}
              className="px-3 py-1.5 text-slate-400 hover:text-white text-xs rounded-xl transition-colors"
            >
              キャンセル
            </button>
          </>
        ) : (
          <>
            {!idea.isUsed && (
              <button
                onClick={handleCreatePost}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors"
              >
                ✏️ この案で投稿作成
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 text-xs rounded-xl transition-colors"
            >
              編集
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white text-xs rounded-xl transition-colors"
                >
                  やめる
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 text-xs rounded-xl transition-colors"
              >
                削除
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
