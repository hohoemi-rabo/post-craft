export function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-32 bg-white/5 rounded-xl animate-pulse"
        />
      ))}
    </div>
  )
}
