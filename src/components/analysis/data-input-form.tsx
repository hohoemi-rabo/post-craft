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

  // Sitemap discovery state
  const [discoveryState, setDiscoveryState] = useState<
    'idle' | 'loading' | 'found' | 'not_found' | 'skipped'
  >('idle')
  const [discoveredSitemapUrl, setDiscoveredSitemapUrl] = useState<string | null>(null)
  const [discoveredArticleCount, setDiscoveredArticleCount] = useState<number | null>(null)
  const [discoveryStrategy, setDiscoveryStrategy] = useState<string | null>(null)
  const [manualSitemapUrl, setManualSitemapUrl] = useState('')
  const [manualSitemapValid, setManualSitemapValid] = useState<boolean | null>(null)
  const [manualArticleCount, setManualArticleCount] = useState<number | null>(null)
  const [isValidatingManual, setIsValidatingManual] = useState(false)

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

  const isBlogUrlValid = /^https?:\/\/.+/.test(blogUrl.trim())

  // Sitemap discovery handlers
  const handleBlogUrlChange = useCallback((value: string) => {
    setBlogUrl(value)
    if (discoveryState !== 'idle') {
      setDiscoveryState('idle')
      setDiscoveredSitemapUrl(null)
      setDiscoveredArticleCount(null)
      setDiscoveryStrategy(null)
      setManualSitemapUrl('')
      setManualSitemapValid(null)
      setManualArticleCount(null)
    }
  }, [discoveryState])

  const handleDiscover = useCallback(async () => {
    if (!isBlogUrlValid) return
    setDiscoveryState('loading')
    setDiscoveredSitemapUrl(null)
    setDiscoveredArticleCount(null)
    setDiscoveryStrategy(null)
    setManualSitemapUrl('')
    setManualSitemapValid(null)
    setManualArticleCount(null)

    try {
      const res = await fetch('/api/analysis/sitemap-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blogUrl.trim() }),
      })
      const data = await res.json()
      if (data.found) {
        setDiscoveryState('found')
        setDiscoveredSitemapUrl(data.sitemapUrl)
        setDiscoveredArticleCount(data.articleCount)
        setDiscoveryStrategy(data.strategy)
      } else {
        setDiscoveryState('not_found')
      }
    } catch {
      setDiscoveryState('not_found')
    }
  }, [isBlogUrlValid, blogUrl])

  const handleValidateManualSitemap = useCallback(async () => {
    if (!manualSitemapUrl.trim() || !isBlogUrlValid) return
    setIsValidatingManual(true)
    setManualSitemapValid(null)
    setManualArticleCount(null)

    try {
      const res = await fetch('/api/analysis/sitemap-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: blogUrl.trim(),
          sitemapUrl: manualSitemapUrl.trim(),
        }),
      })
      const data = await res.json()
      setManualSitemapValid(data.found)
      if (data.found) {
        setManualArticleCount(data.articleCount)
      }
    } catch {
      setManualSitemapValid(false)
    } finally {
      setIsValidatingManual(false)
    }
  }, [manualSitemapUrl, isBlogUrlValid, blogUrl])

  const handleSkipSitemap = useCallback(() => {
    setDiscoveryState('skipped')
  }, [])

  // Validation
  const isInstagramValid = !hasInstagram || (accountName.trim().length > 0 && file !== null)
  const isBlogValid = !hasBlog || (
    isBlogUrlValid && (
      discoveryState === 'found' ||
      discoveryState === 'skipped' ||
      (discoveryState === 'not_found' && manualSitemapValid === true)
    )
  )
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
          sitemapUrl: discoveryState === 'found'
            ? discoveredSitemapUrl || undefined
            : (discoveryState === 'not_found' && manualSitemapValid)
              ? manualSitemapUrl.trim()
              : undefined,
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
            ブログのトップページURLを入力して、サイトマップを検索します
          </p>

          <div className="space-y-4">
            {/* ブログ URL + 検索ボタン */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                ブログ URL <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={blogUrl}
                  onChange={(e) => handleBlogUrlChange(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleDiscover}
                  disabled={!isBlogUrlValid || discoveryState === 'loading'}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all min-h-[44px] whitespace-nowrap ${
                    isBlogUrlValid && discoveryState !== 'loading'
                      ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  {discoveryState === 'loading' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      検索中
                    </span>
                  ) : '検索'}
                </button>
              </div>
              {blogUrl.length > 0 && !isBlogUrlValid && (
                <p className="mt-1.5 text-xs text-yellow-400">
                  http:// または https:// から始まるURLを入力してください
                </p>
              )}
            </div>

            {/* サイトマップ探索結果 */}
            {discoveryState === 'found' && (
              <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                <div className="flex items-start gap-2.5">
                  <span className="text-green-400 text-lg mt-0.5">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-300">
                      サイトマップを発見しました
                    </p>
                    <p className="text-xs text-white/40 mt-1 truncate">
                      {discoveredSitemapUrl}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {discoveredArticleCount}件の記事URL
                      {discoveryStrategy === 'robots.txt' && '（robots.txt から検出）'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {discoveryState === 'not_found' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-start gap-2.5">
                    <span className="text-yellow-400 text-lg mt-0.5">⚠</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-300">
                        サイトマップが自動検出できませんでした
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        サイトマップURLを直接入力するか、サイトマップなしで続行できます
                      </p>
                    </div>
                  </div>
                </div>

                {/* 手動サイトマップURL入力 */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">
                    サイトマップURL（任意）
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={manualSitemapUrl}
                      onChange={(e) => {
                        setManualSitemapUrl(e.target.value)
                        setManualSitemapValid(null)
                        setManualArticleCount(null)
                      }}
                      placeholder="https://example.com/sitemap.xml"
                      className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleValidateManualSitemap}
                      disabled={!manualSitemapUrl.trim() || isValidatingManual}
                      className={`px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px] whitespace-nowrap ${
                        manualSitemapUrl.trim() && !isValidatingManual
                          ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {isValidatingManual ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          確認中
                        </span>
                      ) : '確認'}
                    </button>
                  </div>
                  {manualSitemapValid === true && (
                    <p className="mt-1.5 text-xs text-green-400">
                      有効なサイトマップです（{manualArticleCount}件の記事URL）
                    </p>
                  )}
                  {manualSitemapValid === false && (
                    <p className="mt-1.5 text-xs text-red-400">
                      有効なサイトマップが見つかりませんでした
                    </p>
                  )}
                </div>

                {/* サイトマップなしで続行 */}
                {manualSitemapValid !== true && (
                  <button
                    onClick={handleSkipSitemap}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer underline underline-offset-2"
                  >
                    サイトマップなしで続行（RSS / リンク巡回で取得）
                  </button>
                )}
              </div>
            )}

            {discoveryState === 'skipped' && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-start gap-2.5">
                  <span className="text-white/40 text-lg mt-0.5">ℹ</span>
                  <p className="text-sm text-white/50">
                    サイトマップを使わずに RSS / リンク巡回で記事を取得します
                  </p>
                </div>
              </div>
            )}

            {/* ブログ名 */}
            {(discoveryState === 'found' || discoveryState === 'skipped' || (discoveryState === 'not_found' && manualSitemapValid === true)) && (
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
            )}
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
