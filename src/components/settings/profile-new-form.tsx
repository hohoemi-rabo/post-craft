'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProfiles } from '@/hooks/useProfiles'
import { useToast } from '@/components/ui/toast'

const ICON_OPTIONS = ['📋', '💼', '👴', '👩', '🏫', '🎯', '💡', '🌟', '📱', '🖥️']

export function ProfileNewForm() {
  const router = useRouter()
  const { createProfile } = useProfiles()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📋')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('プロフィール名を入力してください', 'error')
      return
    }

    setIsSaving(true)
    try {
      const created = await createProfile({
        name: name.trim(),
        icon,
        description: description.trim() || undefined,
      })
      showToast('プロフィールを作成しました', 'success')
      router.push(`/settings/profiles/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : '作成に失敗しました'
      showToast(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Icon selection */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">アイコン</h2>
        <div className="flex flex-wrap gap-3">
          {ICON_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-12 h-12 text-2xl rounded-xl border-2 transition-all ${
                icon === emoji
                  ? 'border-blue-500 bg-blue-600/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">プロフィール名 <span className="text-red-400">*</span></h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: パソコン教室シニア向け"
          maxLength={50}
          className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">説明</h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: シニア層向けの分かりやすいパソコン活用情報"
          rows={3}
          maxLength={200}
          className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <Link
          href="/settings/profiles"
          className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? '作成中...' : '作成'}
        </button>
      </div>
    </form>
  )
}
