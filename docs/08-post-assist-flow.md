# 08. 投稿補助機能

## 概要
Instagram投稿を補助する一連の機能（画像ダウンロード、コピー、アプリ起動）

## 担当週
Week 3

## タスク

- [ ] 画像自動ダウンロード機能
- [ ] キャプション+ハッシュタグコピー機能
- [ ] クリップボードAPI実装
- [ ] デバイス判定（モバイル/PC）
- [ ] Instagram誘導（モバイル: アプリ起動、PC: Web）
- [ ] 投稿手順ガイド表示
- [ ] 成功メッセージ表示
- [ ] エラーハンドリング

## 投稿フロー

```
Step 1: 画像自動ダウンロード
  ↓
Step 2: キャプション＋ハッシュタグをクリップボードにコピー
  ↓
Step 3: Instagram誘導
  - モバイル: instagram://camera
  - PC: https://www.instagram.com/
  ↓
ガイド表示: 投稿手順
```

## 実装例

```tsx
// components/post-assist.tsx
'use client'
import { useState } from 'react'

export default function PostAssist({
  imageUrl,
  caption,
  hashtags
}: {
  imageUrl: string
  caption: string
  hashtags: string[]
}) {
  const [step, setStep] = useState(0)

  const handleStartPost = async () => {
    try {
      // Step 1: Download image
      setStep(1)
      await downloadImage(imageUrl)

      // Step 2: Copy to clipboard
      setStep(2)
      const text = `${caption}\n\n${hashtags.join(' ')}`
      await navigator.clipboard.writeText(text)

      // Step 3: Open Instagram
      setStep(3)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      if (isMobile) {
        window.location.href = 'instagram://camera'
        // Fallback to web if app not installed
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank')
        }, 1000)
      } else {
        window.open('https://www.instagram.com/', '_blank')
      }

      setStep(4) // Show guide
    } catch (error) {
      console.error('Post assist error:', error)
      // Show error message
    }
  }

  const downloadImage = async (url: string) => {
    const response = await fetch(url)
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'instagram-post.png'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div>
      <button onClick={handleStartPost}>
        投稿準備を開始
      </button>

      {step > 0 && (
        <div>
          <h3>投稿手順</h3>
          <ol>
            <li className={step >= 1 ? 'completed' : ''}>
              画像をダウンロードしました
            </li>
            <li className={step >= 2 ? 'completed' : ''}>
              キャプションをコピーしました
            </li>
            <li className={step >= 3 ? 'completed' : ''}>
              Instagramを開きました
            </li>
          </ol>

          {step === 4 && (
            <div>
              <h4>次の手順でご投稿ください：</h4>
              <ol>
                <li>ダウンロードした画像を選択</li>
                <li>キャプション欄に貼り付け（Ctrl/Cmd + V）</li>
                <li>投稿ボタンをタップ</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## デバイス別挙動

### モバイル
- Instagram アプリを開く: `instagram://camera`
- アプリ未インストール時: Instagram Web へフォールバック

### PC
- Instagram Web を新規タブで開く

## 参考
- REQUIREMENTS.md: 3.2.5 投稿補助機能
- CLAUDE.md: Core Features - Post Assist Flow
