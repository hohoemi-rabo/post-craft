# Post Craft 仕様書

**Version**: Phase 4 完了 + 継続改善
**Last Updated**: 2026-03-22
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
| AI (画像分析) | Google Gemini Pro (`gemini-3.1-pro-preview`) |
| AI (画像生成) | Google Gemini Image (`gemini-3.1-flash-image-preview`) |
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
| `user_memo` | text | ユーザーメモ（AI生成の元） |
| `type_prompt` | text | タイプ別AIプロンプト |
| `profile_id` | UUID (FK → profiles.id, ON DELETE SET NULL) | 所属プロフィール |
| `source_analysis_id` | UUID (FK → competitor_analyses.id) | 分析から生成された場合の元分析ID |
| `flow_type` | text (DEFAULT 'standard') | フロータイプ (`standard` / `image_read`) |
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

**フロータイプ (`flow_type`)**:
- `standard` (デフォルト): 通常の5-6ステップフロー
- `image_read`: 画像読み取り専用の4ステップフロー。複数プロフィールで利用可能（例: `image_read`, `image_read_biz`）
- フロー分岐は `PostTypeDB.flowType` / `CreateFormState.flowType` で判定（slug文字列比較ではない）

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

### 2.7 user_settings（レガシー）

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

### 2.8 competitor_analyses（分析機能）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | 分析ID |
| `user_id` | text (FK → users.id) | ユーザーID |
| `source_type` | text | ソースタイプ (`instagram` / `blog`) |
| `source_identifier` | text | ソース識別子（URL等） |
| `source_display_name` | text | 表示名 |
| `raw_data` | jsonb | 生データ |
| `analysis_result` | jsonb | 分析結果 |
| `status` | text | ステータス（`pending` / `analyzing` / `completed` / `error`） |
| `data_source` | text | データソース |
| `post_count` | integer | 投稿数 |
| `error_message` | text | エラーメッセージ |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

### 2.9 generated_configs（生成設定）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | 設定ID |
| `user_id` | text (FK → users.id) | ユーザーID |
| `analysis_id` | UUID (FK → competitor_analyses.id) | 元分析ID |
| `generated_profile_id` | UUID (FK → profiles.id, nullable) | 生成されたプロフィールID |
| `generated_post_type_ids` | text[] | 生成された投稿タイプIDの配列 |
| `generation_config` | jsonb | 生成設定 |
| `status` | text | ステータス |
| `created_at` | timestamptz | 作成日時 |

### 2.10 post_ideas（アイデア提案）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID (PK) | アイデアID |
| `user_id` | text (FK → users.id) | ユーザーID |
| `profile_id` | UUID (FK → profiles.id, ON DELETE CASCADE) | プロフィールID |
| `title` | text | タイトル（20文字以内） |
| `description` | text | 詳細説明（15行程度） |
| `is_used` | boolean (DEFAULT false) | 使用済みフラグ |
| `ai_instructions` | text | AI追加指示 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

### 2.11 Row Level Security (RLS)

全テーブルで RLS 有効化:
```sql
CREATE POLICY "Users can CRUD own data" ON <table>
  FOR ALL USING ((SELECT auth.uid())::text = user_id::text);
```

- `(SELECT auth.uid())` パターンで行ごとの再評価を防止
- service_role は自動的に RLS をバイパス

### 2.12 Supabase Storage バケット

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
| `/api/posts` | GET | `?limit=20&offset=0&postType=solution` | `{ posts, hasMore }` | 「もっと見る」方式の一覧取得 |
| `/api/posts` | POST | `{ postType, postTypeId, profileId, inputText, ... }` | 完全な投稿データ | 投稿作成 + post_images レコード |
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
| `/api/generate/post-type` | POST | `{ name, description, minLength, maxLength, userMemo, inputMode }` | `{ typePrompt, templateStructure, placeholders, samplePost }` | 投稿タイプのAI生成 |
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
| `/api/post-types/reorder` | PUT | 並び替え |

### 3.5 プロフィール管理

| Route | Method | 説明 |
|-------|--------|------|
| `/api/profiles` | GET | 一覧 (post_types count 付き) |
| `/api/profiles` | POST | 新規作成 |
| `/api/profiles/[id]` | GET | 詳細取得 |
| `/api/profiles/[id]` | PUT | 更新 |
| `/api/profiles/[id]` | DELETE | 削除 (`post_types.profile_id` を NULL に) |
| `/api/profiles/[id]/hashtags` | GET/PUT | 必須ハッシュタグ |
| `/api/profiles/[id]/system-prompt` | GET/PUT | システムプロンプト |

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

