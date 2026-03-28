'use client'

import type { PeriodFilter } from '@/types/reports'

interface PeriodFilterProps {
  value: PeriodFilter
  onChange: (period: PeriodFilter) => void
}

const OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '1m', label: '直近1ヶ月' },
  { value: '3m', label: '直近3ヶ月' },
  { value: 'all', label: '全期間' },
]

export function PeriodFilterComponent({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            value === opt.value
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
