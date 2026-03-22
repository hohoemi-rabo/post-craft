# 79: ナビゲーション・ミドルウェア更新

**ステータス**: 未着手
**Phase**: 5
**依存**: #77

## 概要

サイドメニュー、モバイルナビ、ミドルウェアにレポートページを追加する。

## 作業内容

### サイドバー（sidebar.tsx）
- 💡 アイデアの下に `{ href: '/reports', label: '投稿レポート', icon: '📊' }` 追加

### モバイルナビ（mobile-nav.tsx）
- 同上

### ミドルウェア（middleware.ts）
- matcher に `'/reports/:path*'` 追加

### CLAUDE.md 更新
- プロジェクト構造にレポートページ追加
- ナビゲーションアイコン一覧更新

## Todo

- [ ] sidebar.tsx にメニュー追加
- [ ] mobile-nav.tsx にメニュー追加
- [ ] middleware.ts に /reports パス追加
- [ ] CLAUDE.md 更新
- [ ] ビルド確認
