# チケット #59: 分析ダッシュボード

> Phase 4B | 優先度: 中 | 依存: #49

## 概要

分析ダッシュボード `/analysis` を実装する。ユーザーの全分析一覧をステータスバッジ・ソースタイプバッジ付きで表示し、新規分析の開始や結果ページへの遷移を提供する。アーキテクチャは履歴ページ (`/history`) と同じ Server Component + Suspense パターンを踏襲する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(dashboard)/analysis/page.tsx` | 新規作成 |
| `src/components/analysis/analysis-list.tsx` | 新規作成 |
| `src/components/analysis/analysis-card.tsx` | 新規作成 |
| `src/components/analysis/analysis-skeleton.tsx` | 新規作成 |

## 変更内容

### 1. ページコンポーネント (`/analysis/page.tsx`)

履歴ページ (`/history/page.tsx`) と同じ Server Component + Suspense パターンを使用する。

```typescript
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AnalysisList } from '@/components/analysis/analysis-list'
import { AnalysisSkeleton } from '@/components/analysis/analysis-skeleton'

export default async function AnalysisPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="space-y-6">
      {/* ヘッダー: Suspense 外、即表示 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            分析
          </h1>
          <p className="text-slate-400">
            競合Instagram・自社ブログの分析結果を管理できます
          </p>
        </div>
        <Link
          href="/analysis/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium
                     rounded-lg transition-colors min-h-[44px] flex items-center gap-2
                     w-fit"
        >
          新規分析
        </Link>
      </div>

      {/* 分析一覧: Suspense 内、データフェッチ中はスケルトン表示 */}
      <Suspense fallback={<AnalysisSkeleton />}>
        <AnalysisList userId={session.user.id} />
      </Suspense>
    </div>
  )
}
```

### 2. 分析一覧コンポーネント (`analysis-list.tsx`)

Server async Component で Supabase に直接クエリを実行する。

```typescript
import { createServerClient } from '@/lib/supabase'
import { AnalysisCard } from './analysis-card'

interface AnalysisListProps {
  userId: string
}

export async function AnalysisList({ userId }: AnalysisListProps) {
  const supabase = createServerClient()

  const { data: analyses, error } = await supabase
    .from('competitor_analyses')
    .select('id, source_type, source_identifier, source_display_name, status, post_count, error_message, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">分析データの取得に失敗しました</p>
      </div>
    )
  }

  // 空状態
  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-xl font-bold text-white mb-2">まだ分析がありません</p>
        <p className="text-slate-400 mb-6">
          競合のInstagramアカウントや自社ブログを分析して、<br />
          最適な投稿テンプレートを自動生成しましょう
        </p>
        <a
          href="/analysis/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600
                     hover:bg-blue-700 text-white font-medium rounded-lg
                     transition-colors min-h-[44px]"
        >
          最初の分析を始める
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {analyses.map((analysis) => (
        <AnalysisCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  )
}
```

### 3. 分析カードコンポーネント (`analysis-card.tsx`)

Server Component として実装。各分析のサマリー情報をカード形式で表示する。

```typescript
import Link from 'next/link'

interface AnalysisCardProps {
  analysis: {
    id: string
    source_type: string
    source_identifier: string
    source_display_name: string | null
    status: string
    post_count: number | null
    error_message: string | null
    created_at: string
  }
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const isClickable = analysis.status === 'completed'
  const displayName = analysis.source_display_name || analysis.source_identifier

  const card = (
    <div
      className={`bg-white/5 border border-white/10 rounded-xl p-5
                  transition-all duration-200 ${
                    isClickable ? 'hover:bg-white/10 hover:border-white/20 cursor-pointer' : ''
                  }`}
    >
      {/* ヘッダー: ソースタイプバッジ + ステータスバッジ */}
      <div className="flex items-center justify-between mb-3">
        <SourceTypeBadge type={analysis.source_type} />
        <StatusBadge status={analysis.status} />
      </div>

      {/* 表示名 */}
      <h3 className="text-white font-medium mb-2 truncate">{displayName}</h3>

      {/* メタ情報 */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        {analysis.post_count && (
          <span>{analysis.post_count}件</span>
        )}
        <span>{new Date(analysis.created_at).toLocaleDateString('ja-JP')}</span>
      </div>

      {/* エラーメッセージ */}
      {analysis.status === 'failed' && analysis.error_message && (
        <p className="mt-2 text-xs text-red-400 truncate">
          {analysis.error_message}
        </p>
      )}
    </div>
  )

  if (isClickable) {
    return <Link href={`/analysis/${analysis.id}`}>{card}</Link>
  }

  return card
}
```

### 4. ステータスバッジ

```typescript
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: '準備中',
      className: 'bg-slate-500/20 text-slate-400',
    },
    analyzing: {
      label: '分析中',
      className: 'bg-yellow-500/20 text-yellow-400',
    },
    completed: {
      label: '完了',
      className: 'bg-green-500/20 text-green-400',
    },
    failed: {
      label: '失敗',
      className: 'bg-red-500/20 text-red-400',
    },
  }

  const { label, className } = config[status] || config.pending

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${className}`}>
      {label}
    </span>
  )
}
```

