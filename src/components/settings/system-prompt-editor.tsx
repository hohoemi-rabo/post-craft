'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'

interface SystemPromptEditorProps {
  profileId?: string
}

export function SystemPromptEditor({ profileId }: SystemPromptEditorProps) {
  const { showToast } = useToast()

  const [memo, setMemo] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const url = profileId
          ? `/api/profiles/${profileId}/system-prompt`
          : '/api/settings/system-prompt'
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setMemo(data.systemPromptMemo || '')
        setSystemPrompt(data.systemPrompt || '')
      } catch {
        showToast('設定の読み込みに失敗しました', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = async () => {
    if (!memo.trim()) {
      showToast('メモ書きを入力してください', 'error')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo: memo.trim() }),
      })

      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()
      setSystemPrompt(data.systemPrompt)
      showToast('システムプロンプトを生成しました', 'success')
    } catch {
      showToast('生成に失敗しました', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!systemPrompt.trim()) {
      showToast('システムプロンプトが空です', 'error')
      return
    }

    setIsSaving(true)
    try {
      const url = profileId
        ? `/api/profiles/${profileId}/system-prompt`
        : '/api/settings/system-prompt'
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPromptMemo: memo.trim() || null,
          systemPrompt: systemPrompt.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      showToast('保存しました', 'success')
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Memo input */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">メモ書き</h2>
        <p className="text-sm text-slate-400">
          あなたのサービスや投稿の方向性を自由にメモ書きしてください。AIがシステムプロンプトを生成します。
        </p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例: パソコン教室の講師として、初心者向けにIT活用情報を発信したい。親しみやすい口調で、具体的な手順を含めたい。"
          rows={4}
          className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !memo.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              生成中...
            </>
          ) : (
            'AIで生成'
          )}
        </button>
      </div>

      {/* Section 2: Generated system prompt */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">システムプロンプト</h2>
        <p className="text-sm text-slate-400">
          生成後に手動で編集することもできます。
        </p>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="AIで生成するか、手動で入力してください"
          rows={12}
          className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm leading-relaxed"
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !systemPrompt.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
