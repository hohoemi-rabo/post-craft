'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { IMAGE_UPLOAD } from '@/lib/constants'

interface ImageUploaderProps {
  currentImage?: string | null
  onImageSelect: (file: File) => void
  onImageRemove?: () => void
  disabled?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB (キャラクター画像は小さめ)

export function ImageUploader({
  currentImage,
  onImageSelect,
  onImageRemove,
  disabled = false,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!IMAGE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
      return 'PNG, JPG, WEBP形式のみ対応しています'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'ファイルサイズは5MB以下にしてください'
    }
    return null
  }

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      onImageSelect(file)
    },
    [onImageSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [disabled, handleFile]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    setPreview(null)
    setError(null)
    onImageRemove?.()
  }, [onImageRemove])

  const displayImage = preview || currentImage

  return (
    <div className="space-y-2">
      {displayImage ? (
        <div className="relative">
          <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10">
            <Image
              src={displayImage}
              alt="Character preview"
              fill
              className="object-cover"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-sm transition-colors"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`block w-full p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/20 hover:border-white/40 bg-white/5'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm text-slate-300">
            クリックまたはドロップ
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PNG, JPG, WEBP（最大5MB）
          </p>
        </label>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
