'use client'

import { useState, useRef, useEffect } from 'react'

const EMOJI_CATEGORIES = [
  { name: '一般', emojis: ['📝', '📄', '📋', '📌', '📍'] },
  { name: 'ツール', emojis: ['🔧', '🔨', '🛠️', '⚙️', '🔩'] },
  { name: '情報', emojis: ['💡', '❓', '❗', 'ℹ️', '📢'] },
  { name: '成果', emojis: ['✨', '⭐', '🌟', '💫', '🏆'] },
  { name: '教育', emojis: ['📚', '📖', '📕', '📗', '📘'] },
  { name: 'テクノロジー', emojis: ['💻', '🖥️', '📱', '🤖', '🔌'] },
  { name: 'コミュニケーション', emojis: ['💬', '💭', '🗣️', '📣', '📩'] },
  { name: '画像', emojis: ['🖼️', '📷', '📸', '🎨', '🖌️'] },
  { name: '矢印', emojis: ['➡️', '⬆️', '⬇️', '↗️', '↘️'] },
  { name: 'その他', emojis: ['✅', '❌', '⚠️', '🔔', '🎯'] },
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  const handleSelect = (emoji: string) => {
    onChange(emoji)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 text-3xl bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
      >
        {value || '📝'}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[280px] bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 p-2 border-b border-white/10">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(i)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  activeCategory === i
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="grid grid-cols-5 gap-1 p-2">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className={`flex items-center justify-center w-12 h-12 text-2xl rounded-lg transition-colors ${
                  value === emoji
                    ? 'bg-blue-600/30 ring-2 ring-blue-500'
                    : 'hover:bg-white/10'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
