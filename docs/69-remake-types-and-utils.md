# 69: リメイク型定義・ユーティリティ

**ステータス**: 未着手
**Phase**: 5
**依存**: #68

## 概要

リメイク機能に必要な型定義、データ変換関数、認証ヘルパーを追加する。

## 作業内容

### 新規: src/types/remake.ts
- `RemakeSuggestion` インターフェース（camelCase）
- `RemakeSuggestionRow` インターフェース（snake_case）
- `toRemakeSuggestion()` 変換関数

### 変更: src/types/create-flow.ts
- `CreateFormState` にリメイクフィールド追加
  - `isRemakeMode`, `remakeSourceId`, `remakeSourceCaption`, `remakeSourcePostType`
- `INITIAL_FORM_STATE` に初期値追加

### 変更: src/types/history-detail.ts
- `Post` に `remake_source_id` と `remake_source` 追加

### 変更: src/lib/api-utils.ts
- `requireRemakeSuggestionOwnership()` 追加

## Todo

- [ ] src/types/remake.ts 作成
- [ ] CreateFormState にリメイクフィールド追加
- [ ] history-detail.ts の Post 型更新
- [ ] api-utils.ts に所有権チェック追加
- [ ] ビルド確認
