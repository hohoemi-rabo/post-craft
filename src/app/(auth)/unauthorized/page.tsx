'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function UnauthorizedPage() {
  const handleTryAnotherAccount = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-white mb-3">アクセスが拒否されました</h1>
          <p className="text-slate-400 mb-8">
            このアカウントはPost Craftへのアクセスが許可されていません。
            <br />
            アクセス権限が必要な場合は管理者にお問い合わせください。
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleTryAnotherAccount}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              別のアカウントでログイン
            </button>
            <Link
              href="/contact"
              className="block w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10 text-center"
            >
              お問い合わせ
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
