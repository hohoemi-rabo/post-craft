# 10. Cookie制限機能

## 概要
Cookieベースの回数制限実装（1日5回まで）

## 担当週
Week 4

## タスク

- [ ] Cookie管理ライブラリ選定
- [ ] Cookie設定（js-cookie or cookies-next）
- [ ] 回数カウント機能
- [ ] リセットロジック（日付変更時）
- [ ] 制限超過時のUI表示
- [ ] 開発環境での制限解除
- [ ] プライバシーポリシーページ作成

## 実装例

```typescript
// lib/rate-limiter.ts
import Cookies from 'js-cookie'

const COOKIE_NAME = 'post_generation_count'
const COOKIE_DATE = 'post_generation_date'
const MAX_DAILY_USES = 5

export function getRemainingUses(): number {
  const today = new Date().toDateString()
  const savedDate = Cookies.get(COOKIE_DATE)

  // Reset if date changed
  if (savedDate !== today) {
    Cookies.set(COOKIE_DATE, today, { expires: 1 })
    Cookies.set(COOKIE_NAME, '0', { expires: 1 })
    return MAX_DAILY_USES
  }

  const count = parseInt(Cookies.get(COOKIE_NAME) || '0')
  return Math.max(0, MAX_DAILY_USES - count)
}

export function incrementUsage(): boolean {
  const remaining = getRemainingUses()

  if (remaining <= 0) {
    return false // Limit exceeded
  }

  const count = parseInt(Cookies.get(COOKIE_NAME) || '0')
  Cookies.set(COOKIE_NAME, String(count + 1), { expires: 1 })
  return true
}

export function canGenerate(): boolean {
  return getRemainingUses() > 0
}
```

### UI実装
```tsx
// components/usage-indicator.tsx
'use client'
import { useEffect, useState } from 'react'
import { getRemainingUses } from '@/lib/rate-limiter'

export default function UsageIndicator() {
  const [remaining, setRemaining] = useState(5)

  useEffect(() => {
    setRemaining(getRemainingUses())
  }, [])

  return (
    <div className="text-sm text-gray-600">
      本日の残り生成回数: {remaining} / 5
    </div>
  )
}
```

### 制限超過時の表示
```tsx
if (!canGenerate()) {
  return (
    <div className="text-center p-8">
      <h2>本日の生成回数を使い切りました</h2>
      <p>明日また5回ご利用いただけます。</p>
      <p className="mt-4 text-sm text-gray-600">
        ※ブラウザのCookieをクリアすると制限がリセットされる場合があります
      </p>
    </div>
  )
}
```

## Cookie仕様
- 名前: `post_generation_count`, `post_generation_date`
- 有効期限: 1日
- ドメイン: 自動（サブドメイン共有なし）
- Secure: Production環境のみ
- SameSite: Lax

## 開発環境での制限解除
```typescript
// .env.local
NEXT_PUBLIC_DISABLE_RATE_LIMIT=true

// lib/rate-limiter.ts
export function canGenerate(): boolean {
  if (process.env.NEXT_PUBLIC_DISABLE_RATE_LIMIT === 'true') {
    return true
  }
  return getRemainingUses() > 0
}
```

## 参考
- REQUIREMENTS.md: 3.3.3 セキュリティ・制限
- CLAUDE.md: Rate Limiting
