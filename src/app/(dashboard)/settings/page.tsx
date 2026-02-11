'use client'

import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">設定</h1>
        <p className="text-slate-400">アカウント情報の確認</p>
      </div>

      {/* Settings Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/settings/profiles"
          className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">👥</span>
            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">プロフィール管理</h2>
              <p className="text-sm text-slate-400">ターゲット別のプロンプト・ハッシュタグ・投稿タイプを管理</p>
            </div>
          </div>
        </Link>
        <Link
          href="/settings/post-types"
          className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">📝</span>
            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">投稿タイプ管理</h2>
              <p className="text-sm text-slate-400">投稿テンプレートの追加・編集・並び替え</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Account Info */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-6">アカウント情報</h2>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {session?.user?.name?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">名前</label>
              <p className="text-white font-medium">{session?.user?.name || '未設定'}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">メールアドレス</label>
              <p className="text-white font-medium">{session?.user?.email || '未設定'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-4">ログアウト</h2>
        <p className="text-slate-400 mb-4">
          ログアウトすると、再度Googleアカウントでログインが必要になります。
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
        >
          ログアウト
        </button>
      </div>

      {/* App Info */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-4">アプリ情報</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">バージョン</dt>
            <dd className="text-white">4.0.0 (Phase 4)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">フレームワーク</dt>
            <dd className="text-white">Next.js 15</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
