# 76: レポート集計API

**ステータス**: 未着手
**Phase**: 5
**依存**: #68

## 概要

投稿レポートページ用の集計データを返すAPIを実装する。

## 作業内容

### 新規: src/types/reports.ts
- `PeriodFilter`, `ReportSummary`, `TypeBreakdown`, `ProfileBreakdown`
- `WeeklyFrequency`, `MonthlyFrequency`, `FrequencyData`
- `HashtagRank`, `ReportData`

### 新規: GET /api/reports
- クエリパラメータ: `?period=1m|3m|all`（デフォルト: `all`）
- レスポンス: `ReportData`

### 集計内容

#### サマリー
- 総投稿数、投稿済み数、未投稿数（期間フィルター適用）
- 今月の投稿数（期間フィルター無視、常に当月）

#### 投稿タイプ別
- post_types JOIN で投稿タイプごとの投稿数・比率
- `post_type_id` NULL は「その他」

#### プロフィール別
- profiles JOIN でプロフィールごとの投稿数・比率
- `profile_id` NULL は「未分類」

#### 時系列頻度
- 週別: 週の開始日・終了日・ラベル・投稿数
- 月別: 月・ラベル・投稿数

#### ハッシュタグランキング
- generated_hashtags を集計、TOP 15
- 必須ハッシュタグかどうかのフラグ付き

## Todo

- [ ] src/types/reports.ts 作成
- [ ] GET /api/reports 実装
- [ ] サマリー集計ロジック
- [ ] 投稿タイプ別集計（JOIN）
- [ ] プロフィール別集計（JOIN）
- [ ] 時系列頻度集計（週別・月別）
- [ ] ハッシュタグランキング集計
- [ ] 期間フィルター対応
- [ ] ビルド確認
