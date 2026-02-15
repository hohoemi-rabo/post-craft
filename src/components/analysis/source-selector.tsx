'use client'

import type { AnalysisSourceType } from '@/types/analysis'

interface SourceSelectorProps {
  onSelect: (sourceTypes: AnalysisSourceType[]) => void
}

const sourceOptions = [
  {
    id: 'instagram' as const,
    types: ['instagram'] as AnalysisSourceType[],
    icon: '📸',
    title: 'Instagram 競合分析',
    description: '競合アカウントの投稿データ（CSV/JSON）をアップロードして、投稿パターンやトーンを分析',
  },
  {
    id: 'blog' as const,
    types: ['blog'] as AnalysisSourceType[],
    icon: '📝',
    title: 'ブログ分析',
    description: 'ブログURLを入力するだけで記事を自動取得し、コンテンツの強みを分析',
  },
  {
    id: 'both' as const,
    types: ['instagram', 'blog'] as AnalysisSourceType[],
    icon: '📊',
    title: '統合分析',
    description: 'Instagram + ブログの両方を分析し、最適な投稿戦略を導き出します',
    recommended: true,
  },
]

export function SourceSelector({ onSelect }: SourceSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sourceOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.types)}
          className={`group relative p-6 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
            option.recommended
              ? 'border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/15 hover:border-blue-500/60'
              : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          {option.recommended && (
            <span className="absolute -top-3 left-4 px-3 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
              推奨
            </span>
          )}
          <div className="text-3xl mb-4">{option.icon}</div>
          <h3 className="text-lg font-bold text-white mb-2">{option.title}</h3>
          <p className="text-sm text-white/60 leading-relaxed">{option.description}</p>

          {/* ホバー時の矢印 */}
          <div className="mt-4 text-sm text-white/40 group-hover:text-white/80 transition-colors flex items-center gap-1">
            選択する
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </div>
        </button>
      ))}
    </div>
  )
}
