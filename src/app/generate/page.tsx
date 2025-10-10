'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Spinner from '@/components/ui/spinner'
import Button from '@/components/ui/button'

function GenerateContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get('url')

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!url) {
      setStatus('error')
      setError('URLが指定されていません')
      return
    }

    extractContent()
  }, [url, retryCount])

  const extractContent = async () => {
    setStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '記事の抽出に失敗しました')
      }

      // sessionStorageに保存してからリダイレクト（URLパラメータだと長すぎて431エラーになる）
      sessionStorage.setItem(
        'extractedContent',
        JSON.stringify({
          title: data.title || '',
          content: data.content || '',
          source: 'url',
          sourceUrl: url, // 元のURLを保存
        })
      )
      router.push('/generate/result')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '記事の抽出に失敗しました')
    }
  }

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(retryCount + 1)
    }
  }

  const handleManualInput = () => {
    router.push('/generate/manual')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* グラデーションアクセント */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-orange-500/20" />
        {/* パターン背景 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHptLTEzLjI0NCAwYzAtNC42OTQgMy44MDYtOC41IDguNS04LjVzOC41IDMuODA2IDguNSA4LjUtMy44MDYgOC41LTguNSA4LjUtOC41LTMuODA2LTguNS04LjV6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />

        <div className="relative w-full max-w-md px-4 text-center">
          {status === 'loading' && (
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <Spinner size="lg" />
              <p className="mt-6 text-lg font-medium text-white">
                記事を解析しています...
              </p>
              {url && (
                <p className="mt-2 break-all text-sm text-gray-300">
                  {url}
                </p>
              )}
              <p className="mt-4 text-xs text-gray-400">
                この処理には最大30秒かかる場合があります
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-sm">
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
                  className="text-red-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <h2 className="mt-6 text-lg font-semibold text-white sm:text-xl">
                エラーが発生しました
              </h2>
              <p className="mt-2 text-sm text-gray-300">{error}</p>

              <div className="mt-8 space-y-3">
                {retryCount < 3 && (
                  <Button onClick={handleRetry} className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    もう一度試す ({retryCount}/3)
                  </Button>
                )}

                <Button
                  onClick={handleManualInput}
                  className="w-full border-2 border-white/30 bg-transparent text-white hover:border-white/50 hover:bg-white/10"
                >
                  記事を直接入力する
                </Button>

                <Link
                  href="/"
                  className="block min-h-[44px] py-2 text-sm text-gray-400 hover:text-white hover:underline transition-colors"
                >
                  トップに戻る
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* グラデーションアクセント */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-orange-500/20" />
          {/* パターン背景 */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHptLTEzLjI0NCAwYzAtNC42OTQgMy44MDYtOC41IDguNS04LjVzOC41IDMuODA2IDguNSA4LjUtMy44MDYgOC41LTguNSA4LjUtOC41LTMuODA2LTguNS04LjV6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />

          <div className="relative w-full max-w-md px-4 text-center">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <Spinner size="lg" />
              <p className="mt-6 text-lg font-medium text-white">
                読み込み中...
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  )
}
