# チケット #35: 統合 - 投稿作成フロー更新

> Phase 3 | 優先度: 高 | 依存: #28, #34

## 概要

投稿作成フロー（Step 1: タイプ選択、Step 2: 内容入力）と投稿保存APIを更新し、DB管理の投稿タイプを使用するようにする。

SPEC-PHASE3.md セクション 8.6 に準拠。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/create/step-post-type.tsx` | 更新 |
| `src/components/create/post-type-selector.tsx` | 更新（存在すれば） |
| `src/hooks/useContentGeneration.ts` | 更新 |
| `src/app/api/posts/route.ts` (POST) | 更新 |
| `src/types/create-flow.ts` | 更新（postTypeId 追加） |

## 変更内容

### 1. タイプ選択画面（step-post-type.tsx）

現在:
```typescript
import { POST_TYPES } from '@/lib/post-types'
// POST_TYPES をループして表示
```

変更後:
```typescript
import { usePostTypes } from '@/hooks/usePostTypes'
const { activePostTypes, isLoading } = usePostTypes()
// activePostTypes をループして表示（sort_order 順）
```

- DB から取得した有効タイプのみ表示
- ローディング中はスケルトン表示
- 「💡 投稿タイプは設定画面でカスタマイズできます」リンクを追加

### 2. フォーム状態の拡張（create-flow.ts）

`CreateFormState` に追加:
```typescript
postTypeId: string | null  // DB版の投稿タイプID
```

### 3. 生成ロジック（useContentGeneration.ts）

キャプション生成API呼び出し時:
```typescript
// 変更前
body: { postType: formState.postType, ... }

// 変更後
body: { postTypeId: formState.postTypeId, postType: formState.postType, ... }
```

投稿保存API呼び出し時:
```typescript
// 追加
body: { postTypeId: formState.postTypeId, ... }
```

### 4. 投稿保存API（posts/route.ts POST）

`post_type_id` をリクエストから受け取り保存:
```typescript
const { postTypeId, postType, ... } = body

await supabaseAdmin.from('posts').insert({
  post_type: postType,       // 後方互換性
  post_type_id: postTypeId,  // 新規追加
  ...
})
```

## 受入条件

- タイプ選択画面がDB管理の投稿タイプを表示する
- 無効化されたタイプが非表示になる
- 並び順がDB設定通りに表示される
- 投稿保存時に `post_type_id` が正しく記録される
- 既存の投稿作成フロー全体（全7ステップ）が問題なく動作する
- `image_read` タイプも正常に動作する

## TODO

- [x] `src/types/create-flow.ts` に `postTypeId` フィールドを追加
- [x] `step-post-type.tsx` を更新（`POST_TYPES` → `usePostTypes` フック）
- [x] タイプ選択画面のローディングスケルトン追加
- [x] 「設定画面でカスタマイズ」リンクを追加
- [x] `useContentGeneration.ts` の全 API 呼び出しに `postTypeId` を追加
- [x] `posts/route.ts` (POST) に `post_type_id` 保存を追加
- [x] 全投稿タイプでの投稿作成フローテスト
- [x] `image_read` タイプの動作確認
