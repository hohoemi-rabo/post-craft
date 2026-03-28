'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { CHART_THEME } from '@/lib/chart-config'
import type { FrequencyData } from '@/types/reports'

interface FrequencyChartProps {
  data: FrequencyData
}

type Tab = 'weekly' | 'monthly'

export function FrequencyChart({ data }: FrequencyChartProps) {
  const [tab, setTab] = useState<Tab>('weekly')

  const chartData = tab === 'weekly'
    ? data.weekly.map(w => ({ name: w.weekLabel, count: w.count }))
    : data.monthly.map(m => ({ name: m.monthLabel, count: m.count }))

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">📅 投稿頻度</h3>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setTab('weekly')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              tab === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            週別
          </button>
          <button
            onClick={() => setTab('monthly')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              tab === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            月別
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: Math.max(chartData.length * 60, 300) }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: CHART_THEME.textColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_THEME.gridColor }}
                />
                <YAxis
                  tick={{ fill: CHART_THEME.textColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_THEME.gridColor }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_THEME.tooltipBg,
                    border: `1px solid ${CHART_THEME.tooltipBorder}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value}件`, '投稿数']}
                />
                <Bar dataKey="count" fill={CHART_THEME.barColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
