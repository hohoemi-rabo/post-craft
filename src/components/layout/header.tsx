import Link from 'next/link'
import UsageIndicator from '@/components/usage-indicator'

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur-md relative">
      {/* グラデーションアクセント */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/5 to-orange-500/10" />

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </div>
          <span className="hidden text-lg font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent sm:inline">
            Instagram Post Generator
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          <UsageIndicator />
        </div>
      </div>
    </header>
  )
}
