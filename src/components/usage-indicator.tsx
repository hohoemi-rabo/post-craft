'use client'

import { useEffect, useState } from 'react'
import { getRemainingUses, getMaxDailyUses } from '@/lib/rate-limiter'

export default function UsageIndicator() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const maxUses = getMaxDailyUses()

  useEffect(() => {
    // クライアントサイドでのみ実行
    setRemaining(getRemainingUses())
  }, [])

  // サーバーサイドレンダリング時は何も表示しない
  if (remaining === null) {
    return null
  }

  const isLow = remaining <= 2
  const isZero = remaining === 0

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-400">本日の残り:</span>
      <span
        className={`font-semibold ${
          isZero
            ? 'text-red-400'
            : isLow
            ? 'text-orange-400'
            : 'text-white'
        }`}
      >
        {remaining} / {maxUses}
      </span>
    </div>
  )
}
