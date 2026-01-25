'use client'

import { useState } from 'react'
import Image from 'next/image'
import { type AspectRatio } from '@/lib/image-styles'

interface StepResultProps {
  caption: string
  hashtags: string[]
  imageUrl: string
  aspectRatio: AspectRatio
  onRegenerateImage: () => void
  onCreateNew: () => void
  isRegenerating?: boolean
}

export function StepResult({
  caption,
  hashtags,
  imageUrl,
  aspectRatio,
  onRegenerateImage,
  onCreateNew,
  isRegenerating,
}: StepResultProps) {
  const [editedCaption, setEditedCaption] = useState(caption)
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(hashtags)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)

  const aspectClass = aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[9/16]'

  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(editedCaption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleCopyHashtags = async () => {
    await navigator.clipboard.writeText(selectedHashtags.join(' '))
    setCopiedHashtags(true)
    setTimeout(() => setCopiedHashtags(false), 2000)
  }

  const handleDownloadImage = async () => {
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

  const handleOpenInstagram = () => {
    window.open('https://www.instagram.com/', '_blank')
  }

  const toggleHashtag = (tag: string) => {
    if (selectedHashtags.includes(tag)) {
      setSelectedHashtags(selectedHashtags.filter((t) => t !== tag))
    } else {
      setSelectedHashtags([...selectedHashtags, tag])
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image section */}
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                ハッシュタグ
              </label>
              <button
                type="button"
                onClick={handleCopyHashtags}
                className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              >
                {copiedHashtags ? '✅ コピーしました' : '📋 コピー'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleHashtag(tag)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedHashtags.includes(tag)
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={handleOpenInstagram}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-colors"
        >
          📱 Instagramを開く
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
        >
          ✨ 新規作成
        </button>
      </div>
    </div>
  )
}
