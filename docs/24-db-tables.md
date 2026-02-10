# チケット #24: DBテーブル作成

> Phase 3 | 優先度: 高 | 依存: なし

## 概要

Supabase に `post_types` テーブル、`user_settings` テーブルを新規作成し、`posts` テーブルに `post_type_id` カラムを追加する。RLS ポリシーも設定する。

SPEC-PHASE3.md セクション 5 に準拠。

## 対象

| 対象 | 操作 |
|------|------|
| `post_types` テーブル | 新規作成 |
| `user_settings` テーブル | 新規作成 |
| `posts` テーブル | `post_type_id` カラム追加 |
| RLS ポリシー | 両テーブルに設定 |

## テーブル定義

### post_types

```sql
CREATE TABLE post_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '📝',
  template_structure TEXT NOT NULL,
  placeholders JSONB NOT NULL DEFAULT '[]',
  min_length INTEGER DEFAULT 200,
  max_length INTEGER DEFAULT 400,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_post_types_user_id ON post_types(user_id);
CREATE INDEX idx_post_types_sort_order ON post_types(user_id, sort_order);
```

### user_settings

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  required_hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

### posts テーブル変更

```sql
ALTER TABLE posts
ADD COLUMN post_type_id UUID REFERENCES post_types(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_post_type_id ON posts(post_type_id);
```

### RLS ポリシー

両テーブルに SELECT / INSERT / UPDATE / DELETE の所有権ポリシーを設定。

### updated_at トリガー

`post_types` と `user_settings` に更新時の `updated_at` 自動更新トリガーを作成。

## 受入条件

- 全テーブルが正常に作成される
- RLS が有効でポリシーが設定されている
- `posts` テーブルの既存データに影響がないこと
- `post_type_id` が NULL 許可であること

## TODO

- [x] `post_types` テーブルを作成（Supabase migration）
- [x] `user_settings` テーブルを作成
- [x] `posts` テーブルに `post_type_id` カラムを追加
- [x] インデックスを作成
- [x] RLS ポリシーを設定（post_types: CRUD own + Service role）
- [x] RLS ポリシーを設定（user_settings: CRUD own + Service role）
- [x] `updated_at` 自動更新トリガーを作成（search_path修正済み）
- [x] 既存の `posts` データに影響がないことを確認（13件、post_type_id全てNULL）
