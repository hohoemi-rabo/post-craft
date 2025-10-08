# 12. GA4統合・デプロイ・テスト

## 概要
Google Analytics 4の統合とVercelデプロイ、ベータテスト

## 担当週
Week 4

## タスク

### GA4統合
- [ ] Google Analytics 4アカウント作成
- [ ] 測定ID取得
- [ ] Next.jsにGA4統合（next/script）
- [ ] カスタムイベント設定
- [ ] プライバシーポリシー更新
- [ ] Cookie同意バナー（任意）

### デプロイ
- [ ] Vercelアカウント作成
- [ ] GitHubリポジトリ連携
- [ ] 環境変数設定（Vercel）
- [ ] ドメイン設定
- [ ] ビルド確認
- [ ] 本番デプロイ

### テスト
- [ ] 機能テスト（全フロー）
- [ ] レスポンシブテスト
- [ ] ブラウザ互換性テスト
- [ ] パフォーマンステスト
- [ ] クローズドベータテスト
- [ ] フィードバック収集

## GA4実装

### インストール
```bash
npm install @next/third-parties
```

### 実装例
```tsx
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  )
}
```

### カスタムイベント
```typescript
// lib/analytics.ts
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

// 使用例
trackEvent('generate_post', {
  source: 'url',
  content_length: 1000,
})
```

### 計測イベント
- `page_view`: ページビュー（自動）
- `generate_post`: 投稿生成開始
- `generation_success`: 生成成功
- `generation_error`: 生成エラー
- `download_image`: 画像ダウンロード
- `copy_caption`: キャプションコピー
- `open_instagram`: Instagram起動

## Vercelデプロイ

### 環境変数（Vercel設定）
```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### ビルド設定
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### デプロイコマンド
```bash
# Vercel CLI使用
npm install -g vercel
vercel login
vercel --prod
```

## テストチェックリスト

### 機能テスト
- [ ] URL入力 → 本文抽出
- [ ] 本文直接入力
- [ ] AI生成（キャプション・ハッシュタグ）
- [ ] 画像生成
- [ ] キャプション編集
- [ ] ハッシュタグ選択
- [ ] 画像ダウンロード
- [ ] テキストコピー
- [ ] Instagram起動（モバイル/PC）
- [ ] Cookie制限（5回）
- [ ] エラーハンドリング

### パフォーマンステスト
- [ ] 生成処理: < 60秒
- [ ] 画像生成: < 3秒
- [ ] ページ読み込み: < 2秒
- [ ] Lighthouse スコア: > 90

### ブラウザテスト
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] iOS Safari
- [ ] Android Chrome

## クローズドベータテスト

### 対象ユーザー
- ブロガー 3-5名
- ライター 3-5名

### フィードバック項目
- 使いやすさ
- 生成品質
- バグ報告
- 機能要望
- パフォーマンス

### フィードバック収集方法
- GitHub Issues
- Google Forms
- 直接ヒアリング

## 参考
- REQUIREMENTS.md: Week 4, 8. 運用・保守
- CLAUDE.md: Testing & Deployment
