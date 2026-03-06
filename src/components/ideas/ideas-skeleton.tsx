export function IdeasSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white/5 border border-white/10 rounded-2xl animate-pulse"
        >
          <div className="h-5 bg-white/10 rounded w-1/3 mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-5/6" />
            <div className="h-3 bg-white/10 rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}
