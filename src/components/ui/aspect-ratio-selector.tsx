'use client'

import { ASPECT_RATIOS, type AspectRatio } from '@/lib/image-styles'

interface AspectRatioSelectorProps {
  value: AspectRatio
  onChange: (ratio: AspectRatio) => void
  disabled?: boolean
  /** コンパクト表示（モーダル・アップローダー用） */
  compact?: boolean
  /** ラベルを非表示 */
  hideLabel?: boolean
}

export function AspectRatioSelector({
  value,
  onChange,
  disabled,
  compact = false,
  hideLabel = false,
}: AspectRatioSelectorProps) {
  const ratios = Object.entries(ASPECT_RATIOS) as [AspectRatio, typeof ASPECT_RATIOS['1:1']][]

  if (compact) {
    return (
      <div className="space-y-2">
        {!hideLabel && (
          <label className="block text-xs font-medium text-slate-400">
            アスペクト比
          </label>
        )}
        <div className="grid grid-cols-4 gap-2">
          {ratios.map(([ratio, config]) => (
            <button
              key={ratio}
              type="button"
              onClick={() => onChange(ratio)}
              disabled={disabled}
              className={`p-2 rounded-lg border text-center transition-all ${
                value === ratio
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              } disabled:opacity-50`}
            >
              <div className="text-xs font-medium text-white">{config.name}</div>
              <div className="text-[10px] text-slate-500">{ratio}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!hideLabel && (
        <label className="block text-sm font-medium text-slate-300">
          アスペクト比
        </label>
      )}
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
