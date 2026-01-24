# チケット #14: Google OAuth 認証

> Phase 2 認証基盤
> 優先度: 最高
> 参照: SPEC-PHASE2.md セクション 5

---

## 概要

Google OAuth 2.0 による認証機能を実装する。
ホワイトリスト方式でアクセスを制限し、許可されたユーザーのみがサービスを利用できるようにする。

---

## タスク一覧

### 1. NextAuth.js セットアップ
- [ ] `next-auth` パッケージインストール（v5 beta）
- [ ] `@auth/supabase-adapter` インストール（任意）
- [ ] NextAuth.js 設定ファイル作成 (`lib/auth.ts`)

### 2. Google OAuth 設定
- [ ] Google Cloud Console でプロジェクト作成/選択
- [ ] OAuth 2.0 クライアント ID 作成
  - 承認済み JavaScript 生成元: `http://localhost:3000`, `https://post-craft-rho.vercel.app`
  - 承認済みリダイレクト URI: `/api/auth/callback/google`
- [ ] 環境変数設定
  ```
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  NEXTAUTH_SECRET=
  NEXTAUTH_URL=https://post-craft-rho.vercel.app
  ```

### 3. ホワイトリスト機能実装
- [ ] 環境変数でのホワイトリスト管理
  ```
  ALLOWED_EMAILS=user1@gmail.com,user2@gmail.com
  ```
- [ ] ホワイトリストチェック関数作成 (`lib/auth.ts`)
  ```typescript
  export function isAllowedEmail(email: string): boolean {
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];
    return allowedEmails.includes(email);
  }
  ```
- [ ] サインイン時のホワイトリストチェック（callback で実装）

### 4. 認証 API ルート作成
- [ ] `/api/auth/[...nextauth]/route.ts` 作成
  ```typescript
  import { handlers } from '@/lib/auth'
  export const { GET, POST } = handlers
  ```

### 5. ログインページ実装
- [ ] `/app/(auth)/login/page.tsx` 作成
- [ ] Google ログインボタン
- [ ] ログイン中の状態表示
- [ ] エラーメッセージ表示（アクセス拒否時）

### 6. アクセス拒否ページ実装
- [ ] `/app/(auth)/unauthorized/page.tsx` 作成
- [ ] 「このアカウントではアクセスできません」メッセージ
- [ ] 別のアカウントでログインするリンク
- [ ] お問い合わせリンク

### 7. 認証ミドルウェア実装
- [ ] `middleware.ts` 作成
- [ ] 保護対象パスの設定
  ```typescript
  export const config = {
    matcher: [
      '/dashboard/:path*',
      '/create/:path*',
      '/history/:path*',
      '/characters/:path*',
      '/settings/:path*',
    ]
  }
  ```
- [ ] 未認証時のリダイレクト処理

### 8. セッション管理
- [ ] セッションプロバイダー作成 (`components/providers/auth-provider.tsx`)
- [ ] `useSession` フック活用
- [ ] セッション情報の型定義拡張

### 9. ユーザー情報の Supabase 同期
- [ ] 初回ログイン時に `users` テーブルへ登録
- [ ] NextAuth.js callback での処理
  ```typescript
  callbacks: {
    async signIn({ user, account }) {
      // ホワイトリストチェック
      if (!isAllowedEmail(user.email)) {
        return '/unauthorized';
      }
      // Supabase に users 登録
      await upsertUser(user);
      return true;
    }
  }
  ```

### 10. ログアウト機能
- [ ] ログアウトボタンコンポーネント
- [ ] ログアウト後のリダイレクト（トップページ）

---

## 完了条件

- [ ] Google アカウントでログインできる
- [ ] ホワイトリストに登録されたメールのみアクセス可能
- [ ] 未登録メールはアクセス拒否画面に遷移する
- [ ] 保護されたページは未認証時にログイン画面へリダイレクトされる
- [ ] ログアウトが正常に動作する
- [ ] ユーザー情報が Supabase に保存される

---

## 技術メモ

### NextAuth.js v5 の変更点
- `getServerSession` → `auth()`
- Route Handler での設定が変更
- Edge Runtime 対応

### セキュリティ考慮事項
- CSRF 保護は NextAuth.js 組み込み
- セッショントークンは HTTPOnly Cookie
- state パラメータで CSRF 対策

---

## 依存関係

- #13 Supabase セットアップ（users テーブル必要）

## 後続タスク

- #15 ダッシュボード・レイアウト
- 全ての認証必須ページ
