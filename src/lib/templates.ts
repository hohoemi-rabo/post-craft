import type { PostType, TemplateData, ValidationResult } from '@/types/post'
import { POST_TYPES } from '@/lib/post-types'

// Template definitions
export const TEMPLATES: Record<PostType, string> = {
  solution: `📱 よくある質問
「{question}」

💡 解決方法
① {step1}
② {step2}
③ {step3}

✨ ワンポイント
{tip}

---
📍パソコン・スマホ ほほ笑みラボ（飯田市）`,

  promotion: `【{headline}】

✅ {pain_point1}
✅ {pain_point2}
✅ {pain_point3}

ほほ笑みラボでは
「体験」で終わらせない
必ず成果物を完成させる
AI実務活用サポートを行っています。

{call_to_action}

---
📍詳細はプロフィールのリンクから`,

  tips: `【{title}】

AIを使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
📍AIの使い方、もっと知りたい方は
プロフィールのリンクから`,

  showcase: `【こんな{deliverable_type}を作りました】

📌 お客様の課題
{challenge}

🛠️ 作ったもの
{solution}

🎯 結果
{result}

---
📍一緒に作りませんか？
無料相談はプロフィールから`,

  useful: `【{title}】

{topic}を使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
📍{footer_message}`,

  howto: `【{title}】

{topic}を使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
{howto_title}

1. {step1}

2. {step2}

3. {step3}

---
📍{footer_message}`,

  image_read: `{main_content}

{key_points}

{call_to_action}

---
📍パソコン・スマホ ほほ笑みラボ（飯田市）`,
}

// Field labels for UI
export const FIELD_LABELS: Record<string, string> = {
  // Solution type
  question: '質問内容',
  step1: '解決ステップ①',
  step2: '解決ステップ②',
  step3: '解決ステップ③',
  tip: 'ワンポイントアドバイス',

  // Promotion type
  headline: 'ヘッドライン',
  pain_point1: '悩み・課題①',
  pain_point2: '悩み・課題②',
  pain_point3: '悩み・課題③',
  call_to_action: '行動喚起（CTA）',

  // Tips type
  title: 'タイトル',
  benefit1: 'メリット①',
  benefit2: 'メリット②',
  benefit3: 'メリット③',
  example: '具体例',

  // Showcase type
  deliverable_type: '成果物の種類',
  challenge: 'お客様の課題',
  solution: '作ったもの・解決策',
  result: '結果・成果',

  // Useful type
  topic: 'トピック・主題',
  footer_message: 'フッターメッセージ',

  // Howto type
  howto_title: '使い方の見出し',

  // Image read type
  main_content: '本文',
  key_points: 'キーポイント',
}

// Apply template with data
export function applyTemplate(type: PostType, data: TemplateData): string {
  const template = TEMPLATES[type]
  let result = template

  // Replace placeholders with data
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
  }

  // Remove lines with unfilled optional placeholders
  result = result.replace(/^.*\{\w+\}.*$/gm, '')

  // Clean up multiple newlines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

// Validate template data
export function validateTemplateData(
  type: PostType,
  data: TemplateData
): ValidationResult {
  const config = POST_TYPES[type]
  const errors: string[] = []

  // Check required fields
  for (const field of config.requiredFields) {
    if (!data[field]?.trim()) {
      const label = FIELD_LABELS[field] || field
      errors.push(`「${label}」は必須です`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Get all fields for a post type
export function getFieldsForType(type: PostType): {
  required: { key: string; label: string }[]
  optional: { key: string; label: string }[]
} {
  const config = POST_TYPES[type]

  return {
    required: config.requiredFields.map((key) => ({
      key,
      label: FIELD_LABELS[key] || key,
    })),
    optional: config.optionalFields.map((key) => ({
      key,
      label: FIELD_LABELS[key] || key,
    })),
  }
}

// Get template preview (with placeholder indicators)
export function getTemplatePreview(type: PostType): string {
  const template = TEMPLATES[type]
  return template.replace(/\{(\w+)\}/g, '【$1】')
}
