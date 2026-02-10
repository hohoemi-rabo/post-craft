'use client'

import { useState, useCallback, useRef } from 'react'
import type { Placeholder } from '@/types/post-type'

const MAX_PLACEHOLDERS = 10

interface PlaceholderEditorProps {
  placeholders: Placeholder[]
  onChange: (placeholders: Placeholder[]) => void
}

export function PlaceholderEditor({ placeholders, onChange }: PlaceholderEditorProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)

  const addPlaceholder = useCallback(() => {
    if (placeholders.length >= MAX_PLACEHOLDERS) return
    const newPlaceholder: Placeholder = {
      name: `var_${placeholders.length + 1}`,
      label: '',
      description: '',
      required: true,
      inputType: 'text',
    }
    onChange([...placeholders, newPlaceholder])
  }, [placeholders, onChange])

  const updatePlaceholder = useCallback((index: number, field: keyof Placeholder, value: string | boolean) => {
    const updated = [...placeholders]
    if (field === 'name' && typeof value === 'string') {
      // Sanitize variable name: only a-z, 0-9, underscore
      value = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    }
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }, [placeholders, onChange])

  const removePlaceholder = useCallback((index: number) => {
    onChange(placeholders.filter((_, i) => i !== index))
  }, [placeholders, onChange])

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback((index: number) => {
    if (dragItem.current === null || dragItem.current === index) {
      setDragOverIndex(null)
      return
    }
    const reordered = [...placeholders]
    const [removed] = reordered.splice(dragItem.current, 1)
    reordered.splice(index, 0, removed)
    onChange(reordered)
    dragItem.current = null
    setDragOverIndex(null)
  }, [placeholders, onChange])

  const handleDragEnd = useCallback(() => {
    dragItem.current = null
    setDragOverIndex(null)
  }, [])

  // Check for duplicate names
  const getDuplicateNames = useCallback(() => {
    const names = placeholders.map(p => p.name)
    return names.filter((name, i) => name && names.indexOf(name) !== i)
  }, [placeholders])

  const duplicateNames = getDuplicateNames()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">プレースホルダー変数</h3>
        <button
          type="button"
          onClick={addPlaceholder}
          disabled={placeholders.length >= MAX_PLACEHOLDERS}
          className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-slate-700 disabled:text-slate-400"
        >
          + 変数追加 ({placeholders.length}/{MAX_PLACEHOLDERS})
        </button>
      </div>

      {duplicateNames.length > 0 && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          変数名が重複しています: {duplicateNames.join(', ')}
        </div>
      )}

      {placeholders.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          変数がありません。「+ 変数追加」で追加してください。
        </p>
      ) : (
        <div className="space-y-2">
          {placeholders.map((ph, index) => {
            const isDuplicate = duplicateNames.includes(ph.name)
            return (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`p-3 bg-white/5 border rounded-xl transition-all ${
                  dragOverIndex === index ? 'border-blue-500' : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 pt-2 select-none">
                    <span className="text-sm">≡</span>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Variable name */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">変数名</label>
                      <input
                        type="text"
                        value={ph.name}
                        onChange={(e) => updatePlaceholder(index, 'name', e.target.value)}
                        placeholder="variable_name"
                        className={`w-full px-3 py-2 text-sm bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                          isDuplicate ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    {/* Label */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">表示ラベル</label>
                      <input
                        type="text"
                        value={ph.label}
                        onChange={(e) => updatePlaceholder(index, 'label', e.target.value)}
                        placeholder="ラベル名"
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Description (hint) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">説明（ヒント）</label>
                      <input
                        type="text"
                        value={ph.description || ''}
                        onChange={(e) => updatePlaceholder(index, 'description', e.target.value)}
                        placeholder="入力のヒントを記述（任意）"
                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Input type */}
                    <select
                      value={ph.inputType}
                      onChange={(e) => updatePlaceholder(index, 'inputType', e.target.value)}
                      className="px-2 py-1.5 text-xs bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="text">text</option>
                      <option value="textarea">textarea</option>
                    </select>

                    {/* Required toggle */}
                    <button
                      type="button"
                      onClick={() => updatePlaceholder(index, 'required', !ph.required)}
                      className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                        ph.required
                          ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-700 text-slate-400 border border-white/10'
                      }`}
                      title={ph.required ? '必須' : '任意'}
                    >
                      {ph.required ? '必須' : '任意'}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removePlaceholder(index)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
