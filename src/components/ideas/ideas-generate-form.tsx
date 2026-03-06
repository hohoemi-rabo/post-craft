'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface Profile {
  id: string
  name: string
  icon: string
}

export function IdeasGenerateForm() {
  const router = useRouter()
  const { showToast } = useToast()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [aiInstructions, setAiInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch('/api/profiles')
        if (res.ok) {
          const data = await res.json()
          const profileList = (data.profiles || []).map(
            (p: { id: string; name: string; icon: string }) => ({
              id: p.id,
              name: p.name,
              icon: p.icon,
            })
          )
          setProfiles(profileList)
          if (profileList.length > 0) {
            setSelectedProfileId(profileList[0].id)
          }
        }
      } catch {
        showToast('プロフィールの取得に失敗しました', 'error')
      } finally {
        setIsLoadingProfiles(false)
      }
    }
    fetchProfiles()
  }, [showToast])

  const handleGenerate = async () => {
    if (!selectedProfileId) return

    setIsGenerating(true)
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId,
          aiInstructions: aiInstructions.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate ideas')
      }

      showToast('アイデアを5件生成しました', 'success')
      router.push(`/ideas?profileId=${selectedProfileId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成に失敗しました'
      showToast(message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile selection */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">プロフィール選択</h2>
        <p className="text-sm text-slate-400">
          どのプロフィールの投稿アイデアを生成しますか？
        </p>
        {isLoadingProfiles ? (
          <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => {
              const isSelected = selectedProfileId === profile.id
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  disabled={isGenerating}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600/20 text-white ring-1 ring-blue-500/30'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  } disabled:opacity-50`}
                >
                  {isSelected && <span className="mr-1.5">&#10003;</span>}
                  {profile.icon} {profile.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* AI instructions */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">AIへの追加指示（任意）</h2>
        <p className="text-sm text-slate-400">
          生成するアイデアに対して追加の要望があれば入力してください。
        </p>
        <textarea
          value={aiInstructions}
          onChange={(e) => setAiInstructions(e.target.value)}
          placeholder="例: 季節やトレンドを意識してほしい、初心者向けのネタを多めに"
          rows={3}
          disabled={isGenerating}
          className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:opacity-50"
        />
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !selectedProfileId}
        className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            アイデアを生成中...（30秒ほどかかります）
          </>
        ) : (
          '投稿アイデアを生成（5件）'
        )}
      </button>

      {/* Back link */}
      <div className="text-center">
        <button
          onClick={() => router.push('/ideas')}
          disabled={isGenerating}
          className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          アイデア一覧に戻る
        </button>
      </div>
    </div>
  )
}
