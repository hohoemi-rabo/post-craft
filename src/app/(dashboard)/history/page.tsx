'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IMAGE_STYLES } from '@/lib/image-styles'
import { usePostTypes } from '@/hooks/usePostTypes'
import { type Post, formatDate } from '@/types/history-detail'

interface PostsResponse {
  posts: Post[]
  total: number
  page: number
  totalPages: number
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterType, setFilterType] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { activePostTypes } = usePostTypes()

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        })
        if (filterType) {
          params.set('postType', filterType)
        }

        const response = await fetch(`/api/posts?${params}`)
        if (response.ok) {
          const data: PostsResponse = await response.json()
          setPosts(data.posts)
          setTotalPages(data.totalPages)
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [page, filterType])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== id))
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            投稿履歴
          </h1>
          <p className="text-slate-400">過去に作成した投稿を確認できます</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white/5 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            投稿履歴
          </h1>
          <p className="text-slate-400">過去に作成した投稿を確認できます</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">フィルター:</label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" className="bg-slate-800 text-white">すべて</option>
            {activePostTypes.map((type) => (
              <option key={type.id} value={type.slug} className="bg-slate-800 text-white">
                {type.icon} {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            投稿がありません
          </h2>
          <p className="text-slate-400 mb-4">
            新しい投稿を作成してみましょう
          </p>
          <Link
            href="/create"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            新規作成
          </Link>
        </div>
      ) : (
        <>
          {/* Post list */}
          <div className="space-y-4">
            {posts.map((post) => {
              const typeIcon = post.post_type_ref?.icon || '📝'
              const typeName = post.post_type_ref?.name || post.post_type || '不明なタイプ'
              const firstImage = post.post_images?.[0]

              return (
                <div
                  key={post.id}
                  className="relative p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white/5 rounded-lg overflow-hidden">
                      {firstImage ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={firstImage.image_url}
                            alt="Post thumbnail"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-slate-600">
                          🖼️
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-lg">{typeIcon}</span>
                        <span className="text-sm font-medium text-white">
                          {typeName}
                        </span>
                        {firstImage?.style && IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES] && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                            {IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES].icon}{' '}
                            {IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES].name}
                          </span>
                        )}
                        {post.profile_ref && (
                          <span className="px-2 py-0.5 bg-blue-600/15 text-blue-400 text-xs rounded-full">
                            {post.profile_ref.icon} {post.profile_ref.name}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {formatDate(post.created_at)}
                        </span>
                        {post.instagram_published ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            ✅ 投稿済み
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded-full">
                            ⏳ 未投稿
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {truncateText(post.generated_caption, 80)}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Link
                          href={`/history/${post.id}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                          詳細
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(post.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirm === post.id && (
                    <div className="absolute inset-0 bg-slate-900/95 rounded-xl flex flex-col items-center justify-center p-4">
                      <p className="text-white text-sm text-center mb-4">
                        この投稿を削除しますか？
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors ${
                  page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                ← 前へ
              </button>
              <span className="text-slate-400 text-sm">
                {page} / {totalPages} ページ
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors ${
                  page === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                次へ →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
