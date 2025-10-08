# 07. 画像生成機能

## 概要
@vercel/ogまたはCanvas APIを使った投稿画像の生成

## 担当週
Week 3

## タスク

- [ ] @vercel/og または Canvas API選定
- [ ] Noto Sans JPフォント設定
- [ ] 画像生成API実装（Route Handler）
- [ ] 背景色ランダム選択
- [ ] テキスト色自動選択（背景に応じて白/黒）
- [ ] テキストレイアウト調整
- [ ] 画像サイズ最適化（1080×1080px）
- [ ] ダウンロード機能
- [ ] プレビュー表示

## 技術詳細

### オプション1: @vercel/og
```bash
npm install @vercel/og
```

```tsx
// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'タイトル'

  const bgColors = ['#1E293B', '#334155', '#F5F5F5']
  const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)]
  const textColor = bgColor === '#F5F5F5' ? '#1F2937' : '#FFFFFF'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          color: textColor,
          fontSize: 60,
          fontWeight: 'bold',
          padding: '80px',
          textAlign: 'center',
        }}
      >
        {title}
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  )
}
```

### オプション2: Canvas API
```typescript
// lib/image-generator.ts
import { createCanvas, registerFont } from 'canvas'

registerFont('./fonts/NotoSansJP-Regular.ttf', { family: 'Noto Sans JP' })

export function generateImage(title: string): Buffer {
  const canvas = createCanvas(1080, 1080)
  const ctx = canvas.getContext('2d')

  const bgColors = ['#1E293B', '#334155', '#F5F5F5']
  const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)]
  const textColor = bgColor === '#F5F5F5' ? '#1F2937' : '#FFFFFF'

  // Background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, 1080, 1080)

  // Text
  ctx.fillStyle = textColor
  ctx.font = 'bold 60px "Noto Sans JP"'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Word wrap
  const maxWidth = 900
  const lines = wrapText(ctx, title, maxWidth)
  const lineHeight = 80
  const startY = 540 - (lines.length * lineHeight) / 2

  lines.forEach((line, i) => {
    ctx.fillText(line, 540, startY + i * lineHeight)
  })

  return canvas.toBuffer('image/png')
}
```

## 画像仕様
- サイズ: 1080×1080px（正方形）
- フォント: Noto Sans JP
- 背景色:
  - `#1E293B`（ダークネイビー）
  - `#334155`（グレー）
  - `#F5F5F5`（ライトグレー）
- テキスト色: 背景に応じて自動選択
- 編集: 不可（気に入らない場合は自分の画像使用を推奨）

## パフォーマンス目標
- 生成時間: < 3秒

## 参考
- REQUIREMENTS.md: 3.2.4 画像生成
- CLAUDE.md: Core Features - Image Generation
