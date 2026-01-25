'use client'

import { useEffect, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { POST_TYPES } from '@/lib/post-types'
import type { PostType } from '@/types/post'

interface PostImage {
  id: string
  image_url: string
  image_style: string | null
  aspect_ratio: string | null
}

interface Post {
  id: string
  post_type: PostType
  input_text: string
  source_url: string | null
  generated_caption: string
  generated_hashtags: string[]
  created_at: string
  post_images: PostImage[]
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`)
        if (response.ok) {
          const data = await response.json()
          setPost(data)
        } else {
          router.push('/history')
        }
      } catch (error) {
        console.error('Failed to fetch post:', error)
        router.push('/history')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [id, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleCopyCaption = async () => {
    if (!post) return
    await navigator.clipboard.writeText(post.generated_caption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleCopyHashtags = async () => {
    if (!post) return
    await navigator.clipboard.writeText(post.generated_hashtags.join(' '))
    setCopiedHashtags(true)
    setTimeout(() => setCopiedHashtags(false), 2000)
  }

  const handleCopyAll = async () => {
    if (!post) return
    const text = `${post.generated_caption}\n\n${post.generated_hashtags.join(' ')}`
    await navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `post-craft-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/history')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const handleOpenInstagram = () => {
    window.open('https://www.instagram.com/', '_blank')
  }

  const handleReuse = () => {
    if (!post) return
    // Store data in sessionStorage for the create page to pick up
    sessionStorage.setItem(
      'reusePost',
      JSON.stringify({
        postType: post.post_type,
        inputText: post.input_text,
      })
    )
    router.push('/create')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white/5 rounded-lg w-32 animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!post) {
    return null
  }

  const typeConfig = POST_TYPES[post.post_type]
  const firstImage = post.post_images?.[0]
  const aspectRatio = firstImage?.aspect_ratio || '1:1'
  const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/history"
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          ← 戻る
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">投稿詳細</h1>
        </div>
      </div>

      {/* Post info */}
      <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
        <span className="text-2xl">{typeConfig?.icon}</span>
        <div>
          <p className="font-medium text-white">{typeConfig?.name}</p>
          <p className="text-xs text-slate-400">{formatDate(post.created_at)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image section */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-slate-300">生成画像</h2>
          {firstImage ? (
            <>
              <div
                className={`relative ${aspectClass} max-w-sm mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden`}
              >
                <Image
                  src={firstImage.image_url}
                  alt="Generated image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                onClick={() => handleDownloadImage(firstImage.image_url)}
                className="w-full max-w-sm mx-auto block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                ⬇️ 画像をダウンロード
              </button>
            </>
          ) : (
            <div className="aspect-square max-w-sm mx-auto bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <p className="text-slate-500">画像なし</p>
            </div>
          )}
        </div>

        {/* Text section */}
        <div className="space-y-4">
          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">投稿文</h2>
              <button
                onClick={handleCopyCaption}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              >
                {copiedCaption ? '✅ コピーしました' : '📋 コピー'}
              </button>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-sm text-white whitespace-pre-wrap">
                {post.generated_caption}
              </p>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">ハッシュタグ</h2>
              <button
                onClick={handleCopyHashtags}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              >
                {copiedHashtags ? '✅ コピーしました' : '📋 コピー'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
              {post.generated_hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Source */}
          {post.input_text && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-slate-300">元のメモ</h2>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-xs text-slate-400 whitespace-pre-wrap">
                  {post.input_text}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={handleCopyAll}
          className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
        >
          {copiedAll ? '✅ コピーしました' : '📋 すべてコピー'}
        </button>
        <button
          onClick={handleOpenInstagram}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors"
        >
          📱 Instagram を開く
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 border-t border-white/10 pt-6">
        <button
          onClick={handleReuse}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          🔄 このテンプレートで新規作成
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
        >
          🗑️ 削除
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">投稿を削除</h3>
            <p className="text-slate-400 text-sm mb-6">
              この投稿を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
