'use client'

import { useRef, useMemo } from 'react'
import type { Placeholder } from '@/types/post-type'

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  placeholders: Placeholder[]
}

export function TemplateEditor({ value, onChange, placeholders }: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Insert variable at cursor position
  const insertVariable = (varName: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const tag = `{${varName}}`
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + tag + value.substring(end)
    onChange(newValue)

    // Restore cursor position after the inserted tag
    requestAnimationFrame(() => {
      textarea.focus()
      const newPos = start + tag.length
      textarea.setSelectionRange(newPos, newPos)
    })
  }

  // Find undefined variables in template
  const undefinedVars = useMemo(() => {
    const templateVars = value.match(/\{([a-z_][a-z0-9_]*)\}/g) || []
    const definedNames = new Set(placeholders.map(p => p.name))
    const undefined: string[] = []
    for (const match of templateVars) {
      const name = match.slice(1, -1)
      if (!definedNames.has(name) && !undefined.includes(name)) {
        undefined.push(name)
      }
    }
    return undefined
  }, [value, placeholders])

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">テンプレート構造</h3>

      {/* Available variables */}
      {placeholders.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">クリックでカーソル位置に挿入:</p>
          <div className="flex flex-wrap gap-1.5">
            {placeholders.map((ph) => (
              <button
                key={ph.name}
                type="button"
                onClick={() => insertVariable(ph.name)}
                className="px-2.5 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-600/30 transition-colors"
              >
                {`{${ph.name}}`}
                {ph.label && <span className="text-blue-300/60 ml-1">{ph.label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={2000}
        rows={12}
        placeholder="テンプレート構造を入力してください。&#10;変数は {変数名} の形式で埋め込みます。"
        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[200px]"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>変数は {'{変数名}'} の形式で埋め込みます</span>
        <span>{value.length} / 2000</span>
      </div>

      {/* Undefined variable warnings */}
      {undefinedVars.length > 0 && (
        <div className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          ⚠️ 未定義の変数: {undefinedVars.map(v => `{${v}}`).join(', ')}
          <span className="block text-xs text-yellow-400/70 mt-1">
            プレースホルダー変数に定義を追加してください
          </span>
        </div>
      )}
    </div>
  )
}
