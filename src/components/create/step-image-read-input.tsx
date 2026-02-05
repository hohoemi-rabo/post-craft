'use client'

import { useState, useCallback, useRef } from 'react'

interface StepImageReadInputProps {
  onSubmit: (imageBase64: string, imageMimeType: string, text: string, file: File) => void
  onBack: () => void
}

export function StepImageReadInput({ onSubmit, onBack }: StepImageReadInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string>('')
  const [text, setText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    // プレビュー表示とBase64変換
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      // data:image/xxx;base64, を除去してBase64データのみ抽出
      const base64 = result.split(',')[1]
      setImageBase64(base64)
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
    setPreview(null)
    setImageBase64('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleSubmit = () => {
    if (!selectedFile || !imageBase64) {
      setError('画像を選択してください')
      return
    }
    onSubmit(imageBase64, selectedFile.type, text, selectedFile)
  }

  const isValid = selectedFile !== null && imageBase64 !== ''

  return (
    <div className="space-y-6">
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

        {preview ? (
          // プレビュー表示
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden border-2 border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="プレビュー"
                className="w-full max-h-[400px] object-contain bg-black/20"
              />
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
              {selectedFile?.name} ({(selectedFile?.size ?? 0 / 1024 / 1024).toFixed(2)} MB)
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
