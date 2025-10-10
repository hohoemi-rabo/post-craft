'use client'

import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Button from '@/components/ui/button'

const GITHUB_REPO = 'https://github.com/hohoemi-rabo/post-craft'
const GITHUB_ISSUES = `${GITHUB_REPO}/issues`

export default function ContactPage() {
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
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              お問い合わせ
            </h1>
            <p className="mt-4 text-base text-gray-300 sm:text-lg">
              ご意見・ご要望・バグ報告などお気軽にお寄せください
            </p>
          </div>

          {/* メインコンテンツ */}
          <div className="space-y-6">
            {/* GitHub Issuesについて */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
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
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    GitHub Issuesで受け付けています
                  </h2>
                  <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                    当サービスでは、GitHub Issuesを通じてフィードバックを受け付けています。
                    バグ報告、機能リクエスト、使い方の質問など、お気軽にお寄せください。
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href={GITHUB_ISSUES}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full sm:w-auto"
                >
                  <Button className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mr-2"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub Issuesを開く
                  </Button>
                </a>
              </div>
            </div>

            {/* 利用方法 */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-white">利用方法</h3>
              <ol className="mt-4 space-y-4 text-sm text-gray-300">
                <li className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-white">GitHub Issuesページを開く</p>
                    <p className="mt-1 text-gray-400">
                      上のボタンから GitHub Issuesページに移動します
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-white">既存のIssueを確認（任意）</p>
                    <p className="mt-1 text-gray-400">
                      同じ内容のIssueがないか検索してみてください
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-white">「New issue」をクリック</p>
                    <p className="mt-1 text-gray-400">
                      新しいIssueを作成します（GitHubアカウントが必要です）
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-green-400 text-xs font-bold text-white">
                    4
                  </span>
                  <div>
                    <p className="font-medium text-white">内容を記入して送信</p>
                    <p className="mt-1 text-gray-400">
                      タイトルと詳細を記入し、「Submit new issue」をクリック
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* お問い合わせ種類 */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-white">お問い合わせ種類</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🐛</span>
                    <h4 className="font-semibold text-white">バグ報告</h4>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    動作の不具合やエラーを報告
                  </p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">✨</span>
                    <h4 className="font-semibold text-white">機能リクエスト</h4>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    追加してほしい機能の提案
                  </p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">❓</span>
                    <h4 className="font-semibold text-white">使い方の質問</h4>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    使い方がわからないことの質問
                  </p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">💬</span>
                    <h4 className="font-semibold text-white">その他のフィードバック</h4>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    感想やご意見など
                  </p>
                </div>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md p-6 shadow-lg">
              <div className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 flex-shrink-0 text-yellow-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-300">注意事項</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-300">
                    <li>• GitHub Issuesは公開されます。個人情報は記入しないでください</li>
                    <li>• GitHubアカウント（無料）が必要です</li>
                    <li>• 回答までにお時間をいただく場合があります</li>
                    <li>• すべてのリクエストに対応できるとは限りません</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
