# チケット #65: 適用フロー UI

> Phase 4C | 優先度: 高 | 依存: #63, #64

## 概要

生成プレビューページ (#63) の「承認して適用」ボタンのクリック時のフローを実装する。確認ダイアログ表示、適用 API (#64) の呼び出し、成功状態の表示（プロフィール設定へのリンク、投稿作成ページへの誘導 CTA）、およびエラーハンドリングを含む。`useTransition` でペンディング状態を管理し、トースト通知でフィードバックを提供する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/analysis/generation-preview.tsx` | 更新（適用フロー追加） |

## 変更内容

### 1. 適用フロー状態管理

`generation-preview.tsx` に適用フロー関連の状態を追加:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

// 追加の状態
const [showConfirmDialog, setShowConfirmDialog] = useState(false)
const [isApplied, setIsApplied] = useState(false)
const [appliedResult, setAppliedResult] = useState<{
  profileId: string
  profileName: string
  postTypeCount: number
} | null>(null)
const [isPending, startTransition] = useTransition()
const router = useRouter()
const { showToast } = useToast()
```

### 2. 「承認して適用」ボタンの実装

```typescript
// アクションボタン部分を更新
<div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
  <Button
    variant="primary"
    onClick={() => setShowConfirmDialog(true)}
    disabled={isPending || isApplied}
  >
    {isPending ? '適用中...' : '承認して適用'}
  </Button>
  <Button
    variant="secondary"
    disabled={isPending || isApplied}
    /* onClick は #66 で実装 */
  >
    編集してから適用
  </Button>
  <Button
    variant="ghost"
    onClick={() => router.push(`/analysis/${analysisId}`)}
    disabled={isPending}
  >
    分析結果に戻る
  </Button>
</div>
```

### 3. 確認ダイアログ

```typescript
{showConfirmDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="bg-slate-800 rounded-xl border border-white/10 p-6 max-w-md mx-4">
      <h3 className="text-lg font-semibold text-white mb-3">
        プロフィールと投稿タイプを適用しますか？
      </h3>
      <p className="text-sm text-slate-400 mb-2">
        以下が作成されます:
      </p>
      <ul className="text-sm text-slate-300 mb-6 space-y-1">
        <li>
          <span className="text-lg mr-2">{profile?.icon}</span>
          プロフィール: {profile?.name}
        </li>
        <li>
          <span className="mr-2">📝</span>
          投稿タイプ: {postTypes.length}種類
        </li>
      </ul>
      <div className="flex gap-3 justify-end">
        <Button
          variant="ghost"
          onClick={() => setShowConfirmDialog(false)}
          disabled={isPending}
        >
          キャンセル
        </Button>
        <Button
          variant="primary"
          onClick={handleApply}
          disabled={isPending}
        >
          {isPending ? '適用中...' : '適用する'}
        </Button>
      </div>
    </div>
  </div>
)}
```

### 4. 適用処理

```typescript
async function handleApply() {
  startTransition(async () => {
    try {
      const res = await fetch(`/api/analysis/${analysisId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId }),
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

      showToast({
        type: 'success',
        message: 'プロフィールと投稿タイプが作成されました！',
      })
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : '適用に失敗しました',
      })
      setShowConfirmDialog(false)
    }
  })
}
```

### 5. 成功状態の表示

適用成功後にプレビュー部分を成功メッセージに差し替え:

```typescript
{isApplied && appliedResult && (
  <div className="text-center py-12 space-y-6">
    {/* 成功アイコン */}
    <div className="text-5xl mb-4">🎉</div>

    <h2 className="text-xl font-bold text-white">
      プロフィールと投稿タイプが作成されました！
    </h2>

    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6 max-w-md mx-auto">
      <p className="text-slate-300 mb-4">
        <span className="text-lg mr-2">{profile?.icon}</span>
        <span className="font-semibold text-white">{appliedResult.profileName}</span>
        <span className="text-slate-400"> と </span>
        <span className="font-semibold text-white">{appliedResult.postTypeCount}種類</span>
        <span className="text-slate-400"> の投稿タイプが作成されました。</span>
      </p>
    </div>

    {/* 遷移リンク */}
    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
      <Button
        variant="primary"
        onClick={() => router.push(`/create?profileId=${appliedResult.profileId}`)}
      >
        さっそく投稿を作ってみましょう！
      </Button>
      <Button
        variant="secondary"
        onClick={() => router.push(`/settings/profiles/${appliedResult.profileId}`)}
      >
        プロフィール設定を確認
      </Button>
      <Button
        variant="ghost"
        onClick={() => router.push('/analysis')}
      >
        分析一覧に戻る
      </Button>
    </div>
  </div>
)}
```

### 6. 既に適用済みの `generated_configs` がある場合

ページ表示時に `existingConfig.status === 'applied'` の場合は、適用済みメッセージを表示:

```typescript
// GenerationPreview コンポーネント内
if (existingConfig?.status === 'applied') {
  return (
    <div className="text-center py-12 space-y-6">
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-xl font-bold text-white">
        この分析結果は既に適用済みです
      </h2>
      <p className="text-slate-400">
        プロフィールと投稿タイプは既に作成されています。
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        {existingConfig.generated_profile_id && (
          <Button
            variant="secondary"
            onClick={() => router.push(`/settings/profiles/${existingConfig.generated_profile_id}`)}
          >
            プロフィール設定を確認
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => router.push('/analysis')}
        >
          分析一覧に戻る
        </Button>
      </div>
    </div>
  )
}
```

## 受入条件

- 「承認して適用」ボタンクリックで確認ダイアログが表示される
- 確認ダイアログに作成されるプロフィール名と投稿タイプ数が表示される
- 「キャンセル」でダイアログが閉じる
- 「適用する」で適用 API が呼ばれる
- 適用中にボタンが無効化され「適用中...」が表示される
- 適用成功後に成功メッセージと遷移リンクが表示される
- 「さっそく投稿を作ってみましょう！」が `/create?profileId=xxx` に遷移する
- 「プロフィール設定を確認」が `/settings/profiles/xxx` に遷移する
- 適用失敗時にトーストでエラーメッセージが表示される
- 既に適用済みの場合は適用済みメッセージが表示される
- `npm run build` が成功する

## TODO

- [ ] 確認ダイアログコンポーネントを実装
- [ ] `handleApply()` 関数を実装（`useTransition` 使用）
- [ ] 適用 API の呼び出しロジックを実装
- [ ] 成功状態の表示コンポーネントを実装
- [ ] 遷移リンク（投稿作成、プロフィール設定、分析一覧）を実装
- [ ] トースト通知（成功・エラー）を実装
- [ ] 既に適用済みの場合の表示を実装
- [ ] ペンディング状態中のボタン無効化を実装
- [ ] レスポンシブデザインを確認
- [ ] `npm run build` 成功を確認
