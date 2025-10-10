'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Spinner from '@/components/ui/spinner'
import Button from '@/components/ui/button'
import Textarea from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { incrementUsage } from '@/lib/rate-limiter'

const MAX_CAPTION_LENGTH = 150

export default function ResultPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [title, setTitle] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // 編集可能な状態
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set())
  const [bgColorIndex, setBgColorIndex] = useState(0)

  // 投稿アシスト状態
  const [assistStep, setAssistStep] = useState(0) // 0: 未開始, 1: ダウンロード中, 2: コピー中, 3: Instagram起動, 4: 完了
  const [showAssistGuide, setShowAssistGuide] = useState(false)

  // sessionStorageからデータを取得
  useEffect(() => {
    const data = sessionStorage.getItem('extractedContent')

    if (!data) {
      setStatus('error')
      setError('コンテンツが見つかりません。もう一度やり直してください。')
      return
    }

    try {
      const parsed = JSON.parse(data)
      setTitle(parsed.title || null)
      setContent(parsed.content || null)
      setSource(parsed.source || null)
      setSourceUrl(parsed.sourceUrl || null)
    } catch (err) {
      setStatus('error')
      setError('データの読み込みに失敗しました')
    }
  }, [])

  useEffect(() => {
    if (!content) return

    generateContent()
  }, [content, retryCount])

  const generateContent = async () => {
    setStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title: title || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'コンテンツの生成に失敗しました')
      }

      // 生成結果を設定
      setCaption(data.caption)
      setHashtags(data.hashtags)
      // デフォルトで全選択
      setSelectedHashtags(new Set(data.hashtags))
      setStatus('success')

      // 使用回数をインクリメント
      incrementUsage()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'コンテンツの生成に失敗しました')
    }
  }

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(retryCount + 1)
    }
  }

  const handleHashtagToggle = (tag: string) => {
    const newSelected = new Set(selectedHashtags)
    if (newSelected.has(tag)) {
      newSelected.delete(tag)
    } else {
      newSelected.add(tag)
    }
    setSelectedHashtags(newSelected)
  }

  const handleSelectAll = () => {
    setSelectedHashtags(new Set(hashtags))
  }

  const handleDeselectAll = () => {
    setSelectedHashtags(new Set())
  }

  const handleCopy = async () => {
    const selectedHashtagsArray = Array.from(selectedHashtags)
    const hashtagsText = selectedHashtagsArray.map((tag) => `#${tag.replace(/^#+/, '')}`).join(' ')
    const text = selectedHashtagsArray.length > 0 ? `${caption}\n\n${hashtagsText}` : caption

    try {
      await navigator.clipboard.writeText(text)
      showToast('クリップボードにコピーしました', 'success')
    } catch (err) {
      showToast('コピーに失敗しました', 'error')
    }
  }

  const handleDownloadImage = async () => {
    if (!title) {
      showToast('タイトルが見つかりません', 'error')
      return
    }

    try {
      const imageUrl = `/api/og?title=${encodeURIComponent(title)}&bgColorIndex=${bgColorIndex}`
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `instagram-post-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('画像をダウンロードしました', 'success')
    } catch (err) {
      showToast('ダウンロードに失敗しました', 'error')
    }
  }

  const handleStartPostAssist = async () => {
    if (!title) {
      showToast('タイトルが見つかりません', 'error')
      return
    }

    try {
      setShowAssistGuide(true)

      // Step 1: 画像ダウンロード
      setAssistStep(1)
      const imageUrl = `/api/og?title=${encodeURIComponent(title)}&bgColorIndex=${bgColorIndex}`
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `instagram-post-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // 少し待つ（ユーザーがダウンロードを確認できるように）
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 2: キャプション+ハッシュタグをコピー
      setAssistStep(2)
      const selectedHashtagsArray = Array.from(selectedHashtags)
      const hashtagsText = selectedHashtagsArray
        .map((tag) => `#${tag.replace(/^#+/, '')}`)
        .join(' ')
      const text =
        selectedHashtagsArray.length > 0 ? `${caption}\n\n${hashtagsText}` : caption
      await navigator.clipboard.writeText(text)

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 3: Instagram起動
      setAssistStep(3)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      if (isMobile) {
        // モバイル: Instagramアプリを起動
        window.location.href = 'instagram://camera'
        // アプリがない場合のフォールバック（1秒後にWeb版を開く）
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank')
        }, 1000)
      } else {
        // PC: Instagram Web版を新しいタブで開く
        window.open('https://www.instagram.com/', '_blank')
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 4: 完了
      setAssistStep(4)
      showToast('投稿準備が完了しました！', 'success')
    } catch (err) {
      showToast('投稿準備中にエラーが発生しました', 'error')
      setShowAssistGuide(false)
      setAssistStep(0)
    }
  }

  const BG_COLORS = [
    '#1E293B', // ダークネイビー
    '#334155', // グレー
    '#F5F5F5', // ライトグレー
    '#10B981', // グリーン
    '#3B82F6', // ブルー
    '#EC4899', // ピンク
    '#8B5CF6', // パープル
    '#F59E0B', // オレンジ
    '#EF4444', // レッド
    '#06B6D4', // シアン
    '#000000', // ブラック
    '#FFFFFF', // ホワイト
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* グラデーションアクセント */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-orange-500/20" />
        {/* パターン背景 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHptLTEzLjI0NCAwYzAtNC42OTQgMy44MDYtOC41IDguNS04LjVzOC41IDMuODA2IDguNSA4LjUtMy44MDYgOC41LTguNSA4LjUtOC41LTMuODA2LTguNS04LjV6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 戻るリンク */}
          <Link
            href="/"
            className="mb-6 inline-flex min-h-[44px] items-center py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            トップに戻る
          </Link>

          {/* ローディング状態 */}
          {status === 'loading' && (
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-12 text-center">
              <Spinner size="lg" />
              <h2 className="mt-6 text-xl font-semibold text-white">
                AIが投稿素材を生成しています...
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                この処理には最大30秒かかる場合があります
              </p>

              <div className="mt-8 rounded-lg bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-left text-sm text-gray-300">
                  <p className="font-medium">処理内容:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• 記事の内容を分析中...</li>
                    <li>• Instagram用のキャプションを生成中...</li>
                    <li>• 最適なハッシュタグを選定中...</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* エラー状態 */}
          {status === 'error' && (
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-error"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <h2 className="mt-6 text-center text-xl font-semibold text-white">
                生成に失敗しました
              </h2>
              <p className="mt-2 text-center text-sm text-gray-300">{error}</p>

              <div className="mt-8 flex justify-center space-x-4">
                {retryCount < 3 && (
                  <Button onClick={handleRetry} className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0">
                    もう一度試す ({retryCount}/3)
                  </Button>
                )}
                <Button onClick={() => router.back()} className="border-2 border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10">
                  戻る
                </Button>
              </div>
            </div>
          )}

          {/* 生成成功 */}
          {status === 'success' && (
            <>
              {/* タイトル */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  投稿素材の生成が完了しました
                </h1>
                <p className="mt-2 text-sm text-gray-300 sm:text-base">
                  キャプションとハッシュタグを編集して、コピーしてInstagramに投稿しましょう
                </p>
              </div>

              {/* 2カラムレイアウト（PC）/ 1カラム（モバイル） */}
              <div className="grid gap-8 md:grid-cols-2">
                {/* 左カラム: 編集エリア */}
                <div className="space-y-6">
                  {/* メタ情報 */}
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
                    <h2 className="text-lg font-semibold text-white">元記事情報</h2>
                    <div className="mt-4 space-y-3">
                      {sourceUrl && (
                        <div>
                          <p className="text-xs font-medium text-gray-400">URL</p>
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block break-all text-sm text-purple-400 hover:text-pink-400 hover:underline transition-colors"
                          >
                            {sourceUrl}
                          </a>
                        </div>
                      )}
                      {!sourceUrl && source === 'manual' && (
                        <div>
                          <p className="text-xs font-medium text-gray-400">ソース</p>
                          <p className="mt-1 text-sm text-gray-300">直接入力</p>
                        </div>
                      )}
                      {title && (
                        <div>
                          <p className="text-xs font-medium text-gray-400">タイトル</p>
                          <p className="mt-1 text-sm text-gray-300">{title}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* キャプション編集 */}
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
                    <h2 className="text-lg font-semibold text-white">キャプション</h2>
                    <div className="mt-4">
                      <Textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        maxLength={MAX_CAPTION_LENGTH}
                        showCount
                        className="min-h-[120px] bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500"
                        placeholder="キャプションを入力してください..."
                      />
                    </div>
                  </div>

                  {/* ハッシュタグ選択 */}
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">ハッシュタグ</h2>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSelectAll}
                          className="min-h-[44px] py-2 text-xs text-purple-400 hover:text-pink-400 hover:underline transition-colors"
                        >
                          全選択
                        </button>
                        <span className="text-xs text-gray-400">|</span>
                        <button
                          onClick={handleDeselectAll}
                          className="min-h-[44px] py-2 text-xs text-purple-400 hover:text-pink-400 hover:underline transition-colors"
                        >
                          全解除
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {hashtags.map((tag, index) => {
                        const cleanTag = tag.replace(/^#+/, '')
                        return (
                          <label
                            key={index}
                            className="flex min-h-[44px] cursor-pointer items-center space-x-3 rounded-lg border border-white/20 bg-white/5 p-3 transition-colors hover:bg-white/10"
                          >
                            <input
                              type="checkbox"
                              checked={selectedHashtags.has(tag)}
                              onChange={() => handleHashtagToggle(tag)}
                              className="h-4 w-4 rounded border-white/30 text-purple-500 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                            />
                            <span className="text-sm text-gray-300">#{cleanTag}</span>
                          </label>
                        )
                      })}
                    </div>

                    <p className="mt-3 text-xs text-gray-400">
                      {selectedHashtags.size} / {hashtags.length} 個選択中
                    </p>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
                    <Button onClick={handleCopy} className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      コピーする
                    </Button>
                    <Button onClick={handleRetry} className="flex-1 border-2 border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      再生成
                    </Button>
                  </div>
                </div>

                {/* 右カラム: プレビュー */}
                <div className="space-y-6">
                  {/* プレビュー */}
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
                    <h2 className="text-lg font-semibold text-white">プレビュー</h2>
                    <div className="mt-4">
                      <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                        <p className="whitespace-pre-wrap text-sm text-gray-300">
                          {caption || 'キャプションが入力されていません'}
                        </p>

                        {selectedHashtags.size > 0 && (
                          <>
                            <div className="my-3 border-t border-white/20" />
                            <div className="flex flex-wrap gap-1">
                              {Array.from(selectedHashtags).map((tag, index) => {
                                const cleanTag = tag.replace(/^#+/, '')
                                return (
                                  <span key={index} className="text-sm text-purple-400">
                                    #{cleanTag}
                                  </span>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span>文字数: {caption.length} / {MAX_CAPTION_LENGTH}</span>
                        <span>ハッシュタグ: {selectedHashtags.size}個</span>
                      </div>
                    </div>
                  </div>

                  {/* 投稿アシスト */}
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
                    <h2 className="text-lg font-semibold text-white">
                      📱 Instagram投稿準備
                    </h2>
                    <p className="mt-2 text-sm text-gray-300">
                      ワンクリックで画像ダウンロード、キャプションコピー、Instagram起動を自動実行します
                    </p>

                    <div className="mt-4">
                      <Button
                        onClick={handleStartPostAssist}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0"
                        disabled={assistStep > 0 && assistStep < 4}
                      >
                        {assistStep === 0 && '投稿準備を開始'}
                        {assistStep > 0 && assistStep < 4 && '実行中...'}
                        {assistStep === 4 && 'もう一度実行'}
                      </Button>
                    </div>

                    {/* 進捗表示 */}
                    {showAssistGuide && (
                      <div className="mt-4 space-y-3 rounded-lg bg-white/5 border border-white/20 p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              assistStep >= 1 ? 'bg-success text-white' : 'bg-gray-300'
                            }`}
                          >
                            {assistStep >= 1 ? '✓' : '1'}
                          </div>
                          <span
                            className={`text-sm ${
                              assistStep >= 1 ? 'font-medium text-white' : 'text-gray-400'
                            }`}
                          >
                            画像をダウンロード
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              assistStep >= 2 ? 'bg-success text-white' : 'bg-gray-600'
                            }`}
                          >
                            {assistStep >= 2 ? '✓' : '2'}
                          </div>
                          <span
                            className={`text-sm ${
                              assistStep >= 2 ? 'font-medium text-white' : 'text-gray-400'
                            }`}
                          >
                            キャプション・ハッシュタグをコピー
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              assistStep >= 3 ? 'bg-success text-white' : 'bg-gray-600'
                            }`}
                          >
                            {assistStep >= 3 ? '✓' : '3'}
                          </div>
                          <span
                            className={`text-sm ${
                              assistStep >= 3 ? 'font-medium text-white' : 'text-gray-400'
                            }`}
                          >
                            Instagramを起動
                          </span>
                        </div>

                        {assistStep === 4 && (
                          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 backdrop-blur-sm p-4">
                            <h4 className="font-semibold text-success">準備完了！</h4>
                            <p className="mt-2 text-sm text-gray-300">
                              Instagramで以下の手順で投稿してください：
                            </p>
                            <ol className="mt-2 space-y-1 text-sm text-gray-300">
                              <li>1. ダウンロードした画像を選択</li>
                              <li>2. キャプション欄に貼り付け（Ctrl/Cmd + V）</li>
                              <li>3. 投稿ボタンをタップ</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 画像プレビュー */}
                  {title && (
                    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6">
                      <h2 className="text-lg font-semibold text-white">生成画像</h2>

                      {/* 色選択UI */}
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-gray-300">背景色を選択</p>
                        <div className="grid grid-cols-6 gap-2">
                          {BG_COLORS.map((color, index) => (
                            <button
                              key={color}
                              onClick={() => setBgColorIndex(index)}
                              className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg border-2 transition-all hover:scale-110 ${
                                bgColorIndex === index
                                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                                  : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                              title={`色 ${index + 1}`}
                              aria-label={`背景色 ${index + 1} を選択`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="overflow-hidden rounded-lg border border-border">
                          <img
                            src={`/api/og?title=${encodeURIComponent(title)}&bgColorIndex=${bgColorIndex}`}
                            alt="Instagram投稿用画像"
                            className="w-full"
                          />
                        </div>
                        <p className="mt-3 text-xs text-gray-400">
                          サイズ: 1080×1080px（Instagram正方形）
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button onClick={handleDownloadImage} className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          画像をダウンロード
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
