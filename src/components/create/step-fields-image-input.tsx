'use client'

import { useCallback, useRef, useState } from 'react'
import { IMAGE_UPLOAD } from '@/lib/constants'
import type { Placeholder } from '@/types/post-type'
import { RelatedPostSelector, type RelatedPostData } from './related-post-selector'

interface StepFieldsImageInputProps {
  postTypeName?: string | null
  placeholders: Placeholder[]
  initialText?: string
  initialRelatedPostId?: string | null
  profileId?: string | null
  onSubmit: (
    inputText: string,
    imageBase64: string | null,
    imageMimeType: string | null,
    file: File | null,
    relatedPost?: RelatedPostData | null
  ) => void
  onBack: () => void
}

/**
 * フォーム入力 + 任意画像アップロードの入力ステップ（flow_type='image_read_fields'）
 *
 * フォーム項目（placeholders）を埋めつつ、任意で画像をアップロードできる。
 * 画像があれば AI が内容を読み取り、フォーム情報と合わせて投稿文を生成する。
 * 画像は投稿の1枚目としてそのまま保存される（クロップ・キャッチコピー合成なし）。
 */
export function StepFieldsImageInput({
  postTypeName,
  placeholders,
  initialText = '',
  initialRelatedPostId,
  profileId,
  onSubmit,
  onBack,
}: StepFieldsImageInputProps) {
  // フォーム項目の値（初期テキスト "label: value" から復元）
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {}
    if (initialText && placeholders.length > 0) {
      for (const line of initialText.split('\n')) {
        const colonIdx = line.indexOf(': ')
        if (colonIdx > 0) {
          const label = line.slice(0, colonIdx)
          const value = line.slice(colonIdx + 2)
          const ph = placeholders.find((p) => p.label === label)
          if (ph) values[ph.name] = value
        }
      }
    }
    return values
  })

  // 画像の状態（任意）
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string>('')
  const [imageMimeType, setImageMimeType] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 関連投稿参照の状態
  const [relatedEnabled, setRelatedEnabled] = useState(!!initialRelatedPostId)
  const [relatedPost, setRelatedPost] = useState<RelatedPostData | null>(null)
  const [selectedRelatedPostId, setSelectedRelatedPostId] = useState<string | null>(initialRelatedPostId || null)

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = useCallback((file: File) => {
    if (!IMAGE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
      setError('JPEG、PNG、WebP形式の画像を選択してください')
      return
    }
    if (file.size > IMAGE_UPLOAD.MAX_SIZE) {
      setError('画像サイズは8MB以下にしてください')
      return
    }
    setError(null)
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      setImageBase64(dataUrl.split(',')[1] || '')
      setImageMimeType(file.type)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleRemoveImage = useCallback(() => {
    setSelectedFile(null)
    setImagePreview(null)
    setImageBase64('')
    setImageMimeType('')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // 必須フォーム項目がすべて埋まっていれば送信可能（画像は任意）
  const isValid = placeholders
    .filter((p) => p.required)
    .every((p) => (fieldValues[p.name] || '').trim().length > 0)

  const handleSubmit = () => {
    if (!isValid) return
    const inputText = placeholders
      .map((p) => `${p.label}: ${fieldValues[p.name] || ''}`)
      .filter((line) => !line.endsWith(': '))
      .join('\n')
    onSubmit(
      inputText,
      imageBase64 || null,
      imageMimeType || null,
      selectedFile,
      relatedEnabled ? relatedPost : null
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎉</span>
          <h2 className="text-xl font-bold text-white">{postTypeName || '投稿'}</h2>
        </div>
        <p className="text-slate-400 text-sm">
          各項目を入力してください。画像をアップロードすると、AIが画像の内容も読み取って投稿文を作成します。
        </p>
      </div>

      {/* 動的フォーム項目 */}
      <div className="space-y-4">
        {placeholders.map((ph) => (
          <div key={ph.name} className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              {ph.label}
              {ph.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {ph.description && (
              <p className="text-xs text-slate-500">{ph.description}</p>
            )}
            {ph.inputType === 'textarea' ? (
              <textarea
                value={fieldValues[ph.name] || ''}
                onChange={(e) => handleFieldChange(ph.name, e.target.value)}
                placeholder={ph.description || ph.label}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            ) : (
              <input
                type="text"
                value={fieldValues[ph.name] || ''}
                onChange={(e) => handleFieldChange(ph.name, e.target.value)}
                placeholder={ph.description || ph.label}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>

      {/* 画像アップロード（任意） */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          画像（任意）
          <span className="ml-2 text-xs text-slate-500">— アップすると内容をAIが読み取ります</span>
        </label>

        {imagePreview ? (
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden border-2 border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="プレビュー"
                className="w-full max-h-[400px] object-contain bg-black/20"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                aria-label="画像を削除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">{selectedFile?.name}</p>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
              isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 mb-3 rounded-full bg-white/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1 text-sm">クリックまたはドラッグ&ドロップ</p>
              <p className="text-slate-400 text-xs">JPEG, PNG, WebP（最大8MB）</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {/* 関連投稿セレクタ */}
      <RelatedPostSelector
        enabled={relatedEnabled}
        onToggle={setRelatedEnabled}
        selectedPostId={selectedRelatedPostId}
        onSelect={(post) => {
          setRelatedPost(post)
          setSelectedRelatedPostId(post.id)
        }}
        onDeselect={() => {
          setRelatedPost(null)
          setSelectedRelatedPostId(null)
        }}
        profileId={profileId}
      />

      {/* ナビゲーション */}
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
          disabled={!isValid}
          className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors ${
            !isValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          生成する →
        </button>
      </div>
    </div>
  )
}
