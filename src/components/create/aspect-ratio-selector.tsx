'use client'

import { ASPECT_RATIOS, type AspectRatio } from '@/lib/image-styles'

interface AspectRatioSelectorProps {
  value: AspectRatio
  onChange: (ratio: AspectRatio) => void
  disabled?: boolean
}

export function AspectRatioSelector({ value, onChange, disabled }: AspectRatioSelectorProps) {
  const ratios = Object.entries(ASPECT_RATIOS) as [AspectRatio, typeof ASPECT_RATIOS['1:1']][]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        アスペクト比
      </label>
      <div className="flex gap-3">
        {ratios.map(([ratio, config]) => (
          <button
            key={ratio}
            type="button"
            onClick={() => onChange(ratio)}
            disabled={disabled}
            className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
              value === ratio
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex justify-center mb-2">
              {/* Visual aspect ratio preview */}
              <div
                className={`bg-white/20 rounded ${
                  ratio === '1:1' ? 'w-10 h-10' :
                  ratio === '4:5' ? 'w-8 h-10' :
                  ratio === '9:16' ? 'w-6 h-10' :
                  'w-10 h-6' // 16:9
                }`}
              />
            </div>
            <div className="font-medium text-white text-sm">{config.name}</div>
            <div className="text-xs text-slate-400">{config.description}</div>
            <div className="text-xs text-slate-500 mt-1">
              {config.width} x {config.height}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
