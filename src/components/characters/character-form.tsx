'use client'

import { useState } from 'react'
import { ImageUploader } from './image-uploader'
import type { Character } from '@/types/supabase'

interface CharacterFormProps {
  character?: Character
  onSubmit: (data: CharacterFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface CharacterFormData {
  name: string
  description: string
  imageFile?: File
  isDefault: boolean
}

export function CharacterForm({
  character,
  onSubmit,
  onCancel,
  isLoading = false,
}: CharacterFormProps) {
  const [name, setName] = useState(character?.name || '')
  const [description, setDescription] = useState(character?.description || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDefault, setIsDefault] = useState(character?.is_default || false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleAnalyzeImage = async () => {
    if (!imageFile) return

    setIsAnalyzing(true)
    setErrors([])

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('/api/characters/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('画像分析に失敗しました')
      }

      const data = await response.json()
      setDescription(data.description)
    } catch (error) {
      console.error('Analyze error:', error)
      setErrors(['画像分析に失敗しました。手動で特徴を入力してください。'])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validation
    const validationErrors: string[] = []
    if (!name.trim() || name.length > 50) {
      validationErrors.push('キャラクター名は1〜50文字で入力してください')
    }
    if (!description.trim() || description.length < 10 || description.length > 500) {
      validationErrors.push('特徴テキストは10〜500文字で入力してください')
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      imageFile: imageFile || undefined,
      isDefault,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
          キャラクター名 <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: まさゆき"
          maxLength={50}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <p className="text-xs text-slate-500 mt-1">{name.length}/50</p>
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          キャラクター画像
        </label>
        <ImageUploader
          currentImage={character?.image_url}
          onImageSelect={setImageFile}
          onImageRemove={() => setImageFile(null)}
          disabled={isLoading || isAnalyzing}
        />
        {imageFile && (
          <button
            type="button"
            onClick={handleAnalyzeImage}
            disabled={isAnalyzing || isLoading}
            className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <span>🔍</span>
                画像から特徴を自動抽出
              </>
            )}
          </button>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
          特徴テキスト <span className="text-red-400">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: 30-40代男性、短髪で黒髪、紺色のスーツに白シャツ、親しみやすい笑顔、似顔絵イラスト風"
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isLoading || isAnalyzing}
        />
        <p className="text-xs text-slate-500 mt-1">{description.length}/500（最低10文字）</p>
      </div>

      {/* Default checkbox */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          disabled={isLoading}
          className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
        />
        <span className="text-slate-300">デフォルトに設定する</span>
      </label>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <ul className="text-sm text-red-400 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isLoading || isAnalyzing}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-xl transition-colors"
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
