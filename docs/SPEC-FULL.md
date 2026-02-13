# Post Craft 仕様書 (Phase 4 完了時点)

**Version**: Phase 4 Complete
**Last Updated**: 2026-02-13
**Framework**: Next.js 15.5.9 (App Router), React 19.1.0, TypeScript 5.x

---

## 1. プロジェクト概要

**Post Craft** は、メモ書きやブログ記事URLからInstagram投稿素材（キャプション、ハッシュタグ、画像）をAIで自動生成するWebサービス。

| 項目 | 値 |
|------|-----|
| 本番URL | https://post-craft-rho.vercel.app/ |
| ホスティング | Vercel |
| 認証 | Google OAuth (NextAuth.js v5) + メールホワイトリスト |
| データベース | Supabase (PostgreSQL) |
| AI (文章) | Google Gemini Flash (`gemini-3-flash-preview`) |
| AI (画像分析) | Google Gemini Pro (`gemini-3-pro-preview`) |
| AI (画像生成) | Google Gemini Image (`gemini-3-pro-image-preview`) |
| Instagram | Facebook Graph API v21.0 + FB JS SDK |
| スタイリング | Tailwind CSS 3.4.17 |

---

## 2. データベーススキーマ

### 2.1 users

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | ユーザーID |
| `email` | text (UNIQUE) | メールアドレス |
| `name` | text | 表示名 |
| `avatar_url` | text | アバター画像URL |
| `role` | text | ロール |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

- Google OAuth signIn 時に自動作成・更新

### 2.2 posts

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | 投稿ID |
| `user_id` | text (FK → users.id) | ユーザーID |
| `post_type` | text | 投稿タイプslug (`solution`, `tips` 等) |
| `post_type_id` | UUID (FK → post_types.id, ON DELETE SET NULL) | 投稿タイプID |
| `profile_id` | UUID (FK → profiles.id, ON DELETE SET NULL) | プロフィールID |
| `input_text` | text | 入力テキスト（メモ/記事内容） |
| `source_url` | text | ブログ記事URL |
| `generated_caption` | text | AI生成キャプション |
| `generated_hashtags` | text[] | ハッシュタグ配列（計10個） |
| `related_post_id` | UUID (FK → posts.id, ON DELETE SET NULL) | 関連投稿ID |
| `instagram_published` | boolean (DEFAULT false) | Instagram投稿済みフラグ |
| `instagram_media_id` | text | InstagramメディアID |
| `instagram_published_at` | timestamptz | Instagram投稿日時 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

**リレーション**:
- `post_images(*)` via `post_images.post_id`
- `post_type_ref:post_types(*)` via `post_type_id`
- `profile_ref:profiles(*)` via `profile_id`

**デュアルシステム**:
- `post_type` (slug文字列): 後方互換用
- `post_type_id` (UUID FK): 現行システム

### 2.3 post_images

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | 画像ID |
| `post_id` | UUID (FK → posts.id, ON DELETE CASCADE) | 投稿ID |
| `image_url` | text | Supabase Storage 公開URL |
| `style` | text | 画像スタイル (`manga_male`, `uploaded` 等) |
| `aspect_ratio` | text | アスペクト比 (`1:1`, `9:16` 等) |
| `character_id` | UUID (FK → characters.id, ON DELETE SET NULL) | キャラクターID |
| `prompt` | text | AI生成プロンプト |
| `created_at` | timestamptz | 作成日時 |

### 2.4 post_types

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | 投稿タイプID |
| `user_id` | text (FK → users.id) | ユーザーID |
| `name` | text (50文字以下) | タイプ名 |
| `slug` | text (UNIQUE per user) | スラッグ |
| `description` | text (200文字以下) | 説明 |
| `icon` | text | 絵文字アイコン |
| `template_structure` | text (2000文字以下) | テンプレート本体 |
| `placeholders` | jsonb | プレースホルダー配列 |
| `min_length` | integer | キャプション最小文字数 |
| `max_length` | integer | キャプション最大文字数 |
| `input_mode` | text (`fields` / `memo`) | 入力モード |
| `sort_order` | integer | 並び順 |
| `is_active` | boolean (DEFAULT true) | 有効/無効 |
| `user_memo` | text | ユーザーメモ |
| `type_prompt` | text | タイプ別AIプロンプト |
| `profile_id` | UUID (FK → profiles.id, ON DELETE SET NULL) | 所属プロフィール |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

