# Instagram Post Generator

ブログ記事のURLからInstagram投稿素材（キャプション・ハッシュタグ・画像）を自動生成するサービス

## 概要

ブロガーやライターがブログ記事をInstagramで紹介する際の手間を最小化。記事URLを入力するだけで、AIが自動的に投稿用のコンテンツを生成します。

## 主な機能

- 📝 **本文自動抽出**: ブログ記事URLからコンテンツを自動抽出
- 🤖 **AI生成**: OpenAI GPT-4によるキャプション・ハッシュタグの自動生成
- 🖼️ **画像生成**: 1080×1080pxの投稿画像を自動作成
- 📱 **投稿補助**: 画像ダウンロード・テキストコピー・Instagram起動を自動化

## 技術スタック

- **フレームワーク**: Next.js 15.5.4 (App Router)
- **言語**: TypeScript 5.x
- **スタイリング**: Tailwind CSS 3.4.17
- **ビルドツール**: Turbopack
- **デプロイ**: Vercel
- **AI**: OpenAI API (GPT-4)
- **画像生成**: @vercel/og または Canvas API

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd post-craft
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定：

```bash
# OpenAI API
OPENAI_API_KEY=your_api_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development: Disable rate limiting in development
NEXT_PUBLIC_DISABLE_RATE_LIMIT=true
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## 開発コマンド

```bash
# 開発サーバー起動（Turbopack）
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Lint実行
npm run lint
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # トップページ
│   ├── globals.css        # グローバルスタイル
│   └── api/               # API Routes（今後追加予定）
├── components/            # Reactコンポーネント（今後追加予定）
└── lib/                   # ユーティリティ（今後追加予定）

docs/                      # 開発タスク管理
├── 01-project-setup.md
├── 02-ui-components.md
└── ...
```

## デザインシステム

### カラーパレット

- Primary: `#3B82F6` (Blue)
- Background: `#FFFFFF` (White)
- Text Primary: `#1F2937` (Dark Gray)
- Text Secondary: `#6B7280` (Gray)
- Border: `#E5E7EB` (Light Gray)
- Success: `#10B981` (Green)
- Error: `#EF4444` (Red)

### フォント

- 日本語: Noto Sans JP (400, 500, 700)
- 英数字: Geist Sans
- コード: Geist Mono

## 開発ステータス

現在MVP（最小機能プロダクト）開発中。進捗は`/docs`ディレクトリ内のタスクチケットで管理しています。

### Week 1 (現在)
- [x] プロジェクト初期設定
- [ ] UIコンポーネント作成
- [ ] トップページ実装
- [ ] 本文抽出機能

### Week 2
- [ ] OpenAI API統合
- [ ] キャプション・ハッシュタグ生成

### Week 3
- [ ] 画像生成機能
- [ ] 投稿補助機能
- [ ] レスポンシブ対応

### Week 4
- [ ] Cookie制限機能
- [ ] エラーハンドリング
- [ ] GA4統合・デプロイ

## ライセンス

このプロジェクトは個人開発のMVPです。

## 開発者

Claude Codeを使用した個人開発プロジェクト
