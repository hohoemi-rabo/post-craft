# Post Craft 現状仕様書

> 作成日: 2026-01-23
> フェーズ: MVP (Phase 1) 完了 → Phase 2 準備中

## 1. プロジェクト概要

**Post Craft** は、ブログ記事URLからInstagram投稿素材（キャプション、ハッシュタグ、画像）を自動生成するWebサービスです。

### ターゲットユーザー
- ブロガー、ライター
- SNSプロモーションを効率化したい個人・小規模事業者

### 技術スタック
| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| Framework | Next.js (App Router) | 15.5.9 |
| Language | TypeScript | 5.x |
| UI | React | 19.1.0 |
| Styling | Tailwind CSS | 3.4.17 |
| AI | OpenAI API (GPT-4o-mini) | 最新 |
| Scraping | @mozilla/readability + jsdom | 0.6.0 / 27.0.0 |
| Image Gen | @vercel/og (Satori) | 0.8.5 |
| Analytics | Google Analytics 4 | @next/third-parties |
| Cookie | js-cookie | 3.0.5 |
| Build | Turbopack | - |

---

## 2. Phase 1 (MVP) 実装状況

### 2.1 機能一覧

| # | 機能 | 状態 | 実装ファイル |
|---|------|------|-------------|
| 1 | URL入力・記事抽出 | ✅ 完了 | `app/page.tsx`, `api/extract/route.ts` |
| 2 | 手動テキスト入力 | ✅ 完了 | `app/generate/manual/page.tsx` |
| 3 | AIキャプション生成 | ✅ 完了 | `api/generate/route.ts`, `lib/openai.ts` |
| 4 | AIハッシュタグ生成 | ✅ 完了 | 同上 |
| 5 | カスタムハッシュタグ追加 | ✅ 完了 | `app/generate/result/page.tsx` |
| 6 | 画像生成 (1080x1080) | ✅ 完了 | `api/og/route.tsx` |
| 7 | 背景色選択 (12色) | ✅ 完了 | 同上 |
| 8 | 画像ダウンロード | ✅ 完了 | `app/generate/result/page.tsx` |
| 9 | クリップボードコピー | ✅ 完了 | 同上 |
| 10 | Instagram起動 | ✅ 完了 | 同上 |
| 11 | Cookie回数制限 (5回/日) | ✅ 完了 | `lib/rate-limiter.ts` |
| 12 | エラーハンドリング | ✅ 完了 | `lib/error-messages.ts`, `app/error.tsx` |
| 13 | レスポンシブデザイン | ✅ 完了 | 全ページ |
| 14 | GA4アナリティクス | ✅ 完了 | `lib/analytics.ts` |
| 15 | プライバシーポリシー | ✅ 完了 | `app/privacy/page.tsx` |
| 16 | お問い合わせ | ✅ 完了 | `app/contact/page.tsx` |

### 2.2 未完了タスク (Phase 1)

| タスク | 状態 | 備考 |
|--------|------|------|
| Vercelデプロイ | ⏳ 未実施 | 環境変数設定必要 |
| 本番GA4設定 | ⏳ 未実施 | GA ID取得必要 |
| ブラウザテスト | ⏳ 未実施 | - |
| ベータテスト | ⏳ 未実施 | - |

---

## 3. アーキテクチャ

### 3.1 ディレクトリ構造

```
src/
├── app/
│   ├── layout.tsx              # Root Layout (フォント, GA4)
│   ├── page.tsx                # トップページ (URL入力)
│   ├── error.tsx               # グローバルエラー境界
│   ├── globals.css             # グローバルスタイル
│   │
│   ├── generate/
│   │   ├── page.tsx            # 記事抽出中間ページ
│   │   ├── manual/
│   │   │   └── page.tsx        # 手動入力ページ
│   │   └── result/
│   │       └── page.tsx        # 生成結果ページ (847行)
│   │
│   ├── api/
│   │   ├── extract/
│   │   │   └── route.ts        # 記事抽出API
│   │   ├── generate/
│   │   │   └── route.ts        # AI生成API
│   │   └── og/
│   │       └── route.tsx       # 画像生成API (Edge)
│   │
│   ├── privacy/
│   │   └── page.tsx            # プライバシーポリシー
│   └── contact/
│       └── page.tsx            # お問い合わせ
│
├── components/
│   ├── ui/
│   │   ├── button.tsx          # ボタン (variant: primary/secondary/ghost)
│   │   ├── input.tsx           # 入力フィールド
│   │   ├── textarea.tsx        # テキストエリア (文字数カウント付き)
│   │   ├── card.tsx            # カード
│   │   ├── spinner.tsx         # ローディング
│   │   ├── toast.tsx           # トースト通知
│   │   └── modal.tsx           # モーダル
│   │
│   ├── layout/
│   │   ├── header.tsx          # ヘッダー
│   │   └── footer.tsx          # フッター
│   │
│   ├── providers/
│   │   └── providers.tsx       # Context Providers
│   │
│   └── usage-indicator.tsx     # 残り回数表示
│
└── lib/
    ├── utils.ts                # cn() ユーティリティ
    ├── openai.ts               # OpenAI クライアント
    ├── api-client.ts           # fetch ラッパー (リトライ付き)
    ├── validation.ts           # URL バリデーション
    ├── error-messages.ts       # エラーメッセージ定数
    ├── rate-limiter.ts         # Cookie回数制限
    └── analytics.ts            # GA4 イベント関数
```

