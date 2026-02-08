# Post Craft 現状仕様書

> 作成日: 2026-01-23
> 最終更新: 2026-02-08
> フェーズ: Phase 2 完了 + 機能拡張

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
| AI (文章) | Google Gemini Flash | gemini-3-flash-preview |
| AI (画像分析) | Google Gemini Pro | gemini-3-pro-preview |
| AI (画像生成) | Google Gemini Pro Image | gemini-3-pro-image-preview |
| Instagram投稿 | Facebook Graph API | v21.0 |
| Scraping | @mozilla/readability + jsdom | 0.6.0 / 27.0.0 |
| Analytics | Google Analytics 4 | @next/third-parties |
| Hosting | Vercel | - |

---

## 2. 機能一覧

### 2.1 コア機能

| # | 機能 | 状態 | 説明 |
|---|------|------|------|
| 1 | Google OAuth認証 | ✅ | ホワイトリスト方式のアクセス制御 |
| 2 | ダッシュボード | ✅ | ホーム画面、ナビゲーション |
| 3 | 7種類の投稿タイプ | ✅ | 解決/宣伝/AI活用/実績/お役立ち/使い方/画像読み取り |
| 4 | AIキャプション生成 | ✅ | Gemini Flashによるテンプレートベース生成 |
| 5 | AIハッシュタグ生成 | ✅ | 必須4個 + 自動生成6個 = 計10個 |
| 6 | AI画像生成 | ✅ | 5種類のスタイル、マルチモーダル対応 |
| 7 | キャッチコピー生成 | ✅ | 画像に表示するキャッチコピーをAI生成（30文字以内） |
| 8 | キャラクター管理 | ✅ | 登録・特徴抽出・画像参照で一貫性ある画像生成 |
| 9 | 投稿履歴 | ✅ | 一覧・詳細・インライン編集・削除 |
| 10 | Instagram直接投稿 | ✅ | Facebook Graph APIで投稿作成画面・履歴から直接投稿 |
| 11 | 関連投稿参照 | ✅ | 以前の投稿を参照したシリーズ投稿の作成 |
| 12 | URL記事抽出 | ✅ | ブログ記事URLからテキスト自動抽出 |
| 13 | 画像アップロード | ✅ | 手動画像のアップロード・差し替え |
| 14 | レスポンシブデザイン | ✅ | モバイルファースト |
| 15 | GA4アナリティクス | ✅ | Google Analytics 4 |

### 2.2 投稿タイプ（7種類）

| ID | タイプ名 | ターゲット | 説明 |
|----|---------|-----------|------|
| `solution` | 解決タイプ | 全般 | よくある質問と3ステップの解決方法 |
| `promotion` | 宣伝タイプ | ビジネス層 | サービスの価値と3つの悩み解決 |
| `tips` | AI活用タイプ | ビジネス層 | AIの便利な使い方と3つのメリット |
| `showcase` | 実績タイプ | ビジネス層 | 課題→解決策→成果の紹介 |
| `useful` | お役立ちタイプ | 全般 | 汎用的な便利情報と3つのメリット |
| `howto` | 使い方タイプ | 全般 | 便利情報＋3ステップの操作手順 |
| `image_read` | 画像読み取り | 全般 | 画像をAIで分析し投稿文を自動生成 |

### 2.3 画像スタイル（5種類）

| ID | スタイル名 | キャラクター対応 | 説明 |
|----|-----------|:-:|------|
| `manga_male` | マンガ風（男性） | ✅ | テック・ビジネス系、鮮やかな配色 |
| `manga_female` | マンガ風（女性） | ✅ | クリエイティブ系、パステル調 |
| `pixel_art` | ピクセルアート | ✅ | レトロゲーム風、サイバー背景 |
| `illustration` | イラスト（人物なし） | ❌ | フラットデザイン、図形のみ |
| `realistic` | リアル（写真風） | ❌ | 写真のようなリアルな画像 |

### 2.4 画像設定オプション

| 設定 | 選択肢 |
|------|--------|
| 背景タイプ | テクノロジー背景 (`tech`) / 内容に合わせる (`auto`) |
| アスペクト比 | 1:1（正方形）/ 4:5（縦長）/ 9:16（リール）/ 16:9（横長） |

---

## 3. 投稿作成フロー

### 3.1 通常フロー（画像あり: 6ステップ）

