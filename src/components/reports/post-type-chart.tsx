'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS, CHART_THEME } from '@/lib/chart-config'
import type { TypeBreakdown } from '@/types/reports'

interface PostTypeChartProps {
  data: TypeBreakdown[]
}

export function PostTypeChart({ data }: PostTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-sm font-bold text-white mb-4">投稿タイプ別</h3>
        <p className="text-sm text-slate-500 text-center py-8">データがありません</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      <h3 className="text-sm font-bold text-white mb-4">投稿タイプ別</h3>

      <div className="flex flex-col items-center gap-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="count"
              nameKey="typeName"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: CHART_THEME.tooltipBg,
                border: `1px solid ${CHART_THEME.tooltipBorder}`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value, name) => [`${value}件`, name]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="w-full space-y-2">
          {data.map((item, i) => (
            <div key={item.typeId || 'other'} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-slate-300">
                {item.typeIcon} {item.typeName}
              </span>
              <span className="ml-auto text-slate-400">
                {item.count}件 ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
