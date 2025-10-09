'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { getUrlValidationError } from '@/lib/validation'

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    const validationError = getUrlValidationError(url)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      // TODO: 実際の生成処理は後で実装
      // 今はURLをクエリパラメータとして渡すだけ
      router.push(`/generate?url=${encodeURIComponent(url)}`)
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください。')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ヒーローセクション */}
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            {/* タイトル */}
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              ブログ記事から
              <span className="block text-primary">Instagram投稿素材を自動生成</span>
            </h1>

            {/* サブタイトル */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
              記事URLを入力するだけで、AIが自動的にキャプション・ハッシュタグ・画像を生成します
            </p>

            {/* URL入力フォーム */}
            <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-xl">
              <div className="space-y-4">
                <Input
                  type="url"
                  placeholder="https://example.com/blog/your-article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  error={error}
                  disabled={isLoading}
                  className="text-base"
                />

                <Button
                  type="submit"
                  size="lg"
                  loading={isLoading}
                  className="w-full"
                >
                  生成する
                </Button>
              </div>
            </form>

            {/* 直接入力リンク */}
            <div className="mt-6">
              <Link
                href="/generate/manual"
                className="text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
              >
                または記事を直接入力
              </Link>
            </div>
          </div>

          {/* 特徴セクション */}
          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                AIキャプション生成
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                記事の内容を要約し、Instagram向けのキャプションを自動生成
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                最適なハッシュタグ
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                記事に関連する日本語ハッシュタグを10個自動選定
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                投稿用画像生成
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                1080×1080pxのInstagram投稿用画像を自動作成
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
