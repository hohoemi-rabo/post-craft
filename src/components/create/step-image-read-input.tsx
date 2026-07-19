'use client'

import { useState, useCallback, useRef } from 'react'
import { IMAGE_UPLOAD } from '@/lib/constants'
import { RelatedPostSelector, type RelatedPostData } from './related-post-selector'
import type { UploadedImage } from '@/types/create-flow'

type ImageReadAspectRatio = '1:1' | '4:5' | '16:9'

interface AspectRatioOption {
  id: ImageReadAspectRatio
  name: string
  ratio: number // width / height
}

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { id: '1:1', name: '1:1（正方形）', ratio: 1 },
  { id: '4:5', name: '4:5（縦長）', ratio: 4 / 5 },
  { id: '16:9', name: '16:9（横長）', ratio: 16 / 9 },
]

const MAX_IMAGES = 5

interface LocalImage {
  id: string
  file: File
  originalDataUrl: string // アスペクト比変更時の再クロップ用
  croppedPreview: string
  croppedBase64: string
}

/** File を Data URL として読み込む */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    reader.readAsDataURL(file)
  })
}

/** Canvas API で画像を指定比率にセンタークロップ（Instagram推奨サイズで出力） */
function cropImageToRatio(
  dataUrl: string,
  ratio: ImageReadAspectRatio
): Promise<{ preview: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('画像の処理に失敗しました'))
        return
      }

      const targetRatio = ASPECT_RATIO_OPTIONS.find(o => o.id === ratio)?.ratio || 1

      let srcX = 0
      let srcY = 0
      let srcWidth = img.width
      let srcHeight = img.height

      const imgRatio = img.width / img.height

      if (imgRatio > targetRatio) {
        // 画像が目標より横長 → 左右をクロップ
        srcWidth = img.height * targetRatio
        srcX = (img.width - srcWidth) / 2
      } else {
        // 画像が目標より縦長 → 上下をクロップ
        srcHeight = img.width / targetRatio
        srcY = (img.height - srcHeight) / 2
      }

      // 出力サイズ（Instagram推奨サイズに合わせる）
      let outputWidth: number
      let outputHeight: number

      if (ratio === '1:1') {
        outputWidth = 1080
        outputHeight = 1080
      } else if (ratio === '4:5') {
        outputWidth = 1080
        outputHeight = 1350
      } else {
        // 16:9
        outputWidth = 1080
        outputHeight = 608
      }

      canvas.width = outputWidth
      canvas.height = outputHeight

      ctx.drawImage(
        img,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, outputWidth, outputHeight
      )

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      resolve({
        preview: croppedDataUrl,
        base64: croppedDataUrl.split(',')[1],
      })
    }
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = dataUrl
  })
}

interface StepImageReadInputProps {
  onSubmit: (images: UploadedImage[], text: string, aspectRatio: ImageReadAspectRatio, relatedPost?: RelatedPostData | null) => void
  onBack: () => void
  profileId?: string | null
  initialRelatedPostId?: string | null
}

