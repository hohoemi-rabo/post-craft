'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Spinner from '@/components/ui/spinner'
import Button from '@/components/ui/button'

interface GeneratedContent {
  caption: string
  hashtags: string[]
}

export default function ResultPage() {
  const router = useRouter()

  const [title, setTitle] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [retryCount, setRetryCount] = useState(0)

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

      setGeneratedContent({
        caption: data.caption,
        hashtags: data.hashtags,
      })
      setStatus('success')
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 戻るリンク */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm text-text-secondary hover:text-text-primary"
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
            <div className="rounded-lg border border-border bg-white p-12 text-center">
              <Spinner size="lg" />
              <h2 className="mt-6 text-xl font-semibold text-text-primary">
                AIが投稿素材を生成しています...
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                この処理には最大30秒かかる場合があります
              </p>

              <div className="mt-8 rounded-lg bg-blue-50 p-4">
                <div className="text-left text-sm text-blue-900">
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
            <div className="rounded-lg border border-border bg-white p-8">
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

              <h2 className="mt-6 text-center text-xl font-semibold text-text-primary">
                生成に失敗しました
              </h2>
              <p className="mt-2 text-center text-sm text-text-secondary">{error}</p>

              <div className="mt-8 flex justify-center space-x-4">
                {retryCount < 3 && (
                  <Button onClick={handleRetry}>
                    もう一度試す ({retryCount}/3)
                  </Button>
                )}
                <Button variant="outline" onClick={() => router.back()}>
                  戻る
                </Button>
              </div>
            </div>
          )}

          {/* 生成成功 */}
          {status === 'success' && generatedContent && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-white p-8">
                <h1 className="text-2xl font-bold text-text-primary">
                  投稿素材の生成が完了しました
                </h1>

                {/* メタ情報 */}
                <div className="mt-6 space-y-4 border-b border-border pb-6">
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary">ソース</h3>
                    <p className="mt-1 text-text-primary">
                      {source === 'manual' ? '直接入力' : 'URL'}
                    </p>
                  </div>

                  {title && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary">
                        元記事タイトル
                      </h3>
                      <p className="mt-1 text-text-primary">{title}</p>
                    </div>
                  )}
                </div>

                {/* 生成されたキャプション */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-text-secondary">
                    生成されたキャプション
                  </h3>
                  <div className="mt-2 rounded-lg border border-border bg-gray-50 p-4">
                    <p className="text-text-primary">{generatedContent.caption}</p>
                    <p className="mt-2 text-xs text-text-secondary">
                      文字数: {generatedContent.caption.length}文字
                    </p>
                  </div>
                </div>

                {/* 生成されたハッシュタグ */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-text-secondary">
                    生成されたハッシュタグ
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {generatedContent.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                      >
                        #{tag.replace(/^#+/, '')}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    {generatedContent.hashtags.length}個のハッシュタグ
                  </p>
                </div>

                <div className="mt-8 rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    ✨ 次のチケット（06-caption-hashtag-generation）で、編集・コピー・画像生成機能を追加します
                  </p>
                </div>

                {/* アクション */}
                <div className="mt-8 flex space-x-4">
                  <Button onClick={() => router.push('/')}>トップに戻る</Button>
                  <Button variant="outline" onClick={handleRetry}>
                    再生成
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
