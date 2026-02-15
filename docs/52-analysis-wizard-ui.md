# チケット #52: 分析ウィザード UI (Step 1-3)

> Phase 4A | 優先度: 中 | 依存: #49, #50, #51

## 概要

分析機能の新規作成ウィザード UI を実装する。3ステップ構成で、Step 1（ソース選択）、Step 2（データ入力）、Step 3（分析実行 + 進捗表示）を提供する。既存の投稿作成フロー（`src/components/create/` の Step コンポーネント）のパターンに倣い、Client Component で状態管理を行う。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(dashboard)/analysis/new/page.tsx` | 新規作成（ウィザードページ） |
| `src/components/analysis/analysis-wizard.tsx` | 新規作成（ウィザード本体、Client Component） |
| `src/components/analysis/source-selector.tsx` | 新規作成（Step 1: ソース選択） |
| `src/components/analysis/data-input-form.tsx` | 新規作成（Step 2: データ入力） |
| `src/components/analysis/analysis-progress.tsx` | 新規作成（Step 3: 進捗表示） |

## 変更内容

### 1. ページコンポーネント (`src/app/(dashboard)/analysis/new/page.tsx`)

```typescript
import type { Metadata } from 'next'
import { AnalysisWizard } from '@/components/analysis/analysis-wizard'

export const metadata: Metadata = {
  title: '新規分析 | Post Craft',
}

export default function NewAnalysisPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">新規分析</h1>
      <AnalysisWizard />
    </div>
  )
}
```

### 2. ウィザード本体 (`src/components/analysis/analysis-wizard.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SourceSelector } from './source-selector'
import { DataInputForm } from './data-input-form'
import { AnalysisProgress } from './analysis-progress'
import type { AnalysisSourceType } from '@/types/analysis'

type WizardStep = 1 | 2 | 3

interface AnalysisConfig {
  sourceTypes: AnalysisSourceType[] // ['instagram'], ['blog'], or ['instagram', 'blog']
  instagram?: {
    accountName: string
    file: File | null
    analysisId: string | null
  }
  blog?: {
    blogUrl: string
    blogName: string
    analysisId: string | null
  }
}

export function AnalysisWizard() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(1)
  const [config, setConfig] = useState<AnalysisConfig>({
    sourceTypes: [],
  })

  // Step 1 完了: ソース選択
  const handleSourceSelect = (sourceTypes: AnalysisSourceType[]) => {
    setConfig(prev => ({ ...prev, sourceTypes }))
    setStep(2)
  }

  // Step 2 完了: データ入力 → 分析開始
  const handleDataSubmit = (updatedConfig: AnalysisConfig) => {
    setConfig(updatedConfig)
    setStep(3)
  }

  // Step 3 完了: 分析結果ページへ遷移
  const handleAnalysisComplete = (analysisId: string) => {
    router.push(`/analysis/${analysisId}`)
  }

  return (
    <div>
      {/* ステッププログレス */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              s === step
                ? 'bg-blue-600 text-white'
                : s < step
                ? 'bg-green-600 text-white'
                : 'bg-white/10 text-slate-400'
            }`}>
              {s < step ? '✓' : s}
            </div>
            <span className={`text-sm hidden sm:inline ${
              s === step ? 'text-white' : 'text-slate-400'
            }`}>
              {s === 1 ? 'ソース選択' : s === 2 ? 'データ入力' : '分析実行'}
            </span>
          </div>
        ))}
      </div>

      {/* ステップコンテンツ */}
      {step === 1 && <SourceSelector onSelect={handleSourceSelect} />}
      {step === 2 && (
        <DataInputForm
          config={config}
          onSubmit={handleDataSubmit}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <AnalysisProgress
          config={config}
          onComplete={handleAnalysisComplete}
        />
      )}
    </div>
  )
}
```

### 3. Step 1: ソース選択 (`src/components/analysis/source-selector.tsx`)

```typescript
'use client'

import type { AnalysisSourceType } from '@/types/analysis'

interface SourceSelectorProps {
  onSelect: (sourceTypes: AnalysisSourceType[]) => void
}

const sourceOptions = [
  {
    id: 'instagram' as const,
    types: ['instagram'] as AnalysisSourceType[],
    icon: '📸',
    title: 'Instagram 競合分析',
    description: '競合アカウントの投稿データをCSV/JSONでアップロードして分析します',
  },
  {
    id: 'blog' as const,
    types: ['blog'] as AnalysisSourceType[],
    icon: '📝',
    title: 'ブログ分析',
    description: '自社ブログの記事を自動取得して強みやコンテンツ資産を分析します',
  },
  {
    id: 'both' as const,
    types: ['instagram', 'blog'] as AnalysisSourceType[],
    icon: '📸📝',
    title: '両方（推奨）',
    description: '競合のInstagram分析と自社ブログ分析を組み合わせて最適な戦略を導き出します',
    recommended: true,
  },
]

export function SourceSelector({ onSelect }: SourceSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sourceOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.types)}
          className={`relative p-6 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] ${
            option.recommended
              ? 'border-blue-500/50 bg-blue-600/10 hover:bg-blue-600/20'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          {option.recommended && (
            <span className="absolute -top-3 left-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              推奨
            </span>
          )}
          <div className="text-3xl mb-3">{option.icon}</div>
          <h3 className="text-lg font-bold text-white mb-2">{option.title}</h3>
          <p className="text-sm text-slate-400">{option.description}</p>
        </button>
      ))}
    </div>
  )
}
```

### 4. Step 2: データ入力 (`src/components/analysis/data-input-form.tsx`)

```typescript
'use client'