```
Step 1: タイプ選択
  └─ 7種類から投稿タイプを選択

Step 2: 内容入力
  ├─ メモ書きを直接入力 or URL記事から抽出
  └─ [オプション] 関連投稿を参照する

Step 3: 画像設定
  ├─ 画像スタイル選択（5種類）
  ├─ 背景タイプ選択（2種類）
  ├─ アスペクト比選択（4種類）
  ├─ [オプション] キャラクター選択
  └─ [オプション] キャラクター画像を参照として使用

Step 4: キャッチコピー確認
  └─ AIが生成したキャッチコピーを確認・編集・再生成

Step 5: 生成中
  └─ キャプション → シーン説明 → 画像 → 保存

Step 6: 完成
  ├─ キャプション・ハッシュタグ表示・コピー
  ├─ 画像ダウンロード・再生成
  └─ Instagram直接投稿
```

### 3.2 画像スキップフロー（5ステップ）

```
Step 1 → Step 2 → Step 3（スキップ選択）→ Step 4（生成）→ Step 5（完成）
```

### 3.3 画像読み取りタイプフロー（4ステップ）

```
Step 1: タイプ選択
Step 2: 画像アップロード + メモ入力（方向性指示）
Step 3: 生成中（画像分析 → キャプション生成 → 保存）
Step 4: 完成
```

### 3.4 関連投稿参照機能

以前の投稿を参照して、テーマの繋がりのある投稿を作成する機能。

| 項目 | 仕様 |
|------|------|
| 対象タイプ | 全タイプ（`image_read` を除く） |
| 参照数 | 1投稿のみ |
| キャプション | 冒頭に前回の投稿を1文で軽く触れる導入文をAIが自動生成 |
| ハッシュタグ | 前回のハッシュタグを優先的に再利用 + 追加生成（計10個） |
| 画像設定 | 3択: 前回設定を引き継ぐ / 新しく設定する / 画像なし |
| 注意 | 「Part 2」「第2弾」「続き」等の表記は使用しない |

---

## 4. 投稿履歴・編集機能

### 4.1 履歴一覧（`/history`）
- 投稿タイプアイコン、キャプション冒頭、作成日時
- Instagram投稿ステータスバッジ（「✅ 投稿済み」/「⏳ 未投稿」）
- 削除機能

### 4.2 履歴詳細・インライン編集（`/history/[id]`）

| 編集項目 | 操作 |
|---------|------|
| キャプション | textarea直接編集 + AIで再生成 |
| ハッシュタグ | 追加/削除UI |
| 入力メモ | textarea直接編集 |
| 投稿タイプ | モーダルで変更（タイプのみ or キャプション再生成） |
| 画像差し替え | 手動アップロード（既存画像を自動削除） |
| 画像再生成 | モーダルでスタイル/アスペクト比/背景タイプ選択 → AI再生成 |

保存は PATCH `/api/posts/[id]` で一括更新（ホワイトリスト方式）。

---

## 5. Instagram直接投稿機能

### 5.1 概要
ダッシュボード内からInstagram Graph APIで直接投稿。

### 5.2 投稿フロー

```
[投稿作成完了画面 or 履歴詳細]
  └─ 「Instagramに投稿」ボタン
       └─ InstagramPublishModal
            ├─ Step 1: Facebook SDK ログイン
            ├─ Step 2: アカウント選択
            ├─ Step 3: キャプション確認
            └─ Step 4: 投稿実行
                 ├─ /api/instagram/accounts（トークン交換）
                 └─ /api/instagram/publish（メディア作成→ポーリング→公開）
```

### 5.3 技術仕様

| 項目 | 仕様 |
|------|------|
| API | Facebook Graph API v21.0 |
| 認証 | Facebook JS SDK → OAuth → long-lived token (60日) |
| 画像 | Supabase Storage URLをそのまま利用 |
| ポーリング | 2秒間隔、最大15回（30秒） |
| 要件 | Instagram Business/Creator Account必須 |
| ハッシュタグ | 改行区切り（縦並び）で投稿 |

### 5.4 投稿ステータス管理

```
posts テーブル:
  instagram_published     boolean     DEFAULT false
  instagram_media_id      text        NULL
  instagram_published_at  timestamptz NULL
```

---

## 6. AI機能

### 6.1 モデル構成

全モデルは `src/lib/gemini.ts` で一元管理。変更時は1ファイルのみ修正。

| 変数名 | モデル | 用途 |
|--------|--------|------|
| `geminiFlash` | `gemini-3-flash-preview` | キャプション、シーン説明、キャッチコピー等のテキスト生成全般 |
| `geminiVision` | `gemini-3-pro-preview` | 画像読み取り（Vision）、キャラクター特徴抽出 |
| `geminiImageGen` | `gemini-3-pro-image-preview` | 画像生成（テキストのみ） |
| `geminiImageGenMultimodal` | `gemini-3-pro-image-preview` | 画像生成（キャラクター画像参照） |

