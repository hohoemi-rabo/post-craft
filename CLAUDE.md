# CLAUDE.md

Post Craft プロジェクトのガイドライン。
詳細なルールは `.claude/rules/` ディレクトリを参照。

## プロジェクト概要

**Post Craft** - メモ書きやブログ記事URLからInstagram投稿素材（キャプション、ハッシュタグ、画像）を自動生成するWebサービス。

- **本番URL**: https://post-craft-rho.vercel.app/
- **現在のフェーズ**: Phase 4 完了

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 15.5.9 (App Router) |
| Language | TypeScript 5.x |
| UI | React 19.1.0, Tailwind CSS 3.4.17 |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js + Google OAuth |
| AI (文章) | Google Gemini Flash (gemini-3-flash-preview) |
| AI (画像分析) | Google Gemini Pro (gemini-3-pro-preview) |
| AI (画像) | Google Gemini (gemini-3-pro-image-preview) |
| Instagram投稿 | Facebook Graph API v21.0 + FB JS SDK |
| Hosting | Vercel |

## 開発コマンド

```bash
npm run dev      # 開発サーバー (Turbopack)
npm run build    # プロダクションビルド
npm run lint     # Lint
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ (login, unauthorized)
│   ├── (dashboard)/       # ダッシュボード (認証必須)
│   │   ├── dashboard/     # ホーム
│   │   ├── create/        # 投稿作成
│   │   │   ├── history/       # 履歴 (Server Component + Suspense)
│   │   ├── characters/    # キャラクター管理
│   │   ├── analysis/      # 分析機能
│   │   │   ├── page.tsx           # 分析一覧
│   │   │   ├── new/page.tsx       # 新規分析ウィザード
│   │   │   ├── [id]/page.tsx      # 分析詳細レポート
│   │   │   └── [id]/generate/page.tsx # 生成プレビュー・適用
│   │   └── settings/      # 設定
│   │       ├── post-types/ # 投稿タイプ管理
│   │       ├── profiles/  # プロフィール管理
│   │       ├── hashtags/  # ハッシュタグ設定（レガシー）
│   │       └── system-prompt/ # システムプロンプト設定
│   ├── api/               # API Routes
│   └── publish/           # Instagram投稿（スタンドアロン）
├── components/            # UIコンポーネント
│   ├── analysis/          # 分析機能 (wizard, report, generation-preview, profile-preview, posttype-preview-card等)
│   ├── characters/        # キャラクター管理 (characters-client等)
│   ├── create/            # 投稿作成コンポーネント
│   ├── history/           # 履歴一覧・編集 (post-list, post-card, post-detail-client, filter, pagination, delete-button, skeleton等)
│   ├── publish/           # Instagram投稿コンポーネント
│   ├── settings/          # 設定コンポーネント (post-type-list, post-type-form, profile-list, profile-detail-client等)
│   └── providers/         # Context Providers
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ
│   ├── constants.ts       # 共通定数 (TOTAL_HASHTAG_COUNT, IMAGE_UPLOAD)
│   ├── api-utils.ts       # API認証・所有権チェックヘルパー
│   ├── analysis-prompts.ts    # 分析AIプロンプト（Instagram・ブログ解析）
│   ├── analysis-executor.ts   # 分析実行ロジック
│   ├── generation-prompts.ts  # プロフィール・投稿タイプ自動生成プロンプト
│   ├── blog-crawler.ts        # ブログクロール・サイトマップ探索
│   └── ...
└── types/                 # 型定義
```

### カスタムフック (`src/hooks/`)

| フック | 用途 |
|--------|------|
| `useContentGeneration` | 投稿作成の生成ロジック全般 |
| `useGenerationSteps` | 生成ステップの進捗管理 |
| `usePostEdit` | 履歴詳細の編集モード管理 |
| `useCopyActions` | コピー機能（キャプション、ハッシュタグ） |
| `usePostActions` | 投稿アクション（削除、再利用、ダウンロード） |
| `usePostImageHandlers` | 画像関連のハンドラ |
| `usePostTypes` | 投稿タイプの CRUD・並び替え・有効/無効切り替え |
| `useProfiles` | プロフィールの CRUD・並び替え |
| `useUserSettings` | ユーザー設定（必須ハッシュタグ等） |

### 型定義 (`src/types/`)

| ファイル | 内容 |
|---------|------|
| `post.ts` | ビルトイン投稿タイプの union 型・ヘルパー (`isBuiltinPostType`) |
| `post-type.ts` | DB管理の投稿タイプ型 (`PostTypeDB`, `PostTypeFormData`) |
| `create-flow.ts` | 投稿作成フローの状態・型 |
| `history-detail.ts` | 履歴詳細ページの型・ユーティリティ (`Post`, `PostTypeRef`, `ProfileRef`) |
| `analysis.ts` | 分析機能の型 (`InstagramAnalysisResult`, `BlogAnalysisResult`, `GeneratedProfile`, `GeneratedPostType`, `AnalysisSourceType`, `AnalysisStatus`) |
| `supabase.ts` | Supabase Database 型定義（自動生成） |

