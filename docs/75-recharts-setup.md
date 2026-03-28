# 75: Recharts 導入・チャート共通設定

**ステータス**: 完了
**Phase**: 5
**依存**: なし

## 概要

投稿レポートページで使用するチャートライブラリ Recharts を導入し、ダークテーマに合わせた共通設定を用意する。

## 作業内容

### パッケージインストール
```bash
npm install recharts
```

### 新規: src/lib/chart-config.ts
- `CHART_COLORS`: 10色パレット
- `CHART_THEME`: ダークテーマ設定（テキスト、グリッド、ツールチップ）

## Todo

- [x] npm install recharts
- [x] チャート共通設定（色・テーマ）の定数ファイル作成
- [x] ビルド確認