### 3.2 データフロー

```
[ユーザー]
    │
    ▼ URL入力
[トップページ] ─────────────────────────────────────┐
    │                                               │
    ▼ POST /api/extract                             │ 抽出失敗
[記事抽出API]                                       │
    │ ├── @mozilla/readability                      │
    │ └── jsdom                                     │
    │                                               ▼
    ▼ sessionStorage                        [手動入力ページ]
[生成結果ページ]                                    │
    │                                               │
    ├─────────────────────────────────────────────┘
    │
    ▼ POST /api/generate
[AI生成API]
    │ ├── OpenAI GPT-4o-mini
    │ └── システムプロンプト
    │
    ▼ キャプション + ハッシュタグ
[生成結果ページ]
    │
    ├── キャプション編集
    ├── ハッシュタグ選択/追加
    │
    ▼ GET /api/og?title=...&bg=...
[画像生成API]
    │ └── @vercel/og (Edge Runtime)
    │
    ▼ 1080x1080 PNG
[生成結果ページ]
    │
    ├── 画像ダウンロード
    ├── テキストコピー
    └── Instagram起動
```

---

## 4. APIエンドポイント仕様

### 4.1 POST /api/extract

記事URLから本文を抽出する。

**Request:**
```typescript
{
  url: string  // https://example.com/article
}
```

**Response (成功):**
```typescript
{
  title: string      // 記事タイトル
  content: string    // 本文 (最大8000文字に切り詰め)
  excerpt: string    // 抜粋 (最大200文字)
}
```

**Response (エラー):**
```typescript
{
  error: string      // エラーメッセージ
}
```

**エラーケース:**
- 400: URLが未指定
- 400: 無効なURL形式
- 500: 記事の取得に失敗
- 500: 記事の解析に失敗

---

### 4.2 POST /api/generate

本文からキャプション・ハッシュタグを生成する。

**Request:**
```typescript
{
  content: string    // 本文
  title?: string     // タイトル (オプション)
}
```

**Response (成功):**
```typescript
{
  caption: string    // キャプション (100-150文字)
  hashtags: string[] // ハッシュタグ (10個)
}
```

**Response (エラー):**
```typescript
{
  error: string
}
```

**生成仕様:**
- キャプション: 100-150文字、ビジネストーン、絵文字なし
- ハッシュタグ: 10個 (内容関連8個 + 汎用2個)、日本語中心
- モデル: GPT-4o-mini
- Temperature: 0.7
- Max tokens: 500

---

### 4.3 GET /api/og

Instagram用画像を生成する。

**Query Parameters:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| title | string | Yes | 表示テキスト |
| bg | string | No | 背景色 (例: "1E293B") |

**Response:**
- Content-Type: `image/png`
- サイズ: 1080×1080 px

**背景色プリセット (12色):**
```typescript
const BG_COLORS = [
  '#1E293B', '#334155', '#0F172A', '#1E3A5F',
  '#312E81', '#3730A3', '#4C1D95', '#581C87',
  '#831843', '#9F1239', '#1F2937', '#374151'
]
```

---

## 5. UI/UXデザイン仕様

### 5.1 デザインシステム

**カラーパレット:**
```css
--primary: #3B82F6 (Blue)
--background: グラデーション (slate-950 → slate-900)
--text-primary: #FFFFFF
--text-secondary: #94A3B8
--border: rgba(255,255,255,0.1)
--success: #10B981
--error: #EF4444
```

**フォント:**
- 英語: Poppins
- 日本語: M PLUS Rounded 1c

