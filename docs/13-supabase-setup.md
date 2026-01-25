# チケット #13: Supabase セットアップ

> Phase 2 基盤構築
> 優先度: 最高（他の機能の前提条件）
> 参照: SPEC-PHASE2.md セクション 6
> **ステータス: 完了**

---

## 概要

Phase 2 のデータ永続化基盤として Supabase を構築する。
データベーステーブル、Storage バケット、RLS ポリシーを設定する。

---

## タスク一覧

### 1. Supabase プロジェクト作成
- [x] Supabase MCP を使用してプロジェクト作成
- [x] プロジェクト設定確認（リージョン: ap-northeast-1 東京）
- [x] API キー取得（anon key, service role key）

**プロジェクト情報:**
- ID: `gadczzbkxqjzdpauzsfg`
- URL: `https://gadczzbkxqjzdpauzsfg.supabase.co`
- リージョン: ap-northeast-1（東京）

### 2. データベーステーブル作成
- [x] `users` テーブル作成
- [x] `characters` テーブル作成
- [x] `posts` テーブル作成
- [x] `post_images` テーブル作成

### 3. インデックス作成
- [x] `posts` テーブルのインデックス (`idx_posts_user_created`)
- [x] `characters` テーブルのインデックス (`idx_characters_user`)
- [x] `post_images` テーブルのインデックス (`idx_post_images_post`)

### 4. Storage バケット作成
- [x] `characters` バケット作成（キャラクター画像用）
- [x] `generated-images` バケット作成（生成画像用）
- [x] バケットポリシー設定（公開読み取り、認証ユーザーのみ書き込み）

### 5. Row Level Security (RLS) 設定
- [x] `users` テーブル RLS
- [x] `characters` テーブル RLS
- [x] `posts` テーブル RLS
- [x] `post_images` テーブル RLS
- [x] Service role ポリシー追加（API用）

### 6. Next.js 連携設定
- [x] `@supabase/supabase-js` パッケージインストール
- [x] Supabase クライアント作成 (`src/lib/supabase.ts`)
  - ブラウザ用クライアント
  - サーバー用クライアント（service role）
- [x] 環境変数設定 (`.env.local`)
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://gadczzbkxqjzdpauzsfg.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
  SUPABASE_SERVICE_ROLE_KEY=（要手動設定）
  ```

### 7. 型定義生成
- [x] Supabase MCP で TypeScript 型定義生成
- [x] `src/types/supabase.ts` に保存

---

## 完了条件

- [x] 全テーブルが作成され、マイグレーション履歴に記録されている
- [x] Storage バケットが作成されている
- [x] RLS ポリシーが有効化されている
- [x] Next.js から Supabase に接続できる（ビルド成功）
- [x] 型定義が生成されている

---

## 作成されたファイル

- `src/types/supabase.ts` - TypeScript型定義
- `src/lib/supabase.ts` - Supabaseクライアント

## マイグレーション履歴

| Version | Name |
|---------|------|
| 20260125032930 | create_users_table |
| 20260125032939 | create_characters_table |
| 20260125032950 | create_posts_table |
| 20260125033000 | create_post_images_table |

---

## ユーザーへの注意事項

**SUPABASE_SERVICE_ROLE_KEY の取得が必要:**

1. Supabase ダッシュボードにアクセス: https://supabase.com/dashboard/project/gadczzbkxqjzdpauzsfg
2. Settings > API > Project API keys
3. `service_role` キーをコピー
4. `.env.local` の `SUPABASE_SERVICE_ROLE_KEY=` に設定

---

## 依存関係

- なし（最初に実施）

## 後続タスク

- #14 Google OAuth 認証
- #18 キャラクター管理
- #20 投稿履歴管理
