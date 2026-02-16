'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfilePreview } from './profile-preview'
import { PostTypePreviewCard } from './posttype-preview-card'
import Button from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
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
    generated_profile_id: string | null
  } | null
  sourceDisplayName: string
}

export function GenerationPreview({
  analysisId,
  existingConfig,
  sourceDisplayName,
}: GenerationPreviewProps) {
  const router = useRouter()
  const { showToast } = useToast()

  const [configId, setConfigId] = useState<string | null>(existingConfig?.id || null)
  const [profile, setProfile] = useState<GeneratedProfile | null>(
    existingConfig?.generation_config?.profile || null
  )
  const [postTypes, setPostTypes] = useState<GeneratedPostType[]>(
    existingConfig?.generation_config?.postTypes || []
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 適用フロー状態
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isApplied, setIsApplied] = useState(existingConfig?.status === 'applied')
  const [appliedResult, setAppliedResult] = useState<{
    profileId: string
    profileName: string
    postTypeCount: number
  } | null>(
    existingConfig?.status === 'applied' && existingConfig.generated_profile_id
      ? {
          profileId: existingConfig.generated_profile_id,
          profileName: existingConfig.generation_config?.profile?.name || '',
          postTypeCount: existingConfig.generation_config?.postTypes?.length || 0,
        }
      : null
  )

  // 編集モード状態
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedProfile, setEditedProfile] = useState<GeneratedProfile | null>(null)
  const [editedPostTypes, setEditedPostTypes] = useState<GeneratedPostType[]>([])

  // 生成実行
  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setIsEditMode(false)

    try {
      const res = await fetch(`/api/analysis/${analysisId}/generate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '生成に失敗しました')
      }

      const data = await res.json()
      setConfigId(data.configId)
      setProfile(data.profile)
      setPostTypes(data.postTypes)
      setIsApplied(false)
      setAppliedResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // 適用実行（編集あり/なし共通）
  async function handleApply() {
    if (!configId) return
    setIsApplying(true)

    try {
      const body: Record<string, unknown> = { configId }
      if (isEditMode && editedProfile && editedPostTypes.length) {
        body.profile = editedProfile
        body.postTypes = editedPostTypes
      }

      const res = await fetch(`/api/analysis/${analysisId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '適用に失敗しました')
      }

      const data = await res.json()

      setIsApplied(true)
      setAppliedResult({
        profileId: data.profileId,
        profileName: data.profileName,
        postTypeCount: data.postTypeCount,
      })
      setShowConfirmDialog(false)
      setIsEditMode(false)
      showToast('プロフィールと投稿タイプが作成されました', 'success')
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '適用に失敗しました',
        'error'
      )
      setShowConfirmDialog(false)
    } finally {
      setIsApplying(false)
    }
  }

  // 編集モード開始
  function handleStartEdit() {
    setIsEditMode(true)
    setEditedProfile({ ...profile! })
    setEditedPostTypes(postTypes.map((pt) => ({
      ...pt,
      placeholders: pt.placeholders.map((ph) => ({ ...ph })),
    })))
  }

  // 編集モード終了
  function handleCancelEdit() {
    setIsEditMode(false)
    setEditedProfile(null)
    setEditedPostTypes([])
  }

  // 投稿タイプ削除
  function handleDeletePostType(index: number) {
    if (editedPostTypes.length <= 3) {
      showToast('投稿タイプは最低3個必要です', 'error')
      return
    }
    setEditedPostTypes(editedPostTypes.filter((_, i) => i !== index))
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

  // 適用済み: 成功メッセージ
  if (isApplied && appliedResult) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="text-5xl">🎉</div>

        <h2 className="text-xl font-bold text-white">
          プロフィールと投稿タイプが作成されました
        </h2>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-white/80">
            <span className="text-lg mr-2">{profile?.icon}</span>
            <span className="font-semibold text-white">{appliedResult.profileName}</span>
            <span className="text-white/60"> と </span>
            <span className="font-semibold text-white">{appliedResult.postTypeCount}種類</span>
            <span className="text-white/60"> の投稿タイプ</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            variant="primary"
            onClick={() => router.push(`/create?profileId=${appliedResult.profileId}`)}
          >
            さっそく投稿を作成する
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/settings/profiles/${appliedResult.profileId}`)}
          >
            プロフィール設定を確認
          </Button>
          <Button
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/5"
            onClick={() => router.push('/analysis')}
          >
            分析一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  // 表示用データ（編集モード時は edited を使用）
  const displayProfile = isEditMode ? editedProfile! : profile
  const displayPostTypes = isEditMode ? editedPostTypes : postTypes

  // 生成済み: プレビュー表示
  return (
    <div className="space-y-8">
      {/* 編集モードバナー */}
      {isEditMode && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-300">
            編集モード — 各フィールドを直接編集できます。完了したら下部の「編集を適用する」をクリックしてください。
          </p>
        </div>
      )}

      {/* プロフィールプレビュー */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          プロフィール
        </h2>
        <ProfilePreview
          profile={displayProfile}
          isEditMode={isEditMode}
          onUpdate={isEditMode ? (updated: GeneratedProfile) => setEditedProfile(updated) : undefined}
        />
      </section>

      {/* 投稿タイププレビュー */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          投稿タイプ（{displayPostTypes.length}種）
        </h2>
        <div className="space-y-4">
          {displayPostTypes.map((postType, index) => (
            <PostTypePreviewCard
              key={postType.slug + (isEditMode ? '-edit' : '')}
              postType={postType}
              isEditMode={isEditMode}
              onUpdate={isEditMode ? (updated: GeneratedPostType) => {
                const newPostTypes = [...editedPostTypes]
                newPostTypes[index] = updated
                setEditedPostTypes(newPostTypes)
              } : undefined}
              onDelete={isEditMode ? () => handleDeletePostType(index) : undefined}
            />
          ))}
        </div>
      </section>

      {/* アクションボタン（通常モード時のみ） */}
      {!isEditMode && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button
              variant="primary"
              onClick={() => setShowConfirmDialog(true)}
            >
              承認して適用
            </Button>
            <Button
              variant="secondary"
              onClick={handleStartEdit}
            >
              編集してから適用
            </Button>
            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/5"
              onClick={() => router.push(`/analysis/${analysisId}`)}
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
        </>
      )}

      {/* 編集モード時のスティッキーアクションバー */}
      {isEditMode && (
        <div className="sticky bottom-4 z-40 bg-slate-800/95 backdrop-blur rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-lg">
          <p className="text-sm text-white/60">
            編集中 — 変更を確認してから適用してください
          </p>
          <div className="flex gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/5"
              onClick={handleCancelEdit}
            >
              編集を取り消す
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
            >
              編集を適用する
            </Button>
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isApplying) {
              setShowConfirmDialog(false)
            }
          }}
        >
          <div className="bg-slate-800 border border-white/10 rounded-xl p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-semibold text-white mb-3">
              {isEditMode
                ? '編集した内容で適用しますか？'
                : 'プロフィールと投稿タイプを適用しますか？'}
            </h3>
            <p className="text-sm text-white/60 mb-2">
              以下が作成されます:
            </p>
            <ul className="text-sm text-white/80 mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-lg">{displayProfile.icon}</span>
                <span>プロフィール: {displayProfile.name}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span>投稿タイプ: {displayPostTypes.length}種類</span>
              </li>
            </ul>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/5"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isApplying}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                onClick={handleApply}
                loading={isApplying}
              >
                適用する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
