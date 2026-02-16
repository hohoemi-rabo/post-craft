import Link from 'next/link'
import { AnalysisDeleteButton } from './analysis-delete-button'

interface AnalysisCardProps {
  analysis: {
    id: string
    source_type: string
    source_identifier: string
    source_display_name: string | null
    status: string
    post_count: number | null
    error_message: string | null
    created_at: string | null
  }
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const isClickable = analysis.status === 'completed'
  const displayName = analysis.source_display_name || analysis.source_identifier

  const card = (
    <div
      className={`relative bg-white/5 border border-white/10 rounded-xl p-5
                  transition-all duration-200 ${
                    isClickable ? 'hover:bg-white/10 hover:border-white/20' : ''
                  }`}
    >
      {/* バッジ行 */}
      <div className="flex items-center justify-between mb-3">
        <SourceTypeBadge type={analysis.source_type} />
        <StatusBadge status={analysis.status} />
      </div>

      {/* 表示名 */}
      <h3 className="text-white font-medium mb-2 truncate">{displayName}</h3>

      {/* メタ情報 + 削除ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-white/50">
          {analysis.post_count != null && (
            <span>{analysis.post_count}件</span>
          )}
          {analysis.created_at && (
            <span>{new Date(analysis.created_at).toLocaleDateString('ja-JP')}</span>
          )}
        </div>
        <AnalysisDeleteButton analysisId={analysis.id} />
      </div>

      {/* エラーメッセージ */}
      {analysis.status === 'failed' && analysis.error_message && (
        <p className="mt-2 text-xs text-red-400 truncate">
          {analysis.error_message}
        </p>
      )}
    </div>
  )

  if (isClickable) {
    return <Link href={`/analysis/${analysis.id}`}>{card}</Link>
  }

  return card
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: '準備中',
      className: 'bg-white/10 text-white/60',
    },
    analyzing: {
      label: '分析中',
      className: 'bg-yellow-500/20 text-yellow-300',
    },
    completed: {
      label: '完了',
      className: 'bg-green-500/20 text-green-300',
    },
    failed: {
      label: '失敗',
      className: 'bg-red-500/20 text-red-300',
    },
  }

  const { label, className } = config[status] || config.pending

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${className}`}>
      {label}
    </span>
  )
}

function SourceTypeBadge({ type }: { type: string }) {
  if (type === 'instagram') {
    return (
      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
        📸 Instagram
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">
      📝 Blog
    </span>
  )
}
