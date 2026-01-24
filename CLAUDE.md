# CLAUDE.md

Post Craft プロジェクトのガイドライン。
詳細なルールは `.claude/rules/` ディレクトリを参照。

## プロジェクト概要

**Post Craft** - ブログ記事URLまたはメモ書きからInstagram投稿素材（キャプション、ハッシュタグ、画像）を自動生成するWebサービス。

- **本番URL**: https://post-craft-rho.vercel.app/
- **現在のフェーズ**: Phase 2 開発中

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 15.5.9 (App Router) |
| Language | TypeScript 5.x |
| UI | React 19.1.0, Tailwind CSS 3.4.17 |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js + Google OAuth |
| AI | Google Gemini (文章・画像生成) |
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
│   └── api/               # API Routes
├── components/            # UIコンポーネント
├── lib/                   # ユーティリティ
└── types/                 # 型定義
```

## ルールファイル

| ファイル | 内容 | 適用場面 |
|---------|------|---------|
| `.claude/rules/frontend.md` | React, Tailwind, UI | コンポーネント実装時 |
| `.claude/rules/backend.md` | API, Supabase, 認証 | API・DB実装時 |
| `.claude/rules/nextjs.md` | Next.js 15 ベストプラクティス | 全般 |
| `.claude/rules/ai.md` | Gemini, プロンプト | AI機能実装時 |

## タスク管理

チケットは `/docs` ディレクトリに配置：
- `- [ ]` 未完了
- `- [×]` 完了

**Phase 2 チケット**: #13〜#22

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
```

## 仕様書

- `/docs/SPEC-CURRENT.md` - 現状仕様（Phase 1完了時点）
- `/docs/SPEC-PHASE2.md` - Phase 2 要件定義
