'use client'

import { useState } from 'react'
import type { HashtagRank } from '@/types/reports'

interface HashtagRankingProps {
  data: HashtagRank[]
}

export function HashtagRanking({ data }: HashtagRankingProps) {
  const [excludeRequired, setExcludeRequired] = useState(false)

  const filtered = excludeRequired ? data.filter(h => !h.isRequired) : data
  const maxCount = filtered.length > 0 ? filtered[0].count : 1

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">#️⃣ ハッシュタグランキング</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={excludeRequired}
            onChange={(e) => setExcludeRequired(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-800 border-white/10 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-400">必須タグを除外</span>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">データがありません</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <div key={item.hashtag} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-5 text-right">{i + 1}.</span>
              <span className={`text-sm min-w-[120px] ${item.isRequired ? 'text-blue-400' : 'text-slate-300'}`}>
                {item.hashtag}
                {item.isRequired && <span className="ml-1 text-xs text-blue-400/60">必須</span>}
              </span>
              <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500/40 rounded-full transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-10 text-right">{item.count}回</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
