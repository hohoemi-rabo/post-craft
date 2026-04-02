export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl" />
            <div>
              <div className="h-4 bg-white/10 rounded w-16 mb-2" />
              <div className="h-8 bg-white/10 rounded w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent posts skeleton */}
      <div>
        <div className="h-6 bg-white/10 rounded w-28 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="h-5 bg-white/10 rounded w-48 mb-2" />
              <div className="h-4 bg-white/5 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
