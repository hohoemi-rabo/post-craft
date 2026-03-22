# 71: リメイク投稿作成フロー

**ステータス**: 未着手
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
- リメイクモード時に元投稿の入力テキストをプリセット
- 元投稿のキャプションを折りたたみで参照表示

### useContentGeneration（変更）
- リメイクモード時のキャプション生成ロジック
- AIプロンプトにリメイク元のキャプション + 「新しいタイプで再構成してください」指示を追加

### StepResult（変更）
- リメイクモード時に「リメイク元」情報を表示
- 元投稿へのリンク

## Todo

- [ ] URLパラメータ処理（remakeFrom, suggestedType, suggestedProfile）
- [ ] 元投稿データ取得・formState セット
- [ ] リメイクモードのヘッダーUI
- [ ] StepPostType の元タイプバッジ
- [ ] StepContentInput の元投稿プリセット + キャプション参照
- [ ] useContentGeneration のリメイクプロンプト
- [ ] StepResult のリメイク元表示
- [ ] 投稿保存時に remake_source_id を送信
- [ ] ビルド確認
