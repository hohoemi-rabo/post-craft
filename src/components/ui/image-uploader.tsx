'use client'

import { useCallback, useRef, useState } from 'react'

interface ImageUploaderProps {
  postId: string
  onUploadComplete: (imageUrl: string) => void
}

export function ImageUploader({ postId, onUploadComplete }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      // Upload
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('image', file)

        const res = await fetch(`/api/posts/${postId}/image`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || '画像のアップロードに失敗しました')
        }

        const { imageUrl } = await res.json()
        onUploadComplete(imageUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
        setPreview(null)
      } finally {
        setIsUploading(false)
      }
    },
    [postId, onUploadComplete]
  )

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
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative aspect-square max-w-sm mx-auto border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : preview
              ? 'border-white/20 bg-white/5'
              : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
        } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
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

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">アップロード中...</p>
          </div>
        ) : preview ? (
          <img
            src={preview}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="text-4xl">📷</div>
            <p className="text-slate-300 text-sm">
              クリックまたはドラッグ&ドロップで
              <br />
              画像をアップロード
            </p>
            <p className="text-slate-500 text-xs">
              JPEG, PNG, WebP (最大8MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