### 6.2 キャプション生成

- テンプレートベースの構造化生成
- 投稿タイプ別のプロンプト最適化
- 入力メモが不足している場合はAIが一般知識で補完
- 「共感 → 安心」の文章スタイル（内容に合う場合のみ自然に適用）

### 6.3 ハッシュタグ生成

- 必須4個: `#ほほ笑みラボ #飯田市 #パソコン教室 #スマホ`
- 生成6個: 投稿内容 + 推奨タグから自動生成
- 関連投稿参照時: 前回のハッシュタグを優先的に再利用

### 6.4 画像生成

- スタイル別ベースプロンプト + シーン説明 + キャッチコピー
- キャラクター設定による一貫性のある人物描写
- マルチモーダル: キャラクター画像を参照してより似た画像を生成

### 6.5 キャッチコピー

- 投稿内容から10〜20文字のキャッチコピーを自動生成
- 確認画面でユーザーが編集・再生成可能
- 全画像スタイルで画像内にテキスト表示

---

## 7. アーキテクチャ

### 7.1 ディレクトリ構造

```
src/
├── app/
│   ├── layout.tsx              # Root Layout (フォント, GA4, Providers)
│   ├── page.tsx                # ランディングページ
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
│   │   │   └── [id]/page.tsx   # 履歴詳細・編集
│   │   ├── characters/page.tsx # キャラクター管理
│   │   └── settings/page.tsx   # 設定
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth.js
│   │   ├── characters/
│   │   │   ├── route.ts        # GET, POST
│   │   │   ├── [id]/route.ts   # PUT, DELETE
│   │   │   └── analyze/route.ts # POST (特徴抽出)
│   │   ├── extract/route.ts    # POST (URL記事抽出)
│   │   ├── generate/
│   │   │   ├── caption/route.ts    # POST (キャプション生成)
│   │   │   ├── catchphrase/route.ts # POST (キャッチコピー生成)
│   │   │   ├── image/route.ts      # POST (画像生成)
│   │   │   └── scene/route.ts      # POST (シーン説明生成)
│   │   ├── instagram/
│   │   │   ├── accounts/route.ts   # POST (トークン交換+アカウント取得)
│   │   │   └── publish/route.ts    # POST (Instagram投稿)
│   │   ├── posts/
│   │   │   ├── route.ts           # GET (一覧), POST (新規作成)
│   │   │   ├── [id]/route.ts      # GET, PATCH (汎用更新), DELETE
│   │   │   └── [id]/image/route.ts # POST (画像アップロード), PUT (画像更新)
│   │   └── keepalive/route.ts     # GET (Vercelスリープ防止)
│   │
│   ├── publish/page.tsx        # Instagram投稿（スタンドアロン）
│   ├── contact/page.tsx        # お問い合わせ
│   └── privacy/page.tsx        # プライバシーポリシー
│
├── components/
│   ├── ui/                     # 汎用UIコンポーネント
│   ├── layout/                 # レイアウト (header, footer)
│   ├── dashboard/              # ダッシュボード (sidebar)
│   ├── create/                 # 投稿作成ステップ (15コンポーネント)
│   ├── history/                # 履歴編集モーダル (3コンポーネント)
│   ├── publish/                # Instagram投稿 (6コンポーネント)
│   └── providers/              # Context Providers
│
├── hooks/
│   ├── useContentGeneration.ts # 投稿生成フロー全体
│   ├── useGenerationSteps.ts   # 生成ステップ進捗管理
│   ├── usePostEdit.ts          # 履歴詳細の編集モード
│   ├── useCopyActions.ts       # コピー機能
│   ├── usePostActions.ts       # 投稿アクション
│   └── usePostImageHandlers.ts # 画像ハンドラ
│
├── lib/
│   ├── gemini.ts               # AIモデル一元管理
│   ├── image-prompt.ts         # 画像プロンプト構築
│   ├── image-styles.ts         # 画像スタイル定義
│   ├── post-types.ts           # 投稿タイプ定義
│   ├── templates.ts            # キャプションテンプレート
│   ├── instagram.ts            # Graph API ラッパー
│   ├── auth.ts                 # NextAuth設定
│   ├── supabase.ts             # Supabaseクライアント
│   ├── api-utils.ts            # API認証ヘルパー
│   └── analytics.ts            # GA4イベント
│
└── types/
    ├── post.ts                 # 投稿タイプ定義
    ├── create-flow.ts          # 投稿作成フロー状態
    ├── history-detail.ts       # 履歴詳細ページ型
    ├── instagram.ts            # Instagram関連型
    ├── next-auth.d.ts          # NextAuth型拡張
    └── supabase.ts             # Supabase自動生成型
```

