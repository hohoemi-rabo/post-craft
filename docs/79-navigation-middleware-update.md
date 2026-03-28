# 79: ナビゲーション・ミドルウェア更新

**ステータス**: 完了
**Phase**: 5
**依存**: #77

## 概要

サイドメニュー、モバイルナビ、ミドルウェアにレポートページを追加する。

## 作業内容

### サイドバー（sidebar.tsx）
- 💡 アイデアの下に `📊 投稿レポート` 追加

### モバイルナビ（mobile-nav.tsx）
- 💡 アイデアの下に `📊 レポート` 追加

### ミドルウェア（middleware.ts）
- matcher に `'/reports/:path*'` 追加

## Todo

- [x] sidebar.tsx にメニュー追加
- [x] mobile-nav.tsx にメニュー追加
- [x] middleware.ts に /reports パス追加
- [x] ビルド確認
