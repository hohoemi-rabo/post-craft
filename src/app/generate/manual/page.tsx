'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Button from '@/components/ui/button'
import Textarea from '@/components/ui/textarea'
import { canGenerate } from '@/lib/rate-limiter'
import { ERROR_MESSAGES } from '@/lib/error-messages'

const MAX_CHARS = 10000

export default function ManualInputPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 回数制限チェック
    if (!canGenerate()) {
      setError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED)
      return
    }

    if (!content.trim()) {
      setError(ERROR_MESSAGES.CONTENT_REQUIRED)
      return
    }

    if (content.length < 100) {
      setError(ERROR_MESSAGES.CONTENT_TOO_SHORT)
      return
    }

    setIsLoading(true)

    try {
      // contentの最初の部分をタイトルとして使用（最初の50文字、または最初の行）
      const firstLine = content.split('\n')[0]
      const generatedTitle = firstLine.length > 50
        ? firstLine.substring(0, 50) + '...'
        : firstLine

      // sessionStorageに保存してからリダイレクト（URLパラメータだと長すぎて431エラーになる）
      sessionStorage.setItem(
        'extractedContent',
        JSON.stringify({
          title: generatedTitle,
          content: content.substring(0, MAX_CHARS),
          source: 'manual',
        })
      )
      router.push('/generate/result')
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

        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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

          {/* タイトル */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              記事を直接入力
            </h1>
            <p className="mt-2 text-sm text-gray-300 sm:text-base">
              ブログ記事の本文を貼り付けてください（最大10,000文字）
            </p>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit}>
            <div className="relative group">
              {/* 外側のグラデーションボーダー */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-3xl opacity-75 group-hover:opacity-100 blur transition duration-300"></div>

              {/* フォームコンテンツ */}
              <div className="relative rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-2xl space-y-6">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="記事本文を貼り付けてください...

例：
この記事では、Next.js 15の新機能について解説します。
App Routerの改善により、パフォーマンスが大幅に向上しました。
..."
                  maxLength={MAX_CHARS}
                  showCount
                  error={error}
                  disabled={isLoading}
                  className="min-h-[400px] bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                />

                <div className="flex flex-col-reverse justify-end space-y-3 space-y-reverse sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={!content.trim() || content.length < 100}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    生成する
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* ヒント */}
          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-lg">
            <h3 className="font-semibold text-white">💡 ヒント</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-300">
              <li>• 記事の本文のみを貼り付けてください（タイトルやメタ情報は除く）</li>
              <li>• 最低100文字以上の本文が必要です</li>
              <li>• より長い本文の方が、質の高いキャプションが生成されます</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
