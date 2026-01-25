'use client'

import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Button from '@/components/ui/button'

const INSTAGRAM_URL = 'https://www.instagram.com/hohoemi.rabo/'

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
            {/* Instagram DMについて */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 shadow-lg">
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
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    Instagram DMで受け付けています
                  </h2>
                  <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                    当サービスでは、Instagram DMを通じてお問い合わせを受け付けています。
                    バグ報告、機能リクエスト、使い方の質問など、お気軽にメッセージをお送りください。
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href={INSTAGRAM_URL}
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
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    Instagramを開く
                  </Button>
                </a>
              </div>
            </div>

            {/* 利用方法 */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-white">お問い合わせ方法</h3>
              <ol className="mt-4 space-y-4 text-sm text-gray-300">
                <li className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-white">Instagramを開く</p>
                    <p className="mt-1 text-gray-400">
                      上のボタンから「ほほ笑みラボ」のInstagramページに移動します
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-white">「メッセージ」をタップ</p>
                    <p className="mt-1 text-gray-400">
                      プロフィールページの「メッセージ」ボタンからDMを送信できます
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-white">内容を記入して送信</p>
                    <p className="mt-1 text-gray-400">
                      お問い合わせ内容を記入してメッセージを送信してください
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

            {/* 運営者情報 */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-white">ほほ笑みラボについて</h3>
              <p className="mt-2 text-sm text-gray-300">
                パソコン・スマホ・AI活用サポートを行っています。
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="https://www.hohoemi-rabo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  ホームページ
                </a>
                <a
                  href="https://www.masayuki-kiwami.com/works"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
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
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  ポートフォリオ
                </a>
                <a
                  href="https://www.instagram.com/hohoemi.rabo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
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
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  Instagram
                </a>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-md p-6 shadow-lg">
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
                  className="mt-0.5 flex-shrink-0 text-blue-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-300">ご案内</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-300">
                    <li>• Instagramアカウントが必要です</li>
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