### 5. ソースタイプバッジ

```typescript
function SourceTypeBadge({ type }: { type: string }) {
  if (type === 'instagram') {
    return (
      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
        Instagram
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 bg-blue-600/15 text-blue-400 text-xs rounded-full">
      ブログ
    </span>
  )
}
```

### 6. スケルトンコンポーネント (`analysis-skeleton.tsx`)

Suspense フォールバック用。カードのプレースホルダーを表示する。

```typescript
export function AnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse"
        >
          {/* バッジ行 */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-20 bg-white/10 rounded-full" />
            <div className="h-5 w-16 bg-white/10 rounded-full" />
          </div>
          {/* タイトル */}
          <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
          {/* メタ情報 */}
          <div className="flex gap-3">
            <div className="h-4 w-12 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 7. サイドバーへのメニュー追加

SPEC-PHASE4.md セクション 6.3 に従い、サイドバーに「分析」メニューを追加する。

```typescript
// 既存のサイドバーナビゲーション項目に追加
{
  label: '分析',
  href: '/analysis',
  icon: '🔍',
}
```

配置順序: ダッシュボード → 投稿作成 → 履歴 → **分析** → キャラクター → 設定

## 受入条件

- `/analysis` にアクセスすると分析一覧が表示される
- 認証チェック（`auth()`）が実装されており、未認証ユーザーはリダイレクトされる
- 各分析カードにソースタイプバッジ（Instagram: 紫、ブログ: 青）が表示される
- 各分析カードにステータスバッジ（準備中: グレー、分析中: 黄、完了: 緑、失敗: 赤）が表示される
- 完了した分析のカードをクリックすると `/analysis/[id]` に遷移する
- 分析中・失敗の分析カードはクリック不可
- 「新規分析」ボタンが `/analysis/new` にリンクしている
- 分析がない場合に空状態（「まだ分析がありません」+ CTA）が表示される
- Suspense でデータフェッチ中にスケルトンが表示される
- サイドバーに「🔍 分析」メニューが追加されている
- レスポンシブデザイン（モバイル: 1カラム、md: 2カラム、lg: 3カラム）
- バッジのスタイルが既存の投稿バッジ（履歴ページ）と統一されている

## TODO

- [x] `src/app/(dashboard)/analysis/page.tsx` を新規作成（Server Component + Suspense）
- [x] `src/components/analysis/analysis-list.tsx` を新規作成（Server async Component）
- [x] `src/components/analysis/analysis-card.tsx` を新規作成（Server Component）
- [x] `src/components/analysis/analysis-skeleton.tsx` を新規作成
- [x] `StatusBadge` コンポーネントを実装（4状態: pending/analyzing/completed/failed）
- [x] `SourceTypeBadge` コンポーネントを実装（Instagram: 紫、Blog: 緑）
- [x] 空状態の表示を実装（「まだ分析がありません」+ CTA）
- [x] サイドバーに「🔍 分析」メニューを追加 → 既に追加済み（sidebar.tsx, mobile-nav.tsx）
- [x] 分析一覧の降順ソート（作成日時）を確認
- [x] レスポンシブグリッドの実装（1/2/3カラム）
- [x] ダークテーマの配色を既存UIと統一
- [x] `npm run build` 成功