**デザインスタイル:**
- ダークテーマ
- グラスモーフィズム (backdrop-blur)
- グラデーション背景
- モダン・ミニマル

### 5.2 レスポンシブブレイクポイント

| ブレイクポイント | サイズ | レイアウト |
|-----------------|--------|-----------|
| Mobile | < 768px | 1カラム |
| Tablet | 768px - 1023px | 1カラム (余白調整) |
| Desktop | >= 1024px | 2カラム |

### 5.3 タッチターゲット

- 最小サイズ: 44×44 px
- ボタン padding: min 12px

---

## 6. エラーハンドリング

### 6.1 エラーメッセージ一覧

```typescript
// lib/error-messages.ts
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  TIMEOUT_ERROR: 'リクエストがタイムアウトしました。もう一度お試しください。',
  EXTRACTION_FAILED: '記事の取得に失敗しました。URLを確認するか、本文を直接入力してください。',
  GENERATION_FAILED: 'コンテンツの生成に失敗しました。もう一度お試しください。',
  RATE_LIMIT_EXCEEDED: '本日の利用回数上限に達しました。明日またお試しください。',
  INVALID_URL: '有効なURLを入力してください。',
  CONTENT_TOO_SHORT: '本文が短すぎます。100文字以上入力してください。',
  CONTENT_TOO_LONG: '本文が長すぎます。10,000文字以内で入力してください。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
}
```

### 6.2 リトライ戦略

```typescript
// lib/api-client.ts
- 最大リトライ回数: 3
- バックオフ: 指数関数的 (1s → 2s → 4s)
- リトライ対象: 5xx, 429
- タイムアウト: 30秒
```

---

## 7. セキュリティ・制限

### 7.1 レート制限

| 制限 | 値 | 実装 |
|------|-----|------|
| 日次生成回数 | 5回/日 | Cookie (クライアント側) |
| リセットタイミング | 日付変更時 | UTC基準 |

**注意:** クライアント側のみの制限のため、技術的には回避可能。Phase 2でサーバーサイド認証と併用予定。

### 7.2 入力制限

| 項目 | 制限 |
|------|------|
| URL | http/https のみ |
| 手動入力 | 100〜10,000文字 |
| キャプション | 最大150文字 |
| API本文送信 | 最大8,000文字 (トークン制限) |

### 7.3 環境変数

```bash
# 必須
OPENAI_API_KEY=sk-...

# オプション
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_APP_URL=https://...
NEXT_PUBLIC_DISABLE_RATE_LIMIT=true  # 開発用
```

---

## 8. アナリティクスイベント

| イベント名 | トリガー | パラメータ |
|-----------|---------|-----------|
| `generate_start` | 生成開始 | source (url/manual) |
| `generate_success` | 生成成功 | captionLength, hashtagCount, processingTime |
| `generate_error` | 生成エラー | errorType, source |
| `image_download` | 画像DL | bgColorIndex |
| `copy_caption` | コピー | captionLength, hashtagCount |
| `open_instagram` | IG起動 | platform (mobile/desktop) |
| `post_assist_complete` | アシスト完了 | - |
| `add_hashtag` | タグ追加 | isCustom |
| `change_bg_color` | 背景変更 | colorIndex |

---

## 9. Phase 2 計画機能

CLAUDE.md の Future Phases より:

### Phase 2: 認証・課金・履歴
- [ ] ユーザー認証 (OAuth: Google/Twitter)
- [ ] 有料プラン導入
- [ ] 生成履歴保存
- [ ] サーバーサイドレート制限

### Phase 3: 機能拡張
- [ ] 複数テンプレート
- [ ] 画像編集機能
- [ ] 絵文字トーン選択
- [ ] マルチプラットフォーム (Twitter/Facebook)

### Phase 4: エンタープライズ
- [ ] チーム機能
- [ ] API提供
- [ ] エンタープライズプラン

---

## 10. 既知の課題・技術的負債

### 10.1 リファクタリング推奨

| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| `app/generate/result/page.tsx` | 847行と大規模 | コンポーネント分割 |
| 定数 | 一部ハードコード | 定数ファイルに集約 |
| エラー処理 | 重複あり | カスタムフック化 |

### 10.2 テスト不足

- ユニットテスト: なし
- E2Eテスト: なし
- 推奨: Vitest + Playwright 導入

### 10.3 セキュリティ考慮事項

- レート制限がクライアント側のみ
- CORS設定が緩い
- API認証なし (Phase 2で対応予定)

---

## 11. 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# Lint
npm run lint
```

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-23 | 初版作成 (Phase 1完了時点) |
