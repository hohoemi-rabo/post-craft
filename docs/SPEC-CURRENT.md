# Post Craft 現状仕様書

> 作成日: 2026-01-23
> 最終更新: 2026-01-25
> フェーズ: Phase 2 完了

## 1. プロジェクト概要

**Post Craft** は、メモ書きやブログ記事URLからInstagram投稿素材（キャプション、ハッシュタグ、画像）を自動生成するWebサービスです。

### ターゲットユーザー
- パソコン・スマホ・AI活用に関する情報発信者
- SNSプロモーションを効率化したい個人・小規模事業者

### 本番URL
https://post-craft-rho.vercel.app/

### 技術スタック
| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| Framework | Next.js (App Router) | 15.5.9 |
| Language | TypeScript | 5.x |
| UI | React | 19.1.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Database | Supabase (PostgreSQL) | - |
| Auth | NextAuth.js + Google OAuth | 5.x |
| AI (文章) | Google Gemini Flash | gemini-2.0-flash |
| AI (画像) | Google Gemini Imagen | imagen-3.0-generate-002 |
| Scraping | @mozilla/readability + jsdom | 0.6.0 / 27.0.0 |
| Analytics | Google Analytics 4 | @next/third-parties |
| Hosting | Vercel | - |

---

## 2. Phase 2 実装状況

### 2.1 機能一覧

| # | 機能 | 状態 | 実装ファイル |
|---|------|------|-------------|
| 1 | Google OAuth認証 | ✅ 完了 | `lib/auth.ts`, `api/auth/[...nextauth]` |
| 2 | ホワイトリスト認証 | ✅ 完了 | `ALLOWED_EMAILS` 環境変数 |
| 3 | ダッシュボード | ✅ 完了 | `app/(dashboard)/dashboard/` |
| 4 | 4種類の投稿タイプ | ✅ 完了 | `lib/post-types.ts`, `lib/templates.ts` |
| 5 | AIキャプション生成 (Gemini) | ✅ 完了 | `api/generate/caption/route.ts` |
| 6 | AIハッシュタグ生成 | ✅ 完了 | 同上 |
| 7 | カスタムハッシュタグ追加/削除 | ✅ 完了 | `components/create/step-result.tsx` |
| 8 | AI画像生成 (Gemini Imagen) | ✅ 完了 | `api/generate/image/route.ts` |
| 9 | 4種類の画像スタイル | ✅ 完了 | `lib/image-styles.ts` |
| 10 | キャラクター登録・管理 | ✅ 完了 | `app/(dashboard)/characters/` |
| 11 | キャラクター特徴抽出 | ✅ 完了 | `api/characters/analyze/route.ts` |
| 12 | 投稿履歴保存 | ✅ 完了 | `api/posts/route.ts`, Supabase |
| 13 | 履歴一覧・詳細表示 | ✅ 完了 | `app/(dashboard)/history/` |
| 14 | 履歴削除 | ✅ 完了 | `api/posts/[id]/route.ts` |
| 15 | URL記事抽出 | ✅ 完了 | `api/extract/route.ts` |
| 16 | 手動テキスト入力 | ✅ 完了 | `components/create/step-content-input.tsx` |
| 17 | クリップボードコピー | ✅ 完了 | `components/create/step-result.tsx` |
| 18 | 画像ダウンロード | ✅ 完了 | 同上 |
| 19 | Instagram起動 | ✅ 完了 | 同上 |
| 20 | レスポンシブデザイン | ✅ 完了 | 全ページ |
| 21 | GA4アナリティクス | ✅ 完了 | `lib/analytics.ts` |
| 22 | プライバシーポリシー | ✅ 完了 | `app/privacy/page.tsx` |
| 23 | お問い合わせ (Instagram DM) | ✅ 完了 | `app/contact/page.tsx` |
| 24 | ランディングページ | ✅ 完了 | `app/page.tsx` |

### 2.2 投稿タイプ

| ID | タイプ名 | ターゲット | 必須フィールド |
|----|---------|-----------|---------------|
| `solution` | 解決タイプ | 全般 | question, step1-3 |
| `promotion` | 宣伝タイプ | ビジネス層 | headline, pain_point1-3 |
| `tips` | Tipsタイプ | ビジネス層 | title, benefit1-3 |
| `showcase` | 実績タイプ | ビジネス層 | deliverable_type, challenge, solution, result |

### 2.3 画像スタイル

| ID | スタイル名 | キャラクター |
|----|-----------|-------------|
| `manga_male` | マンガ風（男性） | あり |
| `manga_female` | マンガ風（女性） | あり |
| `pixel_art` | ピクセルアート | あり |
| `illustration` | イラスト（人物なし） | なし |

---

## 3. アーキテクチャ

### 3.1 ディレクトリ構造

