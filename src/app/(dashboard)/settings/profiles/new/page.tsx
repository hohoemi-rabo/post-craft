import Link from 'next/link'
import { ProfileNewForm } from '@/components/settings/profile-new-form'

export default function NewProfilePage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
          <span>/</span>
          <Link href="/settings/profiles" className="hover:text-white transition-colors">👥 プロフィール</Link>
          <span>/</span>
          <span className="text-white">新規作成</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">プロフィール新規作成</h1>
        <p className="text-slate-400">ターゲット別のプロフィールを作成します</p>
      </div>

      <ProfileNewForm />
    </div>
  )
}
