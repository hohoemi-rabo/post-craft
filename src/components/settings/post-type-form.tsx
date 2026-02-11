'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PostTypeDB, PostTypeFormData, Placeholder } from '@/types/post-type'
import { usePostTypes } from '@/hooks/usePostTypes'
import { useToast } from '@/components/ui/toast'
import { EmojiPicker } from '@/components/settings/emoji-picker'
import { PostTypePreviewModal } from '@/components/settings/post-type-preview-modal'

interface PostTypeFormProps {
  mode: 'new' | 'edit'
  initialData?: PostTypeDB
}

interface FormErrors {
  name?: string
  description?: string
  userMemo?: string
  minLength?: string
  maxLength?: string
}

interface GeneratedData {
  typePrompt: string
  templateStructure: string
  placeholders: Placeholder[]
  samplePost: string
}

export function PostTypeForm({ mode, initialData }: PostTypeFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { createPostType, updatePostType } = usePostTypes()

  // Basic info state
  const [icon, setIcon] = useState(initialData?.icon || '📝')
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [minLength, setMinLength] = useState(initialData?.minLength ?? 200)
  const [maxLength, setMaxLength] = useState(initialData?.maxLength ?? 400)
  const [inputMode, setInputMode] = useState<'fields' | 'memo'>(initialData?.inputMode ?? 'fields')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

  // Memo & generation state
  const [userMemo, setUserMemo] = useState(initialData?.userMemo || '')
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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

    if (minLength < 1) {
      newErrors.minLength = '1以上の値を入力してください'
    }

    if (maxLength < minLength) {
      newErrors.maxLength = '最小文字数以上の値を入力してください'
    }

    if (!userMemo.trim()) {
      newErrors.userMemo = 'メモ書きは必須です'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = async () => {
    if (!validate()) return

    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate/post-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          minLength,
          maxLength,
          userMemo: userMemo.trim(),
          inputMode,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate')
      }

      const data = await res.json()
      setGeneratedData(data)
      setShowPreview(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成に失敗しました'
      showToast(message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedData) return

    setIsSaving(true)
    try {
      const formData: PostTypeFormData = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        templateStructure: generatedData.templateStructure,
        placeholders: generatedData.placeholders,
        minLength,
        maxLength,
        isActive,
        inputMode,
        userMemo: userMemo.trim(),
        typePrompt: generatedData.typePrompt,
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

  // Direct save without AI generation (for editing existing types that already have data)
  const handleDirectSave = async () => {
    if (!validate()) return

    // For existing types, allow saving basic info + memo without re-generation
    if (mode !== 'edit' || !initialData) return

    setIsSaving(true)
    try {
      const formData: PostTypeFormData = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        templateStructure: initialData.templateStructure,
        placeholders: initialData.placeholders,
        minLength,
        maxLength,
        isActive,
        inputMode,
        userMemo: userMemo.trim() || undefined,
        typePrompt: initialData.typePrompt || undefined,
      }

      await updatePostType(initialData.id, formData)
      showToast('投稿タイプを更新しました', 'success')
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

        {/* Input Mode */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">入力方式</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="inputMode"
                value="fields"
                checked={inputMode === 'fields'}
                onChange={() => setInputMode('fields')}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-white/10"
              />
              <span className="text-sm text-white">項目別入力</span>
              <span className="text-xs text-slate-500">（フォーム形式）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="inputMode"
                value="memo"
                checked={inputMode === 'memo'}
                onChange={() => setInputMode('memo')}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-white/10"
              />
              <span className="text-sm text-white">メモ書き入力</span>
              <span className="text-xs text-slate-500">（テキストエリア）</span>
            </label>
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

      {/* Section 2: Current settings (edit mode only) */}
      {mode === 'edit' && initialData?.templateStructure && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white">現在の設定</h2>
          <p className="text-sm text-slate-400">
            現在保存されているテンプレート・入力項目・プロンプトです。変更する場合はメモ書きを編集して「AIで生成してプレビュー」を実行してください。
          </p>

          {/* Type Prompt */}
          {initialData.typePrompt && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">タイプ別プロンプト</h3>
              <div className="p-4 bg-slate-800 rounded-xl text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {initialData.typePrompt}
              </div>
            </div>
          )}

          {/* Template Structure */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">テンプレート構造</h3>
            <div className="p-4 bg-slate-800 rounded-xl text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {initialData.templateStructure}
            </div>
          </div>

          {/* Placeholders */}
          {initialData.inputMode === 'fields' && initialData.placeholders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">入力項目（{initialData.placeholders.length}個）</h3>
              <div className="space-y-2">
                {initialData.placeholders.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-800 rounded-xl text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-mono">{`{${p.name}}`}</span>
                      <span className="text-white">{p.label}</span>
                      {p.required && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                          必須
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {p.inputType === 'textarea' ? 'テキストエリア' : 'テキスト'}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-slate-400 text-xs mt-1">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 3: Memo input */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">メモ書き</h2>
        <p className="text-sm text-slate-400">
          どんな投稿にしたいかをメモ書きで入力してください。AIがテンプレートやプロンプトを自動生成します。
        </p>
        <textarea
          value={userMemo}
          onChange={(e) => setUserMemo(e.target.value)}
          placeholder="例: よくある質問と解決方法を3ステップで紹介する投稿を作りたい。初心者でもわかるように具体的なボタン名や操作手順を含めたい。"
          rows={5}
          className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-y ${
            errors.userMemo ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'
          }`}
        />
        {errors.userMemo && <p className="text-xs text-red-400 mt-1">{errors.userMemo}</p>}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !name.trim() || !userMemo.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              生成中...
            </>
          ) : (
            'AIで生成してプレビュー'
          )}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/settings/post-types')}
          className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          キャンセル
        </button>
        {mode === 'edit' && initialData?.templateStructure && (
          <button
            type="button"
            onClick={handleDirectSave}
            disabled={isSaving}
            className="px-6 py-3 border border-white/10 text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '基本情報のみ保存'}
          </button>
        )}
      </div>

      {/* Preview Modal */}
      {generatedData && (
        <PostTypePreviewModal
          isOpen={showPreview}
          data={generatedData}
          inputMode={inputMode}
          isSaving={isSaving}
          onClose={() => setShowPreview(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