### 7.2 データフロー

```
[ユーザー]
    │
    ▼ Google OAuth
[ログインページ] ──── 未認可 → [未認可ページ]
    │
    ▼ 認証成功
[ダッシュボード]
    │
    ├── 投稿作成 (/create)
    │     │
    │     ▼ Step 1: タイプ選択
    │     ▼ Step 2: 内容入力 (メモ or URL抽出)
    │     │    └─ [オプション] 関連投稿参照 ← GET /api/posts
    │     ▼ Step 3: 画像設定 (スタイル/背景/比率/キャラクター)
    │     ▼ Step 4: キャッチコピー確認・編集
    │     ▼ Step 5: 生成
    │     │    ├─ POST /api/generate/caption → Gemini Flash
    │     │    ├─ POST /api/generate/scene   → Gemini Flash
    │     │    ├─ POST /api/generate/image   → Gemini Pro Image
    │     │    └─ POST /api/posts            → Supabase
    │     ▼ Step 6: 完成
    │          ├─ コピー / ダウンロード
    │          └─ Instagram投稿 → POST /api/instagram/publish
    │
    ├── 履歴 (/history)
    │     ├─ 一覧 ← GET /api/posts
    │     └─ 詳細 ← GET /api/posts/[id]
    │          ├─ インライン編集 → PATCH /api/posts/[id]
    │          ├─ 画像差し替え → POST /api/posts/[id]/image
    │          ├─ 画像再生成 → POST /api/generate/image + PUT /api/posts/[id]/image
    │          └─ Instagram投稿
    │
    ├── キャラクター管理 (/characters)
    │     ├─ 一覧 ← GET /api/characters
    │     ├─ 登録 → POST /api/characters + 特徴抽出
    │     ├─ 更新 → PUT /api/characters/[id]
    │     └─ 削除 → DELETE /api/characters/[id]
    │
    └── 設定 (/settings)
```

---

## 8. データベース設計 (Supabase)

### 8.1 テーブル構造

#### users
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| email | text | メールアドレス |
| name | text | 表示名 |
| avatar_url | text | アバター画像URL |
| role | text | ロール |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

#### characters
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | text | ユーザーID |
| name | text | キャラクター名 |
| image_url | text | 画像URL (Storage) |
| description | text | 特徴説明テキスト |
| is_default | boolean | デフォルトキャラクター |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

#### posts
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | text | ユーザーID |
| post_type | text | 投稿タイプ |
| input_text | text | 入力テキスト |
| source_url | text | 参照URL |
| generated_caption | text | 生成キャプション |
| generated_hashtags | text[] | ハッシュタグ配列 |
| related_post_id | uuid | 関連投稿ID (FK, ON DELETE SET NULL) |
| instagram_published | boolean | Instagram投稿済みフラグ |
| instagram_media_id | text | InstagramメディアID |
| instagram_published_at | timestamptz | Instagram投稿日時 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

#### post_images
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| post_id | uuid | 投稿ID (FK) |
| image_url | text | 画像URL |
| style | text | 画像スタイル（'uploaded' = 手動アップロード） |
| aspect_ratio | text | アスペクト比 |
| prompt | text | 生成プロンプト |
| character_id | uuid | キャラクターID (FK) |
| created_at | timestamptz | 作成日時 |

### 8.2 Storage バケット

| バケット名 | 用途 | 公開 |
|-----------|------|------|
| characters | キャラクター画像 | Yes |
| generated-images | AI生成画像・アップロード画像 | Yes |

### 8.3 Row Level Security

全テーブルでRLS有効化。ユーザーは自身のデータのみアクセス可能。

---

## 9. APIエンドポイント仕様

### 9.1 認証API

| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js ハンドラ (Google OAuth) |

### 9.2 投稿API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/posts` | 投稿一覧取得（ページネーション対応） |
| POST | `/api/posts` | 新規投稿保存 |
| GET | `/api/posts/[id]` | 投稿詳細取得 |
| PATCH | `/api/posts/[id]` | 投稿更新（ホワイトリスト方式） |
| DELETE | `/api/posts/[id]` | 投稿削除（Storage画像も削除） |
| POST | `/api/posts/[id]/image` | 画像アップロード/差し替え |
| PUT | `/api/posts/[id]/image` | 画像レコード更新（再生成時） |

