# チケット #58: 分析結果詳細ページ

> Phase 4B | 優先度: 高 | 依存: #56

## 概要

分析結果の詳細ページ `/analysis/[id]` を実装する。AI分析で抽出された4要素（投稿タイプの傾向、トーン・文体、ハッシュタグ戦略、投稿頻度・タイミング）を視覚的に分かりやすく表示する。CSSベースのチャート（外部ライブラリ不使用）、展開可能なセクション、サマリー表示を含む。Server Component アーキテクチャで `auth()` + `createServerClient()` を使用する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(dashboard)/analysis/[id]/page.tsx` | 新規作成 |
| `src/components/analysis/analysis-report.tsx` | 新規作成 |
| `src/components/analysis/post-type-chart.tsx` | 新規作成 |
| `src/components/analysis/tone-display.tsx` | 新規作成 |
| `src/components/analysis/hashtag-display.tsx` | 新規作成 |
| `src/components/analysis/posting-pattern.tsx` | 新規作成 |

## 変更内容

### 1. ページコンポーネント (`/analysis/[id]/page.tsx`)

Server Component として実装。認証チェック + Supabase直接クエリでデータ取得。

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { AnalysisReport } from '@/components/analysis/analysis-report'

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const supabase = createServerClient()

  const { data: analysis, error } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !analysis) {
    redirect('/analysis')
  }

  // ステータスが completed でない場合はリダイレクト
  if (analysis.status !== 'completed') {
    redirect('/analysis')
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            分析レポート
          </h1>
          <p className="text-slate-400">
            {analysis.source_display_name}
            （{analysis.post_count}件 / {new Date(analysis.created_at).toLocaleDateString('ja-JP')}）
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SourceTypeBadge type={analysis.source_type} />
        </div>
      </div>

      {/* 分析レポート本体 */}
      <AnalysisReport
        sourceType={analysis.source_type}
        result={analysis.analysis_result}
      />

      {/* CTA: テンプレート生成 */}
      <div className="flex justify-center pt-6">
        <a
          href={`/analysis/${id}/generate`}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium
                     rounded-lg transition-colors min-h-[44px] flex items-center gap-2"
        >
          この分析からテンプレートを生成
        </a>
      </div>
    </div>
  )
}
```

### 2. レポートコンポーネント (`analysis-report.tsx`)

Instagram分析とブログ分析の両方に対応するレポートレイアウト。

```typescript
import { PostTypeChart } from './post-type-chart'
import { ToneDisplay } from './tone-display'
import { HashtagDisplay } from './hashtag-display'
import { PostingPattern } from './posting-pattern'
import type { InstagramAnalysisResult, BlogAnalysisResult } from '@/types/analysis'

interface AnalysisReportProps {
  sourceType: string
  result: InstagramAnalysisResult | BlogAnalysisResult
}

export function AnalysisReport({ sourceType, result }: AnalysisReportProps) {
  if (sourceType === 'instagram') {
    const igResult = result as InstagramAnalysisResult
    return (
      <div className="space-y-6">
        {/* サマリーセクション */}
        <SummarySection
          summary={igResult.summary}
          keyFactors={igResult.key_success_factors}
        />

        {/* 4要素セクション */}
        <PostTypeChart distribution={igResult.post_type_distribution} />
        <ToneDisplay tone={igResult.tone_analysis} />
        <HashtagDisplay strategy={igResult.hashtag_strategy} />
        <PostingPattern pattern={igResult.posting_pattern} />
      </div>
    )
  }

  // ブログ分析の場合
  const blogResult = result as BlogAnalysisResult
  return (
    <div className="space-y-6">
      <SummarySection summary={blogResult.summary} />
      {/* ブログ固有のセクションは Phase 4C で拡張 */}
    </div>
  )
}
```

### 3. 投稿タイプの傾向チャート (`post-type-chart.tsx`)

CSSベースの横棒グラフで投稿タイプの割合を視覚化する。外部チャートライブラリは使用しない。

