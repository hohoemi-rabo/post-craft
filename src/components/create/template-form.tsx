'use client'

import type { PostType, TemplateData } from '@/types/post'
import { getFieldsForType, FIELD_LABELS } from '@/lib/templates'

interface TemplateFormProps {
  type: PostType
  data: TemplateData
  onChange: (data: TemplateData) => void
  errors?: string[]
}

export function TemplateForm({ type, data, onChange, errors = [] }: TemplateFormProps) {
  const fields = getFieldsForType(type)

  const handleChange = (key: string, value: string) => {
    onChange({ ...data, [key]: value })
  }

  const hasError = (key: string) => {
    const label = FIELD_LABELS[key] || key
    return errors.some((e) => e.includes(label))
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-white">入力フォーム</h3>

      {/* Required fields */}
      <div className="space-y-4">
        {fields.required.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              {field.label}
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea
              id={field.key}
              value={data[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={`${field.label}を入力`}
              rows={2}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                hasError(field.key) ? 'border-red-500' : 'border-white/10'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Optional fields */}
      {fields.optional.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <p className="text-sm text-slate-400">任意項目</p>
          {fields.optional.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                {field.label}
              </label>
              <textarea
                id={field.key}
                value={data[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={`${field.label}を入力（任意）`}
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <ul className="text-sm text-red-400 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
