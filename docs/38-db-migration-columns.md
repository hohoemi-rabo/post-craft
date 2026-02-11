# チケット #38: DBマイグレーション - カラム追加

> Phase 3 Revised | 優先度: 高 | 依存: なし

## 概要

`user_settings` テーブルに `system_prompt_memo` と `system_prompt` カラム、`post_types` テーブルに `user_memo`、`type_prompt`、`input_mode` カラムを追加する。既存データに影響を与えないよう、全て NULL 許可またはデフォルト値付きで追加する。型定義も同時に更新する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| Supabase migration (SQL) | 実行 |
| `src/types/supabase.ts` | 更新（新カラムの型追加） |
| `src/types/post-type.ts` | 更新（PostTypeDB, PostTypeFormData に新フィールド追加） |
| `src/lib/post-type-utils.ts` | 更新（toPostTypeDB に新フィールドマッピング追加） |

## 変更内容

### 1. user_settings テーブル（カラム追加）

```sql
ALTER TABLE user_settings
ADD COLUMN system_prompt_memo TEXT,
ADD COLUMN system_prompt TEXT;
```

### 2. post_types テーブル（カラム追加）

```sql
ALTER TABLE post_types
ADD COLUMN user_memo TEXT,
ADD COLUMN type_prompt TEXT,
ADD COLUMN input_mode TEXT NOT NULL DEFAULT 'fields';

ALTER TABLE post_types
ADD CONSTRAINT post_types_input_mode_check
CHECK (input_mode IN ('fields', 'memo'));
```

### 3. 型定義の更新

**`src/types/supabase.ts`**: `post_types` の Row/Insert/Update に `user_memo`, `type_prompt`, `input_mode` を追加。`user_settings` の Row/Insert/Update に `system_prompt_memo`, `system_prompt` を追加。

**`src/types/post-type.ts`**:
```typescript
// PostTypeDB に追加
userMemo: string | null
typePrompt: string | null
inputMode: 'fields' | 'memo'

// PostTypeFormData に追加
userMemo?: string
typePrompt?: string
inputMode: 'fields' | 'memo'
```

**`src/lib/post-type-utils.ts`**: `toPostTypeDB` に新フィールドマッピングを追加:
- `row.user_memo` → `userMemo`
- `row.type_prompt` → `typePrompt`
- `row.input_mode` → `inputMode`

## 受入条件

- マイグレーションが正常に適用される
- 既存の `user_settings` データに影響がない（`system_prompt`, `system_prompt_memo` は NULL）
- 既存の `post_types` データに影響がない（`user_memo`, `type_prompt` は NULL、`input_mode` は 'fields'）
- `input_mode` が 'fields' または 'memo' 以外の値で CHECK 制約エラーになる
- TypeScript 型定義が正しく更新されている
- `npm run build` が成功する

## TODO

- [x] `user_settings` テーブルに `system_prompt_memo TEXT` カラムを追加
- [x] `user_settings` テーブルに `system_prompt TEXT` カラムを追加
- [x] `post_types` テーブルに `user_memo TEXT` カラムを追加
- [x] `post_types` テーブルに `type_prompt TEXT` カラムを追加
- [x] `post_types` テーブルに `input_mode TEXT NOT NULL DEFAULT 'fields'` カラムを追加
- [x] `post_types` に `input_mode` の CHECK 制約を追加
- [x] `src/types/supabase.ts` を更新（両テーブルの Row/Insert/Update）
- [x] `src/types/post-type.ts` の `PostTypeDB` を更新
- [x] `src/types/post-type.ts` の `PostTypeFormData` を更新
- [x] `src/lib/post-type-utils.ts` の `toPostTypeDB` を更新
- [x] 既存データに影響がないことを検証
- [x] `npm run build` 成功を確認