```typescript
interface PostTypeChartProps {
  distribution: InstagramAnalysisResult['post_type_distribution']
}

export function PostTypeChart({ distribution }: PostTypeChartProps) {
  // types を percentage 降順でソート
  const sorted = [...distribution.types].sort((a, b) => b.percentage - a.percentage)

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">投稿タイプの傾向</h2>

      <div className="space-y-4">
        {sorted.map((type, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-white font-medium">{type.category}</span>
              <span className="text-slate-400">{type.percentage}%</span>
            </div>
            {/* CSSベース横棒グラフ */}
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${type.percentage}%`,
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              平均エンゲージメント: {type.avg_engagement.toFixed(1)}%
              {type.example_caption && ` | 例: ${type.example_caption.slice(0, 40)}...`}
            </p>
          </div>
        ))}
      </div>

      {/* 推奨配分 */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-sm text-slate-300">
          <span className="text-blue-400 font-medium">推奨: </span>
          {distribution.recommendation}
        </p>
      </div>
    </section>
  )
}

const BAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
```

### 4. トーン・文体表示 (`tone-display.tsx`)

キー・バリュー形式の情報表示 + 特徴的フレーズのリスト。

```typescript
interface ToneDisplayProps {
  tone: InstagramAnalysisResult['tone_analysis']
}

