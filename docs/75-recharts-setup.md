# 75: Recharts 導入・チャート共通設定

**ステータス**: 未着手
**Phase**: 5
**依存**: なし

## 概要

投稿レポートページで使用するチャートライブラリ Recharts を導入し、ダークテーマに合わせた共通設定を用意する。

## 作業内容

### パッケージインストール
```bash
npm install recharts
```

### ダークテーマ設定
- テキスト色: `#94A3B8`（slate-400）
- グリッド色: `rgba(255, 255, 255, 0.05)`
- ツールチップ背景: `#1E293B`（slate-800）
- ツールチップボーダー: `rgba(255, 255, 255, 0.1)`

### 使用コンポーネント
- `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`（円グラフ）
- `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`（棒グラフ）
- `ResponsiveContainer`（レスポンシブ対応）

### 色パレット定数
```typescript
const TYPE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6']
```

## Todo

- [ ] npm install recharts
- [ ] チャート共通設定（色・テーマ）の定数ファイル作成
- [ ] ビルド確認
