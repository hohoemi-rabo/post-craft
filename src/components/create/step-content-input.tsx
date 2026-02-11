'use client'

import { useState } from 'react'
import { POST_TYPES } from '@/lib/post-types'
import type { PostType } from '@/types/post'
import type { Placeholder } from '@/types/post-type'
import { RelatedPostSelector, type RelatedPostData } from './related-post-selector'

interface StepContentInputProps {
  postType: PostType | null
  postTypeName?: string | null
  initialText: string
  initialUrl: string
  initialRelatedPostId?: string | null
  inputMode?: 'fields' | 'memo'
  placeholders?: Placeholder[]
  onSubmit: (text: string, url: string, relatedPost?: RelatedPostData | null) => void
  onBack: () => void
}

const PLACEHOLDERS: Record<PostType, string> = {
  solution: `例：LINEの通知が来ないって質問されて、設定から通知をONにしたら解決した。結構この質問多いんだよね。

スマホの困りごとや質問、その解決方法をメモ書きで入力してください。`,
  promotion: `例：AIを使った業務効率化のサポートを始めました。ChatGPTやGeminiを使って、日々の仕事を楽にする方法をお伝えしています。

サービスや商品の宣伝内容をメモ書きで入力してください。`,
  tips: `例：ChatGPTに「もっと詳しく」って言うと、回答を深掘りしてくれる。知ってた？

AIの便利な使い方やTipsをメモ書きで入力してください。`,
  showcase: `例：地元の工務店さんのホームページをリニューアルしました。スマホでも見やすくなって、お問い合わせが2倍に増えたそうです。

制作実績や成果事例をメモ書きで入力してください。`,
  useful: `例：スマホのバッテリーを長持ちさせるには、画面の明るさを自動調整にするといいよ。設定から変えられる。

便利な情報やお役立ちTipsをメモ書きで入力してください。`,
  howto: `例：Googleレンズを使うと、写真を撮るだけで物の名前や値段がわかる。使い方は、Googleアプリを開いて、検索窓のカメラマークをタップ、調べたい物にかざしてシャッターボタンを押すだけ。

便利な機能やアプリの使い方を、手順も含めて入力してください。`,
  image_read: `例：無料勉強会に来てほしいという内容でお願いします。

画像をアップロードした後、投稿の方向性をメモ書きで入力してください。`,
}

