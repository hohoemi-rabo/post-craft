# チケット #36: 統合 - 履歴表示・タイプ変更更新

> Phase 3 | 優先度: 高 | 依存: #26, #28, #35

## 概要

履歴一覧・詳細ページと投稿タイプ変更モーダルを更新し、DB管理の投稿タイプ情報を使用するようにする。削除されたタイプの投稿にも対応する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(dashboard)/history/page.tsx` | 更新 |
| `src/app/(dashboard)/history/[id]/page.tsx` | 更新 |
| `src/components/history/post-edit-modal.tsx` | 更新（PostTypeChangeModal） |
| `src/app/api/posts/route.ts` (GET) | 更新（JOINデータ追加） |
| `src/app/api/posts/[id]/route.ts` (GET, PATCH) | 更新 |

## 変更内容

### 1. 投稿一覧API（GET /api/posts）

レスポンスに `post_types` テーブルの JOIN データを含める:
```typescript
const { data } = await supabaseAdmin
  .from('posts')
  .select('*, post_images(*), post_type_ref:post_types(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

### 2. 投稿詳細API（GET /api/posts/[id]）

同様に JOIN データを含める。

### 3. 投稿更新API（PATCH /api/posts/[id]）

`post_type_id` をホワイトリストに追加。

### 4. 履歴一覧ページ

`POST_TYPES[post.post_type]` の参照を DB JOIN データで置き換え:
```typescript
// 変更前
const config = POST_TYPES[post.post_type]
const icon = config.icon

// 変更後
const typeData = post.post_type_ref  // JOIN データ
const icon = typeData?.icon || '📝'  // 削除されたタイプのフォールバック
const name = typeData?.name || '不明なタイプ'
```

### 5. 履歴詳細ページ

同様に DB JOIN データを使用。

### 6. タイプ変更モーダル（PostTypeChangeModal）

`POST_TYPES` 定数の代わりに `usePostTypes` フックでDB値を使用:
```typescript
const { activePostTypes } = usePostTypes()
// activePostTypes をタイプ選択肢として表示
```

### 7. 削除されたタイプの投稿

`post_type_id` が指す `post_types` レコードが削除された場合（ON DELETE SET NULL）:
- `post_type_ref` は `null` になる
- 表示: 「📝 不明なタイプ」または「削除されたタイプ」
- `post_type`（slug テキスト）は残っているので、最低限の表示は可能

## 受入条件

- 履歴一覧が正常に表示される（既存投稿含む）
- 投稿タイプのアイコン・名前がDB値で表示される
- 削除されたタイプの投稿が「不明なタイプ」として適切に表示される
- タイプ変更モーダルがDB管理のタイプ一覧を表示する
- フィルタ機能（タイプ別）が正常に動作する
- PATCH で `post_type_id` が更新できる

## TODO

- [x] `posts/route.ts` (GET) に `post_types` テーブルの JOIN を追加
- [x] `posts/[id]/route.ts` (GET) に JOIN を追加
- [x] `posts/[id]/route.ts` (PATCH) のホワイトリストに `post_type_id` を追加
- [x] 履歴一覧ページを更新（`POST_TYPES` → JOINデータ）
- [x] 履歴詳細ページを更新
- [x] 削除されたタイプのフォールバック表示を実装
- [x] タイプ変更モーダルを更新（`POST_TYPES` → `usePostTypes`）
- [x] フィルタ機能をDB値ベースに更新
- [ ] 既存投稿の表示テスト（全タイプ）
