# チケット #63: 生成プレビューページ

> Phase 4C | 優先度: 高 | 依存: #62

## 概要

生成プレビューページ `/analysis/[id]/generate` を実装する。生成 API (#62) の結果を表示し、プロフィールと投稿タイプ（3〜5種）のプレビューを提供する。Server Component でデータフェッチし、Client Component でインタラクション（展開/折りたたみ、承認・編集ボタン）を処理する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(dashboard)/analysis/[id]/generate/page.tsx` | 新規作成 |
| `src/components/analysis/generation-preview.tsx` | 新規作成 |
| `src/components/analysis/profile-preview.tsx` | 新規作成 |
| `src/components/analysis/posttype-preview-card.tsx` | 新規作成 |

## 変更内容

### 1. Server Component（ページ）

`src/app/(dashboard)/analysis/[id]/generate/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { GenerationPreview } from '@/components/analysis/generation-preview'

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id: analysisId } = await params
  const supabase = createServerClient()

  // 分析データを取得
  const { data: analysis, error: analysisError } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', session.user.id)
    .single()

  if (analysisError || !analysis) {
    redirect('/analysis')
  }

  // 既存の generated_configs を取得（生成済みの場合）
  const { data: existingConfig } = await supabase
    .from('generated_configs')
    .select('*')
    .eq('analysis_id', analysisId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          テンプレート生成
        </h1>
        <p className="text-slate-400">
          {analysis.source_display_name || analysis.source_identifier} の分析結果から
          プロフィールと投稿タイプを自動生成します
        </p>
      </div>

      {/* 生成プレビュー (Client Component) */}
      <GenerationPreview
        analysisId={analysisId}
        existingConfig={existingConfig}
        sourceDisplayName={analysis.source_display_name || analysis.source_identifier}
      />
    </div>
  )
}
```

### 2. GenerationPreview (Client Component)

`src/components/analysis/generation-preview.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { ProfilePreview } from './profile-preview'
import { PostTypePreviewCard } from './posttype-preview-card'
import { Button } from '@/components/ui/button'
import type { GeneratedProfile, GeneratedPostType } from '@/types/analysis'

interface GenerationPreviewProps {
  analysisId: string
  existingConfig: {
    id: string
    generation_config: {
      profile: GeneratedProfile
      postTypes: GeneratedPostType[]
    }
    status: string
  } | null
  sourceDisplayName: string
}

export function GenerationPreview({
  analysisId,
  existingConfig,
  sourceDisplayName,
}: GenerationPreviewProps) {
  const [configId, setConfigId] = useState(existingConfig?.id || null)
  const [profile, setProfile] = useState<GeneratedProfile | null>(
    existingConfig?.generation_config?.profile || null
  )
  const [postTypes, setPostTypes] = useState<GeneratedPostType[]>(
    existingConfig?.generation_config?.postTypes || []
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 生成実行
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
      setConfigId(data.configId)
      setProfile(data.profile)
      setPostTypes(data.postTypes)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // 未生成 or 再生成の場合
  if (!profile || !postTypes.length) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 mb-6">
          「{sourceDisplayName}」の分析結果からプロフィールと投稿タイプを自動生成します
        </p>
        {error && (
          <p className="text-red-400 mb-4">{error}</p>
        )}
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? '生成中...' : '生成を開始'}
        </Button>
      </div>
    )
  }

  // 生成済みの場合: プレビュー表示
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
          {postTypes.map((postType, index) => (
            <PostTypePreviewCard
              key={postType.slug}
              postType={postType}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
        <Button variant="primary" /* onClick は #65 で実装 */>
          承認して適用
        </Button>
        <Button variant="secondary" /* onClick は #66 で実装 */>
          編集してから適用
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
        >
          分析結果に戻る
        </Button>
      </div>

      {/* 再生成ボタン */}
      <div className="text-center pt-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isGenerating ? '再生成中...' : '結果に満足できない場合は再生成'}
        </button>
      </div>
    </div>
  )
}
```

### 3. ProfilePreview コンポーネント

`src/components/analysis/profile-preview.tsx`:

```typescript
'use client'

import { useState } from 'react'
import type { GeneratedProfile } from '@/types/analysis'

interface ProfilePreviewProps {
  profile: GeneratedProfile
}

export function ProfilePreview({ profile }: ProfilePreviewProps) {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
      {/* アイコン + 名前 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{profile.icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
          <p className="text-sm text-slate-400">{profile.description}</p>
        </div>
      </div>

      {/* 必須ハッシュタグ */}
      <div className="mb-4">
        <p className="text-sm text-slate-400 mb-2">必須ハッシュタグ</p>
        <div className="flex flex-wrap gap-2">
          {profile.required_hashtags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* システムプロンプト（展開/折りたたみ） */}
      <div>
        <button
          onClick={() => setIsPromptExpanded(!isPromptExpanded)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          <span>{isPromptExpanded ? '▼' : '▶'}</span>
          <span>システムプロンプト</span>
        </button>
        {isPromptExpanded && (
          <div className="mt-2 p-4 bg-slate-900/50 rounded-lg">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {profile.system_prompt}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4. PostTypePreviewCard コンポーネント

`src/components/analysis/posttype-preview-card.tsx`:

```typescript
'use client'

import { useState } from 'react'
import type { GeneratedPostType } from '@/types/analysis'

interface PostTypePreviewCardProps {
  postType: GeneratedPostType
  index: number
}

export function PostTypePreviewCard({ postType, index }: PostTypePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
      {/* ヘッダー（クリックで展開） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{postType.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{postType.name}</h3>
            <p className="text-sm text-slate-400">{postType.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
            {postType.input_mode === 'fields' ? 'フィールド入力' : 'メモ入力'}
          </span>
          <span className="text-slate-500">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {/* 展開時の詳細 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {/* テンプレート構造プレビュー */}
          <div className="mt-4">
            <p className="text-sm text-slate-400 mb-2">テンプレート構造</p>
            <pre className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {postType.template_structure}
            </pre>
          </div>

          {/* プレースホルダー一覧 */}
          <div>
            <p className="text-sm text-slate-400 mb-2">
              入力フィールド（{postType.placeholders.length}個）
            </p>
            <div className="space-y-2">
              {postType.placeholders.map((ph) => (
                <div
                  key={ph.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-slate-500 font-mono">{`{${ph.key}}`}</span>
                  <span className="text-white">{ph.label}</span>
                  {ph.required && (
                    <span className="text-red-400 text-xs">必須</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 文字数設定 */}
          <div className="flex gap-4 text-sm">
            <span className="text-slate-400">
              文字数: {postType.min_length}〜{postType.max_length}
            </span>
          </div>

          {/* type_prompt（折りたたみ） */}
          <details className="text-sm">
            <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
              AIプロンプト（type_prompt）
            </summary>
            <p className="mt-2 p-3 bg-slate-900/50 rounded-lg text-slate-300 whitespace-pre-wrap">
              {postType.type_prompt}
            </p>
          </details>
        </div>
      )}
    </div>
  )
}
```

### 5. ローディング状態

生成中のローディング表示:

```typescript
// GenerationPreview 内の生成中表示
{isGenerating && (
  <div className="text-center py-16">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4" />
    <p className="text-white font-semibold mb-2">プロフィールと投稿タイプを生成中...</p>
    <p className="text-sm text-slate-400">
      分析結果を元にAIが最適なテンプレートを作成しています
    </p>
    <p className="text-xs text-slate-500 mt-2">
      通常 10〜20 秒で完了します
    </p>
  </div>
)}
```

## 受入条件

- `/analysis/[id]/generate` ページが正常に表示される
- 未認証ユーザーはログインページにリダイレクトされる
- 存在しない分析IDの場合は `/analysis` にリダイレクトされる
- 「生成を開始」ボタンで API が呼ばれ、結果がプレビュー表示される
- プロフィールプレビューにアイコン・名前・説明・ハッシュタグ・システムプロンプトが表示される
- システムプロンプトが展開/折りたたみできる
- 投稿タイプカードがクリックで展開し、テンプレート構造・プレースホルダー・文字数・type_prompt が表示される
- 「分析結果に戻る」ボタンで前のページに戻れる
- 生成中にローディング表示が出る
- エラー時にエラーメッセージが表示される
- 既に生成済みの場合は保存済みデータが表示される
- レスポンシブデザイン（モバイル対応）
- `npm run build` が成功する

## TODO

- [ ] `src/app/(dashboard)/analysis/[id]/generate/page.tsx` を新規作成（Server Component）
- [ ] `src/components/analysis/generation-preview.tsx` を新規作成（Client Component）
- [ ] `src/components/analysis/profile-preview.tsx` を新規作成
- [ ] `src/components/analysis/posttype-preview-card.tsx` を新規作成
- [ ] 生成 API の呼び出しロジックを実装
- [ ] 生成中ローディング表示を実装
- [ ] 既存 `generated_configs` のデータ表示を実装
- [ ] 再生成機能を実装
- [ ] エラーハンドリング表示を実装
- [ ] レスポンシブデザインを確認
- [ ] `npm run build` 成功を確認
