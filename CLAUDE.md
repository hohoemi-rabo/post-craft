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
| AI (文章) | Google Gemini Flash (gemini-2.0-flash) |
| AI (画像) | Google Gemini (gemini-3-pro-image-preview) |
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

## 主要機能

### 投稿タイプ（6種類）
| ID | タイプ | 説明 |
|----|--------|------|
| `solution` | 解決タイプ | よくある質問と解決方法を紹介 |
| `promotion` | 宣伝タイプ | サービス・商品の告知 |
| `tips` | AI活用タイプ | AIの便利な使い方を紹介 |
| `showcase` | 実績タイプ | 制作事例・成果を紹介 |
| `useful` | お役立ちタイプ | 汎用的な便利情報 |
| `howto` | 使い方タイプ | 便利情報＋手順を紹介 |

### 投稿作成フロー
画像生成あり（6ステップ）:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定 → 4. キャッチコピー確認 → 5. 生成 → 6. 完成

画像スキップ（5ステップ）:
1. タイプ選択 → 2. 内容入力 → 3. 画像設定 → 4. 生成 → 5. 完成

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

### ハッシュタグ生成
- 必須タグ4個: #ほほ笑みラボ #飯田市 #パソコン教室 #スマホ
- 生成タグ6個: 投稿内容に基づいて自動生成
- 計10個のハッシュタグ

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
```

## 仕様書

- `/docs/SPEC-CURRENT.md` - 現状仕様（Phase 2完了時点）
- `/docs/SPEC-PHASE2.md` - Phase 2 要件定義
- `/docs/SPEC-PHASE3.md` - Phase 3 構想メモ（ユーザーカスタマイズ機能）

## 運営情報

- **Instagram**: https://www.instagram.com/hohoemi.rabo/
- **ホームページ**: https://www.hohoemi-rabo.com/
- **ポートフォリオ**: https://www.masayuki-kiwami.com/works