### 3.8 分析機能

| Route | Method | 説明 |
|-------|--------|------|
| `/api/analysis` | GET/POST | 分析一覧 / 新規作成 |
| `/api/analysis/upload` | POST | CSVアップロード |
| `/api/analysis/blog-crawl` | POST | ブログクロール (sitemapUrl オプション) |
| `/api/analysis/sitemap-discover` | POST | サイトマップ自動探索・手動検証 |
| `/api/analysis/[id]` | GET/PUT/DELETE | 分析詳細CRUD |
| `/api/analysis/[id]/status` | GET | 分析ステータス確認 |
| `/api/analysis/[id]/generate` | POST | プロフィール・投稿タイプ生成 |
| `/api/analysis/[id]/apply` | POST | 生成結果をDB適用 |

### 3.9 アイデア提案

| Route | Method | 説明 |
|-------|--------|------|
| `/api/ideas` | GET | 一覧 (`?profileId=xxx`) |
| `/api/ideas` | POST | AI生成 (`{ profileId, aiInstructions? }`) |
| `/api/ideas/[id]` | PATCH | 編集 (`{ title?, description?, isUsed? }`) |
| `/api/ideas/[id]` | DELETE | 削除 |

### 3.10 設定 (レガシー)

| Route | Method | 説明 |
|-------|--------|------|
| `/api/settings/hashtags` | GET/PUT | レガシー必須ハッシュタグ |
| `/api/settings/system-prompt` | GET/PUT | レガシーシステムプロンプト |

### 3.11 認証ヘルパー (`lib/api-utils.ts`)

```typescript
requireAuth()                         // → { error, session, userId }
requirePostOwnership(id, userId)      // → { error, post }
requireCharacterOwnership(id, userId) // → { error, character }
requireProfileOwnership(id, userId)   // → { error, profile }
requirePostTypeOwnership(id, userId)  // → { error, postType }
requireAnalysisOwnership(id, userId)  // → { error, analysis }
requireIdeaOwnership(id, userId)      // → { error, idea }
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
│   ├── history/page.tsx             # 履歴一覧 (Server Component + Suspense + もっと見る)
│   ├── history/[id]/page.tsx        # 履歴詳細 + インライン編集
│   ├── characters/page.tsx          # キャラクター管理
│   ├── analysis/page.tsx            # 分析一覧
│   ├── analysis/new/page.tsx        # 新規分析ウィザード
│   ├── analysis/[id]/page.tsx       # 分析詳細レポート
│   ├── analysis/[id]/generate/page.tsx # 生成プレビュー・適用
│   ├── ideas/page.tsx               # アイデア一覧
│   ├── ideas/generate/page.tsx      # アイデア生成
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
// 未認証時 /login にリダイレクト
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/history/:path*',
    '/characters/:path*',
    '/settings/:path*',
    '/analysis/:path*',
    '/ideas/:path*',
  ],
}
```

---

## 5. 投稿作成フロー

### 5.1 ステップ構成

**画像生成あり（6ステップ）**:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定 → 4. キャッチコピー確認 → 5. 生成中 → 6. 完成

**画像スキップ（5ステップ）**:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定(スキップ) → 4. 生成中 → 5. 完成

**画像読み取りタイプ（4ステップ、`flow_type = 'image_read'`）**:
1. タイプ選択 → 2. 画像アップロード + メモ → 3. 生成中 → 4. 完成
- フロー分岐は `formState.flowType === 'image_read'` で判定
- 複数プロフィールで利用可能（例: シニア向け `image_read`、ビジネス向け `image_read_biz`）

**プロフィール選択ステップ**: プロフィールが2つ以上ある場合のみ表示（ステップ0）

### 5.2 入力モード

| モード | 説明 | 対象 |
|--------|------|------|
| `fields` | テンプレートのプレースホルダーに沿って入力 | ビルトイン＋カスタム |
| `memo` | 自由記述テキストエリア | カスタムタイプ |

### 5.3 関連投稿参照

- 対象: 全投稿タイプ（`image_read` フローを除く）
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

