# CLAUDE.md

Post Craft プロジェクトのガイドライン。
詳細なルールは `.claude/rules/` ディレクトリを参照。

## プロジェクト概要

**Post Craft** - メモ書きやブログ記事URLからInstagram投稿素材（キャプション、ハッシュタグ、画像）を自動生成するWebサービス。

- **本番URL**: https://post-craft-rho.vercel.app/
- **現在のフェーズ**: Phase 2 完了

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 15.5.9 (App Router) |
| Language | TypeScript 5.x |
| UI | React 19.1.0, Tailwind CSS 3.4.17 |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js + Google OAuth |
| AI (文章) | Google Gemini Pro (gemini-3-pro-preview) |
| AI (軽量タスク) | Google Gemini Flash (gemini-2.5-flash) |
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
│   │   ├── history/       # 履歴
│   │   ├── characters/    # キャラクター管理
│   │   └── settings/      # 設定
│   ├── api/               # API Routes
│   └── publish/           # Instagram投稿（スタンドアロン）
├── components/            # UIコンポーネント
│   ├── history/           # 履歴編集モーダル
│   ├── publish/           # Instagram投稿コンポーネント
│   └── providers/         # Context Providers
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ
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

### 型定義 (`src/types/`)

| ファイル | 内容 |
|---------|------|
| `post.ts` | 投稿タイプ定義 |
| `create-flow.ts` | 投稿作成フローの状態・型 |
| `history-detail.ts` | 履歴詳細ページの型・ユーティリティ |

## 主要機能

### 投稿タイプ（7種類）
| ID | タイプ | 説明 |
|----|--------|------|
| `solution` | 解決タイプ | よくある質問と解決方法を紹介 |
| `promotion` | 宣伝タイプ | サービス・商品の告知 |
| `tips` | AI活用タイプ | AIの便利な使い方を紹介 |
| `showcase` | 実績タイプ | 制作事例・成果を紹介 |
| `useful` | お役立ちタイプ | 汎用的な便利情報 |
| `howto` | 使い方タイプ | 便利情報＋手順を紹介 |
| `image_read` | 画像読み取りタイプ | 画像をAIで読み取り投稿文を自動生成 |

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

### ハッシュタグ生成
- 必須タグ4個: #ほほ笑みラボ #飯田市 #パソコン教室 #スマホ
- 生成タグ6個: 投稿内容に基づいて自動生成
- 計10個のハッシュタグ
- コピー・投稿時は縦並び（改行区切り）で出力

### 投稿履歴の編集機能
履歴詳細ページ (`/history/[id]`) でインライン編集が可能。

- **編集モード**: ヘッダーの「編集」ボタンで切り替え
- **キャプション**: textarea で直接編集 + AIで再生成ボタン
- **ハッシュタグ**: 追加/削除UI（入力フィールド + x ボタン）
- **入力メモ**: textarea で直接編集
- **投稿タイプ**: モーダルで変更（タイプのみ or キャプション再生成も選択可）
- **画像差し替え**: ImageUploader で手動アップロード（既存画像を自動削除）
- **画像再生成**: モーダルでスタイル/アスペクト比/背景タイプを選択 → AI再生成
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
- **投稿ステータス**: 履歴一覧・詳細に「✅ 投稿済み」/「⏳ 未投稿」バッジ表示。投稿成功時に自動更新
- **制約**: Instagram Business/Creator Account 必須

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

- `/docs/SPEC-CURRENT.md` - 現状仕様（Phase 2完了時点）
- `/docs/SPEC-PHASE2.md` - Phase 2 要件定義
- `/docs/SPEC-PHASE3.md` - Phase 3 構想メモ（ユーザーカスタマイズ機能）

## 運営情報

- **Instagram**: https://www.instagram.com/hohoemi.rabo/
- **ホームページ**: https://www.hohoemi-rabo.com/
- **ポートフォリオ**: https://www.masayuki-kiwami.com/works