export function StepImageReadInput({ onSubmit, onBack, profileId, initialRelatedPostId }: StepImageReadInputProps) {
  const [images, setImages] = useState<LocalImage[]>([])
  const [aspectRatio, setAspectRatio] = useState<ImageReadAspectRatio>('1:1')
  const [text, setText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Related post state
  const [relatedEnabled, setRelatedEnabled] = useState(!!initialRelatedPostId)
  const [selectedRelatedPostId, setSelectedRelatedPostId] = useState<string | null>(initialRelatedPostId || null)
  const [relatedPostData, setRelatedPostData] = useState<RelatedPostData | null>(null)

  const handleRelatedSelect = useCallback((post: RelatedPostData) => {
    setSelectedRelatedPostId(post.id)
    setRelatedPostData(post)
  }, [])

  const handleRelatedDeselect = useCallback(() => {
    setSelectedRelatedPostId(null)
    setRelatedPostData(null)
  }, [])

  const handleFilesSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    setError(null)

    if (images.length + files.length > MAX_IMAGES) {
      setError(`画像は最大${MAX_IMAGES}枚までです`)
      return
    }

    const validFiles: File[] = []
    for (const file of files) {
      if (!IMAGE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
        setError('JPEG、PNG、WebP形式の画像を選択してください')
        continue
      }
      if (file.size > IMAGE_UPLOAD.MAX_SIZE) {
        setError('画像サイズは8MB以下にしてください')
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setIsProcessing(true)
    try {
      const newImages: LocalImage[] = []
      for (const file of validFiles) {
        const originalDataUrl = await readFileAsDataUrl(file)
        const { preview, base64 } = await cropImageToRatio(originalDataUrl, aspectRatio)
        newImages.push({
          id: crypto.randomUUID(),
          file,
          originalDataUrl,
          croppedPreview: preview,
          croppedBase64: base64,
        })
      }
      setImages(prev => [...prev, ...newImages])
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像の処理に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }, [images.length, aspectRatio])

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
    handleFilesSelect(Array.from(e.dataTransfer.files))
  }, [handleFilesSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelect(Array.from(e.target.files ?? []))
    // 同じファイルを再選択できるようにリセット
    e.target.value = ''
  }, [handleFilesSelect])

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
    setError(null)
  }, [])

  // アスペクト比変更: 全画像を元データから再クロップ
  const handleAspectRatioChange = useCallback(async (ratio: ImageReadAspectRatio) => {
    if (ratio === aspectRatio || isProcessing) return
    setAspectRatio(ratio)
    if (images.length === 0) return

    setIsProcessing(true)
    try {
      const recropped: LocalImage[] = []
      for (const img of images) {
        const { preview, base64 } = await cropImageToRatio(img.originalDataUrl, ratio)
        recropped.push({ ...img, croppedPreview: preview, croppedBase64: base64 })
      }
      setImages(recropped)
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像の処理に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }, [aspectRatio, images, isProcessing])

  const handleSubmit = () => {
    if (images.length === 0) {
      setError('画像を選択してください')
      return
    }
    onSubmit(
      images.map(img => ({ file: img.file, base64: img.croppedBase64, mimeType: 'image/jpeg' })),
      text,
      aspectRatio,
      relatedEnabled ? relatedPostData : null
    )
  }

  const isValid = images.length > 0 && images.every(img => img.croppedBase64 !== '') && !isProcessing

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📷</span>
          <h2 className="text-xl font-bold text-white">画像読み取りタイプ</h2>
        </div>
        <p className="text-slate-400 text-sm">
          画像を1〜{MAX_IMAGES}枚アップロードし、投稿の方向性をメモで入力してください。
          AIが画像の内容を読み取り、投稿文を自動生成します。
        </p>
      </div>

      {/* 画像アップロードエリア */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">
            画像をアップロード <span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-slate-500">{images.length} / {MAX_IMAGES}枚</span>
        </div>
        <p className="text-xs text-slate-500">
          定点観測など変化を伝えたい投稿は3〜5枚がおすすめです（1枚でもOK）。並び順がカルーセルの投稿順になります。
        </p>

        {/* サムネイルグリッド */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div key={img.id} className="relative rounded-xl overflow-hidden border-2 border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.croppedPreview}
                  alt={`画像 ${index + 1}`}
                  className="w-full aspect-square object-cover bg-black/20"
                />
                {/* 順番バッジ */}
                <span className="absolute top-1.5 left-1.5 min-w-[24px] h-6 px-1.5 flex items-center justify-center bg-black/70 text-white text-xs font-bold rounded-full">
                  {index + 1}
                </span>
                {/* 1枚目はキャッチコピー合成対象 */}
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-blue-500/80 text-white text-[10px] rounded-full">
                    キャッチコピー合成
                  </span>
                )}
                {/* 削除ボタン */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  disabled={isProcessing}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors disabled:opacity-50"
                  aria-label={`画像 ${index + 1} を削除`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-xs">処理中...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ドラッグ&ドロップエリア（上限未満なら常に表示） */}
        {images.length < MAX_IMAGES && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl cursor-pointer
              transition-all duration-200
              ${images.length > 0 ? 'p-4' : 'p-8'}
              ${isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 hover:border-white/40 bg-white/5'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center text-center">
              {images.length === 0 && (
                <div className="w-16 h-16 mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <p className="text-white font-medium mb-1">
                {images.length > 0 ? '画像を追加（クリックまたはドラッグ&ドロップ）' : 'クリックまたはドラッグ&ドロップ'}
              </p>
              <p className="text-slate-400 text-sm">
                JPEG, PNG, WebP（最大8MB・複数選択可）
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>

      {/* アスペクト比選択（画像選択後に表示） */}
      {images.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            アスペクト比（全画像に適用）
          </label>
          <div className="flex gap-2">
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAspectRatioChange(option.id)}
                disabled={isProcessing}
                className={`
                  flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${aspectRatio === option.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* メモ入力 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          投稿の方向性（メモ）
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例：無料勉強会に来てほしいという内容でお願いします"
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>※ 画像の内容をAIが読み取り、このメモを参考に投稿文を生成します</span>
          <span>{text.length} / 2000</span>
        </div>
      </div>

      {/* 関連投稿セレクタ */}
      <RelatedPostSelector
        enabled={relatedEnabled}
        onToggle={setRelatedEnabled}
        selectedPostId={selectedRelatedPostId}
        onSelect={handleRelatedSelect}
        onDeselect={handleRelatedDeselect}
        profileId={profileId}
      />

      {/* ナビゲーション */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className={`
            px-8 py-3 rounded-xl font-medium transition-all
            ${isValid
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          次へ →
        </button>
      </div>
    </div>
  )
}