### 9.3 生成API

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/generate/caption` | キャプション + ハッシュタグ生成 |
| POST | `/api/generate/catchphrase` | キャッチコピー生成 |
| POST | `/api/generate/scene` | シーン説明生成 |
| POST | `/api/generate/image` | 画像生成 |

#### POST /api/generate/caption
```typescript
// Request
{
  postType: PostType
  inputText: string
  sourceUrl?: string
  imageBase64?: string       // image_readタイプ用
  imageMimeType?: string     // image_readタイプ用
  relatedPostCaption?: string      // 関連投稿参照時
  relatedPostHashtags?: string[]   // 関連投稿参照時
}

// Response
{
  caption: string
  hashtags: string[]
  templateData: TemplateData
}
```

#### POST /api/generate/image
```typescript
// Request
{
  style: ImageStyle
  aspectRatio: AspectRatio
  characterId?: string
  sceneDescription: string
  useCharacterImage?: boolean
  catchphrase: string
  backgroundType: BackgroundType
}

// Response
{
  imageUrl: string  // Supabase Storage URL
}
```

### 9.4 キャラクターAPI

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/characters` | キャラクター一覧取得 |
| POST | `/api/characters` | キャラクター登録 |
| PUT | `/api/characters/[id]` | キャラクター更新 |
| DELETE | `/api/characters/[id]` | キャラクター削除 |
| POST | `/api/characters/analyze` | 画像から特徴抽出 (Gemini Vision) |

### 9.5 Instagram API

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/instagram/accounts` | FBトークン交換 + IGアカウント取得 |
| POST | `/api/instagram/publish` | メディアコンテナ作成 → ポーリング → 公開 |

### 9.6 その他

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/extract` | URLから記事内容抽出 |
| GET | `/api/keepalive` | Vercelスリープ防止 |

---

## 10. セキュリティ

### 10.1 認証

| 項目 | 実装 |
|------|------|
| 認証方式 | Google OAuth 2.0 |
| セッション | NextAuth.js (JWT) |
| アクセス制御 | ホワイトリスト (ALLOWED_EMAILS) |
| ミドルウェア | /dashboard, /create, /history 等を保護 |

### 10.2 API認証ヘルパー (`lib/api-utils.ts`)

| 関数 | 用途 |
|------|------|
| `requireAuth()` | セッション検証、userId取得 |
| `requirePostOwnership(postId, userId)` | 投稿の所有権チェック |
| `requireCharacterOwnership(characterId, userId)` | キャラクターの所有権チェック |

### 10.3 環境変数

```bash
# 認証
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ALLOWED_EMAILS=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GOOGLE_AI_API_KEY=

# Analytics
NEXT_PUBLIC_GA_ID=

# Instagram (Facebook Graph API)
NEXT_PUBLIC_FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

---

## 11. UI/UXデザイン

### 11.1 デザインシステム

- **テーマ**: ダークテーマ
- **スタイル**: グラスモーフィズム (backdrop-blur, bg-white/10)
- **フォント**: 英語 Poppins / 日本語 M PLUS Rounded 1c
- **アイコン**: 絵文字ベース（外部ライブラリ不使用）

### 11.2 カラーパレット

```
背景:      slate-950 → slate-900 グラデーション
テキスト:   white (一次) / slate-400 (二次)
ボーダー:   white/10
プライマリ: blue-500
成功:       green-500
エラー:     red-500
```

### 11.3 レスポンシブ

| ブレイクポイント | サイズ | レイアウト |
|-----------------|--------|-----------|
| Mobile | < 768px | 1カラム、サイドバー非表示 |
| Tablet | 768px+ | 1カラム、サイドバー折りたたみ |
| Desktop | 1024px+ | 2カラム、サイドバー表示 |

---

## 12. パフォーマンス目標

| 項目 | 目標 |
|------|------|
| 文章生成 | 5秒以内 |
| 画像生成 | 30秒以内 |
| API レスポンス | 3秒以内 |

---

## 13. 運営情報

- **Instagram**: https://www.instagram.com/hohoemi.rabo/
- **ホームページ**: https://www.hohoemi-rabo.com/
- **ポートフォリオ**: https://www.masayuki-kiwami.com/works

---

## 14. 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-23 | 初版作成 (Phase 1完了時点) |
| 2026-01-25 | Phase 2完了に伴い全面更新 |
| 2026-02-08 | 全面改訂: 7投稿タイプ、5画像スタイル、Instagram直接投稿、関連投稿参照、AI モデル統一、履歴編集、キャッチコピー機能等を反映 |