**ビルトインタイプ（7種類）**:

| slug | 名前 | アイコン | 説明 |
|------|------|---------|------|
| `solution` | 解決タイプ | 🔧 | よくある質問と解決方法 |
| `promotion` | 宣伝タイプ | 📢 | サービス・商品の告知 |
| `tips` | AI活用タイプ | 💡 | AIの便利な使い方 |
| `showcase` | 実績タイプ | ✨ | 制作事例・成果 |
| `useful` | お役立ちタイプ | 📖 | 汎用的な便利情報 |
| `howto` | 使い方タイプ | 📝 | 便利情報＋手順 |
| `image_read` | 画像読み取り | 📸 | 画像をAIで読み取り投稿文を生成 |

**制限**: ユーザーあたり最大10個

### 2.5 profiles

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | プロフィールID |
| `user_id` | text (FK → users.id) | ユーザーID |
| `name` | text | プロフィール名 |
| `icon` | text | 絵文字アイコン |
| `description` | text | 説明 |
| `system_prompt_memo` | text | システムプロンプトのメモ |
| `system_prompt` | text | AI用システムプロンプト |
| `required_hashtags` | text[] | 必須ハッシュタグ |
| `is_default` | boolean | デフォルト選択フラグ |
| `sort_order` | integer | 並び順 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

**デフォルト必須ハッシュタグ**: `['ほほ笑みラボ', '飯田市', 'パソコン教室', 'スマホ']`

**制限**: ユーザーあたり最大5個

### 2.6 characters

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | キャラクターID |
| `user_id` | text (FK → users.id) | ユーザーID |
| `name` | text (50文字以下) | キャラクター名 |
| `description` | text (10-500文字) | AI抽出の特徴テキスト |
| `image_url` | text | Supabase Storage URL |
| `is_default` | boolean | デフォルトフラグ |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

### 2.7 user_settings

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | 設定ID |
| `user_id` | text (FK → users.id, UNIQUE) | ユーザーID |
| `required_hashtags` | text[] | レガシー必須ハッシュタグ |
| `system_prompt_memo` | text | レガシーメモ |
| `system_prompt` | text | レガシーシステムプロンプト |
| `settings` | jsonb | 将来拡張用 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

- プロフィール機能導入前のレガシー設定
- `profileId` 未指定時のフォールバックとして使用

### 2.8 Row Level Security (RLS)

全テーブルで RLS 有効化:
```sql
CREATE POLICY "Users can CRUD own data" ON <table>
  FOR ALL USING (auth.uid()::text = user_id::text);
```

### 2.9 Supabase Storage バケット

| バケット | 用途 | パス形式 | 公開 |
|---------|------|---------|------|
| `characters` | キャラクター画像 | `{userId}/{timestamp}.{ext}` | Yes |
| `generated-images` | 投稿画像 | `{userId}/generated/{uuid}.{ext}` or `{userId}/uploaded/{timestamp}.{ext}` | Yes |

---

## 3. API Routes

### 3.1 認証

| Route | Method | 説明 |
|-------|--------|------|
| `/api/auth/[...nextauth]` | - | NextAuth.js ハンドラ (signIn, callback, session) |

### 3.2 投稿管理

| Route | Method | リクエスト | レスポンス | 説明 |
|-------|--------|----------|----------|------|
| `/api/posts` | GET | `?page=1&limit=10&postType=solution` | `{ posts, total, page, totalPages }` | ページネーション付き一覧 |
| `/api/posts` | POST | `{ postType, inputText, generatedCaption, ... }` | 完全な投稿データ | 投稿作成 + post_images レコード |
| `/api/posts/[id]` | GET | - | 完全な投稿データ (JOIN込み) | post_images, post_type_ref, profile_ref 含む |
| `/api/posts/[id]` | PATCH | ホワイトリストフィールド | 更新後の完全データ | 汎用更新 |
| `/api/posts/[id]` | DELETE | - | `{ success: true }` | Storage画像も削除 |
| `/api/posts/[id]/image` | POST | FormData (image, replace?) | `{ imageUrl }` | 画像アップロード/差し替え |
| `/api/posts/[id]/image` | PUT | JSON `{ imageUrl, style, aspectRatio, prompt }` | `{ imageUrl }` | 画像レコード更新（再生成用） |

