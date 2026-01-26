'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { IMAGE_STYLES, ASPECT_RATIOS, type ImageStyle, type AspectRatio } from '@/lib/image-styles'
import type { Character } from '@/types/supabase'

interface StepImageSettingsProps {
  initialStyle: ImageStyle
  initialAspectRatio: AspectRatio
  initialCharacterId: string | null
  initialSkipImage?: boolean
  initialUseCharacterImage?: boolean
  onSubmit: (style: ImageStyle, aspectRatio: AspectRatio, characterId: string | null, skipImage: boolean, useCharacterImage: boolean) => void
  onBack: () => void
}

export function StepImageSettings({
  initialStyle,
  initialAspectRatio,
  initialCharacterId,
  initialSkipImage = false,
  initialUseCharacterImage = false,
  onSubmit,
  onBack,
}: StepImageSettingsProps) {
  const [style, setStyle] = useState<ImageStyle>(initialStyle)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialAspectRatio)
  const [characterId, setCharacterId] = useState<string | null>(initialCharacterId)
  const [skipImage, setSkipImage] = useState(initialSkipImage)
  const [useCharacterImage, setUseCharacterImage] = useState(initialUseCharacterImage)
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true)

  const styles = Object.values(IMAGE_STYLES)
  const ratios = Object.entries(ASPECT_RATIOS) as [AspectRatio, typeof ASPECT_RATIOS['1:1']][]
  const selectedStyle = IMAGE_STYLES[style]

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/characters')
        if (response.ok) {
          const data = await response.json()
          setCharacters(data)
          // Auto-select default character if none selected
          if (!initialCharacterId) {
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
  }, [initialCharacterId])

  // Get selected character info
  const selectedCharacter = characters.find(c => c.id === characterId)
  const canUseCharacterImage = selectedCharacter?.image_url && selectedStyle.supportsCharacter

  const handleSubmit = () => {
    // Only pass useCharacterImage if character has an image
    const effectiveUseCharacterImage = canUseCharacterImage ? useCharacterImage : false
    onSubmit(style, aspectRatio, characterId, skipImage, effectiveUseCharacterImage)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">画像設定</h2>
        <p className="text-slate-400 text-sm">
          生成する画像のスタイルと設定を選択してください
        </p>
      </div>

      {/* Skip image toggle */}
      <div className="p-4 rounded-xl border-2 border-white/10 bg-white/5">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📷</span>
            <div>
              <div className="font-medium text-white">画像を生成しない</div>
              <div className="text-xs text-slate-400">自分の写真を使う場合はONにしてください</div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={skipImage}
            onClick={() => setSkipImage(!skipImage)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              skipImage ? 'bg-blue-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                skipImage ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Image settings (hidden when skipImage is true) */}
      {!skipImage && (
        <>
          {/* Style selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              画像スタイル
            </label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    style === s.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="font-medium text-white text-sm">{s.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              アスペクト比
            </label>
            <div className="flex gap-3">
              {ratios.map(([ratio, config]) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                    aspectRatio === ratio
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <div
                      className={`bg-white/20 rounded ${
                        ratio === '1:1' ? 'w-10 h-10' : 'w-6 h-10'
                      }`}
                    />
                  </div>
                  <div className="font-medium text-white text-sm">{config.name}</div>
                  <div className="text-xs text-slate-400">{config.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Character selection (only if style supports it) */}
          {selectedStyle.supportsCharacter && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                キャラクター（任意）
              </label>
              {isLoadingCharacters ? (
                <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setCharacterId(null)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      characterId === null
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-slate-300">なし</span>
                  </button>
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => setCharacterId(char.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                        characterId === char.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {char.image_url ? (
                        <div className="w-8 h-8 relative rounded-full overflow-hidden">
                          <Image
                            src={char.image_url}
                            alt={char.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                          👤
                        </div>
                      )}
                      <span className="text-white text-sm">{char.name}</span>
                      {char.is_default && (
                        <span className="text-xs text-yellow-400">★</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {characters.length === 0 && !isLoadingCharacters && (
                <p className="text-xs text-slate-500">
                  キャラクターを登録すると、画像に反映されます
                </p>
              )}

              {/* Use character image as reference option */}
              {canUseCharacterImage && (
                <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCharacterImage}
                      onChange={(e) => setUseCharacterImage(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">
                        キャラクター画像を参照として使用する
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        より似た画像を生成します（マルチモーダルAI使用）
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          {skipImage ? '生成する（文章のみ）→' : '生成する →'}
        </button>
      </div>
    </div>
  )
}
