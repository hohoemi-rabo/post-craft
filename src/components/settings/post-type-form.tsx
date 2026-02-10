'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { PostTypeDB, PostTypeFormData, Placeholder } from '@/types/post-type'
import { usePostTypes } from '@/hooks/usePostTypes'
import { useToast } from '@/components/ui/toast'
import { EmojiPicker } from '@/components/settings/emoji-picker'
import { PlaceholderEditor } from '@/components/settings/placeholder-editor'
import { TemplateEditor } from '@/components/settings/template-editor'

interface PostTypeFormProps {
  mode: 'new' | 'edit'
  initialData?: PostTypeDB
}

interface FormErrors {
  name?: string
  description?: string
  templateStructure?: string
  minLength?: string
  maxLength?: string
  placeholders?: string
}

export function PostTypeForm({ mode, initialData }: PostTypeFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { createPostType, updatePostType } = usePostTypes()

  // Form state
  const [icon, setIcon] = useState(initialData?.icon || '📝')
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [minLength, setMinLength] = useState(initialData?.minLength ?? 200)
  const [maxLength, setMaxLength] = useState(initialData?.maxLength ?? 400)
  const [placeholders, setPlaceholders] = useState<Placeholder[]>(initialData?.placeholders || [])
  const [templateStructure, setTemplateStructure] = useState(initialData?.templateStructure || '')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Preview: replace {varName} with label or sample text
  const previewText = useMemo(() => {
    let text = templateStructure
    for (const ph of placeholders) {
      const sample = ph.label || ph.name
      text = text.replaceAll(`{${ph.name}}`, sample)
    }
    return text
  }, [templateStructure, placeholders])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'タイプ名は必須です'
    } else if (name.length > 50) {
      newErrors.name = '50文字以内で入力してください'
    }

    if (description && description.length > 200) {
      newErrors.description = '200文字以内で入力してください'
    }

    if (!templateStructure.trim()) {
      newErrors.templateStructure = 'テンプレート構造は必須です'
    } else if (templateStructure.length > 2000) {
      newErrors.templateStructure = '2000文字以内で入力してください'
    }

    if (minLength < 1) {
      newErrors.minLength = '1以上の値を入力してください'
    }

    if (maxLength < minLength) {
      newErrors.maxLength = '最小文字数以上の値を入力してください'
    }

    // Check for duplicate placeholder names
    const names = placeholders.map(p => p.name)
    const hasDuplicates = names.some((n, i) => n && names.indexOf(n) !== i)
    if (hasDuplicates) {
      newErrors.placeholders = '変数名が重複しています'
    }

    // Check placeholder names are not empty
    const hasEmptyName = placeholders.some(p => !p.name.trim())
    if (hasEmptyName) {
      newErrors.placeholders = '変数名が空の項目があります'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSaving(true)
    try {
      const formData: PostTypeFormData = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        templateStructure: templateStructure.trim(),
        placeholders,
        minLength,
        maxLength,
        isActive,
      }

      if (mode === 'new') {
        await createPostType(formData)
        showToast('投稿タイプを作成しました', 'success')
      } else if (initialData) {
        await updatePostType(initialData.id, formData)
        showToast('投稿タイプを更新しました', 'success')
      }
      router.push('/settings/post-types')
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      showToast(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Basic Info */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">基本情報</h2>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">アイコン</label>
            <EmojiPicker value={icon} onChange={setIcon} />
          </div>

          {/* Name */}
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-2">タイプ名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="例: 解決タイプ"
              className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'
              }`}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            <p className="text-xs text-slate-500 mt-1 text-right">{name.length}/50</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">説明文</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="このタイプの用途や特徴を記述"
            className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
              errors.description ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'
            }`}
          />
          {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
          <p className="text-xs text-slate-500 mt-1 text-right">{description.length}/200</p>
        </div>

        {/* Character range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">文字数目安（最小）</label>
            <input
              type="number"
              value={minLength}
              onChange={(e) => setMinLength(parseInt(e.target.value) || 0)}
              min={1}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white focus:outline-none focus:ring-2 ${
                errors.minLength ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'
              }`}
            />
            {errors.minLength && <p className="text-xs text-red-400 mt-1">{errors.minLength}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">文字数目安（最大）</label>
            <input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(parseInt(e.target.value) || 0)}
              min={1}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white focus:outline-none focus:ring-2 ${
                errors.maxLength ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'
              }`}
            />
            {errors.maxLength && <p className="text-xs text-red-400 mt-1">{errors.maxLength}</p>}
          </div>
        </div>

        {/* Active toggle (edit mode only) */}
        {mode === 'edit' && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-slate-400">有効/無効</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isActive ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isActive ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Placeholders */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        {errors.placeholders && (
          <p className="text-xs text-red-400 mb-3">{errors.placeholders}</p>
        )}
        <PlaceholderEditor placeholders={placeholders} onChange={setPlaceholders} />
      </div>

      {/* Section 3: Template */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        {errors.templateStructure && (
          <p className="text-xs text-red-400 mb-3">{errors.templateStructure}</p>
        )}
        <TemplateEditor
          value={templateStructure}
          onChange={setTemplateStructure}
          placeholders={placeholders}
        />
      </div>

      {/* Section 4: Preview */}
      {showPreview && templateStructure && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-3">プレビュー</h3>
          <div className="p-4 bg-slate-800 rounded-xl text-sm text-slate-300 whitespace-pre-wrap">
            {previewText}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/settings/post-types')}
          className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          キャンセル
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-5 py-3 border border-white/10 text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            {showPreview ? 'プレビュー非表示' : 'プレビュー'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
