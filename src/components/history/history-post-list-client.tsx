'use client'

import { useState, useEffect } from 'react'
import type { Post } from '@/types/history-detail'
import { HistoryPostCard } from './history-post-card'

interface HistoryPostListClientProps {
  initialPosts: Post[]
  totalCount: number
  postType: string
}

const LIMIT = 20

export function HistoryPostListClient({
  initialPosts,
  totalCount,
  postType,
}: HistoryPostListClientProps) {
  const [extraPosts, setExtraPosts] = useState<Post[]>([])
  const [currentTotal, setCurrentTotal] = useState(totalCount)
  const [isLoading, setIsLoading] = useState(false)

  // initialPosts が変わったら extraPosts をリセット
  // (router.refresh() やフィルター変更時)
  useEffect(() => {
    setExtraPosts([])
    setCurrentTotal(totalCount)
  }, [initialPosts, totalCount])

  const allPosts = [...initialPosts, ...extraPosts]
  const hasMore = allPosts.length < currentTotal

  const loadMore = async () => {
    setIsLoading(true)
    try {
      const nextPage = Math.floor(allPosts.length / LIMIT) + 1
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: LIMIT.toString(),
      })
      if (postType) params.set('postType', postType)

      const res = await fetch(`/api/posts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setExtraPosts((prev) => [...prev, ...data.posts])
        setCurrentTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to load more posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {allPosts.map((post) => (
          <HistoryPostCard key={post.id} post={post} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                読み込み中...
              </span>
            ) : (
              `もっと見る（残り ${currentTotal - allPosts.length} 件）`
            )}
          </button>
        </div>
      )}
    </>
  )
}