### 6.1 一覧ページ (Server Component + Suspense + もっと見る)

**アーキテクチャ**:
```
page.tsx (Server Component)
  ├── ヘッダー（静的テキスト: 即表示）
  ├── HistoryFilter (Client: onChange → URL searchParams 更新)
  └── <Suspense key={postType} fallback={<HistorySkeleton />}>
       └── HistoryPostList (Server async: 初回20件をSupabase直接クエリ)
            └── HistoryPostListClient (Client: 追加読み込み管理)
                 ├── HistoryPostCard × N
                 │    └── HistoryDeleteButton (Client: postId のみ)
                 └── 「もっと見る」ボタン → /api/posts で追加20件取得
```

**データ読み込み**:
- 初回: Server Component で20件を Supabase 直接クエリ
- 追加: 「もっと見る」ボタンで `/api/posts?offset=20&limit=20` から20件ずつ追加取得
- フィルター: URL `searchParams` で管理（`?postType=tips`）
- 削除後: `router.refresh()` で Server Component 再実行（追加読み込み分はリセット）

**コンポーネント分割**:

| コンポーネント | Server/Client | 機能 |
|--------------|--------------|------|
| `history-post-list.tsx` | Server (async) | 初回20件のデータフェッチ |
| `history-post-list-client.tsx` | Client | 「もっと見る」ボタン + 追加読み込み管理 |
| `history-post-card.tsx` | Server | 投稿カード（バッジ・サムネイル） |
| `history-filter.tsx` | Client | フィルタードロップダウン |
| `history-delete-button.tsx` | Client | 削除ボタン + 確認UI |
| `history-skeleton.tsx` | Server | Suspense フォールバック |

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

### 7.2 統合箇所

- 投稿作成完了画面（StepResult）
- 履歴詳細ページ
- スタンドアロンページ（`/publish`）

### 7.3 Context

`InstagramPublishProvider` でFB SDK初期化 + ログイン状態をダッシュボード内で共有

---

## 8. プロフィール機能

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

## 9. 分析機能

### 9.1 概要

競合のInstagramアカウントやブログ記事を分析し、プロフィールと投稿タイプを自動生成する機能。

### 9.2 分析フロー

1. ソース選択（Instagram CSV/手動入力 or ブログURL）
2. データ入力
3. AI分析実行 → レポート表示
4. プロフィール＋投稿タイプ生成 → プレビュー → 編集（任意） → 適用

### 9.3 ブログ分析のサイトマップ探索

- **自動探索**: URL入力 → `/sitemap.xml` 等5パス + `/robots.txt` を順番に試行
- **手動入力**: 自動検出失敗時 → サイトマップURLを直接入力 → 検証
- **スキップ**: サイトマップなしで続行 → RSS / リンク巡回フォールバック
- **パイプライン**: 事前発見済みサイトマップを `crawlBlog()` の `options.sitemapUrl` に渡して優先使用

### 9.4 適用

- `generated_configs` のデータを `profiles` + `post_types` テーブルに INSERT
- slug 重複時は `-2`, `-3` サフィックス付与
- 失敗時はロールバック

---

## 10. アイデア提案機能

### 10.1 概要

投稿履歴をAIに分析させ、新しい投稿アイデアを提案する機能。

### 10.2 フロー

1. プロフィール選択 → （AI追加指示入力）→ AI分析 → 5件のアイデア生成
2. 各アイデア: タイトル（20文字以内）+ 詳細説明（15行程度）

### 10.3 管理機能

- 編集、削除、使用済み/未使用トグル
- 再分析: いつでも追加生成可能（既存アイデアとの重複回避あり）

### 10.4 投稿作成連携

- 「この案で投稿作成」→ `/create` にメモ引き継ぎ
- 投稿完了時に自動で使用済みフラグを設定（`ideaId` を `sessionStorage` → `CreateFormState` → 投稿保存時に `PATCH`）

---

## 11. 投稿タイプ管理

### 11.1 設定画面の構成

**新規作成** (`/settings/post-types/new`):
1. 基本情報（プロフィール、アイコン、名前、説明、文字数、入力方式）
2. メモ書き入力 → 「AIで生成してプレビュー」
3. プレビューモーダル → 保存

