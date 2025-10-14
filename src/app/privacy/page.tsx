import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

export const metadata = {
  title: 'プライバシーポリシー | Instagram Post Generator',
  description: 'Instagram Post Generatorのプライバシーポリシー',
}

export default function PrivacyPage() {
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

          {/* コンテンツ */}
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-white mb-8">プライバシーポリシー</h1>

            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">1. 収集する情報</h2>
                <p className="text-sm leading-relaxed">
                  本サービス（Instagram Post Generator）では、サービスの改善と利用状況の把握のために、以下の情報を収集します：
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2 text-sm">
                  <li>ページビュー、クリック、利用機能などの行動データ</li>
                  <li>ブラウザの種類、OS、デバイス情報</li>
                  <li>IPアドレス（匿名化された形式）</li>
                  <li>Cookie情報（利用制限の管理に使用）</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed">
                  なお、入力されたブログ記事のURLや本文は、AI生成のために一時的に使用されますが、当社のサーバーには保存されません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. Google Analyticsの使用</h2>
                <p className="text-sm leading-relaxed">
                  本サービスでは、Google Analytics（GA4）を使用して、サイトの利用状況を分析しています。
                  Google Analyticsは、Cookieを使用してユーザーの情報を収集します。
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  収集されたデータは匿名化され、個人を特定する情報は含まれません。
                  詳細については、Googleのプライバシーポリシーをご確認ください：
                </p>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-purple-400 hover:text-pink-400 hover:underline"
                >
                  Google プライバシーポリシー
                </a>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. Cookieの使用</h2>
                <p className="text-sm leading-relaxed">
                  本サービスでは、以下の目的でCookieを使用しています：
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2 text-sm">
                  <li>利用回数の制限管理（1日5回まで）</li>
                  <li>Google Analyticsによるアクセス解析</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed">
                  ブラウザの設定により、Cookieの受け入れを拒否することができますが、
                  その場合、一部機能が正常に動作しない可能性があります。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. 第三者サービスの利用</h2>
                <p className="text-sm leading-relaxed">
                  本サービスでは、以下の第三者サービスを利用しています：
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2 text-sm">
                  <li>
                    <strong>OpenAI API:</strong> キャプションとハッシュタグの生成に使用
                  </li>
                  <li>
                    <strong>Vercel:</strong> ホスティングサービス
                  </li>
                  <li>
                    <strong>Google Analytics:</strong> アクセス解析
                  </li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed">
                  これらのサービスには、それぞれのプライバシーポリシーが適用されます。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">5. 情報の保護</h2>
                <p className="text-sm leading-relaxed">
                  収集した情報は、適切なセキュリティ対策を講じて管理し、不正アクセス、紛失、破壊、改ざん、漏洩などから保護します。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">6. 情報の第三者への提供</h2>
                <p className="text-sm leading-relaxed">
                  収集した情報を、以下の場合を除き、第三者に提供することはありません：
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2 text-sm">
                  <li>ユーザーの同意がある場合</li>
                  <li>法令に基づく場合</li>
                  <li>人の生命、身体または財産の保護のために必要がある場合</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">7. プライバシーポリシーの変更</h2>
                <p className="text-sm leading-relaxed">
                  本プライバシーポリシーは、法令の変更や事業内容の変更に伴い、予告なく変更することがあります。
                  変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">8. お問い合わせ</h2>
                <p className="text-sm leading-relaxed">
                  本プライバシーポリシーに関するお問い合わせは、以下のページからお願いします：
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-block text-sm text-purple-400 hover:text-pink-400 hover:underline"
                >
                  お問い合わせページ
                </Link>
              </section>

              <section className="pt-6 border-t border-white/20">
                <p className="text-xs text-gray-400">最終更新日: 2025年1月</p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
