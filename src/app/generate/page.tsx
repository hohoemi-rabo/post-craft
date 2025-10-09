'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Spinner from '@/components/ui/spinner'
import Button from '@/components/ui/button'

export default function GeneratePage() {
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

      <main className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-4 text-center">
          {status === 'loading' && (
            <div>
              <Spinner size="lg" />
              <p className="mt-6 text-lg font-medium text-text-primary">
                記事を解析しています...
              </p>
              {url && (
                <p className="mt-2 break-all text-sm text-text-secondary">
                  {url}
                </p>
              )}
              <p className="mt-4 text-xs text-text-secondary">
                この処理には最大30秒かかる場合があります
              </p>
            </div>
          )}

          {status === 'error' && (
            <div>
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

              <h2 className="mt-6 text-xl font-semibold text-text-primary">
                エラーが発生しました
              </h2>
              <p className="mt-2 text-sm text-text-secondary">{error}</p>

              <div className="mt-8 space-y-3">
                {retryCount < 3 && (
                  <Button onClick={handleRetry} className="w-full">
                    もう一度試す ({retryCount}/3)
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleManualInput}
                  className="w-full"
                >
                  記事を直接入力する
                </Button>

                <Link
                  href="/"
                  className="block text-sm text-text-secondary hover:text-text-primary hover:underline"
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