export function ToneDisplay({ tone }: ToneDisplayProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">トーン・文体</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem label="主なトーン" value={tone.primary_tone} />
        <InfoItem label="フォーマル度" value={`${tone.formality_level}/5`} />
        <InfoItem label="絵文字の使い方" value={tone.emoji_usage} />
        <InfoItem label="文章スタイル" value={tone.sentence_style} />
        <InfoItem label="一人称" value={tone.first_person} />
        <InfoItem label="CTA スタイル" value={tone.call_to_action_style} />
      </div>

      {/* 特徴的フレーズ */}
      {tone.sample_phrases.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-slate-300 mb-2">特徴的なフレーズ:</p>
          <div className="flex flex-wrap gap-2">
            {tone.sample_phrases.map((phrase, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full"
              >
                「{phrase}」
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
```

### 5. ハッシュタグ戦略表示 (`hashtag-display.tsx`)

カテゴリ別タグクラウド + パフォーマンス上位タグのハイライト。

```typescript
interface HashtagDisplayProps {
  strategy: InstagramAnalysisResult['hashtag_strategy']
}

export function HashtagDisplay({ strategy }: HashtagDisplayProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">ハッシュタグ戦略</h2>

      <p className="text-sm text-slate-400 mb-4">
        平均使用数: <span className="text-white font-medium">{strategy.avg_count}個/投稿</span>
      </p>

      {/* カテゴリ別タグ */}
      {strategy.categories.map((cat, i) => (
        <div key={i} className="mb-4">
          <p className="text-sm font-medium text-slate-300 mb-2">
            {getCategoryLabel(cat.type)}（使用頻度: {cat.frequency}%）
          </p>
          <div className="flex flex-wrap gap-2">
            {cat.tags.map((tag, j) => (
              <span
                key={j}
                className={`px-2 py-1 text-xs rounded-full ${
                  strategy.top_performing_tags.includes(tag)
                    ? 'bg-green-500/20 text-green-400 font-medium'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* 推奨タグ */}
      {strategy.recommended_tags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-blue-400 mb-2">推奨ハッシュタグ:</p>
          <div className="flex flex-wrap gap-2">
            {strategy.recommended_tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function getCategoryLabel(type: string): string {
  const labels: Record<string, string> = {
    brand: 'ブランド',
    region: '地域',
    genre: 'ジャンル',
    trend: 'トレンド',
  }
  return labels[type] || type
}
```

### 6. 投稿頻度・タイミング表示 (`posting-pattern.tsx`)

週間スケジュール風の表示で投稿パターンを可視化。

```typescript
interface PostingPatternProps {
  pattern: InstagramAnalysisResult['posting_pattern']
}

const DAYS_OF_WEEK = ['月', '火', '水', '木', '金', '土', '日']

export function PostingPattern({ pattern }: PostingPatternProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">投稿頻度・タイミング</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <InfoItem label="週間投稿数" value={`平均 ${pattern.avg_posts_per_week}回/週`} />
        <InfoItem label="投稿の規則性" value={pattern.posting_consistency} />
      </div>

      {/* 曜日別アクティビティ */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-300 mb-2">投稿が多い曜日:</p>
        <div className="flex gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                pattern.most_active_days.includes(day)
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-slate-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* 時間帯 */}
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-300 mb-2">投稿が多い時間帯:</p>
        <div className="flex flex-wrap gap-2">
          {pattern.most_active_hours.map((hour, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm rounded-full"
            >
              {hour}
            </span>
          ))}
        </div>
      </div>

      {/* 推奨 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-sm text-slate-300">
          <span className="text-blue-400 font-medium">推奨: </span>
          {pattern.recommendation}
        </p>
      </div>
    </section>
  )
}
```

### 7. サマリーセクション

ページ上部に表示する総合サマリー + 成功要因トップ3。

```typescript
function SummarySection({
  summary,
  keyFactors,
}: {
  summary: string
  keyFactors?: string[]
}) {
  return (
    <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10
                        border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-3">総合サマリー</h2>
      <p className="text-slate-300 leading-relaxed">{summary}</p>

      {keyFactors && keyFactors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-white mb-2">成功要因トップ3:</p>
          <ol className="list-decimal list-inside space-y-1">
            {keyFactors.map((factor, i) => (
              <li key={i} className="text-sm text-slate-300">{factor}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
```

## 受入条件

- `/analysis/[id]` にアクセスすると分析結果が4セクションで表示される
- 認証チェック（`auth()`）が実装されており、未認証ユーザーはリダイレクトされる
- 所有権チェック（`user_id` 一致）が実装されている
- 投稿タイプの傾向がCSSベースの横棒グラフで表示される
- トーン・文体がキー・バリュー + フレーズリスト形式で表示される
- ハッシュタグがカテゴリ別にタグクラウド形式で表示され、パフォーマンス上位がハイライトされる
- 投稿頻度が曜日別 + 時間帯で表示される
- サマリーと成功要因がページ上部に表示される
- ソース情報（アカウント名/ブログURL、投稿数、分析日）が表示される
- 「この分析からテンプレートを生成」CTAボタンが `/analysis/[id]/generate` にリンクしている
- ステータスが `completed` でない分析はリダイレクトされる
- レスポンシブデザイン（モバイル/タブレット/デスクトップ）

## TODO

- [ ] `src/app/(dashboard)/analysis/[id]/page.tsx` を新規作成（Server Component）
- [ ] `src/components/analysis/analysis-report.tsx` を新規作成
- [ ] `src/components/analysis/post-type-chart.tsx` を新規作成（CSSベース横棒グラフ）
- [ ] `src/components/analysis/tone-display.tsx` を新規作成（キー・バリュー + フレーズリスト）
- [ ] `src/components/analysis/hashtag-display.tsx` を新規作成（カテゴリ別タグクラウド）
- [ ] `src/components/analysis/posting-pattern.tsx` を新規作成（曜日別 + 時間帯表示）
- [ ] `SummarySection` コンポーネントを実装（サマリー + 成功要因）
- [ ] `SourceTypeBadge` コンポーネントを実装（Instagram/ブログ）
- [ ] `InfoItem` 共通コンポーネントを実装（ラベル + 値）
- [ ] ブログ分析結果の表示対応（基本レイアウト）
- [ ] レスポンシブデザインの実装（モバイル: 1カラム、md以上: 2カラムグリッド）
- [ ] ダークテーマの配色を既存UIと統一
