'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDateShort } from '@/types/history-detail'

interface PostSummary {
  id: string
  post_type: string
  post_type_ref?: { icon: string; name: string } | null
  generated_caption: string
  generated_hashtags: string[]
  created_at: string
  post_images: {
    style: string | null
    aspect_ratio: string | null
  }[]
}

export interface RelatedPostData {
  id: string
  caption: string
  hashtags: string[]
  imageStyle: string | null
  aspectRatio: string | null
}

interface RelatedPostSelectorProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  selectedPostId: string | null
  onSelect: (post: RelatedPostData) => void
  onDeselect: () => void
}

export function RelatedPostSelector({
  enabled,
  onToggle,
  selectedPostId,
  onSelect,
  onDeselect,
}: RelatedPostSelectorProps) {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/posts?limit=20')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled && posts.length === 0) {
      fetchPosts()
    }
  }, [enabled, posts.length, fetchPosts])

  const handleToggle = () => {
    const newEnabled = !enabled
    onToggle(newEnabled)
    if (!newEnabled) {
      onDeselect()
    }
  }

  const handleSelect = (post: PostSummary) => {
    const firstImage = post.post_images?.[0]
    onSelect({
      id: post.id,
      caption: post.generated_caption,
      hashtags: post.generated_hashtags,
      imageStyle: firstImage?.style || null,
      aspectRatio: firstImage?.aspect_ratio || null,
    })
  }


  const truncateCaption = (caption: string, maxLen = 40) => {
    if (caption.length <= maxLen) return caption
    return caption.slice(0, maxLen) + '...'
  }

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="p-4 rounded-xl border-2 border-white/10 bg-white/5">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <div className="font-medium text-white">関連投稿を参照する</div>
              <div className="text-xs text-slate-400">
                以前の投稿と繋がりのある投稿を作成します
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              enabled ? 'bg-blue-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Post list */}
      {enabled && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              投稿履歴がありません
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {posts.map((post) => {
                const typeIcon = post.post_type_ref?.icon || '📝'
                const typeName = post.post_type_ref?.name || post.post_type || '不明'
                const isSelected = selectedPostId === post.id
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => isSelected ? onDeselect() : handleSelect(post)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/50'
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0">{typeIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                          {truncateCaption(post.generated_caption)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {typeName} ・ {formatDateShort(post.created_at)}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="text-blue-400 text-xs shrink-0">✓ 選択中</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
