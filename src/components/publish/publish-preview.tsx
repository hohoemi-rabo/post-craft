'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { InstagramAccount } from '@/types/instagram'
import { getAspectClass, type AspectRatio } from '@/lib/image-styles'

interface PublishPreviewProps {
  account: InstagramAccount
  imageUrls: string[]
  caption: string
  onPublish: (editedCaption: string) => void
  onBack: () => void
  isPublishing: boolean
  aspectRatio?: AspectRatio
}

export function PublishPreview({
  account,
  imageUrls,
  caption,
  onPublish,
  onBack,
  isPublishing,
  aspectRatio = '1:1',
}: PublishPreviewProps) {
  const [editedCaption, setEditedCaption] = useState(caption)
  const [activeIndex, setActiveIndex] = useState(0)
  const isCarousel = imageUrls.length > 1
  const mainImage = imageUrls[activeIndex] ?? imageUrls[0]

  return (
    <div className="space-y-4">
      {/* Account info */}
      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
        {account.igProfilePictureUrl ? (
          <Image
            src={account.igProfilePictureUrl}
            alt={account.igUsername}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
            {account.igUsername.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-white text-sm font-medium">
            @{account.igUsername}
          </p>
          <p className="text-slate-500 text-xs">に投稿します</p>
        </div>
      </div>

      {/* Image preview */}
      <div className="space-y-2">
        <div className={`relative ${getAspectClass(aspectRatio)} max-w-[200px] mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden`}>
          <Image
            src={mainImage}
            alt="投稿画像"
            fill
            className="object-cover"
            unoptimized
          />
          {isCarousel && (
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
              {activeIndex + 1} / {imageUrls.length}
            </span>
          )}
        </div>

        {/* カルーセル: サムネイル一覧 */}
        {isCarousel && (
          <div className="flex flex-wrap justify-center gap-2">
            {imageUrls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeIndex
                    ? 'border-blue-500'
                    : 'border-transparent hover:border-white/30'
                }`}
                aria-label={`${i + 1}枚目を表示`}
              >
                <Image
                  src={url}
                  alt={`${i + 1}枚目`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
        {isCarousel && (
          <p className="text-[10px] text-slate-500 text-center">
            複数画像（カルーセル）として {imageUrls.length} 枚を投稿します
          </p>
        )}
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400">
          キャプション
        </label>
        <textarea
          value={editedCaption}
          onChange={(e) => setEditedCaption(e.target.value)}
          rows={6}
          maxLength={2200}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-slate-500 text-right">
          {editedCaption.length} / 2,200
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPublishing}
          className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={() => onPublish(editedCaption)}
          disabled={isPublishing || !editedCaption.trim()}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              投稿中...
            </span>
          ) : (
            '投稿する'
          )}
        </button>
      </div>
    </div>
  )
}
