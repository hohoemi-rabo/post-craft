# チケット #13: Supabase セットアップ

> Phase 2 基盤構築
> 優先度: 最高（他の機能の前提条件）
> 参照: SPEC-PHASE2.md セクション 6

---

## 概要

Phase 2 のデータ永続化基盤として Supabase を構築する。
データベーステーブル、Storage バケット、RLS ポリシーを設定する。

---

## タスク一覧

### 1. Supabase プロジェクト作成
- [ ] Supabase MCP を使用してプロジェクト作成
- [ ] プロジェクト設定確認（リージョン: 東京推奨）
- [ ] API キー取得（anon key, service role key）

### 2. データベーステーブル作成
- [ ] `users` テーブル作成
  ```sql
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- [ ] `characters` テーブル作成
  ```sql
  CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    description TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- [ ] `posts` テーブル作成
  ```sql
  CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_type TEXT NOT NULL,
    input_text TEXT NOT NULL,
    source_url TEXT,
    generated_caption TEXT NOT NULL,
    generated_hashtags TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- [ ] `post_images` テーブル作成
  ```sql
  CREATE TABLE post_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    style TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

### 3. インデックス作成
- [ ] `posts` テーブルのインデックス
  ```sql
  CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
  ```
- [ ] `characters` テーブルのインデックス
  ```sql
  CREATE INDEX idx_characters_user ON characters(user_id);
  ```

### 4. Storage バケット作成
- [ ] `characters` バケット作成（キャラクター画像用）
- [ ] `generated-images` バケット作成（生成画像用）
- [ ] バケットポリシー設定（認証ユーザーのみアクセス可）

### 5. Row Level Security (RLS) 設定
- [ ] `users` テーブル RLS
  ```sql
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);
  ```

- [ ] `characters` テーブル RLS
  ```sql
  ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can CRUD own characters" ON characters
    FOR ALL USING (auth.uid()::text = user_id::text);
  ```

- [ ] `posts` テーブル RLS
  ```sql
  ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can CRUD own posts" ON posts
    FOR ALL USING (auth.uid()::text = user_id::text);
  ```

- [ ] `post_images` テーブル RLS
  ```sql
  ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own post images" ON post_images
    FOR SELECT USING (
      post_id IN (SELECT id FROM posts WHERE user_id::text = auth.uid()::text)
    );
  ```

### 6. Next.js 連携設定
- [ ] `@supabase/supabase-js` パッケージインストール
- [ ] Supabase クライアント作成 (`lib/supabase.ts`)
  - ブラウザ用クライアント
  - サーバー用クライアント（service role）
- [ ] 環境変数設定
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```

### 7. 型定義生成
- [ ] Supabase MCP で TypeScript 型定義生成
- [ ] `types/supabase.ts` に保存

---

## 完了条件

- [ ] 全テーブルが作成され、マイグレーション履歴に記録されている
- [ ] Storage バケットが作成されている
- [ ] RLS ポリシーが有効化されている
- [ ] Next.js から Supabase に接続できる
- [ ] 型定義が生成されている

---

## 技術メモ

- Supabase MCP を活用してテーブル作成・マイグレーション実行
- RLS は Phase 2 では簡易的に設定（ホワイトリストユーザーのみなので）
- Storage のファイルサイズ制限: 5MB（画像用）

---

## 依存関係

- なし（最初に実施）

## 後続タスク

- #14 Google OAuth 認証
- #18 キャラクター管理
- #20 投稿履歴管理
