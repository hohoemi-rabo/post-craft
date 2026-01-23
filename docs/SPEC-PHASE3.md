# Post Craft Phase 2 実装計画書

> 作成日: 2026-01-23
> 前提: Phase 1 (MVP) 完了

## 1. Phase 2 概要

**目標:** ユーザー認証、有料プラン、生成履歴機能を実装し、持続可能なサービス基盤を構築する。

### スコープ
| 機能 | 優先度 | 必須/任意 |
|------|--------|----------|
| ユーザー認証 (OAuth) | 高 | 必須 |
| 生成履歴保存 | 高 | 必須 |
| 有料プラン導入 | 中 | 必須 |
| サーバーサイドレート制限 | 高 | 必須 |
| ダッシュボード | 中 | 必須 |
| メール通知 | 低 | 任意 |

---

## 2. 技術選定

### 2.1 認証
| 選択肢 | 推奨 | 理由 |
|--------|------|------|
| NextAuth.js (Auth.js) | ✅ | Next.js公式推奨、OAuth対応、App Router対応 |
| Clerk | - | 高機能だがコスト高 |
| Supabase Auth | - | DB連携前提 |

**採用:** NextAuth.js v5 (Auth.js)

### 2.2 データベース
| 選択肢 | 推奨 | 理由 |
|--------|------|------|
| Prisma + PostgreSQL | ✅ | TypeScript親和性、Vercel Postgres対応 |
| Drizzle ORM | - | 軽量だが学習コスト |
| Supabase | - | BaaS依存 |

**採用:** Prisma + Vercel Postgres (または PlanetScale)

### 2.3 決済
| 選択肢 | 推奨 | 理由 |
|--------|------|------|
| Stripe | ✅ | 日本対応、サブスク対応、webhook |
| LemonSqueezy | - | 手数料高め |
| PAY.JP | - | 日本特化だが機能限定 |

**採用:** Stripe (Checkout + Customer Portal)

### 2.4 追加パッケージ

```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta",
    "@prisma/client": "^5.x",
    "stripe": "^14.x",
    "@stripe/stripe-js": "^2.x"
  },
  "devDependencies": {
    "prisma": "^5.x"
  }
}
```

---

## 3. データベース設計

### 3.1 ERD

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│    User     │     │   Generation    │     │Subscription │
├─────────────┤     ├─────────────────┤     ├─────────────┤
│ id (PK)     │────<│ userId (FK)     │     │ id (PK)     │
│ email       │     │ id (PK)         │     │ userId (FK) │──┐
│ name        │     │ sourceUrl       │     │ stripeSubId │  │
│ image       │     │ sourceTitle     │     │ stripeCusId │  │
│ plan        │     │ caption         │     │ plan        │  │
│ createdAt   │     │ hashtags        │     │ status      │  │
│ updatedAt   │     │ imageUrl        │     │ currentPer.S│  │
└─────────────┘     │ bgColor         │     │ currentPer.E│  │
       │            │ createdAt       │     │ createdAt   │  │
       │            └─────────────────┘     │ updatedAt   │  │
       │                                    └─────────────┘  │
       └────────────────────────────────────────────────────┘
```

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Plan {
  FREE
  PRO
  BUSINESS
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  TRIALING
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  plan          Plan      @default(FREE)

  // Relations
  accounts      Account[]
  sessions      Session[]
  generations   Generation[]
  subscription  Subscription?

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Generation {
  id          String   @id @default(cuid())
  userId      String

  // Source
  sourceUrl   String?
  sourceTitle String?
  sourceText  String   @db.Text

  // Generated content
  caption     String
  hashtags    String[] // PostgreSQL array
  imageUrl    String?
  bgColor     String?

  // Metadata
  processingTime Int?   // milliseconds

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique

  // Stripe
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?

  // Status
  plan                 Plan               @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)

  // Billing period
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)

  // Relations
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}
```

---

## 4. プラン設計

### 4.1 プラン比較

| 機能 | Free | Pro | Business |
|------|------|-----|----------|
| 月額 | ¥0 | ¥980 | ¥2,980 |
| 日次生成回数 | 5回 | 50回 | 無制限 |
| 履歴保存 | 7日間 | 30日間 | 無制限 |
| 画像背景色 | 12色 | 12色 + カスタム | 12色 + カスタム |
| 優先サポート | - | - | ✓ |
| API アクセス | - | - | ✓ |

### 4.2 Stripe Price ID (設定例)

```typescript
const PLANS = {
  FREE: {
    name: 'Free',
    priceId: null,
    dailyLimit: 5,
    historyDays: 7,
  },
  PRO: {
    name: 'Pro',
    priceId: 'price_xxx_pro_monthly',
    dailyLimit: 50,
    historyDays: 30,
  },
  BUSINESS: {
    name: 'Business',
    priceId: 'price_xxx_business_monthly',
    dailyLimit: Infinity,
    historyDays: Infinity,
  },
}
```

---

## 5. 認証フロー

### 5.1 NextAuth.js 設定

```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.plan = user.plan
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
```

### 5.2 認証フロー図

```
[未認証ユーザー]
      │
      ▼ 生成ページアクセス
[認証チェック] ─── 未認証 ───> [ログインページ]
      │                              │
      │ 認証済み                      ▼ OAuth
      │                        [Google認証]
      ▼                              │
[生成ページ] <─────────────────────┘
      │
      ▼ 生成実行
[レート制限チェック]
      │
      ├── 制限内 ──> [生成処理] ──> [履歴保存]
      │
      └── 制限超過 ──> [アップグレード促進]
```

