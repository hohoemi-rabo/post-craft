export function ReportsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="h-4 bg-white/10 rounded w-16 mb-3" />
            <div className="h-8 bg-white/10 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div className="h-4 bg-white/10 rounded w-24 mb-4" />
          <div className="h-48 bg-white/5 rounded" />
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div className="h-4 bg-white/10 rounded w-24 mb-4" />
          <div className="h-48 bg-white/5 rounded" />
        </div>
      </div>

      {/* Frequency */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="h-4 bg-white/10 rounded w-24 mb-4" />
        <div className="h-64 bg-white/5 rounded" />
      </div>

      {/* Hashtag */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="h-4 bg-white/10 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-5 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
