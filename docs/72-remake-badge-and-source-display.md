# 72: リメイクバッジ・リメイク元表示

**ステータス**: 未着手
**Phase**: 5
**依存**: #70

## 概要

リメイクで作成された投稿に「🔄 リメイク」バッジを表示し、履歴詳細ページでリメイク元の情報を表示する。

## 作業内容

### 履歴一覧（history-post-card.tsx）
- `remake_source_id` が存在する場合、オレンジ色のリメイクバッジ表示
- `bg-orange-500/20 text-orange-400`

### 履歴詳細（post-detail-client.tsx）
- リメイク元情報セクション追加
  - 元投稿のタイプ・日付・キャプション冒頭
  - 「元投稿を見る」リンク

### 新規コンポーネント: remake-source-info.tsx
- リメイク元の概要を表示するコンポーネント
- 履歴詳細 + StepResult で再利用

### 履歴詳細ページ
- 「🔄 リメイク」ボタンを既存アクションボタン列に追加
- クリックで `/create?remakeFrom={postId}` に遷移

## Todo

- [ ] history-post-card.tsx にリメイクバッジ追加
- [ ] remake-source-info.tsx コンポーネント作成
- [ ] post-detail-client.tsx にリメイク元情報セクション追加
- [ ] 履歴詳細に「リメイク」ボタン追加
- [ ] ビルド確認