---

## 6. 新規ページ・API

### 6.1 ページ一覧

| パス | 機能 | 認証 |
|------|------|------|
| `/login` | ログインページ | 不要 |
| `/dashboard` | ダッシュボード | 必要 |
| `/dashboard/history` | 生成履歴 | 必要 |
| `/dashboard/settings` | アカウント設定 | 必要 |
| `/pricing` | 料金ページ | 不要 |
| `/api/auth/*` | NextAuth.js | - |
| `/api/stripe/checkout` | Stripe Checkout | 必要 |
| `/api/stripe/portal` | Customer Portal | 必要 |
| `/api/stripe/webhook` | Stripe Webhook | - |
| `/api/generations` | 履歴取得 | 必要 |

### 6.2 新規ディレクトリ構造

```
src/app/
├── (auth)/
│   └── login/
│       └── page.tsx
│
├── (dashboard)/
│   ├── layout.tsx          # サイドバー付きレイアウト
│   ├── dashboard/
│   │   └── page.tsx        # ダッシュボードホーム
│   ├── history/
│   │   └── page.tsx        # 生成履歴
│   └── settings/
│       └── page.tsx        # アカウント設定
│
├── pricing/
│   └── page.tsx            # 料金ページ
│
└── api/
    ├── auth/
    │   └── [...nextauth]/
    │       └── route.ts
    ├── stripe/
    │   ├── checkout/
    │   │   └── route.ts
    │   ├── portal/
    │   │   └── route.ts
    │   └── webhook/
    │       └── route.ts
    └── generations/
        └── route.ts
```

---

## 7. 既存機能の改修

### 7.1 生成フローの変更

**Before (Phase 1):**
```
URL入力 → 抽出 → 生成 → 結果表示
         ↓
    Cookie制限チェック
```

**After (Phase 2):**
```
URL入力 → 認証チェック → 抽出 → レート制限チェック → 生成 → 履歴保存 → 結果表示
                ↓                    ↓
           ログイン促進        アップグレード促進
```

### 7.2 改修ファイル一覧

| ファイル | 改修内容 |
|---------|---------|
| `app/page.tsx` | 認証状態表示、ログインボタン追加 |
| `app/generate/result/page.tsx` | 履歴保存、認証チェック |
| `lib/rate-limiter.ts` | DB連携、プラン別制限 |
| `api/generate/route.ts` | 認証必須、履歴保存 |
| `components/layout/header.tsx` | ユーザーメニュー追加 |

---

## 8. 環境変数 (追加)

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth.js
NEXTAUTH_URL="https://..."
NEXTAUTH_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
```

---

## 9. 実装タスク

### Week 1: 認証基盤
- [ ] Prisma + PostgreSQL セットアップ
- [ ] NextAuth.js v5 導入
- [ ] Google OAuth 設定
- [ ] User, Account, Session モデル作成
- [ ] ログインページ実装
- [ ] 認証ミドルウェア実装

### Week 2: 履歴機能
- [ ] Generation モデル作成
- [ ] 生成時の履歴保存実装
- [ ] 履歴取得API実装
- [ ] ダッシュボードレイアウト
- [ ] 履歴一覧ページ
- [ ] 履歴詳細・再利用機能

### Week 3: 決済機能
- [ ] Stripe アカウント設定
- [ ] Subscription モデル作成
- [ ] Checkout Session API
- [ ] Customer Portal API
- [ ] Webhook 処理
- [ ] 料金ページ実装

### Week 4: レート制限・仕上げ
- [ ] サーバーサイドレート制限
- [ ] プラン別制限ロジック
- [ ] アップグレード促進UI
- [ ] アカウント設定ページ
- [ ] E2Eテスト
- [ ] 本番デプロイ

---

## 10. マイグレーション戦略

### 10.1 既存ユーザー対応

Phase 1にはユーザー概念がないため、新規サービスとして扱う。

### 10.2 Cookie制限からの移行

```typescript
// 移行期間中の処理
async function checkRateLimit(userId?: string) {
  if (userId) {
    // 認証済み: DBベースの制限
    return checkDbRateLimit(userId)
  } else {
    // 未認証: 従来のCookie制限 (制限付き)
    return checkCookieRateLimit()
  }
}
```

---

## 11. セキュリティ考慮事項

### 11.1 認証
- CSRF保護 (NextAuth.js組み込み)
- セッショントークンのHTTPOnly Cookie
- OAuth state パラメータ検証

### 11.2 API保護
- 認証必須エンドポイントの保護
- Rate limiting (per user)
- Stripe webhook署名検証

### 11.3 データ保護
- パスワードは保存しない (OAuthのみ)
- 個人情報の最小化
- GDPR対応 (データ削除機能)

---

## 12. モニタリング・運用

### 12.1 追加メトリクス

| メトリクス | 用途 |
|-----------|------|
| DAU/MAU | アクティブユーザー |
| 生成数/ユーザー | 利用傾向 |
| Conversion Rate | Free → Pro |
| Churn Rate | 解約率 |

### 12.2 アラート設定

- Stripe webhook失敗
- 認証エラー急増
- DB接続エラー
- API レスポンスタイム劣化

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-23 | 初版作成 |
