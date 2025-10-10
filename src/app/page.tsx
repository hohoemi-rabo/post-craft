'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { getUrlValidationError } from '@/lib/validation'
import { canGenerate } from '@/lib/rate-limiter'

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 回数制限チェック
    if (!canGenerate()) {
      setError('本日の生成回数を使い切りました。明日また5回ご利用いただけます。')
      return
    }

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

      <main className="relative flex-1 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* グラデーションアクセント */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-orange-500/20" />
        {/* パターン背景 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHptLTEzLjI0NCAwYzAtNC42OTQgMy44MDYtOC41IDguNS04LjVzOC41IDMuODA2IDguNSA4LjUtMy44MDYgOC41LTguNSA4LjUtOC41LTMuODA2LTguNS04LjV6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />

        {/* ヒーローセクション */}
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            {/* タイトル */}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              <span className="text-white drop-shadow-lg">ブログ記事から</span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent block mt-2 text-3xl sm:text-4xl md:text-5xl leading-normal pb-2">
                Instagram投稿素材を自動生成
              </span>
            </h1>

            {/* サブタイトル */}
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300">
              記事URLを入力するだけで、AIが自動的にキャプション・ハッシュタグ・画像を生成します
            </p>

            {/* URL入力フォーム - グラスモーフィズム */}
            <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-xl">
              <div className="relative group">
                {/* 外側のグラデーションボーダー */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-3xl opacity-75 group-hover:opacity-100 blur transition duration-300"></div>

                {/* フォームコンテンツ */}
                <div className="relative rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-2xl space-y-4">
                <div className="relative">
                  {/* グラデーションボーダー */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl opacity-75 blur-sm"></div>
                  <Input
                    type="url"
                    placeholder="https://example.com/blog/your-article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    error={error}
                    disabled={isLoading}
                    className="relative text-base bg-white border-2 border-transparent focus-visible:ring-2 focus-visible:ring-purple-400 rounded-xl shadow-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  生成する
                </Button>

                {/* 直接入力リンク */}
                <div className="pt-2">
                  <Link
                    href="/generate/manual"
                    className="inline-block min-h-[44px] py-2 text-sm text-gray-600 underline-offset-4 hover:text-gray-800 hover:underline transition-colors"
                  >
                    または記事を直接入力
                  </Link>
                </div>
                </div>
              </div>
            </form>
          </div>

          {/* 特徴セクション */}
          <div className="mt-16 grid gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group text-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
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
                  className="text-white"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">
                AIキャプション生成
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                記事の内容を要約し、Instagram向けのキャプションを自動生成
              </p>
            </div>

            <div className="group text-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
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
                  className="text-white"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">
                最適なハッシュタグ
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                記事に関連する日本語ハッシュタグを10個自動選定
              </p>
            </div>

            <div className="group text-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
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
                  className="text-white"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">
                投稿用画像生成
              </h3>
              <p className="mt-2 text-sm text-gray-300">
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
