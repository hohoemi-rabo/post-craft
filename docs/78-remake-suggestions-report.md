# 78: レポートページのリメイクおすすめセクション

**ステータス**: 完了
**Phase**: 5
**依存**: #73, #77

## 概要

投稿レポートページに「リメイクおすすめ」セクションを追加する。全投稿からAIが3〜5件のリメイク候補を提案する。

## 作業内容

### 新規: src/components/remake/remake-suggestions-report.tsx
- レポートページ用のリメイク提案セクション
- useRemakeSuggestions を context: 'report' で使用
- 各提案カードに元投稿へのリンク付き

### 変更: reports-page-client.tsx
- 最下部にリメイクおすすめセクション配置

## Todo

- [x] remake-suggestions-report.tsx 作成
- [x] reports-page-client.tsx にセクション追加
- [x] 提案カードのUI（元投稿概要 + 提案内容 + アクション）
- [x] ビルド確認
