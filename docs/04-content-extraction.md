# 04. URL入力・本文抽出機能

## 概要
ブログ記事のURLからコンテンツを抽出する機能の実装

## 担当週
Week 1

## タスク

- [×] @mozilla/readabilityインストール
- [×] jsdomインストール
- [×] スクレイピングAPI実装（Route Handler）
- [×] 本文抽出処理
- [×] タイトル抽出処理
- [×] エラーハンドリング
- [×] フォールバック画面実装（手動入力）
- [×] 文字数制限実装（10,000文字）
- [×] CORSエラー対応

## 技術詳細

### 必須パッケージ
```bash
npm install @mozilla/readability jsdom
npm install -D @types/jsdom
```

### API実装例
```typescript
// app/api/extract/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    const response = await fetch(url)
    const html = await response.text()

    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) {
      return NextResponse.json(
        { error: 'Failed to extract content' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Scraping failed' },
      { status: 500 }
    )
  }
}
```

### フォールバック画面
```tsx
// app/generate/manual/page.tsx
export default function ManualInput() {
  const [content, setContent] = useState('')
  const maxChars = 10000

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={maxChars}
        placeholder="記事本文を貼り付けてください..."
      />
      <p>{content.length} / {maxChars} 文字</p>
    </div>
  )
}
```

## エラーハンドリング
```
URL入力ミス → 「有効なURLを入力してください」
スクレイピング失敗 → 本文コピペ画面へ自動遷移
タイムアウト → 「処理に時間がかかっています」
```

## 参考
- REQUIREMENTS.md: 3.2.1 URL入力・本文抽出
- CLAUDE.md: Core Features - URL Input & Content Extraction
