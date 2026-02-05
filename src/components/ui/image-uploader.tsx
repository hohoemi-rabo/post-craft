'use client'

import { useCallback, useRef, useState } from 'react'
import { ASPECT_RATIOS, getAspectClass, type AspectRatio } from '@/lib/image-styles'
import { AspectRatioSelector } from '@/components/ui/aspect-ratio-selector'

interface ImageUploaderProps {
  postId: string
  onUploadComplete: (imageUrl: string, aspectRatio: AspectRatio) => void
  replace?: boolean
  initialAspectRatio?: AspectRatio
  showAspectRatioSelector?: boolean
}

export function ImageUploader({
  postId,
  onUploadComplete,
  replace = false,
  initialAspectRatio = '1:1',
  showAspectRatioSelector = true,
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialAspectRatio)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get aspect ratio value
  const getAspectRatioValue = (ratio: AspectRatio): number => {
    const config = ASPECT_RATIOS[ratio]
    return config.width / config.height
  }

  // Crop image with Canvas API
  const cropImage = useCallback((imageSrc: string, ratio: AspectRatio): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) {
          reject(new Error('Canvas not available'))
          return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        const targetRatio = getAspectRatioValue(ratio)

        let srcX = 0
        let srcY = 0
        let srcWidth = img.width
        let srcHeight = img.height

        const imgRatio = img.width / img.height

        if (imgRatio > targetRatio) {
          // Image is wider than target - crop left/right
          srcWidth = img.height * targetRatio
          srcX = (img.width - srcWidth) / 2
        } else {
          // Image is taller than target - crop top/bottom
          srcHeight = img.width / targetRatio
          srcY = (img.height - srcHeight) / 2
        }

        // Output size based on Instagram recommendations
        const config = ASPECT_RATIOS[ratio]
        const outputWidth = config.width
        const outputHeight = config.height

        canvas.width = outputWidth
        canvas.height = outputHeight

        ctx.drawImage(
          img,
          srcX, srcY, srcWidth, srcHeight,
          0, 0, outputWidth, outputHeight
        )

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/jpeg',
          0.9
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageSrc
    })
  }, [])

  // Update preview when aspect ratio changes
  const updateCroppedPreview = useCallback(async (imageSrc: string, ratio: AspectRatio) => {
    setIsProcessing(true)
    try {
      const blob = await cropImage(imageSrc, ratio)
      const url = URL.createObjectURL(blob)
      setCroppedPreview(url)
    } catch (err) {
      console.error('Failed to crop image:', err)
      setError('画像の処理に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }, [cropImage])

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback((ratio: AspectRatio) => {
    setAspectRatio(ratio)
    if (originalPreview) {
      updateCroppedPreview(originalPreview, ratio)
    }
  }, [originalPreview, updateCroppedPreview])

  const handleFileSelect = useCallback(
    async (file: File) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('JPEG、PNG、WebP形式の画像を選択してください')
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        setError('画像サイズは8MB以下にしてください')
        return
      }

      setError(null)
      setSelectedFile(file)

      // Read original image
      const reader = new FileReader()
      reader.onload = async (e) => {
        const result = e.target?.result as string
        setOriginalPreview(result)
        await updateCroppedPreview(result, aspectRatio)
      }
      reader.readAsDataURL(file)
    },
    [aspectRatio, updateCroppedPreview]
  )

  const handleUpload = useCallback(async () => {
    if (!originalPreview || !selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      // Crop the image
      const croppedBlob = await cropImage(originalPreview, aspectRatio)
      const croppedFile = new File([croppedBlob], selectedFile.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
      })

      // Upload
      const formData = new FormData()
      formData.append('image', croppedFile)
      formData.append('aspectRatio', aspectRatio)
      if (replace) {
        formData.append('replace', 'true')
      }

      const res = await fetch(`/api/posts/${postId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '画像のアップロードに失敗しました')
      }

      const { imageUrl } = await res.json()
      onUploadComplete(imageUrl, aspectRatio)

      // Reset state
      setSelectedFile(null)
      setOriginalPreview(null)
      setCroppedPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }, [originalPreview, selectedFile, aspectRatio, cropImage, postId, replace, onUploadComplete])

  const handleCancel = useCallback(() => {
    setSelectedFile(null)
    setOriginalPreview(null)
    setCroppedPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div className="space-y-3">
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Aspect ratio selector */}
      {showAspectRatioSelector && (
        <AspectRatioSelector
          value={aspectRatio}
          onChange={handleAspectRatioChange}
          disabled={isUploading || isProcessing}
          compact
        />
      )}

      {/* Upload area */}
      {!croppedPreview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
          className={`relative ${getAspectClass(aspectRatio)} max-w-sm mx-auto border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
          } ${isProcessing ? 'pointer-events-none opacity-70' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">処理中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <div className="text-4xl">📷</div>
              <p className="text-slate-300 text-sm">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="text-slate-500 text-xs">
                JPEG, PNG, WebP (最大8MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Preview with cropped image */
        <div className="space-y-2">
          <div
            className={`relative ${getAspectClass(aspectRatio)} max-w-sm mx-auto border border-white/20 rounded-xl overflow-hidden`}
          >
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={croppedPreview}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUploading}
              className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || isProcessing}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {isUploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
