'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

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

interface StepImageReadInputProps {
  onSubmit: (imageBase64: string, imageMimeType: string, text: string, file: File, aspectRatio: ImageReadAspectRatio) => void
  onBack: () => void
}

export function StepImageReadInput({ onSubmit, onBack }: StepImageReadInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)
  const [croppedBase64, setCroppedBase64] = useState<string>('')
  const [aspectRatio, setAspectRatio] = useState<ImageReadAspectRatio>('1:1')
  const [text, setText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Canvas API で画像をクロップ
  const cropImage = useCallback((imageSrc: string, ratio: ImageReadAspectRatio) => {
    setIsProcessing(true)
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) {
        setIsProcessing(false)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setIsProcessing(false)
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

      // クロップ後の画像をData URLに変換
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setCroppedPreview(croppedDataUrl)

      // Base64データを抽出
      const base64 = croppedDataUrl.split(',')[1]
      setCroppedBase64(base64)
      setIsProcessing(false)
    }
    img.onerror = () => {
      setError('画像の読み込みに失敗しました')
      setIsProcessing(false)
    }
    img.src = imageSrc
  }, [])

  // アスペクト比が変更されたときに画像をクロップ
  useEffect(() => {
    if (originalPreview && selectedFile) {
      cropImage(originalPreview, aspectRatio)
    }
  }, [aspectRatio, originalPreview, selectedFile, cropImage])

  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('JPEG、PNG、WebP形式の画像を選択してください')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('画像サイズは8MB以下にしてください')
      return
    }

    setError(null)
    setSelectedFile(file)

    // オリジナル画像を読み込み
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setOriginalPreview(result)
      // クロップ処理は useEffect で実行される
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
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleRemoveImage = useCallback(() => {
    setSelectedFile(null)
    setOriginalPreview(null)
    setCroppedPreview(null)
    setCroppedBase64('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleSubmit = () => {
    if (!selectedFile || !croppedBase64) {
      setError('画像を選択してください')
      return
    }
    // クロップ済み画像のBase64とMIMEタイプを送信
    onSubmit(croppedBase64, 'image/jpeg', text, selectedFile, aspectRatio)
  }

  const isValid = selectedFile !== null && croppedBase64 !== '' && !isProcessing

  return (
    <div className="space-y-6">
      {/* 非表示のCanvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📷</span>
          <h2 className="text-xl font-bold text-white">画像読み取りタイプ</h2>
        </div>
        <p className="text-slate-400 text-sm">
          画像をアップロードし、投稿の方向性をメモで入力してください。
          AIが画像の内容を読み取り、投稿文を自動生成します。
        </p>
      </div>

      {/* 画像アップロードエリア */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          画像をアップロード <span className="text-red-400">*</span>
        </label>

        {croppedPreview ? (
          // プレビュー表示
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden border-2 border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={croppedPreview}
                alt="プレビュー"
                className="w-full max-h-[400px] object-contain bg-black/20"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-sm">処理中...</div>
                </div>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                aria-label="画像を削除"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {selectedFile?.name}
            </p>
          </div>
        ) : (
          // ドラッグ&ドロップエリア
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative p-8 border-2 border-dashed rounded-xl cursor-pointer
              transition-all duration-200
              ${isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 hover:border-white/40 bg-white/5'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center text-center">
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
              <p className="text-white font-medium mb-1">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="text-slate-400 text-sm">
                JPEG, PNG, WebP（最大8MB）
              </p>
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

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>

      {/* アスペクト比選択（画像選択後に表示） */}
      {selectedFile && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            アスペクト比
          </label>
          <div className="flex gap-2">
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setAspectRatio(option.id)}
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
