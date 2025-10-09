# 06. キャプション・ハッシュタグ生成

## 概要
AI生成結果の表示・編集機能の実装

## 担当週
Week 2

## タスク

- [×] 生成結果画面レイアウト作成
- [×] キャプション編集機能（リアルタイム文字数カウント）
- [×] ハッシュタグ選択UI（チェックボックス）
- [×] プレビュー表示
- [×] コピー機能
- [×] 再生成ボタン
- [×] ローディング状態表示
- [×] エラー表示
- [×] レスポンシブ対応（PC: 2カラム、モバイル: 1カラム）

## UI仕様

### PC版（2カラムレイアウト）
```
┌─────────────────────────────────────────────┐
│ [戻る]  投稿素材の生成完了                    │
├─────────────────────────────────────────────┤
│                                             │
│  左カラム（編集エリア）    右カラム（プレビュー）  │
│  ┌──────────────┐     ┌──────────────┐   │
│  │ キャプション    │     │              │   │
│  │ [編集可能     ]│     │   生成画像     │   │
│  │ 文字数: 89/150 │     │              │   │
│  │              │     │  1080×1080    │   │
│  │ ハッシュタグ   │     │              │   │
│  │ ☑ #ブログ     │     └──────────────┘   │
│  │ ☑ #記事      │                        │
│  │ ☑ #Web開発   │     [画像をダウンロード]  │
│  │ ...          │                        │
│  └──────────────┘     [投稿準備を開始]    │
│                                             │
└─────────────────────────────────────────────┘
```

## 実装例

```tsx
// app/generate/result/page.tsx
'use client'
import { useState, useEffect } from 'react'

export default function ResultPage() {
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set())

  const maxCaptionLength = 150

  const handleHashtagToggle = (tag: string) => {
    const newSelected = new Set(selectedHashtags)
    if (newSelected.has(tag)) {
      newSelected.delete(tag)
    } else {
      newSelected.add(tag)
    }
    setSelectedHashtags(newSelected)
  }

  const handleCopy = () => {
    const text = `${caption}\n\n${Array.from(selectedHashtags).join(' ')}`
    navigator.clipboard.writeText(text)
    // Show toast
  }

  return (
    // ... UI implementation
  )
}
```

### ハッシュタグ仕様
- 生成数: 10個
- 構成: 内容関連8個 + 汎用2個
- 言語: 日本語中心
- デフォルト: 全選択状態

### キャプション仕様
- 文字数: 100-150文字
- トーン: シンプル・ビジネス寄り
- 絵文字: なし
- 編集: 可能

## 参考
- REQUIREMENTS.md: 3.2.2, 3.2.3, 4.4.2 生成結果画面
- CLAUDE.md: Core Features - AI-Powered Content Generation
