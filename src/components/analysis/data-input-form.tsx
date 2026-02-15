'use client'

import { useState, useRef, useCallback } from 'react'
import type { AnalysisConfig } from './analysis-wizard'

interface DataInputFormProps {
  config: AnalysisConfig
  onSubmit: (config: AnalysisConfig) => void
  onBack: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_EXTENSIONS = ['.csv', '.json']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DataInputForm({ config, onSubmit, onBack }: DataInputFormProps) {
  // Instagram state
  const [accountName, setAccountName] = useState(config.instagram?.accountName || '')
  const [file, setFile] = useState<File | null>(config.instagram?.file || null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Blog state
  const [blogUrl, setBlogUrl] = useState(config.blog?.blogUrl || '')
  const [blogName, setBlogName] = useState(config.blog?.blogName || '')

  const hasInstagram = config.sourceTypes.includes('instagram')
  const hasBlog = config.sourceTypes.includes('blog')

  // File validation
  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return '対応していないファイル形式です（CSV または JSON のみ）'
    }
    if (f.size > MAX_FILE_SIZE) {
      return `ファイルサイズが10MBを超えています（${formatFileSize(f.size)}）`
    }
    return null
  }, [])

  const handleFileSelect = useCallback((f: File) => {
    const error = validateFile(f)
    if (error) {
      setFileError(error)
      setFile(null)
    } else {
      setFileError(null)
      setFile(f)
    }
  }, [validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFileSelect(selected)
  }, [handleFileSelect])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Validation
  const isInstagramValid = !hasInstagram || (accountName.trim().length > 0 && file !== null)
  const isBlogValid = !hasBlog || /^https?:\/\/.+/.test(blogUrl.trim())
  const isValid = isInstagramValid && isBlogValid

  const handleSubmit = () => {
    if (!isValid) return

    const updatedConfig: AnalysisConfig = {
      ...config,
      ...(hasInstagram && {
        instagram: {
          accountName: accountName.trim().replace(/^@/, ''),
          file,
          analysisId: null,
        },
      }),
      ...(hasBlog && {
        blog: {
          blogUrl: blogUrl.trim(),
          blogName: blogName.trim(),
          analysisId: null,
        },
      }),
    }

    onSubmit(updatedConfig)
  }

  return (
    <div className="space-y-6">
      {/* Instagram セクション */}
      {hasInstagram && (
        <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span>📸</span> Instagram 競合データ
          </h3>
          <p className="text-sm text-white/50 mb-5">
            Bright Data からエクスポートした CSV/JSON ファイルをアップロード
          </p>

          <div className="space-y-4">
            {/* アカウント名 */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                アカウント名 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="username"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* ファイルアップロード */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                データファイル <span className="text-red-400">*</span>
              </label>

              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-500/10'
                      : fileError
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="text-3xl mb-2 opacity-60">📁</div>
                  <p className="text-sm text-white/80 mb-1">
                    ドラッグ&ドロップ または クリックして選択
                  </p>
                  <p className="text-xs text-white/40">
                    CSV, JSON / 最大 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="text-xl">
                    {file.name.endsWith('.csv') ? '📄' : '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-white/40">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                    aria-label="ファイルを削除"
                  >
                    ✕
                  </button>
                </div>
              )}

              {fileError && (
                <p className="mt-2 text-sm text-red-400">{fileError}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ブログ セクション */}
      {hasBlog && (
        <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span>📝</span> ブログ情報
          </h3>
          <p className="text-sm text-white/50 mb-5">
            ブログのトップページURLを入力すると、記事を自動で取得します
          </p>

          <div className="space-y-4">
            {/* ブログ URL */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                ブログ URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {blogUrl.length > 0 && !isBlogValid && (
                <p className="mt-1.5 text-xs text-yellow-400">
                  http:// または https:// から始まるURLを入力してください
                </p>
              )}
            </div>

            {/* ブログ名 */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                ブログ名 <span className="text-white/30 text-xs font-normal">（任意）</span>
              </label>
              <input
                type="text"
                value={blogName}
                onChange={(e) => setBlogName(e.target.value)}
                placeholder="マイブログ"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>
      )}

      {/* ナビゲーション */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-h-[44px]"
        >
          &larr; 戻る
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`px-6 py-3 rounded-xl font-medium transition-all min-h-[44px] ${
            isValid
              ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-lg shadow-blue-500/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          分析を開始 &rarr;
        </button>
      </div>
    </div>
  )
}
