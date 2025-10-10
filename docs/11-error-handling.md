# 11. エラーハンドリング強化

## 概要
ユーザーフレンドリーなエラーハンドリングの実装

## 担当週
Week 4

## タスク

- [×] エラー境界コンポーネント（error.tsx）
- [×] APIエラーハンドリング
- [×] バリデーションエラー表示
- [×] リトライ機能（最大3回）
- [×] タイムアウトハンドリング（30秒）
- [×] ネットワークエラー対応
- [×] トーストメッセージシステム
- [×] エラーログ収集（開発用）

## エラーメッセージ定義

```typescript
// lib/error-messages.ts
export const ERROR_MESSAGES = {
  INVALID_URL: '有効なURLを入力してください',
  SCRAPING_FAILED: '記事の取得に失敗しました。URLを確認するか、記事を直接入力してください',
  API_TIMEOUT: '処理に時間がかかっています。もう一度お試しください',
  API_FAILED: '生成に失敗しました。しばらく待ってからお試しください',
  RATE_LIMIT_EXCEEDED: '本日の生成回数を使い切りました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
}
```

## 実装例

### エラー境界
```tsx
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">
          エラーが発生しました
        </h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-white rounded-lg"
        >
          もう一度試す
        </button>
      </div>
    </div>
  )
}
```

### APIリトライロジック
```typescript
// lib/api-client.ts
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return response
    } catch (error) {
      lastError = error as Error

      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
      }
    }
  }

  throw lastError!
}
```

### トーストメッセージ
```tsx
// components/toast.tsx
'use client'
import { createContext, useContext, useState } from 'react'

type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const ToastContext = createContext<{
  showToast: (message: string, type: Toast['type']) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: Toast['type']) => {
    const id = Math.random().toString(36)
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded shadow-lg ${
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'success' ? 'bg-green-500' :
              'bg-blue-500'
            } text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
```

## エラーハンドリング戦略

```
URL入力ミス → 「有効なURLを入力してください」
スクレイピング失敗 → 本文コピペ画面へ自動遷移
API失敗 → リトライボタン表示（最大3回）
タイムアウト → 「処理に時間がかかっています」→ リトライ促す
```

## 参考
- REQUIREMENTS.md: 3.3.2 エラーハンドリング
- CLAUDE.md: Error Handling Strategy, Next.js Best Practices - Error Handling
