'use client'

import { useState, useEffect } from 'react'

interface StepCatchphraseProps {
  caption: string
  onSubmit: (catchphrase: string) => void
  onBack: () => void
  isGenerating?: boolean
}

export function StepCatchphrase({
  caption,
  onSubmit,
  onBack,
  isGenerating = false,
}: StepCatchphraseProps) {
  const [catchphrase, setCatchphrase] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const generateCatchphrase = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await fetch('/api/generate/catchphrase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption }),
        })

        if (response.ok) {
          const data = await response.json()
          setCatchphrase(data.catchphrase)
        } else {
          setError('キャッチコピーの生成に失敗しました')
        }
      } catch {
        setError('キャッチコピーの生成に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    generateCatchphrase()
  }, [caption])

  const handleRegenerate = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/generate/catchphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      })

      if (response.ok) {
        const data = await response.json()
        setCatchphrase(data.catchphrase)
      } else {
        setError('キャッチコピーの生成に失敗しました')
      }
    } catch {
      setError('キャッチコピーの生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if (catchphrase.trim()) {
      onSubmit(catchphrase.trim())
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">キャッチコピーを確認</h2>
        <p className="text-slate-400 text-sm">
          画像に表示される文字を確認・編集してください
        </p>
      </div>

      {/* Catchphrase input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">
            キャッチコピー
          </label>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? '生成中...' : '🔄 再生成'}
          </button>
        </div>

        {isLoading ? (
          <div className="h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm">キャッチコピーを生成中...</span>
            </div>
          </div>
        ) : (
          <textarea
            value={catchphrase}
            onChange={(e) => setCatchphrase(e.target.value)}
            rows={3}
            maxLength={30}
            placeholder="キャッチコピーを入力..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <p className="text-xs text-slate-500">
          {catchphrase.length}/30文字 - 短くインパクトのある表現がおすすめです
        </p>
      </div>

      {/* Preview hint */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">ヒント</p>
            <ul className="text-blue-300/80 space-y-1">
              <li>・10〜20文字程度が見やすい</li>
              <li>・疑問形や「〜できる！」などが効果的</li>
              <li>・内容を編集して好みに調整できます</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isGenerating}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !catchphrase.trim() || isGenerating}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : '生成する →'}
        </button>
      </div>
    </div>
  )
}