import { useState, useRef } from 'react'
import type { AnalysisSourceType } from '@/types/analysis'

interface DataInputFormProps {
  config: AnalysisConfig
  onSubmit: (config: AnalysisConfig) => void
  onBack: () => void
}

export function DataInputForm({ config, onSubmit, onBack }: DataInputFormProps) {
  // Instagram 入力フォーム
  // - アカウント名（テキスト入力）
  // - CSV/JSONファイルアップロード（ドラッグ&ドロップ対応）
  // - ファイルバリデーション（.csv, .json、10MB上限）

  // ブログ入力フォーム
  // - ブログURL（テキスト入力、https:// プレフィックス）
  // - ブログ名（テキスト入力、任意）

  // 両方の場合はセクション分けで表示

  return (
    <div className="space-y-8">
      {config.sourceTypes.includes('instagram') && (
        <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>📸</span> Instagram 競合データ
          </h3>
          {/* アカウント名入力 */}
          {/* ファイルアップロード（ドラッグ&ドロップ） */}
        </section>
      )}

      {config.sourceTypes.includes('blog') && (
        <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>📝</span> ブログ情報
          </h3>
          {/* ブログURL入力 */}
          {/* ブログ名入力 */}
        </section>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between">
        <button onClick={onBack} className="...">戻る</button>
        <button onClick={handleSubmit} className="...">分析を開始</button>
      </div>
    </div>
  )
}
```

ファイルアップロード UI:
- ドラッグ&ドロップ対応のエリア
- ファイル選択ボタン
- 対応形式表示: CSV, JSON
- ファイルサイズ上限表示: 10MB
- 選択後にファイル名とサイズを表示
- 不正なファイル形式やサイズ超過時のエラー表示

### 5. Step 3: 分析進捗表示 (`src/components/analysis/analysis-progress.tsx`)

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

interface AnalysisProgressProps {
  config: AnalysisConfig
  onComplete: (analysisId: string) => void
}

interface ProgressStep {
  label: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  detail?: string
}

export function AnalysisProgress({ config, onComplete }: AnalysisProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 1. POST /api/analysis で分析レコードを作成
    // 2. Instagram: POST /api/analysis/upload でファイルアップロード
    // 3. ブログ: POST /api/analysis/blog-crawl でクロール開始
    // 4. ステータスポーリング開始（2秒間隔）
    //    GET /api/analysis/[id]/status をポーリング
    // 5. status が 'completed' になったら onComplete を呼ぶ
    // 6. status が 'failed' になったらエラー表示
    startAnalysis()
  }, [])

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">📊</div>
        <h2 className="text-xl font-bold text-white">分析を実行しています...</h2>
      </div>

      {/* 進捗ステップ */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
              step.status === 'completed' ? 'bg-green-600 text-white' :
              step.status === 'in-progress' ? 'bg-blue-600 text-white animate-pulse' :
              step.status === 'error' ? 'bg-red-600 text-white' :
              'bg-white/10 text-slate-400'
            }`}>
              {step.status === 'completed' ? '✓' :
               step.status === 'in-progress' ? '...' :
               step.status === 'error' ? '!' :
               '○'}
            </div>
            <div>
              <p className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-green-400' :
                step.status === 'in-progress' ? 'text-white' :
                step.status === 'error' ? 'text-red-400' :
                'text-slate-400'
              }`}>{step.label}</p>
              {step.detail && (
                <p className="text-xs text-slate-500">{step.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="...">
            やり直す
          </button>
        </div>
      )}
    </div>
  )
}
```