```
src/
├── app/
│   ├── layout.tsx              # Root Layout (フォント, GA4, Providers)
│   ├── page.tsx                # ランディングページ
│   ├── error.tsx               # グローバルエラー境界
│   ├── globals.css             # グローバルスタイル
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx      # ログインページ
│   │   └── unauthorized/page.tsx # 未認可ページ
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx          # ダッシュボードレイアウト (認証必須)
│   │   ├── dashboard/page.tsx  # ダッシュボードホーム
│   │   ├── create/page.tsx     # 投稿作成 (ステップUI)
│   │   ├── history/
│   │   │   ├── page.tsx        # 履歴一覧
│   │   │   └── [id]/page.tsx   # 履歴詳細
│   │   ├── characters/page.tsx # キャラクター管理
│   │   └── settings/page.tsx   # 設定
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth.js
│   │   ├── characters/
│   │   │   ├── route.ts        # GET (list), POST (create)
│   │   │   ├── [id]/route.ts   # PUT, DELETE
│   │   │   └── analyze/route.ts # POST (特徴抽出)
│   │   ├── extract/route.ts    # POST (URL記事抽出)
│   │   ├── generate/
│   │   │   ├── caption/route.ts # POST (キャプション生成)
│   │   │   ├── image/route.ts   # POST (画像生成)
│   │   │   └── scene/route.ts   # POST (シーン候補生成)
│   │   └── posts/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/route.ts   # GET, DELETE
│   │
│   ├── contact/page.tsx        # お問い合わせ
│   └── privacy/page.tsx        # プライバシーポリシー
│
├── components/
│   ├── ui/                     # 汎用UIコンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── spinner.tsx
│   │   ├── toast.tsx
│   │   └── modal.tsx
│   │
│   ├── layout/
│   │   ├── header.tsx
│   │   └── footer.tsx
│   │
│   ├── dashboard/
│   │   └── sidebar.tsx
│   │
│   ├── create/                 # 投稿作成ステップ
│   │   ├── step-post-type.tsx
│   │   ├── step-content-input.tsx
│   │   ├── step-image-settings.tsx
│   │   └── step-result.tsx
│   │
│   ├── characters/
│   │   └── character-form.tsx
│   │
│   └── providers/
│       └── providers.tsx       # SessionProvider, ToastProvider
│
├── lib/
│   ├── utils.ts                # cn() ユーティリティ
│   ├── auth.ts                 # NextAuth設定
│   ├── supabase.ts             # Supabaseクライアント
│   ├── gemini.ts               # Gemini AIクライアント
│   ├── post-types.ts           # 投稿タイプ定義
│   ├── templates.ts            # テンプレート定義
│   ├── image-styles.ts         # 画像スタイル定義
│   ├── image-prompt.ts         # 画像プロンプト生成
│   ├── api-client.ts           # fetchラッパー (リトライ付き)
│   ├── validation.ts           # URLバリデーション
│   ├── error-messages.ts       # エラーメッセージ
│   └── analytics.ts            # GA4イベント
│
└── types/
    └── post.ts                 # 型定義
```

### 3.2 データフロー

```
[ユーザー]
    │
    ▼ Google OAuth ログイン
[ログインページ] ──────────────────────────────────────┐
    │                                                  │
    ▼ 認証成功                                         │ 未認可
[ダッシュボード]                                       ▼
    │                                           [未認可ページ]
    ├── 投稿作成
    │     │
    │     ▼ Step 1: 投稿タイプ選択
    │   [PostTypeSelector]
    │     │
    │     ▼ Step 2: 内容入力 (メモ or URL抽出)
    │   [ContentInput] ──── POST /api/extract (URL時)
    │     │
    │     ▼ Step 3: 画像設定
    │   [ImageSettings]
    │     │
    │     ▼ POST /api/generate/caption
    │   [Gemini Flash] → キャプション + ハッシュタグ
    │     │
    │     ▼ POST /api/generate/image
    │   [Gemini Imagen] → 画像生成
    │     │
    │     ▼ POST /api/posts (保存)
    │   [Supabase] → posts, post_images テーブル
    │     │
    │     ▼ Step 4: 結果表示
    │   [ResultPage]
    │     ├── キャプション編集
    │     ├── ハッシュタグ選択/追加/削除
    │     ├── 画像ダウンロード
    │     ├── テキストコピー
    │     └── Instagram起動
    │
    ├── 履歴一覧 ──── GET /api/posts
    │     │
    │     ▼ 詳細表示 ──── GET /api/posts/[id]
    │
    └── キャラクター管理
          │
          ├── 一覧取得 ──── GET /api/characters
          ├── 登録 ──── POST /api/characters
          │     └── 特徴抽出 ──── POST /api/characters/analyze
          ├── 更新 ──── PUT /api/characters/[id]
          └── 削除 ──── DELETE /api/characters/[id]
```

---

## 4. データベース設計 (Supabase)

### 4.1 テーブル構造

#### characters
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | text | ユーザーID |
| name | text | キャラクター名 |
| image_url | text | 画像URL (Storage) |
| description | text | 特徴説明 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

#### posts
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | text | ユーザーID |
| post_type | text | 投稿タイプ |
| input_text | text | 入力テキスト |
| caption | text | 生成キャプション |
| hashtags | text[] | ハッシュタグ配列 |
| created_at | timestamp | 作成日時 |

#### post_images
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| post_id | uuid | 投稿ID (FK) |
| image_url | text | 画像URL |
| style | text | 画像スタイル |
| aspect_ratio | text | アスペクト比 |
| created_at | timestamp | 作成日時 |

