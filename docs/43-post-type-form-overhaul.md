# チケット #43: 投稿タイプ登録・編集画面の改修

> Phase 3 Revised | 優先度: 高 | 依存: #38, #41

## 概要

`src/components/settings/post-type-form.tsx` を大幅に改修する。現在の「ユーザーがテンプレート + プレースホルダーを直接編集」方式から、「ユーザーがメモ書きで意図を伝え → AIが全て生成 → プレビューで確認 → 保存」方式に変更する。プレビューモーダルを新規作成。API側も新フィールド対応を追加。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/settings/post-type-form.tsx` | 大幅更新 |
| `src/components/settings/post-type-preview-modal.tsx` | 新規作成 |
| `src/app/api/post-types/route.ts` | 更新（新フィールド対応） |
| `src/app/api/post-types/[id]/route.ts` | 更新（新フィールド対応） |

## 画面構成

SPEC-PHASE3-REVISED.md セクション2.2の画面イメージに準拠。

### PostTypeForm の改修内容

**セクション1: 基本情報（既存 + 変更）**
- アイコン（EmojiPicker）- 変更なし
- タイプ名 - 変更なし
- 説明文 - 変更なし
- 文字数目安（最小/最大） - 変更なし
- **入力方式（新規）**: ラジオボタン（「項目別入力」/ 「メモ書き入力」）
- 有効/無効（編集モードのみ） - 変更なし

**セクション2: メモ書き入力（新規、旧セクション2・3を置換）**
- textarea（プレースホルダー: 「どんな投稿にしたいかをメモ書きで入力してください」）
- 「AIで生成してプレビュー」ボタン → `POST /api/generate/post-type` 呼び出し → プレビューモーダル表示

**旧セクション（削除）**
- PlaceholderEditor（プレースホルダー変数の直接編集）
- TemplateEditor（テンプレート構造の直接編集）
- プレビューセクション（旧形式）

### プレビューモーダル (`post-type-preview-modal.tsx`)

**表示内容**:
- タイプ別プロンプト（readonly textarea）
- テンプレート構造（readonly textarea）
- 入力項目リスト（`inputMode='fields'` の場合のみ）
- サンプル投稿

**アクションボタン**:
- 「メモ書きを修正して再生成」→ モーダルを閉じ、メモ書き入力に戻る
- 「この内容で保存」→ 生成結果 + 基本情報で POST/PUT API を呼び出して保存

### API 更新

**POST /api/post-types** と **PUT /api/post-types/[id]**:
- リクエストに `userMemo`, `typePrompt`, `inputMode` を追加
- DB insert/update に `user_memo`, `type_prompt`, `input_mode` を含める
- PUT のホワイトリストに `user_memo`, `type_prompt`, `input_mode` を追加

## 受入条件

- メモ書き入力→AI生成→プレビュー→保存の全フローが動作する
- プレビューモーダルにタイプ別プロンプト・テンプレート・入力項目・サンプル投稿が表示される
- 「この内容で保存」で正常に保存される
- 編集モードで既存タイプの再編集が動作する（メモ書き再入力→再生成可能）
- 入力方式ラジオボタンが正しく動作する
- ビルトイン7タイプの編集も正常に動作する
- モバイル表示が正常

## TODO

- [x] `src/components/settings/post-type-form.tsx` を改修
  - [x] 入力方式ラジオボタン追加（`fields` / `memo`）
  - [x] メモ書き入力 textarea 追加
  - [x] 「AIで生成してプレビュー」ボタン追加
  - [x] `POST /api/generate/post-type` の呼び出しロジック
  - [x] 旧 PlaceholderEditor / TemplateEditor セクションを削除
  - [x] プレビューモーダルとの連携
  - [x] 編集モード: 既存の `userMemo` を初期値として表示
  - [x] バリデーション更新
- [x] `src/components/settings/post-type-preview-modal.tsx` を作成
  - [x] タイプ別プロンプト表示
  - [x] テンプレート構造表示
  - [x] 入力項目リスト表示（`inputMode='fields'` のみ）
  - [x] サンプル投稿表示
  - [x] 「メモ書きを修正して再生成」ボタン
  - [x] 「この内容で保存」ボタン
- [x] `src/app/api/post-types/route.ts` を更新（POST に新フィールド追加）
- [x] `src/app/api/post-types/[id]/route.ts` を更新（PUT に新フィールド追加）
- [x] モバイル対応確認
- [x] `npm run build` 成功を確認
