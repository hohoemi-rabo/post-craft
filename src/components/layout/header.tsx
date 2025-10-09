import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
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
          <span className="text-lg font-semibold text-text-primary">
            Instagram Post Generator
          </span>
        </Link>

        <nav className="hidden items-center space-x-6 sm:flex">
          <Link
            href="/"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            ホーム
          </Link>
        </nav>
      </div>
    </header>
  )
}
