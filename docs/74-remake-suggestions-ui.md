# 74: リメイク提案UI（履歴詳細）

**ステータス**: 完了
**Phase**: 5
**依存**: #73

## 概要

履歴詳細ページにAIリメイク提案セクションを追加する。

## 作業内容

### 新規: src/hooks/useRemakeSuggestions.ts
- 提案一覧の取得（sourcePostId指定）
- 提案の生成（AI呼び出し）
- 提案の削除
- 提案の使用済みマーク
- ローディング・エラー状態管理

### 新規: src/components/remake/remake-suggestions.tsx
- 「🔄 リメイク提案」セクション
- 「AIで提案を生成」ボタン
- 提案カードのリスト表示

### 新規: src/components/remake/remake-suggestion-card.tsx
- 提案タイプ × プロフィール表示
- 提案理由・方向性の表示
- 「この案でリメイク」ボタン → `/create?remakeFrom={postId}&suggestedType={slug}&suggestedProfile={profileId}`
- 「削除」ボタン

### 変更: post-detail-client.tsx
- リメイク提案セクションを投稿詳細の下に追加（編集モード時は非表示）

## Todo

- [x] useRemakeSuggestions フック作成
- [x] remake-suggestion-card.tsx 作成
- [x] remake-suggestions.tsx 作成
- [x] 履歴詳細ページに提案セクション追加
- [x] 「この案でリメイク」の遷移動作確認
- [x] ビルド確認
