'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  IMAGE_STYLES,
  ASPECT_RATIOS,
  BACKGROUND_TYPES,
  type ImageStyle,
  type AspectRatio,
  type BackgroundType,
} from '@/lib/image-styles'
import type { Character } from '@/types/supabase'

interface ImageRegenerateModalProps {
  open: boolean
  onClose: () => void
  postId: string
  postType: string
  caption: string
  currentStyle: string | null
  currentAspectRatio: string | null
  currentCharacterId?: string | null
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
  currentCharacterId,
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

  // Character state
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true)
  const [characterId, setCharacterId] = useState<string | null>(currentCharacterId ?? null)
  const [useCharacterImage, setUseCharacterImage] = useState(false)

  const selectedStyle = IMAGE_STYLES[style]
  const selectedCharacter = characters.find(c => c.id === characterId)
  const canUseCharacterImage = !!(selectedCharacter?.image_url && selectedStyle.supportsCharacter)

  // Fetch characters
  useEffect(() => {
    if (!open) return
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/characters')
        if (response.ok) {
          const data = await response.json()
          setCharacters(data)
          // Auto-select default character if none provided
          if (!currentCharacterId) {
            const defaultChar = data.find((c: Character) => c.is_default)
            if (defaultChar) {
              setCharacterId(defaultChar.id)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error)
      } finally {
        setIsLoadingCharacters(false)
      }
    }
    fetchCharacters()
  }, [open, currentCharacterId])

  // Reset character when switching to a style that doesn't support characters
  useEffect(() => {
    if (!selectedStyle.supportsCharacter) {
      setCharacterId(null)
      setUseCharacterImage(false)
    }
  }, [style, selectedStyle.supportsCharacter])

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
      const effectiveUseCharacterImage = canUseCharacterImage ? useCharacterImage : false
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
          characterId: selectedStyle.supportsCharacter ? characterId : null,
          useCharacterImage: effectiveUseCharacterImage,
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

        {/* Character selection (only if style supports it) */}
        {selectedStyle.supportsCharacter && (
          <div className="space-y-3 mb-4">
            <label className="block text-sm font-medium text-slate-300">キャラクター</label>
            {isLoadingCharacters ? (
              <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setCharacterId(null); setUseCharacterImage(false) }}
                  disabled={isGenerating}
                  className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                    characterId === null
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  } disabled:opacity-50`}
                >
                  <span className="text-slate-300">なし</span>
                </button>
                {characters.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setCharacterId(char.id)}
                    disabled={isGenerating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                      characterId === char.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    } disabled:opacity-50`}
                  >
                    {char.image_url ? (
                      <div className="w-6 h-6 relative rounded-full overflow-hidden">
                        <Image
                          src={char.image_url}
                          alt={char.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                        👤
                      </div>
                    )}
                    <span className="text-white">{char.name}</span>
                    {char.is_default && (
                      <span className="text-xs text-yellow-400">★</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Use character image as reference */}
            {canUseCharacterImage && (
              <div className="p-2.5 rounded-xl border border-white/10 bg-white/5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCharacterImage}
                    onChange={(e) => setUseCharacterImage(e.target.checked)}
                    disabled={isGenerating}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <div>
                    <div className="text-xs font-medium text-white">
                      キャラクター画像を参照として使用
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      より似た画像を生成します（マルチモーダルAI使用）
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

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
