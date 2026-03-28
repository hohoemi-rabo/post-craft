# 70: 既存投稿APIのリメイク対応

**ステータス**: 完了
**Phase**: 5
**依存**: #68

## 概要

既存の投稿API（/api/posts）にリメイク関連のフィールドを追加する。

## 作業内容

### POST /api/posts
- リクエストに `remakeSourceId` フィールド追加
- 投稿作成時に `remake_source_id` を保存

### PATCH /api/posts/[id]
- ホワイトリストに `remake_source_id` 追加

### GET /api/posts, GET /api/posts/[id]
- `POST_SELECT_QUERY` に `remake_source:posts!remake_source_id(id, post_type, generated_caption, created_at)` を追加

## Todo

- [x] POST /api/posts に remakeSourceId 対応
- [x] PATCH /api/posts/[id] ホワイトリスト追加
- [x] GET レスポンスに remake_source JOIN 追加
- [x] POST_SELECT_QUERY 更新
- [x] ビルド確認
