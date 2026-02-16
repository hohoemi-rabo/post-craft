'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { SystemPromptEditor } from '@/components/settings/system-prompt-editor'
import { HashtagSettings } from '@/components/settings/hashtag-settings'
import type { ProfileDB } from '@/types/profile'
import type { PostTypeDB } from '@/types/post-type'

const ICON_OPTIONS = ['📋', '💼', '👴', '👩', '🏫', '🎯', '💡', '🌟', '📱', '🖥️']

type Tab = 'basic' | 'system-prompt' | 'hashtags' | 'post-types'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'basic', label: '基本情報', icon: '📝' },
  { id: 'system-prompt', label: 'プロンプト', icon: '📋' },
  { id: 'post-types', label: '投稿タイプ', icon: '📄' },
  { id: 'hashtags', label: 'ハッシュタグ', icon: '#️⃣' },
]

interface ProfileDetailClientProps {
  profile: ProfileDB
}

export function ProfileDetailClient({ profile: initialProfile }: ProfileDetailClientProps) {
  const router = useRouter()
  const { showToast } = useToast()

  const [profile, setProfile] = useState(initialProfile)
  const [activeTab, setActiveTab] = useState<Tab>('basic')

  // Basic info edit state
  const [name, setName] = useState(initialProfile.name)
  const [icon, setIcon] = useState(initialProfile.icon)
  const [description, setDescription] = useState(initialProfile.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Post types for this profile
  const [postTypes, setPostTypes] = useState<PostTypeDB[]>([])
  const [isLoadingPostTypes, setIsLoadingPostTypes] = useState(false)
  const [postTypesLoaded, setPostTypesLoaded] = useState(false)

  const deletedRef = useRef(false)

  const fetchPostTypes = useCallback(async () => {
    setIsLoadingPostTypes(true)
    try {
      const res = await fetch(`/api/post-types?profileId=${initialProfile.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPostTypes(data.postTypes)
      setPostTypesLoaded(true)
    } catch {
      // Silently fail
    } finally {
      setIsLoadingPostTypes(false)
    }
  }, [initialProfile.id])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'post-types' && !postTypesLoaded) {
      fetchPostTypes()
    }
  }

  const handleSaveBasic = async () => {
    if (!name.trim()) {
      showToast('プロフィール名を入力してください', 'error')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/profiles/${initialProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon,
          description: description.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated = await res.json()
      setProfile(updated)
      showToast('保存しました', 'success')
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このプロフィールを削除しますか？関連する投稿タイプも全て削除されます。')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/profiles/${initialProfile.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }
      deletedRef.current = true
      showToast('プロフィールを削除しました', 'success')
      router.push('/settings/profiles')
    } catch (err) {
      const message = err instanceof Error ? err.message : '削除に失敗しました'
      showToast(message, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/settings" className="hover:text-white transition-colors">⚙️ 設定</Link>
          <span>/</span>
          <Link href="/settings/profiles" className="hover:text-white transition-colors">👥 プロフィール</Link>
          <span>/</span>
          <span className="text-white">{profile.icon} {profile.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {profile.icon} {profile.name}
          </h1>
          {profile.isDefault && (
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full">
              デフォルト
            </span>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* Icon */}
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
            <h2 className="text-lg font-bold text-white">プロフィール名</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* Save / Delete */}
          <div className="flex justify-between">
            {!profile.isDefault && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-600/10 border border-red-600/30 text-red-400 hover:bg-red-600/20 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : 'プロフィールを削除'}
              </button>
            )}
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleSaveBasic}
                disabled={isSaving || !name.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system-prompt' && (
        <SystemPromptEditor profileId={initialProfile.id} />
      )}

      {activeTab === 'hashtags' && (
        <HashtagSettings profileId={initialProfile.id} />
      )}

      {activeTab === 'post-types' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400">このプロフィールに紐づく投稿タイプ</p>
            <Link
              href={`/settings/post-types/new?profileId=${initialProfile.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              + 投稿タイプ追加
            </Link>
          </div>

          {isLoadingPostTypes ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : postTypes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
              投稿タイプがありません
            </div>
          ) : (
            <div className="space-y-3">
              {postTypes.map((pt) => (
                <Link
                  key={pt.id}
                  href={`/settings/post-types/${pt.id}`}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{pt.icon}</span>
                    <div>
                      <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{pt.name}</p>
                      {pt.description && (
                        <p className="text-xs text-slate-500">{pt.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!pt.isActive && (
                      <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">無効</span>
                    )}
                    <span className="text-slate-400 group-hover:text-white transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
