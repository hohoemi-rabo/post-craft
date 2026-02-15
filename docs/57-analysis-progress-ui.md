# チケット #57: 分析進捗表示UI

> Phase 4B | 優先度: 中 | 依存: #56, #52

## 概要

分析ウィザード Step 3（#52 で作成）にリアルタイムの分析進捗表示を実装する。`/api/analysis/[id]/status` を2秒間隔でポーリングし、ステップごとの進捗アイコン・プログレスバー・自動遷移を提供する。既存の `useGenerationSteps` フック（`src/hooks/useGenerationSteps.ts`）のパターンを踏襲する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/analysis/analysis-progress.tsx` | 更新（#52 で作成したものを拡充） |
| `src/hooks/useAnalysisProgress.ts` | 新規作成 |

## 変更内容

### 1. 進捗管理フック (`src/hooks/useAnalysisProgress.ts`)

既存の `useGenerationSteps.ts` パターンを踏襲し、分析進捗に特化したフックを作成する。

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AnalysisStatus {
  id: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  error_message: string | null
  post_count: number | null
  updated_at: string
}

interface AnalysisStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
  error?: string
}

interface UseAnalysisProgressOptions {
  analysisIds: string[]
  onAllCompleted?: () => void
}

export function useAnalysisProgress({ analysisIds, onAllCompleted }: UseAnalysisProgressOptions) {
  const router = useRouter()
  const [steps, setSteps] = useState<AnalysisStep[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ステップの初期化
  const initSteps = useCallback((analysisIds: string[], sourceTypes: string[]) => {
    const initialSteps: AnalysisStep[] = []

    sourceTypes.forEach((type) => {
      const label = type === 'instagram' ? 'Instagram' : 'ブログ'
      initialSteps.push(
        { id: `${type}-data`, label: `${label}データ取得完了`, status: 'completed' },
        { id: `${type}-analyzing`, label: `${label} AI分析中...`, status: 'pending' },
      )
    })

    // Instagram の場合はサブステップも表示
    if (sourceTypes.includes('instagram')) {
      initialSteps.push(
        { id: 'ig-post-type', label: '投稿タイプ分析', status: 'pending' },
        { id: 'ig-tone', label: 'トーン・文体分析', status: 'pending' },
        { id: 'ig-hashtag', label: 'ハッシュタグ戦略分析', status: 'pending' },
        { id: 'ig-pattern', label: '投稿パターン分析', status: 'pending' },
      )
    }

    setSteps(initialSteps)
  }, [])

  // ポーリング
  const pollStatus = useCallback(async () => {
    try {
      const statuses: AnalysisStatus[] = await Promise.all(
        analysisIds.map(async (id) => {
          const res = await fetch(`/api/analysis/${id}/status`)
          if (!res.ok) throw new Error('Status fetch failed')
          return res.json()
        })
      )

      // ステータスに基づいてステップと進捗を更新
      // ...（ステータス → ステップ状態のマッピングロジック）

      // 全て completed なら完了処理
      const allCompleted = statuses.every((s) => s.status === 'completed')
      const anyFailed = statuses.some((s) => s.status === 'failed')

      if (allCompleted) {
        setIsCompleted(true)
        setProgress(100)
        if (intervalRef.current) clearInterval(intervalRef.current)
        onAllCompleted?.()
      }

      if (anyFailed) {
        const failedAnalysis = statuses.find((s) => s.status === 'failed')
        setError(failedAnalysis?.error_message || '分析中にエラーが発生しました')
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }, [analysisIds, onAllCompleted])

  // 2秒間隔のポーリング開始
  useEffect(() => {
    if (analysisIds.length === 0) return

    pollStatus() // 初回即時実行
    intervalRef.current = setInterval(pollStatus, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [analysisIds, pollStatus])

  // リトライ
  const retry = useCallback(() => {
    setError(null)
    setIsCompleted(false)
    setProgress(0)
    // リトライAPIを呼び出し
  }, [])

  return {
    steps,
    progress,
    error,
    isCompleted,
    initSteps,
    retry,
  }
}
```

### 2. 進捗表示コンポーネント (`src/components/analysis/analysis-progress.tsx`)

```typescript
'use client'

import { useAnalysisProgress } from '@/hooks/useAnalysisProgress'
import { useRouter } from 'next/navigation'

interface AnalysisProgressProps {
  analysisIds: string[]
  sourceTypes: string[] // ['instagram'] | ['blog'] | ['instagram', 'blog']
}

export function AnalysisProgress({ analysisIds, sourceTypes }: AnalysisProgressProps) {
  const router = useRouter()

  const { steps, progress, error, isCompleted } = useAnalysisProgress({
    analysisIds,
    onAllCompleted: () => {
      // 3秒後に結果ページへ自動遷移
      setTimeout(() => {
        router.push(`/analysis/${analysisIds[0]}`)
      }, 3000)
    },
  })

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <p className="text-xl font-bold text-white">
          {isCompleted ? '分析完了!' : '分析を実行しています...'}
        </p>
      </div>

      {/* ステップ一覧 */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            <StepIcon status={step.status} />
            <span className={getStepTextClass(step.status)}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-white/10 rounded-full h-3">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-center text-slate-400 text-sm">{progress}%</p>

      {/* エラー表示 + リトライ */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg
                       hover:bg-red-500/30 transition-colors min-h-[44px]"
          >
            再試行
          </button>
        </div>
      )}

      {/* 完了時の自動遷移メッセージ */}
      {isCompleted && (
        <p className="text-center text-green-400 text-sm">
          3秒後に結果ページへ遷移します...
        </p>
      )}
    </div>
  )
}
```

### 3. ステップアイコンコンポーネント

```typescript
function StepIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <span className="text-green-400 text-lg">✅</span>
    case 'active':
      return <span className="text-yellow-400 text-lg animate-pulse">⏳</span>
    case 'error':
      return <span className="text-red-400 text-lg">❌</span>
    default: // pending
      return <span className="text-slate-600 text-lg">○</span>
  }
}

function getStepTextClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-400'
    case 'active':
      return 'text-yellow-400'
    case 'error':
      return 'text-red-400'
    default:
      return 'text-slate-500'
  }
}
```

### 4. ステータス → 進捗率のマッピング

| ステータス | Instagram のみ | ブログのみ | 両方 |
|-----------|---------------|-----------|------|
| pending | 0% | 0% | 0% |
| analyzing (1件目) | 20% → 80% | 20% → 80% | 10% → 40% |
| analyzing (2件目) | - | - | 50% → 90% |
| completed | 100% | 100% | 100% |

分析中のサブステップ（投稿タイプ → トーン → ハッシュタグ → パターン）はクライアント側で時間ベースのアニメーションを使用し、実際のAI処理と同期する必要はない（AI分析は1回のプロンプトで4要素を同時に抽出するため）。

## 受入条件

- `/api/analysis/[id]/status` を2秒間隔でポーリングしている
- ステップごとの進捗状態（完了/実行中/待機）がアイコン付きで表示される
- プログレスバーが進捗率に応じてアニメーションする
- 全分析完了時に自動的に結果ページ（`/analysis/[id]`）へ遷移する
- エラー発生時にエラーメッセージと再試行ボタンが表示される
- Instagram + ブログの両方を指定した場合、両方のステータスが追跡される
- コンポーネントのアンマウント時にポーリングが停止される
- 既存の `useGenerationSteps` パターンと一貫性のあるAPI設計

## TODO

- [x] ポーリングロジックの実装（2秒間隔、最大3分タイムアウト、自動停止）
- [x] ステータス → ステップ状態のマッピングロジック実装（completed/failed/analyzing）
- [x] `src/components/analysis/analysis-progress.tsx` を更新（最終ステップをAI分析ポーリングに置換）
- [x] StepIcon は既存の丸アイコンパターンを継続使用（✓/⋯/!/○）
- [x] 完了時の自動遷移実装（1.5秒後に `/analysis/[id]`）
- [x] ヘッダーに完了状態表示（「分析が完了しました」+ 遷移メッセージ）
- [x] エラー表示 + やり直しボタン（既存のまま）
- [x] 両方のソース指定時の複数ID追跡（Promise.all でポーリング）
- [x] クリーンアップ処理（abortRef でポーリングループ中断）
- [x] `npm run build` 成功
- [x] `useAnalysisProgress.ts` フック → コンポーネント内に統合（分離不要と判断）
- [x] プログレスバー → 不採用（AI分析は1回のプロンプトで4要素同時抽出、途中経過は存在しない）
- [x] サブステップ表示 → 不採用（偽の進捗は誤解を招く）
