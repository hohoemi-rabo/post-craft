# チケット #48: 既存テーブルへのカラム追加 - source_analysis_id

> Phase 4A | 優先度: 高 | 依存: #47

## 概要

`profiles` テーブルと `post_types` テーブルに `source_analysis_id` カラムを追加する。分析機能から自動生成されたプロフィール・投稿タイプを元の分析にリンクするためのカラムで、nullable な UUID 外部キーとして追加する。既存データには影響しない。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| Supabase migration (SQL) | 実行 |
| `src/types/supabase.ts` | 更新（`profiles`, `post_types` に `source_analysis_id` 追加） |
| `src/types/profile.ts` | 更新（`ProfileDB` に `sourceAnalysisId` 追加） |
| `src/types/post-type.ts` | 更新（`PostTypeDB` に `sourceAnalysisId` 追加） |
| `src/lib/post-type-utils.ts` | 更新（`toPostTypeDB` に `sourceAnalysisId` マッピング追加） |

## 変更内容

### 1. profiles テーブル（カラム追加）

```sql
ALTER TABLE profiles
ADD COLUMN source_analysis_id UUID REFERENCES competitor_analyses(id) ON DELETE SET NULL;
```

### 2. post_types テーブル（カラム追加）

```sql
ALTER TABLE post_types
ADD COLUMN source_analysis_id UUID REFERENCES competitor_analyses(id) ON DELETE SET NULL;
```

### 3. 型定義の更新

**`src/types/supabase.ts`**: `profiles` と `post_types` の Row/Insert/Update に追加:

```typescript
// profiles.Row に追加
source_analysis_id: string | null

// profiles.Insert に追加
source_analysis_id?: string | null

// profiles.Update に追加
source_analysis_id?: string | null

// profiles.Relationships に追加
{
  foreignKeyName: "profiles_source_analysis_id_fkey"
  columns: ["source_analysis_id"]
  isOneToOne: false
  referencedRelation: "competitor_analyses"
  referencedColumns: ["id"]
}

// post_types.Row に追加
source_analysis_id: string | null

// post_types.Insert に追加
source_analysis_id?: string | null

// post_types.Update に追加
source_analysis_id?: string | null

// post_types.Relationships に追加
{
  foreignKeyName: "post_types_source_analysis_id_fkey"
  columns: ["source_analysis_id"]
  isOneToOne: false
  referencedRelation: "competitor_analyses"
  referencedColumns: ["id"]
}
```

**`src/types/profile.ts`**: `ProfileDB` に追加:

```typescript
export interface ProfileDB {
  // ... 既存フィールド
  sourceAnalysisId: string | null  // 追加
}
```

**`src/types/post-type.ts`**: `PostTypeDB` に追加:

```typescript
export interface PostTypeDB {
  // ... 既存フィールド
  sourceAnalysisId: string | null  // 追加
}
```

### 4. post-type-utils.ts の更新

`toPostTypeDB` 関数に `sourceAnalysisId` のマッピングを追加:

```typescript
// row.source_analysis_id → sourceAnalysisId
sourceAnalysisId: row.source_analysis_id ?? null
```

## 受入条件

- マイグレーションが正常に適用される
- 既存の `profiles` データに影響がない（`source_analysis_id` は NULL）
- 既存の `post_types` データに影響がない（`source_analysis_id` は NULL）
- 外部キー制約が正しく機能する（`competitor_analyses` の削除時に SET NULL）
- TypeScript 型定義が正しく更新されている
- `npm run build` が成功する

## TODO

- [x] `profiles` テーブルに `source_analysis_id UUID` カラムを追加（FK, ON DELETE SET NULL）
- [x] `post_types` テーブルに `source_analysis_id UUID` カラムを追加（FK, ON DELETE SET NULL）
- [x] `src/types/supabase.ts` の `profiles` Row/Insert/Update を更新
- [x] `src/types/supabase.ts` の `profiles` Relationships を更新
- [x] `src/types/supabase.ts` の `post_types` Row/Insert/Update を更新
- [x] `src/types/supabase.ts` の `post_types` Relationships を更新
- [x] `src/types/profile.ts` の `ProfileDB` に `sourceAnalysisId` を追加
- [x] `src/types/post-type.ts` の `PostTypeDB` に `sourceAnalysisId` を追加
- [x] `src/lib/post-type-utils.ts` の `toPostTypeDB` を更新
- [x] 既存データに影響がないことを検証
- [x] ON DELETE SET NULL の動作を検証
- [x] `npm run build` 成功を確認
