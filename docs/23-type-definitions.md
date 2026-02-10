# チケット #23: 型定義の追加

> Phase 3 | 優先度: 高 | 依存: なし

## 概要

Phase 3 で使用する TypeScript 型定義ファイルを新規作成する。DB管理の投稿タイプ（`PostTypeDB`）、プレースホルダー変数（`Placeholder`）、ユーザー設定（`UserSettings`）の型を定義する。

既存の `src/types/post.ts` の `PostType`（string union）との共存を考慮し、DB版は別名で定義する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/types/post-type.ts` | 新規作成 |
| `src/types/user-settings.ts` | 新規作成 |
| `src/types/supabase.ts` | 更新（テーブル型追加） |

## 型定義の詳細

### PostTypeDB（DB版投稿タイプ）

```typescript
export interface Placeholder {
  name: string
  label: string
  description?: string
  required: boolean
  inputType: 'text' | 'textarea'
}

export interface PostTypeDB {
  id: string
  userId: string
  name: string
  slug: string
  description: string
  icon: string
  templateStructure: string
  placeholders: Placeholder[]
  minLength: number
  maxLength: number
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PostTypeFormData {
  name: string
  slug?: string
  description?: string
  icon: string
  templateStructure: string
  placeholders: Placeholder[]
  minLength: number
  maxLength: number
  isActive: boolean
}
```

### UserSettings

```typescript
export interface UserSettings {
  id: string
  userId: string
  requiredHashtags: string[]
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
```

## 受入条件

- 新しい型定義ファイルが作成されている
- `npm run build` が通る（既存コードとの型競合がない）
- 既存の `PostType`（string union）と `PostTypeDB`（interface）が共存できる

## TODO

- [x] `src/types/post-type.ts` を作成（Placeholder, PostTypeDB, PostTypeFormData）
- [x] `src/types/user-settings.ts` を作成（UserSettings）
- [x] `src/types/supabase.ts` に post_types, user_settings テーブルの型を追加
- [x] `npm run build` で型の競合がないことを確認
