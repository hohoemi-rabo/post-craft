# 76: レポート集計API

**ステータス**: 完了
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
- 全集計をサーバーサイドで実行（DB→Map集計）

## Todo

- [x] src/types/reports.ts 作成
- [x] GET /api/reports 実装
- [x] サマリー集計ロジック
- [x] 投稿タイプ別集計（JOIN）
- [x] プロフィール別集計（JOIN）
- [x] 時系列頻度集計（週別・月別）
- [x] ハッシュタグランキング集計
- [x] 期間フィルター対応
- [x] ビルド確認
