# 77: レポートページUI

**ステータス**: 完了
**Phase**: 5
**依存**: #75, #76

## 概要

投稿レポートページのUI全体を実装する。期間フィルター、サマリーカード、グラフ4種を配置。

## 作業内容

### 新規ページ: src/app/(dashboard)/reports/page.tsx

### 新規コンポーネント

| ファイル | 説明 |
|---------|------|
| `reports-page-client.tsx` | レポートページ本体（データ取得 + レイアウト） |
| `period-filter.tsx` | 期間フィルター（1ヶ月/3ヶ月/全期間） |
| `summary-cards.tsx` | サマリーカード × 4（総投稿数、投稿済み、未投稿、今月） |
| `post-type-chart.tsx` | 投稿タイプ別円グラフ + 凡例 |
| `profile-chart.tsx` | プロフィール別円グラフ + 凡例 |
| `frequency-chart.tsx` | 投稿頻度棒グラフ（週別/月別切り替えタブ） |
| `hashtag-ranking.tsx` | ハッシュタグランキング（横バー + 必須タグ除外トグル） |
| `reports-skeleton.tsx` | ローディングスケルトン |

## Todo

- [x] reports/page.tsx 作成
- [x] reports-page-client.tsx 作成（データ取得 + レイアウト）
- [x] period-filter.tsx 作成
- [x] summary-cards.tsx 作成
- [x] post-type-chart.tsx 作成（PieChart）
- [x] profile-chart.tsx 作成（PieChart）
- [x] frequency-chart.tsx 作成（BarChart + 週別/月別切替）
- [x] hashtag-ranking.tsx 作成
- [x] reports-skeleton.tsx 作成
- [x] レスポンシブ対応確認
- [x] ビルド確認
