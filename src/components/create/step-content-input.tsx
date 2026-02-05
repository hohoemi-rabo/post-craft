'use client'

import { useState } from 'react'
import { POST_TYPES } from '@/lib/post-types'
import type { PostType } from '@/types/post'

interface StepContentInputProps {
  postType: PostType
  initialText: string
  initialUrl: string
  onSubmit: (text: string, url: string) => void
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
  initialText,
  initialUrl,
  onSubmit,
  onBack,
}: StepContentInputProps) {
  const [text, setText] = useState(initialText)
  const [url, setUrl] = useState(initialUrl)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeConfig = POST_TYPES[postType]
  const minLength = 20
  // Text must be at least minLength characters
  // URL alone is not enough - user must extract content first
  const isValid = text.length >= minLength

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

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit(text, url)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{typeConfig.icon}</span>
          <h2 className="text-xl font-bold text-white">{typeConfig.name}</h2>
        </div>
        <p className="text-slate-400 text-sm">
          投稿したい内容をメモ書きで入力してください
        </p>
      </div>

      {/* Text input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          メモ書き
        </label>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDERS[postType]}
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