## 主要機能

### 投稿タイプ（DB管理）

設定画面 (`/settings/post-types`) でユーザーがカスタマイズ可能。
`post_types` テーブルで管理し、`usePostTypes` フックで取得。
プロフィールタブフィルターで絞り込み表示対応（`usePostTypes(profileId)` でAPIフィルタリング）。

**ビルトインタイプ（7種類、初期データ）**:
| slug | タイプ | 説明 |
|------|--------|------|
| `solution` | 解決タイプ | よくある質問と解決方法を紹介 |
| `promotion` | 宣伝タイプ | サービス・商品の告知 |
| `tips` | AI活用タイプ | AIの便利な使い方を紹介 |
| `showcase` | 実績タイプ | 制作事例・成果を紹介 |
| `useful` | お役立ちタイプ | 汎用的な便利情報 |
| `howto` | 使い方タイプ | 便利情報＋手順を紹介 |
| `image_read` | 画像読み取りタイプ | 画像をAIで読み取り投稿文を自動生成 |

**カスタムタイプ**: ユーザーが自由に追加可能。テンプレート・プレースホルダー・文字数を設定。

**デュアルシステム**:
- `posts.post_type` (slug文字列): 後方互換用、ビルトインタイプの識別に使用
- `posts.post_type_id` (UUID FK): `post_types` テーブルへの外部キー（ON DELETE SET NULL）
- API: `post_type_ref:post_types(*)` で JOIN データを取得
- 表示: `post.post_type_ref?.icon || '📝'` でフォールバック（削除済みタイプ対応）

### 投稿作成フロー
画像生成あり（6ステップ）:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定 → 4. キャッチコピー確認 → 5. 生成 → 6. 完成

画像スキップ（5ステップ）:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定 → 4. 生成 → 5. 完成

画像読み取りタイプ（4ステップ）:
1. タイプ選択 → 2. 画像アップロード＋メモ入力 → 3. 生成 → 4. 完成

### キャッチコピー機能
- 投稿内容からAIがキャッチコピーを自動生成
- 確認画面で編集・再生成可能（30文字以内）
- 全ての画像スタイルで画像内にテキスト表示

### 画像生成オプション
- **スタイル**: マンガ風（男性/女性）/ ピクセルアート / イラスト / リアル（写真風）
- **背景タイプ**: テクノロジー背景 / 内容に合わせる
- **アスペクト比**: 1:1（フィード）/ 9:16（リール）

### マルチモーダル画像生成
- キャラクター画像を参照して一貫性のある画像を生成
- `useCharacterImage` オプションで有効化
- 投稿作成フロー・履歴の画像再生成モーダルの両方で利用可能
- プロンプトにキャラクター再現ルール（年齢・顔立ち・髪型保持）+ テキスト特徴説明を併用

### 関連投稿参照機能
以前の投稿を参照して、テーマの繋がりのある投稿を作成する機能。

- **対象**: 全投稿タイプ（`image_read` を除く）
- **参照数**: 1投稿のみ
- **キャプション**: 冒頭に前回の投稿を1文で軽く触れる導入文をAIが自動生成
- **ハッシュタグ**: 前回のハッシュタグを優先的に再利用 + 追加生成（計10個）
- **画像設定**: 3択（前回設定を引き継ぐ / 新しく設定する / 画像なし）
- **注意**: 「Part 2」「第2弾」「続き」等の表記は使用しない
- **DB**: `posts.related_post_id` で関連を記録（外部キー、ON DELETE SET NULL）
- **UI**: `StepContentInput` のトグル式セレクタ、`StepImageSettings` の3択ボタン

### プロフィール機能（Phase 4）
投稿タイプをプロフィール（ペルソナ）ごとにグループ化する機能。

- **プロフィール**: ターゲット層・トーン（システムプロンプト）・必須ハッシュタグを個別設定
- **DB**: `profiles` テーブル、`post_types.profile_id` で紐付け
- **デフォルト**: 「シニア向け」プロフィール（is_default=true）
- **設定画面**: `/settings/profiles`（一覧）、`/settings/profiles/[id]`（編集）、`/settings/profiles/new`（新規）
- **投稿タイプ連携**: 投稿タイプ作成時にプロフィールを選択（フォーム最上部に配置）
  - 新規作成時はデフォルトプロフィールを自動選択
  - プロフィール詳細ページからの遷移時は `?profileId=` で対象プロフィールを自動選択
