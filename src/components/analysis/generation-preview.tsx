'use client'

import { useState } from 'react'
import { ProfilePreview } from './profile-preview'
import { PostTypePreviewCard } from './posttype-preview-card'
import Button from '@/components/ui/button'
import type { GeneratedProfile, GeneratedPostType } from '@/types/analysis'

interface GenerationPreviewProps {
  analysisId: string
  existingConfig: {
    id: string
    generation_config: {
      profile: GeneratedProfile
      postTypes: GeneratedPostType[]
    } | null
    status: string
  } | null
  sourceDisplayName: string
}

export function GenerationPreview({
  analysisId,
  existingConfig,
  sourceDisplayName,
}: GenerationPreviewProps) {
  const [profile, setProfile] = useState<GeneratedProfile | null>(
    existingConfig?.generation_config?.profile || null
  )
  const [postTypes, setPostTypes] = useState<GeneratedPostType[]>(
    existingConfig?.generation_config?.postTypes || []
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch(`/api/analysis/${analysisId}/generate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '生成に失敗しました')
      }

      const data = await res.json()
      setProfile(data.profile)
      setPostTypes(data.postTypes)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // ローディング中
  if (isGenerating) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4" />
        <p className="text-white font-semibold mb-2">
          プロフィールと投稿タイプを生成中...
        </p>
        <p className="text-sm text-white/60">
          分析結果を元にAIが最適なテンプレートを作成しています
        </p>
        <p className="text-xs text-white/40 mt-2">
          通常 10〜20 秒で完了します
        </p>
      </div>
    )
  }

  // 未生成
  if (!profile || !postTypes.length) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🤖</p>
        <p className="text-white/60 mb-6">
          「{sourceDisplayName}」の分析結果からプロフィールと投稿タイプを自動生成します
        </p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <Button variant="primary" onClick={handleGenerate}>
          生成を開始
        </Button>
      </div>
    )
  }

  // 生成済み: プレビュー表示
  return (
    <div className="space-y-8">
      {/* プロフィールプレビュー */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          プロフィール
        </h2>
        <ProfilePreview profile={profile} />
      </section>

      {/* 投稿タイププレビュー */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          投稿タイプ（{postTypes.length}種）
        </h2>
        <div className="space-y-4">
          {postTypes.map((postType) => (
            <PostTypePreviewCard key={postType.slug} postType={postType} />
          ))}
        </div>
      </section>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
        <Button variant="primary" disabled>
          承認して適用
        </Button>
        <Button variant="secondary" disabled>
          編集してから適用
        </Button>
        <Button
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/5"
          onClick={() => window.history.back()}
        >
          分析結果に戻る
        </Button>
      </div>

      {/* 再生成リンク */}
      <div className="text-center pt-4">
        <button
          onClick={handleGenerate}
          className="text-sm text-white/40 hover:text-white/70 transition-colors min-h-[44px]"
        >
          結果に満足できない場合は再生成
        </button>
      </div>
    </div>
  )
}