### 4.2 Storage バケット

| バケット名 | 用途 | 公開 |
|-----------|------|------|
| characters | キャラクター画像 | Yes |
| post-images | 生成画像 | Yes |

### 4.3 Row Level Security

全テーブルでRLS有効化。ユーザーは自身のデータのみアクセス可能。

---

## 5. APIエンドポイント仕様

### 5.1 認証API

#### GET/POST /api/auth/[...nextauth]
NextAuth.js ハンドラ。Google OAuth認証。

---

### 5.2 キャラクターAPI

#### GET /api/characters
ユーザーのキャラクター一覧を取得。

#### POST /api/characters
キャラクターを登録。画像はSupabase Storageにアップロード。

#### PUT /api/characters/[id]
キャラクター情報を更新。

#### DELETE /api/characters/[id]
キャラクターを削除。Storage画像も削除。

#### POST /api/characters/analyze
画像からキャラクター特徴を抽出 (Gemini Vision)。

---

### 5.3 生成API

#### POST /api/generate/caption
**Request:**
```typescript
{
  postType: 'solution' | 'promotion' | 'tips' | 'showcase'
  inputText: string
}
```

**Response:**
```typescript
{
  caption: string    // テンプレート適用済みキャプション
  hashtags: string[] // ハッシュタグ10個
}
```

#### POST /api/generate/image
**Request:**
```typescript
{
  style: 'manga_male' | 'manga_female' | 'pixel_art' | 'illustration'
  aspectRatio: '1:1' | '9:16'
  sceneDescription: string
  characterDescription?: string
}
```

**Response:**
```typescript
{
  imageUrl: string  // Supabase Storage URL
}
```

#### POST /api/generate/scene
**Request:**
```typescript
{
  caption: string
  postType: string
}
```

**Response:**
```typescript
{
  scenes: string[]  // シーン候補3つ
}
```

---

### 5.4 投稿API

#### GET /api/posts
ユーザーの投稿履歴一覧。

#### POST /api/posts
新規投稿を保存。

#### GET /api/posts/[id]
投稿詳細を取得。

#### DELETE /api/posts/[id]
投稿を削除。関連画像も削除。

---

### 5.5 抽出API

#### POST /api/extract
**Request:**
```typescript
{
  url: string
}
```

**Response:**
```typescript
{
  title: string
  content: string
  excerpt: string
}
```

---

## 6. UI/UXデザイン仕様

### 6.1 デザインシステム

**カラーパレット:**
```css
--primary: グラデーション (purple-600 → pink-500 → orange-400)
--background: グラデーション (gray-900 → gray-800 → gray-900)
--text-primary: #FFFFFF
--text-secondary: #9CA3AF (gray-400)
--border: rgba(255,255,255,0.1)
--success: #10B981 (green-500)
--error: #EF4444 (red-500)
```

**フォント:**
- 英語: Poppins
- 日本語: M PLUS Rounded 1c

**デザインスタイル:**
- ダークテーマ
- グラスモーフィズム (backdrop-blur, bg-white/10)
- グラデーションアクセント
- モダン・ミニマル

### 6.2 レスポンシブブレイクポイント

| ブレイクポイント | サイズ | レイアウト |
|-----------------|--------|-----------|
| Mobile | < 768px | 1カラム、サイドバー非表示 |
| Tablet | 768px - 1023px | 1カラム、サイドバー折りたたみ |
| Desktop | >= 1024px | 2カラム、サイドバー表示 |

### 6.3 タッチターゲット

- 最小サイズ: 44×44 px
- ボタン padding: min 12px

---

## 7. セキュリティ

### 7.1 認証

| 項目 | 実装 |
|------|------|
| 認証方式 | Google OAuth 2.0 |
| セッション | NextAuth.js (JWT) |
| アクセス制御 | ホワイトリスト (ALLOWED_EMAILS) |
| ミドルウェア | /dashboard, /create, /history を保護 |

### 7.2 データアクセス

| 項目 | 実装 |
|------|------|
| RLS | 全テーブルで有効 |
| サーバー側認証 | 全APIでセッションチェック |
| Storage | 認証ユーザーのみアップロード可 |

### 7.3 環境変数

```bash
# 認証
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ALLOWED_EMAILS=user1@example.com,user2@example.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GOOGLE_AI_API_KEY=

# Analytics
NEXT_PUBLIC_GA_ID=
```

---

## 8. 運営情報

### 8.1 連絡先

- **Instagram**: https://www.instagram.com/hohoemi.rabo/
- **ホームページ**: https://www.hohoemi-rabo.com/
- **ポートフォリオ**: https://www.masayuki-kiwami.com/works

---

## 9. Phase 3 計画機能

- [ ] 複数テンプレートの追加
- [ ] 画像編集機能
- [ ] 画像にテキストオーバーレイ
- [ ] 予約投稿機能
- [ ] マルチプラットフォーム対応 (Twitter/Facebook)

---

## 10. 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-23 | 初版作成 (Phase 1完了時点) |
| 2026-01-25 | Phase 2完了に伴い全面更新 |
