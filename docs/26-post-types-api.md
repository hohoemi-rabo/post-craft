# チケット #26: 投稿タイプ API

> Phase 3 | 優先度: 高 | 依存: #23, #24

## 概要

`/api/post-types` の全エンドポイント（CRUD + 並び替え + 複製）を実装する。既存の `requireAuth` パターン（`src/lib/api-utils.ts`）に従う。

SPEC-PHASE3.md セクション 7.1-7.2 に準拠。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/post-types/route.ts` | 新規作成（GET, POST） |
| `src/app/api/post-types/[id]/route.ts` | 新規作成（GET, PUT, DELETE） |
| `src/app/api/post-types/[id]/duplicate/route.ts` | 新規作成（POST） |
| `src/app/api/post-types/reorder/route.ts` | 新規作成（PUT） |

## エンドポイント仕様

### GET /api/post-types
- 認証必須
- `sort_order` 順で一覧取得
- レスポンス: `{ postTypes: PostTypeDB[], count: number, maxCount: 10 }`

### POST /api/post-types
- 認証必須
- 上限10個チェック
- `slug` 省略時は `name` から自動生成（日本語→英語変換 or タイムスタンプ）
- `slug` 重複時は 409 エラー
- `sort_order` は自動で末尾に設定
- バリデーション: name 50文字, description 200文字, template_structure 2000文字, placeholders 最大10個

### GET /api/post-types/[id]
- 認証必須 + 所有権チェック

### PUT /api/post-types/[id]
- 認証必須 + 所有権チェック
- 部分更新対応（渡されたフィールドのみ更新）
- `slug` は変更不可

### DELETE /api/post-types/[id]
- 認証必須 + 所有権チェック
- レスポンス: `{ deleted: true, affectedPosts: number }`
- ON DELETE SET NULL で安全に削除

### POST /api/post-types/[id]/duplicate
- 認証必須 + 所有権チェック
- 上限10個チェック
- name に「のコピー」付与、slug に `-copy-{timestamp}` 付与
- sort_order は末尾に設定

### PUT /api/post-types/reorder
- 認証必須
- リクエスト: `{ items: [{ id: string, sortOrder: number }] }`
- バッチ更新（全アイテムの sort_order を一括更新）

## 受入条件

- 全7エンドポイントが正常に動作する
- 上限10個の制限が機能する（11個目の作成で 400 エラー）
- slug 重複時に 409 エラーが返る
- 削除時に `affectedPosts` が正しい値を返す
- 認証なしリクエストで 401 が返る
- 他ユーザーのデータにアクセスで 404 が返る

## TODO

- [ ] `src/app/api/post-types/route.ts` を作成（GET: 一覧取得）
- [ ] `src/app/api/post-types/route.ts` に POST を追加（新規作成 + バリデーション + 上限チェック）
- [ ] `src/app/api/post-types/[id]/route.ts` を作成（GET: 詳細取得）
- [ ] `src/app/api/post-types/[id]/route.ts` に PUT を追加（更新）
- [ ] `src/app/api/post-types/[id]/route.ts` に DELETE を追加（削除 + affectedPosts）
- [ ] `src/app/api/post-types/[id]/duplicate/route.ts` を作成（複製）
- [ ] `src/app/api/post-types/reorder/route.ts` を作成（並び替え）
- [ ] slug 自動生成ロジックを実装
- [ ] バリデーション（name 50文字, description 200文字, template 2000文字, placeholders 最大10個）
- [ ] 動作確認（全エンドポイント）
