'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { InstagramPublishModal } from '@/components/publish/instagram-publish-modal'
import { ImageUploader } from '@/components/ui/image-uploader'
import { HashtagManager, formatHashtags } from '@/components/ui/hashtag-manager'
import { getAspectClass, type AspectRatio } from '@/lib/image-styles'

interface StepResultProps {
  caption: string
  hashtags: string[]
  imageUrl: string | null
  aspectRatio: AspectRatio
  onRegenerateImage?: () => void
  onCreateNew: () => void
  isRegenerating?: boolean
  postId?: string
  remakeSourceId?: string | null
  remakeSourcePostType?: string | null
}

export function StepResult({
  caption,
  hashtags,
  imageUrl,
  aspectRatio,
  onRegenerateImage,
  onCreateNew,
  isRegenerating,
  postId,
  remakeSourceId,
  remakeSourcePostType,
}: StepResultProps) {
  const [editedCaption, setEditedCaption] = useState(caption)
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(() => new Set(hashtags))
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  const effectiveImageUrl = uploadedImageUrl || imageUrl
  const aspectClass = getAspectClass(aspectRatio)

  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(editedCaption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleDownloadImage = async () => {
    if (!imageUrl) return
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

  const getFullCaption = useCallback(() => {
    const hashtagsText = formatHashtags(selectedHashtags)
    return `${editedCaption}\n\n${hashtagsText}`
  }, [editedCaption, selectedHashtags])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-white mb-2">完成しました！</h2>
        <p className="text-slate-400 text-sm">
          投稿素材が生成されました。編集してInstagramに投稿しましょう。
        </p>
      </div>

      {/* リメイク元情報 */}
      {remakeSourceId && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-orange-400">🔄 リメイク元:</span>
          {remakeSourcePostType && (
            <span className="text-slate-400">{remakeSourcePostType}</span>
          )}
          <a
            href={`/history/${remakeSourceId}`}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            元投稿を見る →
          </a>
        </div>
      )}

      <div className={`grid ${effectiveImageUrl ? 'md:grid-cols-2' : ''} gap-6`}>
        {/* Image section */}
        {!imageUrl && !uploadedImageUrl && postId && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">
              画像をアップロード
            </label>
            <ImageUploader
              postId={postId}
              onUploadComplete={(url) => setUploadedImageUrl(url)}
              showAspectRatioSelector={true}
            />
          </div>
        )}

        {uploadedImageUrl && !imageUrl && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">
              アップロード画像
            </label>
            <div className="relative aspect-square max-w-xs mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <Image
                src={uploadedImageUrl}
                alt="Uploaded image"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {imageUrl && onRegenerateImage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                生成画像
              </label>
              <button
                type="button"
                onClick={onRegenerateImage}
                disabled={isRegenerating}
                className={`text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors ${
                  isRegenerating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isRegenerating ? '生成中...' : '🔄 再生成'}
              </button>
            </div>
            <div
              className={`relative ${aspectClass} max-w-xs mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden`}
            >
              {isRegenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                <Image
                  src={imageUrl}
                  alt="Generated image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isRegenerating}
              className="w-full max-w-xs mx-auto block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              ⬇️ 画像をダウンロード
            </button>
          </div>
        )}

        {/* Caption section */}
        <div className="space-y-4">
          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                投稿文
              </label>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              >
                {copiedCaption ? '✅ コピーしました' : '📋 コピー'}
              </button>
            </div>
            <textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Hashtags */}
          <HashtagManager
            aiHashtags={hashtags}
            onSelectionChange={setSelectedHashtags}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        {effectiveImageUrl ? (
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-colors"
          >
            📱 Instagramに投稿
          </button>
        ) : (
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-colors text-center"
          >
            📱 Instagramを開く
          </a>
        )}
        <button
          type="button"
          onClick={onCreateNew}
          className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
        >
          ✨ 新規作成
        </button>
      </div>

      {effectiveImageUrl && (
        <InstagramPublishModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          caption={getFullCaption()}
          imageUrl={effectiveImageUrl}
          postId={postId}
          aspectRatio={aspectRatio}
        />
      )}
    </div>
  )
}
