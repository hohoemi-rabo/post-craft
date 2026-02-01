'use client'

import { useCallback, useRef, useState } from 'react'
import type { InstagramAccount } from '@/types/instagram'

interface PublishFormProps {
  account: InstagramAccount
  onPublish: (image: File, caption: string) => void
  isPublishing: boolean
}

export function PublishForm({
  account,
  onPublish,
  isPublishing,
}: PublishFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('JPEG、PNG、WebP形式の画像を選択してください')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('画像サイズは8MB以下にしてください')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !caption.trim()) return
    onPublish(imageFile, caption)
  }

  const canSubmit = imageFile && caption.trim().length > 0 && !isPublishing

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account info */}
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
        {account.igProfilePictureUrl ? (
          <img
            src={account.igProfilePictureUrl}
            alt={account.igUsername}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
            {account.igUsername.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-slate-300 text-sm">
          @{account.igUsername} に投稿
        </span>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          画像
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : imagePreview
                ? 'border-white/20 bg-white/5'
                : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
          }`}
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

          {imagePreview ? (
            <div className="space-y-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg object-contain"
              />
              <p className="text-slate-400 text-sm">
                クリックまたはドラッグで画像を変更
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="text-4xl">📷</div>
              <p className="text-slate-300">
                クリックまたはドラッグ&ドロップで画像を選択
              </p>
              <p className="text-slate-500 text-sm">
                JPEG, PNG, WebP (最大8MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          キャプション
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="投稿のキャプションを入力...&#10;&#10;#ハッシュタグ も含められます"
          rows={8}
          maxLength={2200}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className="text-slate-500 text-xs">
            {caption.length} / 2,200
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPublishing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>投稿中...</span>
          </>
        ) : (
          <>
            <span>📱</span>
            <span>Instagramに投稿する</span>
          </>
        )}
      </button>
    </form>
  )
}
