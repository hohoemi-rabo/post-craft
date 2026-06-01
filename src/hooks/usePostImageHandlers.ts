import { useCallback } from 'react'
import type { Post } from '@/types/history-detail'
import type { AspectRatio } from '@/lib/image-styles'
import { useToast } from '@/components/ui/toast'

/**
 * 投稿画像のハンドラ
 */
export function usePostImageHandlers(
  setPost: React.Dispatch<React.SetStateAction<Post | null>>,
  setShowImageReplace: (show: boolean) => void
) {
  const { showToast } = useToast()

  /**
   * 画像差し替え完了
   */
  const handleImageReplaceComplete = useCallback(
    (url: string, aspectRatio: AspectRatio) => {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              post_images: [
                {
                  id: crypto.randomUUID(),
                  image_url: url,
                  style: 'uploaded',
                  aspect_ratio: aspectRatio,
                  character_id: null,
                  prompt: null,
                },
              ],
            }
          : prev
      )
      setShowImageReplace(false)
    },
    [setPost, setShowImageReplace]
  )

  /**
   * 画像再生成完了
   */
  const handleImageRegenerated = useCallback(
    (newImageUrl: string) => {
      setPost((prev) => {
        if (!prev) return prev
        const updatedImages =
          prev.post_images.length > 0
            ? prev.post_images.map((img, i) =>
                i === 0 ? { ...img, image_url: newImageUrl } : img
              )
            : [
                {
                  id: crypto.randomUUID(),
                  image_url: newImageUrl,
                  style: null,
                  aspect_ratio: '1:1',
                  character_id: null,
                  prompt: null,
                },
              ]
        return { ...prev, post_images: updatedImages }
      })
    },
    [setPost]
  )

  /**
   * アスペクト比変更完了
   */
  const handleAspectRatioCropComplete = useCallback(
    (newImageUrl: string, newAspectRatio: AspectRatio) => {
      setPost((prev) => {
        if (!prev) return prev
        const updatedImages =
          prev.post_images.length > 0
            ? prev.post_images.map((img, i) =>
                i === 0
                  ? { ...img, image_url: newImageUrl, aspect_ratio: newAspectRatio }
                  : img
              )
            : [
                {
                  id: crypto.randomUUID(),
                  image_url: newImageUrl,
                  style: 'uploaded',
                  aspect_ratio: newAspectRatio,
                  character_id: null,
                  prompt: null,
                },
              ]
        return { ...prev, post_images: updatedImages }
      })
    },
    [setPost]
  )

  /**
   * 画像新規追加
   */
  const handleImageAdded = useCallback(
    (url: string, ratio: AspectRatio) => {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              post_images: [
                ...prev.post_images,
                {
                  id: crypto.randomUUID(),
                  image_url: url,
                  style: 'uploaded',
                  aspect_ratio: ratio,
                  character_id: null,
                  prompt: null,
                },
              ],
            }
          : prev
      )
    },
    [setPost]
  )

  /**
   * 画像削除（カルーセル用の個別削除）
   */
  const handleImageDeleted = useCallback(
    async (postId: string, imageUrl: string) => {
      try {
        const res = await fetch(
          `/api/posts/${postId}/image?imageUrl=${encodeURIComponent(imageUrl)}`,
          { method: 'DELETE' }
        )
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || '画像の削除に失敗しました')
        }
        setPost((prev) =>
          prev
            ? {
                ...prev,
                post_images: prev.post_images.filter(
                  (img) => img.image_url !== imageUrl
                ),
              }
            : prev
        )
        showToast('画像を削除しました', 'success')
      } catch (error) {
        console.error('Image delete error:', error)
        showToast(
          error instanceof Error ? error.message : '画像の削除に失敗しました',
          'error'
        )
      }
    },
    [setPost, showToast]
  )

  /**
   * Instagram投稿成功
   */
  const handleInstagramPublishSuccess = useCallback(() => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            instagram_published: true,
            instagram_published_at: new Date().toISOString(),
          }
        : prev
    )
  }, [setPost])

  return {
    handleImageReplaceComplete,
    handleImageRegenerated,
    handleAspectRatioCropComplete,
    handleImageAdded,
    handleImageDeleted,
    handleInstagramPublishSuccess,
  }
}
