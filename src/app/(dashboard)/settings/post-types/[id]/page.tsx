'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { PostTypeDB, Placeholder } from '@/types/post-type'
import { PostTypeForm } from '@/components/settings/post-type-form'

export default function EditPostTypePage() {
  const params = useParams()
  const id = params.id as string

  const [postType, setPostType] = useState<PostTypeDB | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPostType() {
      try {
        const res = await fetch(`/api/post-types/${id}`)
        if (!res.ok) {
          throw new Error('投稿タイプが見つかりません')
        }
        const data = await res.json()
        // Ensure placeholders is an array of Placeholder objects
        const typedData: PostTypeDB = {
          ...data,
          placeholders: (data.placeholders || []) as Placeholder[],
        }
        setPostType(typedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPostType()
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-64 bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-48 bg-slate-700 rounded animate-pulse" />
        <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error || !postType) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-lg mb-4">{error || '投稿タイプが見つかりません'}</p>
        <Link
          href="/settings/post-types"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          一覧に戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
        <span>/</span>
        <Link href="/settings/post-types" className="hover:text-white transition-colors">📝 投稿タイプ</Link>
        <span>/</span>
        <span className="text-white">{postType.icon} {postType.name} を編集</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white">
        {postType.icon} {postType.name} を編集
      </h1>

      <PostTypeForm mode="edit" initialData={postType} />
    </div>
  )
}
