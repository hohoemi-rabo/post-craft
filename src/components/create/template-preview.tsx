'use client'

import type { PostType, TemplateData } from '@/types/post'
import { applyTemplate } from '@/lib/templates'
import { POST_TYPES } from '@/lib/post-types'

interface TemplatePreviewProps {
  type: PostType
  data: TemplateData
}

export function TemplatePreview({ type, data }: TemplatePreviewProps) {
  const config = POST_TYPES[type]
  const preview = applyTemplate(type, data)
  const charCount = preview.length

  const isWithinRange = charCount >= config.charRange.min && charCount <= config.charRange.max
  const isUnderMin = charCount < config.charRange.min
  const isOverMax = charCount > config.charRange.max

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">プレビュー</h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              isWithinRange
                ? 'text-green-400'
                : isUnderMin
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {charCount}文字
          </span>
          <span className="text-xs text-slate-500">
            (推奨: {config.charRange.min}〜{config.charRange.max})
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-800/50 rounded-xl border border-white/10">
        <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
          {preview || '（入力内容がここに表示されます）'}
        </pre>
      </div>

      {isOverMax && (
        <p className="text-sm text-red-400">
          文字数が上限を超えています。内容を短くしてください。
        </p>
      )}
    </div>
  )
}
