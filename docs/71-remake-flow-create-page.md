# 71: リメイク投稿作成フロー

**ステータス**: 完了
**Phase**: 5
**依存**: #69, #70

## 概要

`/create` ページにリメイクモードを追加する。URLパラメータ `remakeFrom` でリメイクモードに切り替わり、元投稿のデータを引き継いで新規投稿を作成する。

## 作業内容

### create/page.tsx
- URLパラメータ `remakeFrom`, `suggestedType`, `suggestedProfile` の処理
- `remakeFrom` がある場合、元投稿データを `/api/posts/[id]` から取得
- `formState` にリメイク情報をセット
- リメイクモード時のヘッダー表示（元投稿の概要 + 「投稿タイプやプロフィールを変えて」案内）

### StepPostType（変更）
- リメイクモード時に元タイプに「元の投稿」バッジ表示
- 「別のタイプを選ぶと、同じ内容を違う切り口で投稿できます」案内

### StepContentInput（変更）
- リメイクモード時に元投稿のキャプションを折りたたみで参照表示

### キャプション生成API（変更）
- `remakeSourceCaption`, `remakeSourcePostType` パラメータ追加
- リメイクプロンプト（メモモード・フィールドモード両対応）

### useContentGeneration（変更）
- キャプション生成時にリメイク情報を送信
- 投稿保存時に `remakeSourceId` を送信

### StepResult（変更）
- リメイクモード時に「リメイク元」情報を表示 + 元投稿へのリンク

## Todo

- [x] URLパラメータ処理（remakeFrom, suggestedType, suggestedProfile）
- [x] 元投稿データ取得・formState セット
- [x] リメイクモードのヘッダーUI
- [x] StepPostType の元タイプバッジ
- [x] StepContentInput の元投稿プリセット + キャプション参照
- [x] useContentGeneration のリメイクプロンプト
- [x] StepResult のリメイク元表示
- [x] 投稿保存時に remake_source_id を送信
- [x] ビルド確認