- **キャプション生成**: 選択されたプロフィールのシステムプロンプトと必須ハッシュタグを使用
- **投稿作成UI**: タイプ選択ステップでプロフィールバッジ表示、フィルタリング対応
- **API**: `/api/profiles/[id]`（CRUD）、`/api/profiles/[id]/hashtags`（必須タグ）、`/api/profiles/[id]/system-prompt`（プロンプト）

### ハッシュタグ生成
- 必須タグ: プロフィール単位でカスタマイズ可能（`profiles.required_hashtags`）
  - デフォルト: #ほほ笑みラボ #飯田市 #パソコン教室 #スマホ
  - レガシー: `user_settings.required_hashtags`（プロフィール未指定時のフォールバック）
  - API: `/api/profiles/[id]/hashtags` または `/api/settings/hashtags`
- 生成タグ: 投稿内容に基づいて自動生成（必須タグと合わせて計10個）
- コピー・投稿時は縦並び（改行区切り）で出力

### 投稿履歴（Server Component + Suspense）
履歴一覧ページ (`/history`) は Server Component + Suspense アーキテクチャで実装。

- **アーキテクチャ**: Server Component (page.tsx) → Suspense → async Server Component (HistoryPostList)
- **データフェッチ**: `createServerClient()` + `POST_SELECT_QUERY` で Supabase に直接クエリ（API Route 不要）
- **状態管理**: URL `searchParams` ベース（`?page=2&postType=tips`）でブックマーク・ブラウザバック対応
- **ページネーション**: `<Link>` ベース（JS不要）
- **フィルター**: `HistoryFilter` (Client Component) → `router.push()` でURL更新
- **削除**: `HistoryDeleteButton` (Client Component) → 既存 DELETE API → `router.refresh()`
- **コンポーネント分割**:
  - `history-post-list.tsx` (Server async): データフェッチ + 一覧表示
  - `history-post-card.tsx` (Server): 投稿カード（バッジ・サムネイル）
  - `history-filter.tsx` (Client): フィルタードロップダウン
  - `history-delete-button.tsx` (Client): 削除ボタン + 確認UI
  - `history-pagination.tsx` (Server): `<Link>` ベースのページネーション
  - `history-skeleton.tsx` (Server): Suspense フォールバック

### 詳細ページの Server Component + Client Component パターン
個別データの詳細ページは Server Component (データ取得) + Client Component (インタラクション) で構成。

- **対象ページ**: `/history/[id]`, `/settings/profiles/[id]`, `/settings/post-types/[id]`, `/characters`
- **Server Component (page.tsx)**: `auth()` → `createServerClient()` → Supabase 直接クエリ → `notFound()` or Client Component にデータ渡し
- **Client Component**: `initialData` を props で受け取り `useState(initialData)` で管理。useEffect でのフェッチ不要
- **ミューテーション後**: `router.refresh()` で Server Component を再実行してデータ更新

### 投稿履歴の編集機能
履歴詳細ページ (`/history/[id]`) でインライン編集が可能。

- **編集モード**: ヘッダーの「編集」ボタンで切り替え
- **キャプション**: textarea で直接編集 + AIで再生成ボタン
- **ハッシュタグ**: 追加/削除UI（入力フィールド + x ボタン）
- **入力メモ**: textarea で直接編集
- **投稿タイプ**: モーダルで変更（タイプのみ or キャプション再生成も選択可）
- **画像差し替え**: ImageUploader で手動アップロード（既存画像を自動削除）
- **画像再生成**: モーダルでスタイル/アスペクト比/背景タイプ/キャラクター選択 → AI再生成（キャプションは変更されない）
- **保存**: PATCH `/api/posts/[id]` で一括更新

### Instagram投稿機能
ダッシュボード内からInstagram Graph APIで直接投稿。

- **統合箇所**: 投稿作成完了画面（StepResult）、履歴詳細ページ
- **認証**: Facebook JS SDK → OAuth → long-lived token (60日)
- **投稿フロー**: FBログイン → アカウント選択 → キャプション確認 → 投稿
- **モーダル方式**: ページ遷移なしでフロー完結
- **Context**: `InstagramPublishProvider` でFBログイン状態をダッシュボード内で共有
- **画像**: 生成済みSupabase Storage URLをそのまま利用（再アップロード不要）
- **スタンドアロン**: `/publish` ページも独立して利用可能
- **画像アップロード**: 画像なし投稿でも手動アップロード → 直接投稿可能（完了画面・履歴詳細の両方対応）
- **投稿ステータス**: ダッシュボード・履歴一覧・詳細に「✅ 投稿済み」/「⏳ 未投稿」バッジ表示。投稿成功時に自動更新
- **ダッシュボード**: 最近の投稿に投稿タイプ・画像スタイル・プロフィール・投稿ステータスのバッジ表示（履歴一覧と統一）
- **制約**: Instagram Business/Creator Account 必須

