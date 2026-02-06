import { useCallback } from 'react'
import type { Post } from '@/types/history-detail'
import type { AspectRatio } from '@/lib/image-styles'

/**
 * 投稿画像のハンドラ
 */
export function usePostImageHandlers(
  setPost: React.Dispatch<React.SetStateAction<Post | null>>,
  setShowImageReplace: (show: boolean) => void
) {
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
                  image_style: 'uploaded',
                  aspect_ratio: aspectRatio,
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
                  image_style: null,
                  aspect_ratio: '1:1',
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
                  image_style: 'uploaded',
                  aspect_ratio: newAspectRatio,
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
                  image_style: 'uploaded',
                  aspect_ratio: ratio,
                },
              ],
            }
          : prev
      )
    },
    [setPost]
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
    handleInstagramPublishSuccess,
  }
}
