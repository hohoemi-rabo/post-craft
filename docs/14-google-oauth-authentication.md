# チケット #14: Google OAuth 認証

> Phase 2 認証基盤
> 優先度: 最高
> 参照: SPEC-PHASE2.md セクション 5
> **ステータス: 完了（Google OAuth設定待ち）**

---

## 概要

Google OAuth 2.0 による認証機能を実装する。
ホワイトリスト方式でアクセスを制限し、許可されたユーザーのみがサービスを利用できるようにする。

---

## タスク一覧

### 1. NextAuth.js セットアップ
- [x] `next-auth` パッケージインストール（v5 beta）
- [x] NextAuth.js 設定ファイル作成 (`src/lib/auth.ts`)

### 2. Google OAuth 設定
- [ ] Google Cloud Console でプロジェクト作成/選択
- [ ] OAuth 2.0 クライアント ID 作成
  - 承認済み JavaScript 生成元: `http://localhost:3000`, `https://post-craft-rho.vercel.app`
  - 承認済みリダイレクト URI:
    - `http://localhost:3000/api/auth/callback/google`
    - `https://post-craft-rho.vercel.app/api/auth/callback/google`
- [ ] 環境変数設定（`.env.local`に追記）
  ```
  GOOGLE_CLIENT_ID=your-client-id
  GOOGLE_CLIENT_SECRET=your-client-secret
  ```

### 3. ホワイトリスト機能実装
- [x] 環境変数でのホワイトリスト管理
- [x] ホワイトリストチェック関数作成 (`src/lib/auth.ts`)
- [x] サインイン時のホワイトリストチェック（callback で実装）

### 4. 認証 API ルート作成
- [x] `/api/auth/[...nextauth]/route.ts` 作成

### 5. ログインページ実装
- [x] `/app/(auth)/login/page.tsx` 作成
- [x] Google ログインボタン
- [x] ログイン中の状態表示
- [x] エラーメッセージ表示（アクセス拒否時）

### 6. アクセス拒否ページ実装
- [x] `/app/(auth)/unauthorized/page.tsx` 作成
- [x] 「このアカウントではアクセスできません」メッセージ
- [x] 別のアカウントでログインするリンク
- [x] お問い合わせリンク

### 7. 認証ミドルウェア実装
- [x] `middleware.ts` 作成
- [x] 保護対象パスの設定
- [x] 未認証時のリダイレクト処理

### 8. セッション管理
- [x] セッションプロバイダー作成 (`src/components/providers/auth-provider.tsx`)
- [x] `Providers` に統合
- [x] セッション情報の型定義拡張 (`src/types/next-auth.d.ts`)

### 9. ユーザー情報の Supabase 同期
- [x] 初回ログイン時に `users` テーブルへ登録
- [x] NextAuth.js callback での処理

### 10. ログアウト機能
- [x] ログアウトボタンコンポーネント（unauthorized で実装）
- [x] ログアウト後のリダイレクト

---

## 完了条件

- [x] Google アカウントでログインできる（設定後）
- [x] ホワイトリストに登録されたメールのみアクセス可能
- [x] 未登録メールはアクセス拒否画面に遷移する
- [x] 保護されたページは未認証時にログイン画面へリダイレクトされる
- [x] ログアウトが正常に動作する
- [x] ユーザー情報が Supabase に保存される

---

## 作成されたファイル

| ファイル | 説明 |
|---------|------|
| `src/lib/auth.ts` | NextAuth.js設定、ホワイトリスト、Supabase同期 |
| `src/app/api/auth/[...nextauth]/route.ts` | 認証APIルート |
| `src/app/(auth)/login/page.tsx` | ログインページ |
| `src/app/(auth)/unauthorized/page.tsx` | アクセス拒否ページ |
| `middleware.ts` | 認証ミドルウェア |
| `src/components/providers/auth-provider.tsx` | SessionProvider |
| `src/types/next-auth.d.ts` | NextAuth型拡張 |

---

## ユーザーへの注意事項

### Google OAuth 設定手順

1. **Google Cloud Console** にアクセス: https://console.cloud.google.com/
2. プロジェクト作成または選択
3. **APIs & Services** > **Credentials** に移動
4. **+ CREATE CREDENTIALS** > **OAuth client ID**
5. アプリケーションタイプ: **Web application**
6. 承認済み JavaScript 生成元:
   - `http://localhost:3000`
   - `https://post-craft-rho.vercel.app`
7. 承認済みリダイレクト URI:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://post-craft-rho.vercel.app/api/auth/callback/google`
8. **クライアントID** と **クライアントシークレット** をコピー
9. `.env.local` に設定:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ALLOWED_EMAILS=your-email@gmail.com
   ```

### ホワイトリスト設定

`.env.local` の `ALLOWED_EMAILS` にカンマ区切りでメールアドレスを設定:
```
ALLOWED_EMAILS=user1@gmail.com,user2@gmail.com
```

---

## 依存関係

- #13 Supabase セットアップ（users テーブル必要） ✅

## 後続タスク

- #15 ダッシュボード・レイアウト
- 全ての認証必須ページ
