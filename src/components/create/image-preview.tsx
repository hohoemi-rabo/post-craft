'use client'

import Image from 'next/image'
import { type AspectRatio, getAspectClass } from '@/lib/image-styles'

interface ImagePreviewProps {
  imageUrl?: string
  aspectRatio: AspectRatio
  isLoading?: boolean
  onRegenerate?: () => void
  onDownload?: () => void
  disabled?: boolean
}

export function ImagePreview({
  imageUrl,
  aspectRatio,
  isLoading,
  onRegenerate,
  onDownload,
  disabled,
}: ImagePreviewProps) {
  const aspectClass = getAspectClass(aspectRatio)

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        生成画像
      </label>

      <div
        className={`relative ${aspectClass} max-w-sm mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden`}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm">画像を生成中...</p>
            <p className="text-slate-500 text-xs mt-1">30秒ほどかかる場合があります</p>
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt="Generated image"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm">画像がここに表示されます</p>
          </div>
        )}
      </div>

      {imageUrl && !isLoading && (
        <div className="flex gap-2 justify-center max-w-sm mx-auto">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={disabled}
            className={`flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-lg transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            🔄 再生成
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={disabled}
            className={`flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            ⬇️ ダウンロード
          </button>
        </div>
      )}
    </div>
  )
}
