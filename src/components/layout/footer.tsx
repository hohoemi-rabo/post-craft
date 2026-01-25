import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gray-900/80 backdrop-blur-md relative">
      {/* グラデーションアクセント */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/5 to-orange-500/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center text-sm text-gray-400 sm:text-left">
            <p>&copy; 2025 Post Craft. All rights reserved.</p>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href="/contact"
              className="min-h-[44px] py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              お問い合わせ
            </Link>
            <Link
              href="/privacy"
              className="min-h-[44px] py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              プライバシーポリシー
            </Link>

            {/* 外部リンク */}
            <div className="flex items-center space-x-4">
              {/* ホームページ */}
              <a
                href="https://www.hohoemi-rabo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-white group"
                aria-label="ホームページ"
                title="ホームページ"
              >
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
                  className="group-hover:scale-110 transition-transform duration-300"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>

              {/* ポートフォリオ */}
              <a
                href="https://www.masayuki-kiwami.com/works"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-white group"
                aria-label="ポートフォリオ"
                title="ポートフォリオ"
              >
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
                  className="group-hover:scale-110 transition-transform duration-300"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/hohoemi.rabo/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-white group"
                aria-label="Instagram"
                title="Instagram"
              >
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
                  className="group-hover:scale-110 transition-transform duration-300"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
