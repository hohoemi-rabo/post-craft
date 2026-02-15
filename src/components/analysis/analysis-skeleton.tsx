export function AnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse"
        >
          {/* バッジ行 */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-24 bg-white/10 rounded-full" />
            <div className="h-5 w-14 bg-white/10 rounded-full" />
          </div>
          {/* タイトル */}
          <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
          {/* メタ情報 */}
          <div className="flex gap-3">
            <div className="h-4 w-12 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
