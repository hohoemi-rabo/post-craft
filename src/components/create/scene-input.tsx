'use client'

import { useState } from 'react'

interface SceneInputProps {
  value: string
  onChange: (value: string) => void
  suggestions?: string[]
  onGenerateSuggestions?: () => void
  isLoadingSuggestions?: boolean
  disabled?: boolean
}

export function SceneInput({
  value,
  onChange,
  suggestions,
  onGenerateSuggestions,
  isLoadingSuggestions,
  disabled,
}: SceneInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        シーン説明
      </label>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="画像に描画するシーンを説明してください（例：スマートフォンを操作しながら笑顔で説明している）"
          rows={3}
          maxLength={200}
          className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        <div className="absolute bottom-3 right-3 text-xs text-slate-500">
          {value.length}/200
        </div>
      </div>

      {onGenerateSuggestions && (
        <button
          type="button"
          onClick={() => {
            onGenerateSuggestions()
            setShowSuggestions(true)
          }}
          disabled={disabled || isLoadingSuggestions}
          className={`px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-lg transition-colors flex items-center gap-2 ${
            disabled || isLoadingSuggestions ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoadingSuggestions ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              ✨ AIでシーンを提案
            </>
          )}
        </button>
      )}

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">提案されたシーン:</p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left text-sm text-slate-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
