'use client'

import { useState } from 'react'
import {
  IMAGE_STYLES,
  ASPECT_RATIOS,
  BACKGROUND_TYPES,
  type ImageStyle,
  type AspectRatio,
  type BackgroundType,
} from '@/lib/image-styles'
import type { PostType } from '@/types/post'

interface ImageRegenerateModalProps {
  open: boolean
  onClose: () => void
  postId: string
  postType: PostType
  caption: string
  currentStyle: string | null
  currentAspectRatio: string | null
  onRegenerated: (newImageUrl: string) => void
}

export function ImageRegenerateModal({
  open,
  onClose,
  postId,
  postType,
  caption,
  currentStyle,
  currentAspectRatio,
  onRegenerated,
}: ImageRegenerateModalProps) {
  const [style, setStyle] = useState<ImageStyle>(
    (currentStyle as ImageStyle) || 'manga_male'
  )
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    (currentAspectRatio as AspectRatio) || '1:1'
  )
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('auto')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const handleRegenerate = async () => {
    setIsGenerating(true)
    setError('')

    try {
      // Step 1: Generate scene description
      setProgress('シーンを生成中...')
      const sceneRes = await fetch('/api/generate/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, postType }),
      })
      const sceneData = await sceneRes.json()
      const sceneDescription =
        sceneData.sceneDescription ||
        '親しみやすい雰囲気でスマートフォンやパソコンを使っている様子'

      // Step 2: Generate catchphrase
      setProgress('キャッチコピーを生成中...')
      const catchphraseRes = await fetch('/api/generate/catchphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      })
      const catchphraseData = await catchphraseRes.json()
      const catchphrase = catchphraseData.catchphrase || ''

      // Step 3: Generate image
      setProgress('画像を生成中...')
      const imageRes = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style,
          aspectRatio,
          sceneDescription,
          catchphrase,
          backgroundType,
          postId,
        }),
      })

      if (!imageRes.ok) {
        throw new Error('画像生成に失敗しました')
      }

      const imageData = await imageRes.json()

      // Step 4: Update post_images record
      setProgress('保存中...')
      const updateRes = await fetch(`/api/posts/${postId}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageData.imageUrl,
          style,
          aspectRatio,
          prompt: imageData.prompt || '',
        }),
      })

      if (!updateRes.ok) {
        throw new Error('画像の保存に失敗しました')
      }

      onRegenerated(imageData.imageUrl)
      onClose()
    } catch (err) {
      console.error('Image regeneration error:', err)
      setError(err instanceof Error ? err.message : '画像再生成に失敗しました')
    } finally {
      setIsGenerating(false)
      setProgress('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4">画像を再生成</h3>

        {/* Style selection */}
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-slate-300">スタイル</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(IMAGE_STYLES) as [ImageStyle, (typeof IMAGE_STYLES)[ImageStyle]][]).map(
              ([styleId, config]) => (
                <button
                  key={styleId}
                  type="button"
                  onClick={() => setStyle(styleId)}
                  disabled={isGenerating}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    style === styleId
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <div className="text-xs font-medium text-white">{config.name}</div>
                      <div className="text-[10px] text-slate-400">{config.description}</div>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Aspect ratio selection */}
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-slate-300">アスペクト比</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(ASPECT_RATIOS) as [AspectRatio, (typeof ASPECT_RATIOS)[AspectRatio]][]).map(
              ([ratioId, config]) => (
                <button
                  key={ratioId}
                  type="button"
                  onClick={() => setAspectRatio(ratioId)}
                  disabled={isGenerating}
                  className={`p-2.5 rounded-xl border text-center transition-colors ${
                    aspectRatio === ratioId
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  } disabled:opacity-50`}
                >
                  <div className="text-sm font-medium text-white">{config.name}</div>
                  <div className="text-xs text-slate-400">{config.description}</div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Background type selection */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-slate-300">背景タイプ</label>
          <div className="grid grid-cols-2 gap-2">
            {(
              Object.entries(BACKGROUND_TYPES) as [
                BackgroundType,
                (typeof BACKGROUND_TYPES)[BackgroundType],
              ][]
            ).map(([bgId, config]) => (
              <button
                key={bgId}
                type="button"
                onClick={() => setBackgroundType(bgId)}
                disabled={isGenerating}
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  backgroundType === bgId
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                } disabled:opacity-50`}
              >
                <span className="text-lg">{config.icon}</span>
                <div className="text-xs font-medium text-white">{config.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress / Error */}
        {isGenerating && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-blue-300">{progress}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <p className="text-xs text-slate-500 mb-4">
          ※ 画像生成には最大60秒かかる場合があります
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            キャンセル
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            {isGenerating ? '生成中...' : '再生成する'}
          </button>
        </div>
      </div>
    </div>
  )
}
