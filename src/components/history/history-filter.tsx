'use client'

import { useRouter, usePathname } from 'next/navigation'

interface FilterPostType {
  id: string
  name: string
  slug: string
  icon: string
}

interface HistoryFilterProps {
  currentFilter: string
  postTypes: FilterPostType[]
}

export function HistoryFilter({ currentFilter, postTypes }: HistoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams()
    if (value) {
      params.set('postType', value)
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-400">フィルター:</label>
      <select
        value={currentFilter}
        onChange={(e) => handleFilterChange(e.target.value)}
        className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" className="bg-slate-800 text-white">すべて</option>
        {postTypes.map((type) => (
          <option key={type.id} value={type.slug} className="bg-slate-800 text-white">
            {type.icon} {type.name}
          </option>
        ))}
      </select>
    </div>
  )
}
