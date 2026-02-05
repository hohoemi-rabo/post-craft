'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ASPECT_RATIOS, getAspectClass, type AspectRatio } from '@/lib/image-styles'

interface AspectRatioCropModalProps {
  open: boolean
  onClose: () => void
  postId: string
  currentImageUrl: string
  currentAspectRatio: AspectRatio
  onCropComplete: (newImageUrl: string, aspectRatio: AspectRatio) => void
}

export function AspectRatioCropModal({
  open,
  onClose,
  postId,
  currentImageUrl,
  currentAspectRatio,
  onCropComplete,
}: AspectRatioCropModalProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(currentAspectRatio)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setAspectRatio(currentAspectRatio)
      setPreview(null)
      setError('')
    }
  }, [open, currentAspectRatio])

  const generatePreview = useCallback(async (imageSrc: string, ratio: AspectRatio) => {
    setIsProcessing(true)
    setError('')

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = imageSrc
      })

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const config = ASPECT_RATIOS[ratio]
      const targetRatio = config.width / config.height

      let srcX = 0
      let srcY = 0
      let srcWidth = img.width
      let srcHeight = img.height

      const imgRatio = img.width / img.height

      if (imgRatio > targetRatio) {
        srcWidth = img.height * targetRatio
        srcX = (img.width - srcWidth) / 2
      } else {
        srcHeight = img.width / targetRatio
        srcY = (img.height - srcHeight) / 2
      }

      canvas.width = config.width
      canvas.height = config.height

      ctx.drawImage(
        img,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, config.width, config.height
      )

      const previewUrl = canvas.toDataURL('image/jpeg', 0.9)
      setPreview(previewUrl)
    } catch (err) {
      console.error('Failed to generate preview:', err)
      setError('プレビューの生成に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Generate preview when aspect ratio changes
  useEffect(() => {
    if (open && currentImageUrl) {
      generatePreview(currentImageUrl, aspectRatio)
    }
  }, [open, currentImageUrl, aspectRatio, generatePreview])

  const handleSave = async () => {
    if (!preview || !canvasRef.current) return

    setIsSaving(true)
    setError('')

    try {
      // Get blob from canvas
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
          'image/jpeg',
          0.9
        )
      })

      // Upload cropped image
      const formData = new FormData()
      formData.append('image', new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
      formData.append('aspectRatio', aspectRatio)
      formData.append('replace', 'true')

      const res = await fetch(`/api/posts/${postId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('画像の保存に失敗しました')
      }

      const { imageUrl } = await res.json()
      onCropComplete(imageUrl, aspectRatio)
      onClose()
    } catch (err) {
      console.error('Failed to save cropped image:', err)
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4">アスペクト比を変更</h3>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Aspect ratio selector */}
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-slate-300">アスペクト比</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(ASPECT_RATIOS) as [AspectRatio, typeof ASPECT_RATIOS[AspectRatio]][]).map(
              ([ratio, config]) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  disabled={isProcessing || isSaving}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    aspectRatio === ratio
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  } disabled:opacity-50`}
                >
                  <div className="text-xs font-medium text-white">{config.name}</div>
                  <div className="text-[10px] text-slate-500">{ratio}</div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">プレビュー</label>
          <div
            className={`relative ${getAspectClass(aspectRatio)} max-w-xs mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden`}
          >
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : preview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preview}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                読み込み中...
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-blue-300">保存中...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing || isSaving || aspectRatio === currentAspectRatio}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
