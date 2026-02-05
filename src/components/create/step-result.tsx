'use client'

import { useState } from 'react'
import Image from 'next/image'
import { InstagramPublishModal } from '@/components/publish/instagram-publish-modal'
import { ImageUploader } from '@/components/ui/image-uploader'

interface StepResultProps {
  caption: string
  hashtags: string[]
  imageUrl: string | null
  aspectRatio: string // '1:1' | '9:16' | '4:5' | '16:9'
  onRegenerateImage?: () => void
  onCreateNew: () => void
  isRegenerating?: boolean
  postId?: string
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
}: StepResultProps) {
  const [editedCaption, setEditedCaption] = useState(caption)
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set(hashtags))
  const [customHashtags, setCustomHashtags] = useState<string[]>([])
  const [newHashtagInput, setNewHashtagInput] = useState('')
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [hashtagError, setHashtagError] = useState('')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  const effectiveImageUrl = uploadedImageUrl || imageUrl

  // アスペクト比に応じたCSSクラスを取得
  const getAspectClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square'
      case '4:5': return 'aspect-[4/5]'
      case '16:9': return 'aspect-[16/9]'
      case '9:16': return 'aspect-[9/16]'
      default: return 'aspect-square'
    }
  }
  const aspectClass = getAspectClass(aspectRatio)

  // All hashtags (AI generated + custom)
  const allHashtags = [...hashtags, ...customHashtags]

  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(editedCaption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleCopyHashtags = async () => {
    const selectedArray = Array.from(selectedHashtags)
    // Ensure each hashtag has # prefix
    const hashtagsText = selectedArray
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join('\n')
    await navigator.clipboard.writeText(hashtagsText)
    setCopiedHashtags(true)
    setTimeout(() => setCopiedHashtags(false), 2000)
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

  const getFullCaption = () => {
    const selectedArray = Array.from(selectedHashtags)
    const hashtagsText = selectedArray
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join('\n')
    return `${editedCaption}\n\n${hashtagsText}`
  }

  const toggleHashtag = (tag: string) => {
    const newSelected = new Set(selectedHashtags)
    if (newSelected.has(tag)) {
      newSelected.delete(tag)
    } else {
      newSelected.add(tag)
    }
    setSelectedHashtags(newSelected)
  }

  const handleSelectAll = () => {
    setSelectedHashtags(new Set(allHashtags))
  }

  const handleDeselectAll = () => {
    setSelectedHashtags(new Set())
  }

  const handleAddHashtag = () => {
    const input = newHashtagInput.trim().replace(/^#+/, '') // Remove leading #
    if (!input) return

    // Check if already exists
    if (allHashtags.includes(input) || allHashtags.includes(`#${input}`)) {
      setHashtagError('このハッシュタグは既に追加されています')
      setTimeout(() => setHashtagError(''), 2000)
      return
    }

    // Add to custom hashtags
    const newTag = input.startsWith('#') ? input : `#${input}`
    setCustomHashtags([...customHashtags, newTag])

    // Auto-select the new hashtag
    const newSelected = new Set(selectedHashtags)
    newSelected.add(newTag)
    setSelectedHashtags(newSelected)

    // Clear input
    setNewHashtagInput('')
  }

  const handleRemoveCustomHashtag = (tag: string) => {
    setCustomHashtags(customHashtags.filter((t) => t !== tag))
    const newSelected = new Set(selectedHashtags)
    newSelected.delete(tag)
    setSelectedHashtags(newSelected)
  }

  const handleHashtagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddHashtag()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-white mb-2">完成しました！</h2>
        <p className="text-slate-400 text-sm">
          投稿素材が生成されました。編集してInstagramに投稿しましょう。
        </p>
      </div>

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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                ハッシュタグ
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  全選択
                </button>
                <span className="text-slate-500">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  全解除
                </button>
                <button
                  type="button"
                  onClick={handleCopyHashtags}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors ml-2"
                >
                  {copiedHashtags ? '✅ コピーしました' : '📋 コピー'}
                </button>
              </div>
            </div>

            {/* Add hashtag input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newHashtagInput}
                onChange={(e) => setNewHashtagInput(e.target.value)}
                onKeyDown={handleHashtagInputKeyDown}
                placeholder="ハッシュタグを追加（例: ブログ更新）"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddHashtag}
                disabled={!newHashtagInput.trim()}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg border border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
            {hashtagError && (
              <p className="text-xs text-red-400">{hashtagError}</p>
            )}

            {/* AI generated hashtags */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500">AI生成</p>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleHashtag(tag)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedHashtags.has(tag)
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom hashtags */}
            {customHashtags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">追加したハッシュタグ</p>
                <div className="flex flex-wrap gap-2">
                  {customHashtags.map((tag) => (
                    <div
                      key={tag}
                      className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedHashtags.has(tag)
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleHashtag(tag)}
                        className="hover:opacity-80"
                      >
                        {tag}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomHashtag(tag)}
                        className="ml-1 hover:text-red-400 transition-colors"
                        aria-label="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500">
              {selectedHashtags.size} / {allHashtags.length} 個選択中
            </p>
          </div>
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