**PATCH ホワイトリストフィールド**:
`post_type`, `post_type_id`, `input_text`, `generated_caption`, `generated_hashtags`, `instagram_published`, `instagram_media_id`, `related_post_id`, `profile_id`

### 3.3 AI生成

| Route | Method | リクエスト | レスポンス | 説明 |
|-------|--------|----------|----------|------|
| `/api/generate/caption` | POST | `{ postType, postTypeId, profileId, inputText, sourceUrl, imageBase64, relatedPostCaption, relatedPostHashtags }` | `{ caption, hashtags, templateData }` | キャプション + ハッシュタグ生成 |
| `/api/generate/image` | POST | `{ style, aspectRatio, characterId, sceneDescription, useCharacterImage, catchphrase, backgroundType }` | `{ imageUrl }` | AI画像生成 |
| `/api/generate/scene` | POST | `{ postType, caption }` | `{ sceneDescription }` | シーン説明生成 |
| `/api/generate/catchphrase` | POST | `{ caption }` | `{ catchphrase }` | キャッチコピー生成 (10-20文字) |
| `/api/extract` | POST | `{ url }` | `{ title, content }` | ブログ記事抽出 |

### 3.4 投稿タイプ管理

| Route | Method | 説明 |
|-------|--------|------|
| `/api/post-types` | GET | 一覧 (`?profileId=xxx` でフィルター可) |
| `/api/post-types` | POST | 新規作成 |
| `/api/post-types/[id]` | GET | 詳細取得 |
| `/api/post-types/[id]` | PUT | 更新 |
| `/api/post-types/[id]` | DELETE | 削除 (`posts.post_type_id` を NULL に) |
| `/api/post-types/[id]/duplicate` | POST | 複製 |

### 3.5 プロフィール管理

| Route | Method | 説明 |
|-------|--------|------|
| `/api/profiles` | GET | 一覧 (post_types count 付き) |
| `/api/profiles` | POST | 新規作成 |
| `/api/profiles/[id]` | GET | 詳細取得 |
| `/api/profiles/[id]` | PUT | 更新 |
| `/api/profiles/[id]` | DELETE | 削除 (`post_types.profile_id` を NULL に) |
| `/api/profiles/[id]/hashtags` | GET | 必須ハッシュタグ取得 |
| `/api/profiles/[id]/hashtags` | PUT | 必須ハッシュタグ更新 |
| `/api/profiles/[id]/system-prompt` | GET | システムプロンプト取得 |
| `/api/profiles/[id]/system-prompt` | PUT | システムプロンプト更新 |

### 3.6 キャラクター管理

| Route | Method | 説明 |
|-------|--------|------|
| `/api/characters` | GET | 一覧 |
| `/api/characters` | POST | 新規作成 (FormData: name, description, isDefault, image) |
| `/api/characters/[id]` | PUT | 更新 |
| `/api/characters/[id]` | DELETE | 削除 (Storage画像も削除) |
| `/api/characters/analyze` | POST | AI特徴抽出 (Gemini Vision) |

### 3.7 Instagram投稿

| Route | Method | 説明 |
|-------|--------|------|
| `/api/instagram/accounts` | POST | FBトークン交換 + IGアカウント取得 |
| `/api/instagram/publish` | POST | メディアコンテナ作成 → ポーリング → 公開 |

- ダッシュボード: `Content-Type: application/json` + `imageUrl`
- スタンドアロン: `Content-Type: multipart/form-data` + `image` (File)

### 3.8 設定 (レガシー)

| Route | Method | 説明 |
|-------|--------|------|
| `/api/settings/hashtags` | GET/PUT | レガシー必須ハッシュタグ |
| `/api/settings/system-prompt` | GET/PUT | レガシーシステムプロンプト |

### 3.9 認証ヘルパー (`lib/api-utils.ts`)

```typescript
requireAuth()                    // → { error, session, userId }
requirePostOwnership(id, userId) // → { error, post }
requireCharacterOwnership(id, userId) // → { error, character }
requireProfileOwnership(id, userId)   // → { error, profile }
requirePostTypeOwnership(id, userId)  // → { error, postType }
```

