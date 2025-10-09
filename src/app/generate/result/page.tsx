'use client'

import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

export default function ResultPage() {
  const searchParams = useSearchParams()
  const title = searchParams.get('title')
  const content = searchParams.get('content')
  const source = searchParams.get('source')

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-white p-8">
            <h1 className="text-2xl font-bold text-text-primary">
              記事抽出完了
            </h1>

            <div className="mt-6 space-y-4">
              <div>
                <h2 className="text-sm font-medium text-text-secondary">ソース</h2>
                <p className="mt-1 text-text-primary">
                  {source === 'manual' ? '直接入力' : 'URL'}
                </p>
              </div>

              {title && (
                <div>
                  <h2 className="text-sm font-medium text-text-secondary">タイトル</h2>
                  <p className="mt-1 text-text-primary">{title}</p>
                </div>
              )}

              <div>
                <h2 className="text-sm font-medium text-text-secondary">本文</h2>
                <p className="mt-1 line-clamp-6 text-text-primary">
                  {content?.substring(0, 500)}...
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  文字数: {content?.length || 0}文字
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  ✨ 次のチケット（05-openai-integration）で、ここからOpenAI APIを呼び出して
                  キャプション・ハッシュタグを生成します
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
