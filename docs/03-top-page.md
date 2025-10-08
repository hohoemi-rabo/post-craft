# 03. トップ画面実装

## 概要
URL入力画面とメインランディングページの実装

## 担当週
Week 1

## タスク

- [ ] トップページレイアウト作成（app/page.tsx）
- [ ] ヘッダーコンポーネント（ロゴ・ナビゲーション）
- [ ] ヒーローセクション
- [ ] URL入力フォーム
- [ ] バリデーション実装（URL形式チェック）
- [ ] フッターコンポーネント
- [ ] 「記事を直接入力」リンク
- [ ] レスポンシブ対応
- [ ] ローディング状態表示

## UI仕様

```
┌──────────────────────────────────┐
│ [ロゴ] Instagram Post Generator  │
│                                  │
│   ブログ記事から投稿素材を自動生成     │
│                                  │
│  ┌────────────────────────────┐  │
│  │ URLを入力...              │  │
│  └────────────────────────────┘  │
│         [生成する]               │
│                                  │
│    または [記事を直接入力]          │
└──────────────────────────────────┘
```

## 実装例

```tsx
// app/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // URL validation
    if (!isValidUrl(url)) {
      // Show error
      return
    }
    router.push(`/generate?url=${encodeURIComponent(url)}`)
  }

  return (
    // ... UI implementation
  )
}
```

## 参考
- REQUIREMENTS.md: 4.4 画面構成 - 4.4.1 トップ画面
- CLAUDE.md: Project Structure