### 分析機能（Phase 4）
競合のInstagramアカウントやブログ記事を分析し、プロフィールと投稿タイプを自動生成する機能。

- **分析ソース**: Instagram（CSV/手動入力）、ブログ（URL クロール）
- **分析フロー**: ソース選択 → データ入力 → AI分析実行 → レポート表示
- **生成フロー**: 分析結果 → プロフィール＋投稿タイプ生成 → プレビュー → 編集（任意） → 適用
- **DB**: `competitor_analyses`（分析データ）、`generated_configs`（生成設定・適用状態）
- **ページ**: `/analysis`（一覧）、`/analysis/new`（ウィザード）、`/analysis/[id]`（レポート）、`/analysis/[id]/generate`（生成プレビュー）
- **API**: `/api/analysis`（CRUD）、`/api/analysis/[id]/generate`（AI生成）、`/api/analysis/[id]/apply`（適用）、`/api/analysis/[id]/status`、`/api/analysis/upload`、`/api/analysis/blog-crawl`、`/api/analysis/sitemap-discover`
- **適用**: `generated_configs` のデータを `profiles` + `post_types` テーブルに INSERT、slug 重複時は `-2`, `-3` サフィックス付与、失敗時はロールバック
- **編集してから適用**: 生成プレビューで各フィールドをインライン編集してから適用可能
- **コンポーネント**: `analysis-wizard`, `analysis-report`, `generation-preview`, `profile-preview`, `posttype-preview-card` 等
- **AI分析ライブラリ**: `lib/analysis-prompts.ts`（プロンプト）、`lib/analysis-executor.ts`（実行）、`lib/generation-prompts.ts`（生成プロンプト）
- **ブログクロールライブラリ**: `lib/blog-crawler.ts`（サイトマップ探索 `discoverSitemap()` + クロール `crawlBlog()`）

### ブログ分析のサイトマップ探索
ブログURL入力時にサイトマップを事前探索し、記事取得の確度をユーザーに提示するハイブリッド方式。

- **自動探索**: URL入力 → 「検索」→ `/sitemap.xml` 等5パス + `/robots.txt` の `Sitemap:` ディレクティブを順番に試行
- **手動入力**: 自動検出失敗時 → サイトマップURLを直接入力 → 「確認」でバリデーション
- **スキップ**: サイトマップなしで続行 → RSS / リンク巡回フォールバック
- **API**: `/api/analysis/sitemap-discover`（自動探索 + 手動検証の両対応）
- **ライブラリ**: `lib/blog-crawler.ts` の `discoverSitemap()`（軽量版: 記事本文は取得しない）
- **型**: `AnalysisConfig.blog.sitemapUrl?` でウィザード間のデータ引き継ぎ
- **パイプライン**: `data-input-form` → `analysis-progress` → `blog-crawl` API → `crawlBlog(url, undefined, { sitemapUrl })` で事前発見済みサイトマップを優先使用
- **UI状態遷移**: `idle` → `loading` → `found` | `not_found` | `skipped`（検索完了まで「分析を開始」無効）

## ルールファイル

| ファイル | 内容 | 適用場面 |
|---------|------|---------|
| `.claude/rules/frontend.md` | React, Tailwind, UI | コンポーネント実装時 |
| `.claude/rules/backend.md` | API, Supabase, 認証 | API・DB実装時 |
| `.claude/rules/nextjs.md` | Next.js 15 ベストプラクティス | 全般 |
| `.claude/rules/ai.md` | Gemini, プロンプト | AI機能実装時 |

## 環境変数

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

# Instagram投稿 (Facebook Graph API)
NEXT_PUBLIC_FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

## 仕様書

- `/docs/SPEC-FULL.md` - 全体仕様（Phase 1〜3）
- `/docs/SPEC-CURRENT.md` - 現状仕様（Phase 2完了時点）
- `/docs/SPEC-PHASE2.md` - Phase 2 要件定義
- `/docs/SPEC-PHASE3.md` - Phase 3 要件定義（ユーザーカスタマイズ機能）
- `/docs/SPEC-PHASE4.md` - Phase 4 要件定義（分析機能統合）
- `/docs/23-*.md` 〜 `/docs/37-*.md` - Phase 3 開発チケット
- `/docs/38-*.md` 〜 `/docs/46-*.md` - Phase 3.5/4 開発チケット
- `/docs/47-*.md` 〜 `/docs/67-*.md` - Phase 4 開発チケット（分析機能）

## 運営情報

- **Instagram**: https://www.instagram.com/hohoemi.rabo/
- **ホームページ**: https://www.hohoemi-rabo.com/
- **ポートフォリオ**: https://www.masayuki-kiwami.com/works