export function StepContentInput({
  postType,
  postTypeName,
  initialText,
  initialUrl,
  initialRelatedPostId,
  inputMode = 'fields',
  placeholders = [],
  onSubmit,
  onBack,
}: StepContentInputProps) {
  const [text, setText] = useState(initialText)
  const [url, setUrl] = useState(initialUrl)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fields mode state
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    // Parse initial text to populate field values if possible
    const values: Record<string, string> = {}
    if (initialText && placeholders.length > 0) {
      // Try to parse "label: value" format from initial text
      const lines = initialText.split('\n')
      for (const line of lines) {
        const colonIdx = line.indexOf(': ')
        if (colonIdx > 0) {
          const label = line.slice(0, colonIdx)
          const value = line.slice(colonIdx + 2)
          const ph = placeholders.find((p) => p.label === label)
          if (ph) {
            values[ph.name] = value
          }
        }
      }
    }
    return values
  })

  // 関連投稿参照の状態
  const [relatedEnabled, setRelatedEnabled] = useState(!!initialRelatedPostId)
  const [relatedPost, setRelatedPost] = useState<RelatedPostData | null>(null)
  const [selectedRelatedPostId, setSelectedRelatedPostId] = useState<string | null>(initialRelatedPostId || null)

  const typeConfig = postType ? POST_TYPES[postType] : null
  const minLength = 20

  // Determine if we should show fields mode
  const useFieldsMode = inputMode === 'fields' && placeholders.length > 0 && !postType

  // Validation
  const isFieldsValid = useFieldsMode
    ? placeholders.filter((p) => p.required).every((p) => (fieldValues[p.name] || '').trim().length > 0)
    : false
  const isTextValid = text.length >= minLength
  const isValid = useFieldsMode ? isFieldsValid : isTextValid

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleExtractUrl = async () => {
    if (!url) return

    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('記事の抽出に失敗しました')
      }

      const data = await response.json()
      setText(data.content || data.title || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '抽出に失敗しました')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleRelatedSelect = (post: RelatedPostData) => {
    setRelatedPost(post)
    setSelectedRelatedPostId(post.id)
  }

  const handleRelatedDeselect = () => {
    setRelatedPost(null)
    setSelectedRelatedPostId(null)
  }

  const handleSubmit = () => {
    if (!isValid) return

    if (useFieldsMode) {
      // Convert field values to inputText format
      const inputText = placeholders
        .map((p) => `${p.label}: ${fieldValues[p.name] || ''}`)
        .filter((line) => !line.endsWith(': '))
        .join('\n')
      onSubmit(inputText, url, relatedEnabled ? relatedPost : null)
    } else {
      onSubmit(text, url, relatedEnabled ? relatedPost : null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {typeConfig && <span className="text-2xl">{typeConfig.icon}</span>}
          <h2 className="text-xl font-bold text-white">
            {typeConfig?.name || postTypeName || '投稿'}
          </h2>
        </div>
        <p className="text-slate-400 text-sm">
          投稿したい内容を{useFieldsMode ? '各項目に' : 'メモ書きで'}入力してください
        </p>
      </div>

      {useFieldsMode ? (
        /* Fields mode: dynamic form fields based on placeholders */
        <div className="space-y-4">
          {placeholders.map((ph) => (
            <div key={ph.name} className="space-y-1">
              <label className="block text-sm font-medium text-slate-300">
                {ph.label}
                {ph.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {ph.description && (
                <p className="text-xs text-slate-500">{ph.description}</p>
              )}
              {ph.inputType === 'textarea' ? (
                <textarea
                  value={fieldValues[ph.name] || ''}
                  onChange={(e) => handleFieldChange(ph.name, e.target.value)}
                  placeholder={ph.description || ph.label}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={fieldValues[ph.name] || ''}
                  onChange={(e) => handleFieldChange(ph.name, e.target.value)}
                  placeholder={ph.description || ph.label}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Memo mode: single textarea (existing behavior) */
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              メモ書き
            </label>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={postType ? PLACEHOLDERS[postType] : '投稿したい内容をメモ書きで入力してください。'}
                rows={8}
                maxLength={10000}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                {text.length} / 10000
              </div>
            </div>
            {text.length > 0 && text.length < minLength && (
              <p className="text-xs text-yellow-500">
                {minLength - text.length}文字以上入力してください
              </p>
            )}
          </div>

          {/* URL input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              または記事URLから抽出
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleExtractUrl}
                disabled={!url || isExtracting}
                className={`px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors whitespace-nowrap ${
                  !url || isExtracting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isExtracting ? '抽出中...' : '抽出'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {url && text.length < minLength && !isExtracting && !error && (
              <p className="text-xs text-blue-400">
                URLを入力したら「抽出」ボタンを押してください
              </p>
            )}
            <p className="text-xs text-slate-500">
              ※ ログインが必要なページや一部サイトでは抽出できない場合があります。その場合は記事をコピーして上のメモ欄に貼り付けてください。
            </p>
          </div>
        </>
      )}

      {/* Related post selector (not for image_read) */}
      {(!postType || postType !== 'image_read') && (
        <RelatedPostSelector
          enabled={relatedEnabled}
          onToggle={setRelatedEnabled}
          selectedPostId={selectedRelatedPostId}
          onSelect={handleRelatedSelect}
          onDeselect={handleRelatedDeselect}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors ${
            !isValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          次へ →
        </button>
      </div>
    </div>
  )
}
