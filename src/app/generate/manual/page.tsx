'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Button from '@/components/ui/button'
import Textarea from '@/components/ui/textarea'
import { canGenerate } from '@/lib/rate-limiter'

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
      setError('本日の生成回数を使い切りました。明日また5回ご利用いただけます。')
      return
    }

    if (!content.trim()) {
      setError('記事本文を入力してください')
      return
    }

    if (content.length < 100) {
      setError('記事本文が短すぎます（最低100文字必要です）')
      return
    }

    setIsLoading(true)

    try {
      // sessionStorageに保存してからリダイレクト（URLパラメータだと長すぎて431エラーになる）
      sessionStorage.setItem(
        'extractedContent',
        JSON.stringify({
          title: '',
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

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 戻るリンク */}
          <Link
            href="/"
            className="mb-6 inline-flex min-h-[44px] items-center py-2 text-sm text-text-secondary hover:text-text-primary"
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
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
              記事を直接入力
            </h1>
            <p className="mt-2 text-sm text-text-secondary sm:text-base">
              ブログ記事の本文を貼り付けてください（最大10,000文字）
            </p>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
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
                className="min-h-[400px]"
              />

              <div className="flex flex-col-reverse justify-end space-y-3 space-y-reverse sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={!content.trim() || content.length < 100}
                  className="w-full sm:w-auto"
                >
                  生成する
                </Button>
              </div>
            </div>
          </form>

          {/* ヒント */}
          <div className="mt-8 rounded-lg border border-border bg-white p-4">
            <h3 className="font-semibold text-text-primary">💡 ヒント</h3>
            <ul className="mt-2 space-y-1 text-sm text-text-secondary">
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
