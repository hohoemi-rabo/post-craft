'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

export default function Home() {
  const { data: session } = useSession()

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
              <span className="text-white drop-shadow-lg">メモ書きから</span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent block mt-2 text-3xl sm:text-4xl md:text-5xl leading-normal pb-2">
                Instagram投稿素材を自動生成
              </span>
            </h1>

            {/* サブタイトル */}
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 sm:text-lg">
              AIが投稿文・ハッシュタグ・画像をまとめて作成。
              <br className="hidden sm:inline" />
              4つの投稿タイプから選んで、あなたのInstagramをもっと魅力的に。
            </p>

            {/* CTAボタン */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  ダッシュボードへ
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  無料で始める
                </Link>
              )}
            </div>
          </div>

          {/* 投稿タイプセクション */}
          <div className="mt-20">
            <h2 className="text-center text-xl font-bold text-white mb-8">
              4つの投稿タイプ
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20">
                <div className="text-4xl mb-3">🔧</div>
                <h3 className="text-lg font-semibold text-white">解決タイプ</h3>
                <p className="mt-2 text-sm text-gray-300">
                  質問→解決方法を紹介
                </p>
              </div>
              <div className="text-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20">
                <div className="text-4xl mb-3">📢</div>
                <h3 className="text-lg font-semibold text-white">宣伝タイプ</h3>
                <p className="mt-2 text-sm text-gray-300">
                  サービス・商品の告知
                </p>
              </div>
              <div className="text-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20">
                <div className="text-4xl mb-3">💡</div>
                <h3 className="text-lg font-semibold text-white">Tipsタイプ</h3>
                <p className="mt-2 text-sm text-gray-300">
                  便利な使い方を紹介
                </p>
              </div>
              <div className="text-center rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-lg font-semibold text-white">実績タイプ</h3>
                <p className="mt-2 text-sm text-gray-300">
                  制作事例・成果を紹介
                </p>
              </div>
            </div>
          </div>

          {/* 特徴セクション */}
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                AI投稿文生成
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                メモ書きから魅力的な投稿文を自動生成。テンプレートに沿った構成で統一感のある投稿に。
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">
                AI画像生成
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                マンガ風・ピクセルアートなど4つのスタイルから選択。オリジナルキャラクターも使えます。
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
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">
                ハッシュタグ自動生成
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                投稿内容に最適なハッシュタグを10個自動選定。編集・追加も自由自在。
              </p>
            </div>
          </div>

          {/* 使い方セクション */}
          <div className="mt-20">
            <h2 className="text-center text-xl font-bold text-white mb-8">
              かんたん5ステップ
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold">1</div>
                <p className="mt-2 text-sm text-gray-300">タイプ選択</p>
              </div>
              <div className="text-gray-500 hidden sm:block">→</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 font-bold">2</div>
                <p className="mt-2 text-sm text-gray-300">内容入力</p>
              </div>
              <div className="text-gray-500 hidden sm:block">→</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 font-bold">3</div>
                <p className="mt-2 text-sm text-gray-300">画像設定</p>
              </div>
              <div className="text-gray-500 hidden sm:block">→</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 font-bold">4</div>
                <p className="mt-2 text-sm text-gray-300">AI生成</p>
              </div>
              <div className="text-gray-500 hidden sm:block">→</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400 font-bold">5</div>
                <p className="mt-2 text-sm text-gray-300">完成！</p>
              </div>
            </div>
          </div>

          {/* 最終CTA */}
          <div className="mt-20 text-center">
            <div className="inline-block rounded-2xl bg-white/10 backdrop-blur-md p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                今すぐ始めよう
              </h2>
              <p className="text-gray-300 mb-6">
                Googleアカウントでログインするだけ
              </p>
              {session ? (
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  投稿を作成する
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  無料で始める
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
