import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gray-900/80 backdrop-blur-md relative">
      {/* グラデーションアクセント */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/5 to-orange-500/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center text-sm text-gray-400 sm:text-left">
            <p>&copy; 2025 Instagram Post Generator. All rights reserved.</p>
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
            <a
              href="https://github.com/hohoemi-rabo/post-craft"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors hover:text-white group"
              aria-label="GitHub"
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
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