ポーリングロジック:
- 2秒間隔で `GET /api/analysis/[id]/status` を呼び出す
- `status` が `analyzing` の間はポーリングを継続
- `status` が `completed` になったら `onComplete(analysisId)` を呼び出し、結果ページへ遷移
- `status` が `failed` になったらエラーメッセージを表示
- コンポーネントのアンマウント時にポーリングを停止（`clearInterval`）

### 6. ディレクトリ構造

```
src/
├── app/(dashboard)/analysis/
│   └── new/
│       └── page.tsx
└── components/analysis/
    ├── analysis-wizard.tsx      (Client Component: ステップ管理)
    ├── source-selector.tsx      (Client Component: Step 1)
    ├── data-input-form.tsx      (Client Component: Step 2)
    └── analysis-progress.tsx    (Client Component: Step 3)
```

## 受入条件

- `/analysis/new` にアクセスすると 3 ステップのウィザードが表示される
- Step 1 で 3 つのソース選択肢（Instagram / ブログ / 両方）が表示される
- Step 1 で選択後に Step 2 に遷移する
- Step 2 で選択したソースに応じた入力フォームが表示される
  - Instagram 選択時: アカウント名 + ファイルアップロード
  - ブログ選択時: ブログURL + ブログ名
  - 両方選択時: 両方のフォームが表示される
- ファイルアップロードでドラッグ&ドロップが機能する
- 不正なファイル形式（CSV/JSON 以外）でエラーが表示される
- 10MB を超えるファイルでエラーが表示される
- Step 2 の「戻る」ボタンで Step 1 に戻れる
- Step 3 で進捗ステップが順次更新される
- ステータスポーリングが 2 秒間隔で動作する
- 分析完了時に結果ページ (`/analysis/[id]`) へ遷移する
- 分析失敗時にエラーメッセージと「やり直す」ボタンが表示される
- レスポンシブ対応（モバイルファースト）
- ダークテーマの既存デザインに統一
- `npm run build` が成功する

## TODO

- [x] `src/app/(dashboard)/analysis/new/page.tsx` を作成
- [x] `src/components/analysis/analysis-wizard.tsx` を作成（ステップ管理 + プログレスバー）
- [x] `src/components/analysis/source-selector.tsx` を作成（3つのソース選択カード）
- [x] `src/components/analysis/data-input-form.tsx` を作成
  - [x] Instagram フォーム（アカウント名 + ファイルアップロード）
  - [x] ブログフォーム（URL + ブログ名）
  - [x] ドラッグ&ドロップ UI
  - [x] ファイルバリデーション（形式、サイズ）
- [x] `src/components/analysis/analysis-progress.tsx` を作成
  - [x] 分析レコード作成（POST /api/analysis）
  - [x] ファイルアップロード（POST /api/analysis/upload）
  - [x] ブログクロール（POST /api/analysis/blog-crawl）
  - [x] ステータスポーリング（GET /api/analysis/[id]/status、2秒間隔）
  - [x] 完了・エラーハンドリング
- [x] レスポンシブデザインの実装（モバイルファースト）
- [x] `npm run build` 成功を確認