---

## 4. ページ構成

### 4.1 App Router レイアウト

```
src/app/
├── (auth)/                           # 認証ページ（サイドバーなし）
│   ├── login/page.tsx               # Google OAuth ログイン
│   └── unauthorized/page.tsx        # メールホワイトリスト拒否
├── (dashboard)/                      # 保護ページ（サイドバー付き）
│   ├── layout.tsx                   # サイドバー + モバイルナビ + Provider
│   ├── dashboard/page.tsx           # ホーム: 最近の投稿 + 統計 (Server Component)
│   ├── create/page.tsx              # 投稿作成（ステップ制）(Client Component)
│   ├── history/page.tsx             # 履歴一覧 (Server Component + Suspense)
│   ├── history/[id]/page.tsx        # 履歴詳細 + インライン編集 (Client Component)
│   ├── characters/page.tsx          # キャラクター管理
│   └── settings/
│       ├── page.tsx                 # 設定ハブ
│       ├── hashtags/page.tsx        # ハッシュタグ設定（レガシー）
│       ├── system-prompt/page.tsx   # システムプロンプト（レガシー）
│       ├── post-types/page.tsx      # 投稿タイプ一覧（プロフィールタブフィルター付き）
│       ├── post-types/new/page.tsx  # 投稿タイプ新規作成
│       ├── post-types/[id]/page.tsx # 投稿タイプ編集
│       ├── profiles/page.tsx        # プロフィール一覧
│       ├── profiles/new/page.tsx    # プロフィール新規作成
│       └── profiles/[id]/page.tsx   # プロフィール編集
├── api/                              # API Routes
├── publish/                          # Instagram投稿（スタンドアロン）
├── contact/page.tsx                 # お問い合わせ
└── privacy/page.tsx                 # プライバシーポリシー
```

### 4.2 ミドルウェア

```typescript
// src/middleware.ts
// /dashboard/*, /create/*, /history/* → 未認証時 /login にリダイレクト
export const config = {
  matcher: ['/dashboard/:path*', '/create/:path*', '/history/:path*'],
}
```

---

## 5. 投稿作成フロー

### 5.1 ステップ構成

**画像生成あり（6ステップ）**:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定 → 4. キャッチコピー確認 → 5. 生成中 → 6. 完成

**画像スキップ（5ステップ）**:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定(スキップ) → 4. 生成中 → 5. 完成

**画像読み取りタイプ（4ステップ）**:
1. タイプ選択 → 2. 画像アップロード + メモ → 3. 生成中 → 4. 完成

**プロフィール選択ステップ**: プロフィールが2つ以上ある場合のみ表示（ステップ0）

### 5.2 入力モード

| モード | 説明 | 対象 |
|--------|------|------|
| `fields` | テンプレートのプレースホルダーに沿って入力 | ビルトイン＋カスタム |
| `memo` | 自由記述テキストエリア | カスタムタイプ |

### 5.3 関連投稿参照

- 対象: 全投稿タイプ（`image_read` を除く）
- 参照数: 1投稿のみ
- キャプション: 冒頭に前回の投稿を1文で触れる導入文を自動生成
- ハッシュタグ: 前回のハッシュタグを優先的に再利用 + 追加生成（計10個）
- 画像設定: 3択（前回設定を引き継ぐ / 新しく設定する / 画像なし）
- DB: `posts.related_post_id` で関連を記録

### 5.4 画像生成オプション

**スタイル**:

| ID | スタイル | 説明 | キャラクター対応 |
|----|---------|------|----------------|
| `manga_male` | マンガ風（男性） | テック・ビジネス系、鮮やかな配色 | Yes |
| `manga_female` | マンガ風（女性） | クリエイティブ系、パステル調 | Yes |
| `pixel_art` | ピクセルアート | レトロゲーム風、サイバー背景 | Yes |
| `illustration` | イラスト（人物なし） | フラットデザイン、図形のみ | No |
| `realistic` | リアル（写真風） | 写真のようなリアルな画像 | Yes |

**背景タイプ**:

| ID | タイプ | 説明 |
|----|--------|------|
| `tech` | テクノロジー背景 | PC、AI、デジタル要素を含む |
| `auto` | 内容に合わせる | シーン説明から自動判定 |

