import Link from 'next/link'

interface RemakeSourceInfoProps {
  sourceId: string
  sourcePostType?: string | null
  sourceCaption?: string | null
  sourceCreatedAt?: string | null
}

export function RemakeSourceInfo({
  sourceId,
  sourcePostType,
  sourceCaption,
  sourceCreatedAt,
}: RemakeSourceInfoProps) {
  const formattedDate = sourceCreatedAt
    ? new Date(sourceCreatedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : null

  return (
    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-orange-400">🔄 リメイク元</span>
        {sourcePostType && (
          <span className="text-xs text-slate-400">{sourcePostType}</span>
        )}
        {formattedDate && (
          <span className="text-xs text-slate-500">{formattedDate}</span>
        )}
      </div>
      {sourceCaption && (
        <p className="text-sm text-slate-300 line-clamp-2 mb-2">
          {sourceCaption.slice(0, 100)}
          {sourceCaption.length > 100 ? '...' : ''}
        </p>
      )}
      <Link
        href={`/history/${sourceId}`}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        元投稿を見る →
      </Link>
    </div>
  )
}
