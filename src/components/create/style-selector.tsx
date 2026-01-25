'use client'

import { IMAGE_STYLES, type ImageStyle } from '@/lib/image-styles'

interface StyleSelectorProps {
  value: ImageStyle
  onChange: (style: ImageStyle) => void
  disabled?: boolean
}

export function StyleSelector({ value, onChange, disabled }: StyleSelectorProps) {
  const styles = Object.values(IMAGE_STYLES)

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        画像スタイル
      </label>
      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              value === style.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-2xl mb-2">{style.icon}</div>
            <div className="font-medium text-white text-sm">{style.name}</div>
            <div className="text-xs text-slate-400 mt-1">{style.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
