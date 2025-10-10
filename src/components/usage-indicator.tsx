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
    <div className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-sm shadow-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${
          isZero
            ? 'text-red-400'
            : isLow
            ? 'text-orange-400'
            : 'text-purple-400'
        }`}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="text-gray-300">本日の残り:</span>
      <span
        className={`font-bold ${
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