**編集** (`/settings/post-types/[id]`):
1. 基本情報（編集可能）
2. 現在の設定
   - タイプ別プロンプト: **直接編集可能**
   - テンプレート構造: 表示のみ（変更はメモ書き→AI再生成で）
   - 入力項目: 表示のみ
3. メモ書き → AI再生成（テンプレート構造ごと作り直す場合）
4. 「保存」ボタン

### 11.2 AI生成の仕組み

メモ書きからAIが以下を一括生成:
- `typePrompt`: AIへの指示文（生成ルール）
- `templateStructure`: 出力フォーマット（見出し・区切り・構成）
- `placeholders`: テンプレート内の `{変数名}` 定義（fieldsモードのみ）

---

## 12. AI機能詳細

### 12.1 使用モデル

| 用途 | モデル | 変数名 |
|------|--------|--------|
| 文章生成 | `gemini-3-flash-preview` | `geminiFlash` |
| 画像分析 | `gemini-3.1-pro-preview` | `geminiVision` |
| 画像生成 | `gemini-3.1-flash-image-preview` | `geminiImageGen` |
| 画像生成（マルチモーダル） | `gemini-3.1-flash-image-preview` | `geminiImageGenMultimodal` |

### 12.2 キャプション生成

**投稿タイプ解決パス**:
1. `postTypeId` あり → `post_types` テーブルから取得（カスタムタイプ対応）。`flow_type === 'image_read'` で画像読み取りモードを判定
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

### 12.3 画像生成フロー

```
1. キャプション生成
2. キャッチコピー生成（確認画面で編集可能）
3. キャラクター特徴テキスト取得（未登録ならデフォルト使用）
4. シーン説明生成
5. スタイル別ベースプロンプト + キャッチコピーで画像生成
6. Supabase Storage に保存
```

### 12.4 マルチモーダル画像生成

- `useCharacterImage` オプションで有効化
- キャラクター画像を参照して一貫性のある画像を生成
- プロンプトに「キャラクター再現の最重要ルール」セクションを含め、年齢・顔立ち・髪型・体型の保持を明示

---

## 13. コンポーネント構成

### 13.1 ディレクトリ構成

```
src/components/
├── ui/                # 汎用UI (button, input, textarea, card, modal, toast, spinner等)
├── layout/            # レイアウト (header, footer)
├── dashboard/         # ダッシュボード (header, sidebar, mobile-nav)
├── create/            # 投稿作成 (step-*, progress-indicator, style-selector等)
├── history/           # 履歴 (post-list, post-list-client, post-card, filter, delete-button, skeleton, image-regenerate-modal等)
├── analysis/          # 分析 (wizard, report, generation-preview, profile-preview, posttype-preview-card等)
├── ideas/             # アイデア (ideas-list, idea-card, ideas-filter, ideas-generate-form, ideas-skeleton)
├── characters/        # キャラクター管理 (characters-client等)
├── settings/          # 設定 (post-type-form, post-type-list, profile-list, profile-detail-client, emoji-picker等)
├── publish/           # Instagram投稿 (modal, login, account-selector等)
└── providers/         # Context Providers (providers, auth, instagram)
```

### 13.2 投稿作成コンポーネント

| コンポーネント | 説明 |
|--------------|------|
| `StepProfileSelect` | プロフィール選択（2つ以上で表示） |
| `StepPostType` | 投稿タイプ選択（`flowType` パラメータ付き） |
| `StepContentInput` | 内容入力（fields/memoモード） + 関連投稿参照 |
| `StepImageSettings` | 画像スタイル・アスペクト比・背景タイプ選択 |
| `StepImageReadInput` | 画像読み取りタイプ用入力 |
| `StepCatchphrase` | キャッチコピー確認・編集 |
| `StepGenerating` | 生成中の進捗表示 |
| `StepResult` | 完成画面 + Instagram投稿ボタン |
| `ProgressIndicator` | ステップ進捗バー（`flowType` で表示切替） |

---

## 14. カスタムフック

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

## 15. 型定義

