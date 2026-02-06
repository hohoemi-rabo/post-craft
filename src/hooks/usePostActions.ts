import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Post } from '@/types/history-detail'

/**
 * 投稿アクションのカスタムフック
 */
export function usePostActions(postId: string, post: Post | null) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

  const downloadImage = useCallback(async (imageUrl: string) => {
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
  }, [])

  const deletePost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/history')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }, [postId, router])

  const reusePost = useCallback(() => {
    if (!post) return
    sessionStorage.setItem(
      'reusePost',
      JSON.stringify({
        postType: post.post_type,
        inputText: post.input_text,
      })
    )
    router.push('/create')
  }, [post, router])

  return {
    showDeleteConfirm,
    showPublishModal,
    setShowDeleteConfirm,
    setShowPublishModal,
    downloadImage,
    deletePost,
    reusePost,
  }
}