**アスペクト比**:

| 形式 | 比率 | サイズ | 用途 |
|------|------|--------|------|
| フィード | 1:1 | 1080x1080 | 通常投稿 |
| フィード縦 | 4:5 | 1080x1350 | 縦長投稿 |
| リール | 9:16 | 1080x1920 | ショート動画 |
| 横長 | 16:9 | 1080x608 | 横長投稿 |

### 5.5 キャッチコピー

- 投稿内容からAIが10-20文字のキャッチコピーを自動生成
- 確認画面でユーザーが編集・再生成可能（30文字以内）
- 全ての画像スタイルで画像内にテキスト表示

---

## 6. 投稿履歴

### 6.1 一覧ページ (Server Component + Suspense)

**アーキテクチャ**:
```
page.tsx (Server Component)
  ├── ヘッダー（静的テキスト: 即表示）
  ├── HistoryFilter (Client: onChange → URL searchParams 更新)
  └── <Suspense key={page-postType} fallback={<HistorySkeleton />}>
       └── HistoryPostList (Server async: Supabase直接クエリ)
            ├── 空状態UI (0件時)
            ├── HistoryPostCard (Server) × N
            │    └── HistoryDeleteButton (Client: postId のみ)
            └── HistoryPagination (Server: <Link>ベース)
```

**URL ベースの状態管理**:
```
/history                         → 1ページ目、フィルターなし
/history?page=2                  → 2ページ目
/history?postType=tips           → tipsフィルター
/history?page=2&postType=tips    → 2ページ目 + tipsフィルター
```

**コンポーネント分割**:

| コンポーネント | Server/Client | 機能 |
|--------------|--------------|------|
| `history-post-list.tsx` | Server (async) | Supabase直接クエリ + 一覧表示 |
| `history-post-card.tsx` | Server | 投稿カード（バッジ・サムネイル） |
| `history-filter.tsx` | Client | フィルタードロップダウン |
| `history-delete-button.tsx` | Client | 削除ボタン + 確認UI |
| `history-pagination.tsx` | Server | `<Link>` ベースのページネーション |
| `history-skeleton.tsx` | Server | Suspense フォールバック |

**データフェッチ**: `createServerClient()` + `POST_SELECT_QUERY` で Supabase に直接クエリ（API Route 不要）

**ページネーション**: `<Link href>` ベース（JS不要、プリフェッチ対応）

**削除**: `HistoryDeleteButton` → DELETE API → `router.refresh()` で Server Component 再実行

### 6.2 詳細ページ + インライン編集

- 編集モード: ヘッダーの「編集」ボタンで切り替え
- キャプション: textarea で直接編集 + AIで再生成
- ハッシュタグ: 追加/削除UI
- 入力メモ: textarea で直接編集
- 投稿タイプ: モーダルで変更（タイプのみ or キャプション再生成も選択可）
- 画像差し替え: ImageUploader で手動アップロード
- 画像再生成: モーダルでスタイル/アスペクト比/背景タイプを選択 → AI再生成
- 保存: PATCH `/api/posts/[id]` で一括更新

### 6.3 投稿バッジ表示（ダッシュボード・履歴共通）

| バッジ | 色 | 条件 |
|--------|-----|------|
| 投稿タイプ (アイコン + 名前) | - | 常に表示 |
| 画像スタイル | 紫 (`bg-purple-500/20`) | 画像あり |
| プロフィール | 青 (`bg-blue-600/15`) | プロフィール紐付き |
| 投稿済み | 緑 (`bg-green-500/20`) | `instagram_published=true` |
| 未投稿 | グレー (`bg-white/5`) | `instagram_published=false` |

---

## 7. Instagram投稿機能

### 7.1 投稿フロー

1. ユーザーが投稿ボタンをクリック → Facebook SDK ログインモーダル
2. FB SDK `/login` → 短期トークン取得
3. POST `/api/instagram/accounts` → トークン交換 + IGアカウント取得
4. ユーザーがアカウント選択 → AccountSelector
5. キャプション確認 → PublishForm
6. POST `/api/instagram/publish` → メディアコンテナ作成 → ポーリング → 公開
7. 成功 → `instagram_published=true`, `instagram_media_id`, `instagram_published_at` を更新