| ファイル | 主要な型 |
|---------|---------|
| `supabase.ts` | DB型定義（手動管理）: テーブルの Row, Insert, Update 型 |
| `post.ts` | `PostType` (union), `PostTypeConfig`, `isBuiltinPostType()` |
| `post-type.ts` | `PostTypeDB` (`flowType` 含む), `PostTypeFormData`, `Placeholder` |
| `profile.ts` | `ProfileDB`, `ProfileFormData` |
| `create-flow.ts` | `CreateFormState` (`flowType` 含む), `GeneratedResult`, `GenerationStep`, `INITIAL_FORM_STATE` |
| `history-detail.ts` | `Post`, `PostTypeRef`, `ProfileRef`, `PostImage`, `EditState`, `formatDate()` |
| `idea.ts` | `PostIdea`, `PostIdeaRow`, `toPostIdea()` |
| `analysis.ts` | `InstagramAnalysisResult`, `BlogAnalysisResult`, `GeneratedProfile`, `GeneratedPostType`, `AnalysisSourceType`, `AnalysisStatus` |
| `instagram.ts` | `FacebookAuthResponse`, `InstagramAccount`, `PublishStep`, `ContainerStatusCode` |

---

## 16. ライブラリユーティリティ

| ファイル | 主要なエクスポート |
|---------|------------------|
| `supabase.ts` | `supabase` (ブラウザ), `createServerClient()`, `POST_SELECT_QUERY` |
| `auth.ts` | `auth()`, `signIn()`, `signOut()` |
| `api-utils.ts` | `requireAuth()`, `requirePostOwnership()`, `requireIdeaOwnership()` 等 |
| `gemini.ts` | `geminiFlash`, `geminiVision`, `geminiImageGen`, `generateWithRetry()`, `parseJsonResponse()` |
| `constants.ts` | `TOTAL_HASHTAG_COUNT` (10), `IMAGE_UPLOAD` (サイズ・型制限) |
| `image-styles.ts` | `IMAGE_STYLES`, `ASPECT_RATIOS`, `BACKGROUND_TYPES`, `getAspectClass()` |
| `post-types.ts` | `POST_TYPES` (ビルトイン設定) |
| `post-type-utils.ts` | `toPostTypeDB()` (`flow_type` → `flowType` 変換含む), `POST_TYPE_MAX_COUNT` |
| `instagram.ts` | `exchangeForLongLivedToken()`, `getInstagramAccounts()`, `createMediaContainer()`, `waitAndPublish()` |
| `image-prompt.ts` | `buildImagePrompt()`, `buildMultimodalImagePrompt()` |
| `idea-prompts.ts` | アイデア提案AIプロンプト |
| `analysis-prompts.ts` | 分析AIプロンプト |
| `analysis-executor.ts` | 分析実行ロジック |
| `generation-prompts.ts` | プロフィール・投稿タイプ自動生成プロンプト |
| `blog-crawler.ts` | `discoverSitemap()`, `crawlBlog()` |

---

## 17. テンプレート構造（ビルトインタイプ）

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

## 18. 環境変数

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

## 19. ビルド・開発コマンド

```bash
npm run dev          # 開発サーバー (Turbopack)
npm run build        # プロダクションビルド
npm run start        # プロダクション起動
npm run lint         # ESLint
```

---

## 20. パフォーマンス目標

| 項目 | 目標 |
|------|------|
| 文章生成（キャプション、シーン、キャッチコピー） | 5秒以内 |
| 画像生成 | 30秒以内 |
| キャラクター特徴抽出 | 5秒以内 |
| API レスポンス（一般） | 3秒以内 |
| Instagram投稿 | 60秒以内 |

---

## 21. セキュリティ

### 認証
- Google OAuth (NextAuth.js v5) + メールホワイトリスト
- JWT セッション
- httpOnly Cookie

### 認可
- 全テーブルで RLS 有効化（`(SELECT auth.uid())` パターン）
- API ルートで `requireAuth()` + 所有権チェック
- Service Role Key はサーバーサイドのみ

### ファイルアップロード
- Supabase Storage に `user_id` 名前空間で保存
- 認証済みユーザーのみアップロード可能
- ファイルタイプ・サイズのサーバーサイドバリデーション
- 差し替え時は古い画像を自動削除

---

## 22. UIデザイン

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
- ナビゲーション: 🏠 ✏️ 📋 👤 🔍 💡 ⚙️

---

## 23. 制限事項・既知の制約

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

---

## 24. 運営情報

| 項目 | URL |
|------|-----|
| Instagram | https://www.instagram.com/hohoemi.rabo/ |
| ホームページ | https://www.hohoemi-rabo.com/ |
| ポートフォリオ | https://www.masayuki-kiwami.com/works |
