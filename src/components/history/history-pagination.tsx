import Link from 'next/link'

interface HistoryPaginationProps {
  currentPage: number
  totalPages: number
  postType: string
}

function buildUrl(page: number, postType: string) {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', page.toString())
  if (postType) params.set('postType', postType)
  const queryString = params.toString()
  return queryString ? `/history?${queryString}` : '/history'
}

export function HistoryPagination({ currentPage, totalPages, postType }: HistoryPaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1, postType)}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
        >
          ← 前へ
        </Link>
      ) : (
        <span className="px-4 py-2 bg-white/5 text-white rounded-lg opacity-50 cursor-not-allowed">
          ← 前へ
        </span>
      )}
      <span className="text-slate-400 text-sm">
        {currentPage} / {totalPages} ページ
      </span>
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1, postType)}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
        >
          次へ →
        </Link>
      ) : (
        <span className="px-4 py-2 bg-white/5 text-white rounded-lg opacity-50 cursor-not-allowed">
          次へ →
        </span>
      )}
    </div>
  )
}