### 7.2 トークン交換

```
短期トークン → GET /v21.0/oauth/access_token → 60日長期トークン
```

### 7.3 メディア公開

```
1. POST /v21.0/{ig_account_id}/media → container_id
2. ポーリング (最大120回, 1秒間隔) → status=PUBLISHED
3. POST /v21.0/{ig_account_id}/media_publish → media_id
```

### 7.4 統合箇所

- 投稿作成完了画面（StepResult）
- 履歴詳細ページ
- スタンドアロンページ（`/publish`）

### 7.5 Context

`InstagramPublishProvider` でFB SDK初期化 + ログイン状態をダッシュボード内で共有

---

## 8. プロフィール機能 (Phase 4)

### 8.1 概要

投稿タイプをプロフィール（ペルソナ）ごとにグループ化する機能。ターゲット層・トーン（システムプロンプト）・必須ハッシュタグを個別に設定可能。

### 8.2 機能

- プロフィール作成・編集・削除・並び替え
- デフォルトプロフィール設定（`is_default=true`）
- 投稿タイプとの紐付け（`post_types.profile_id`）
- プロフィール別システムプロンプト
- プロフィール別必須ハッシュタグ
- 投稿作成時のプロフィール選択（2つ以上で表示）

### 8.3 設定画面

- `/settings/profiles` - 一覧
- `/settings/profiles/new` - 新規作成
- `/settings/profiles/[id]` - 編集（システムプロンプト・ハッシュタグ含む）

### 8.4 キャプション生成との連携

1. 投稿作成時: 選択プロフィールの `system_prompt` + `required_hashtags` をAIプロンプトに含める
2. 履歴編集時: 投稿に紐付くプロフィールの設定を使用
3. フォールバック: `profileId` なしの場合は `user_settings` テーブルから取得

---

## 9. AI機能詳細

### 9.1 使用モデル

| 用途 | モデル | 変数名 |
|------|--------|--------|
| 文章生成 | `gemini-3-flash-preview` | `geminiFlash` |
| 画像分析 | `gemini-3-pro-preview` | `geminiVision` |
| 画像生成 | `gemini-3-pro-image-preview` | `geminiImageGen` |
| 画像生成（マルチモーダル） | `gemini-3-pro-image-preview` | `geminiImageGenMultimodal` |

### 9.2 キャプション生成

**投稿タイプ解決パス**:
1. `postTypeId` あり → `post_types` テーブルから取得（カスタムタイプ対応）
2. `postType` あり、`postTypeId` なし → `POST_TYPES` 定数からフォールバック

**生成ルール**:
- 文字数: 200-400文字（カスタムタイプは `min_length`/`max_length` で制御）
- 絵文字: 適度に使用
- ハッシュタグ: 計10個（必須タグ + 生成タグ）
- 入力テキストの内容のみ使用（情報を捏造しない）

**後処理 (`cleanGeneratedCaption`)**:
- ハッシュタグ行の自動除去
- 表紙タイトル案の自動除去
- テンプレート前処理でもハッシュタグ行を除去

### 9.3 シーン説明生成

投稿内容から30-50文字のシーン説明を生成し、画像生成プロンプトの基礎にする。

### 9.4 キャッチコピー生成

投稿内容から10-20文字のキャッチコピーを生成。画像内にテキストとして表示。

### 9.5 画像生成フロー

```
1. キャプション生成
2. キャッチコピー生成（確認画面で編集可能）
3. キャラクター特徴テキスト取得（未登録ならデフォルト使用）
4. シーン説明生成
5. スタイル別ベースプロンプト + キャッチコピーで画像生成
6. Supabase Storage に保存
```

### 9.6 キャラクター特徴抽出

アップロードした画像からGemini Visionで特徴を抽出:
- 推定年代、性別、髪型・髪色、服装、表情・雰囲気、イラストスタイル、その他の特徴

---

## 10. コンポーネント構成

### 10.1 ディレクトリ構成

