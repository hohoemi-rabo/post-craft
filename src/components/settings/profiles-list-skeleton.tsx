export function ProfilesListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-2xl" />
      ))}
    </div>
  )
}