```
src/components/
├── ui/                # 汎用UI (button, input, textarea, card, modal, toast, spinner等)
├── layout/            # レイアウト (header, footer)
├── dashboard/         # ダッシュボード (header, sidebar, mobile-nav)
├── create/            # 投稿作成 (step-*, progress-indicator, style-selector等)
├── history/           # 履歴 (post-list, post-card, filter, pagination, delete-button, skeleton等)
├── characters/        # キャラクター管理
├── settings/          # 設定 (post-type-*, profile-*, emoji-picker等)
├── publish/           # Instagram投稿 (modal, login, account-selector等)
└── providers/         # Context Providers (providers, auth, instagram)
```

### 10.2 投稿作成コンポーネント

| コンポーネント | 説明 |
|--------------|------|
| `StepProfileSelect` | プロフィール選択（2つ以上で表示） |
| `StepPostType` | 投稿タイプ選択 + プロフィールバッジ表示 |
| `StepContentInput` | 内容入力（fields/memoモード） + 関連投稿参照 |
| `StepImageSettings` | 画像スタイル・アスペクト比・背景タイプ選択 |
| `StepImageReadInput` | 画像読み取りタイプ用入力 |
| `StepCatchphrase` | キャッチコピー確認・編集 |
| `StepGenerating` | 生成中の進捗表示 |
| `StepResult` | 完成画面 + Instagram投稿ボタン |
| `ProgressIndicator` | ステップ進捗バー |

---

## 11. カスタムフック

| フック | ファイル | 用途 |
|--------|---------|------|
| `useContentGeneration` | `useContentGeneration.ts` | 投稿作成の生成ロジック全般 |
| `useGenerationSteps` | `useGenerationSteps.ts` | 生成ステップの進捗管理 |
| `usePostEdit` | `usePostEdit.ts` | 履歴詳細の編集モード管理 |
| `useCopyActions` | `useCopyActions.ts` | コピー機能（キャプション、ハッシュタグ） |
| `usePostActions` | `usePostActions.ts` | 投稿アクション（削除、再利用、ダウンロード） |
| `usePostImageHandlers` | `usePostImageHandlers.ts` | 画像関連のハンドラ |
| `usePostTypes` | `usePostTypes.ts` | 投稿タイプ CRUD・並び替え・有効/無効 |
| `useProfiles` | `useProfiles.ts` | プロフィール CRUD・並び替え |
| `useUserSettings` | `useUserSettings.ts` | ユーザー設定（レガシー） |

---

## 12. 型定義

| ファイル | 主要な型 |
|---------|---------|
| `supabase.ts` | DB型定義（自動生成）: テーブルの Row, Insert, Update 型 |
| `post.ts` | `PostType` (union), `PostTypeConfig`, `isBuiltinPostType()` |
| `post-type.ts` | `PostTypeDB`, `PostTypeFormData`, `Placeholder` |
| `profile.ts` | `ProfileDB`, `ProfileFormData` |
| `create-flow.ts` | `CreateFormState`, `GeneratedResult`, `GenerationStep`, `INITIAL_FORM_STATE` |
| `history-detail.ts` | `Post`, `PostTypeRef`, `ProfileRef`, `PostImage`, `EditState`, `formatDate()` |
| `instagram.ts` | `FacebookAuthResponse`, `InstagramAccount`, `PublishStep`, `ContainerStatusCode` |

---

## 13. ライブラリユーティリティ

| ファイル | 主要なエクスポート |
|---------|------------------|
| `supabase.ts` | `supabase` (ブラウザ), `createServerClient()`, `POST_SELECT_QUERY` |
| `auth.ts` | `auth()`, `signIn()`, `signOut()` |
| `api-utils.ts` | `requireAuth()`, `requirePostOwnership()` 等 |
| `gemini.ts` | `geminiFlash`, `geminiVision`, `geminiImageGen`, `generateWithRetry()` |
| `constants.ts` | `TOTAL_HASHTAG_COUNT` (10), `IMAGE_UPLOAD` (サイズ・型制限) |
| `image-styles.ts` | `IMAGE_STYLES`, `ASPECT_RATIOS`, `BACKGROUND_TYPES`, `getAspectClass()` |
| `post-types.ts` | `POST_TYPES` (ビルトイン設定), `POST_TYPE_MAX_COUNT` |
| `instagram.ts` | `exchangeForLongLivedToken()`, `getInstagramAccounts()`, `createMediaContainer()`, `waitAndPublish()` |
| `image-prompt.ts` | `buildImagePrompt()`, `buildMultimodalImagePrompt()` |

---

## 14. テンプレート構造（ビルトインタイプ）

### 解決タイプ (solution)
```
📱 よくある質問
「{question}」

💡 解決方法
① {step1}
② {step2}
③ {step3}

✨ ワンポイント
{tip}

---
📍パソコン・スマホ ほほ笑みラボ（飯田市）
```

### 宣伝タイプ (promotion)
```
【{headline}】

✅ {pain_point1}
✅ {pain_point2}
✅ {pain_point3}

ほほ笑みラボでは
「体験」で終わらせない
必ず成果物を完成させる
AI実務活用サポートを行っています。

{call_to_action}

---
📍詳細はプロフィールのリンクから
```

### AI活用タイプ (tips)
```
【{title}】

AIを使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
📍AIの使い方、もっと知りたい方は
プロフィールのリンクから
```

### 実績タイプ (showcase)
```
【こんな{deliverable_type}を作りました】

📌 お客様の課題
{challenge}

🛠️ 作ったもの
{solution}

🎯 結果
{result}

---
📍一緒に作りませんか？
無料相談はプロフィールから
```

### お役立ちタイプ (useful)
```
【{title}】

{topic}を使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
📍{footer_message}
```

### 使い方タイプ (howto)
```
【{title}】

{topic}を使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
{howto_title}

1. {step1}

2. {step2}

3. {step3}

---
📍{footer_message}
```

### 画像読み取りタイプ (image_read)
```
{main_content}

{key_points}

{call_to_action}

---
📍パソコン・スマホ ほほ笑みラボ（飯田市）
```

---

## 15. 環境変数

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

# Google AI
GOOGLE_AI_API_KEY=

# Instagram (Facebook Graph API)
NEXT_PUBLIC_FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
```

---

## 16. ビルド・開発コマンド

```bash
npm run dev          # 開発サーバー (Turbopack)
npm run dev:https    # HTTPS付き開発（Facebook SDK用）
npm run build        # プロダクションビルド
npm run start        # プロダクション起動
npm run lint         # ESLint
```

---

## 17. パフォーマンス目標

| 項目 | 目標 |
|------|------|
| 文章生成（キャプション、シーン、キャッチコピー） | 5秒以内 |
| 画像生成 | 30秒以内 |
| キャラクター特徴抽出 | 5秒以内 |
| API レスポンス（一般） | 3秒以内 |
| Instagram投稿 | 60秒以内 |

---

## 18. セキュリティ

### 認証

- Google OAuth (NextAuth.js v5) + メールホワイトリスト
- JWT セッション
- httpOnly Cookie

### 認可

- 全テーブルで RLS 有効化
- API ルートで `requireAuth()` + 所有権チェック
- Service Role Key はサーバーサイドのみ

### ファイルアップロード

- Supabase Storage に `user_id` 名前空間で保存
- 認証済みユーザーのみアップロード可能
- ファイルタイプ・サイズのサーバーサイドバリデーション
- 差し替え時は古い画像を自動削除

---

## 19. UIデザイン

### テーマ

ダークテーマ:
- 背景: `slate-950` → `slate-900` グラデーション
- テキスト: `white` (primary), `slate-400` (secondary)
- ボーダー: `white/10`
- プライマリ: `blue-500`

### レスポンシブ

- モバイルファースト設計
- モバイル: < 768px
- タブレット: md (768px+)
- デスクトップ: lg (1024px+)

### フォント

- 英語: Poppins
- 日本語: M PLUS Rounded 1c

### アイコン

- 絵文字ベース（外部ライブラリ不要）
- ナビゲーション: 🏠 ✏️ 📋 👤 ⚙️

---

## 20. 制限事項・既知の制約

| 項目 | 制限 |
|------|------|
| 投稿タイプ | ユーザーあたり最大10個 |
| プロフィール | ユーザーあたり最大5個 |
| 画像アップロード | 8MB以下 |
| キャッチコピー | 30文字以内 |
| ハッシュタグ | 計10個（必須 + 生成） |
| Instagram投稿 | Business/Creator Account 必須 |
| Instagram ポーリング | 最大120回（2分） |
| キャプション文字数 | 200-400文字（ビルトイン）、カスタム設定可 |
