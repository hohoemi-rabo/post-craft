import { NextResponse } from 'next/server'
import { generateWithRetry, parseJsonResponse } from '@/lib/gemini'
import { requireAuth } from '@/lib/api-utils'
import type { Placeholder } from '@/types/post-type'

interface GeneratePostTypeRequest {
  name: string
  description: string
  minLength: number
  maxLength: number
  userMemo: string
  inputMode: 'fields' | 'memo'
}

interface GeneratePostTypeResponse {
  typePrompt: string
  templateStructure: string
  placeholders: Placeholder[]
  samplePost: string
}

export async function POST(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body: GeneratePostTypeRequest = await request.json()
    const { name, description, minLength, maxLength, userMemo, inputMode } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (!userMemo || typeof userMemo !== 'string' || !userMemo.trim()) {
      return NextResponse.json(
        { error: 'userMemo is required' },
        { status: 400 }
      )
    }

    if (inputMode !== 'fields' && inputMode !== 'memo') {
      return NextResponse.json(
        { error: 'inputMode must be "fields" or "memo"' },
        { status: 400 }
      )
    }

    const placeholderInstruction = inputMode === 'fields'
      ? `3. プレースホルダー変数（テンプレート内の{変数名}に対応する入力項目）
   - 各変数は以下の形式:
     { "name": "変数名（英語snake_case）", "label": "表示ラベル（日本語）", "description": "入力の説明", "required": true/false, "inputType": "text"または"textarea" }
   - テンプレート構造内の{変数名}と一致させること`
      : `3. プレースホルダー変数: 空配列 [] を返してください（入力方式がmemoのため）
   - テンプレート構造内に{変数名}は使わず、AIが自由に生成できるセクション形式にしてください`

    const prompt = `あなたはSNS投稿生成AIの設定アシスタントです。

ユーザーが入力した情報から、投稿タイプの設定を生成してください。

【投稿タイプ情報】
- タイプ名: ${name.trim()}
- 説明: ${(description || '').trim()}
- 文字数目安: ${minLength || 200}〜${maxLength || 400}文字
- 入力方式: ${inputMode}（${inputMode === 'fields' ? 'プレースホルダーフォーム' : 'テキストエリア一括入力'}）

【ユーザーのメモ書き】
${userMemo.trim()}

【生成する内容】
1. タイプ別プロンプト（typePrompt）: このタイプの投稿を生成するAIへの指示文。入力メモから投稿を作成する際のルール・要件を記述。
2. テンプレート構造（templateStructure）: 投稿の出力形式。絵文字・見出し・セクション区切りを含む。${inputMode === 'fields' ? '{変数名}のプレースホルダーを含める。' : 'AIが内容を自由に生成できるセクション構成にする。'}
${placeholderInstruction}
4. サンプル投稿（samplePost）: テンプレート構造に沿った具体的な投稿例。${minLength || 200}〜${maxLength || 400}文字程度。

【出力形式】
以下のJSON形式で出力してください。余計な説明は不要です。JSONのみ出力してください。
{
  "typePrompt": "...",
  "templateStructure": "...",
  "placeholders": [${inputMode === 'fields' ? '{"name":"...","label":"...","description":"...","required":true,"inputType":"text"}' : ''}],
  "samplePost": "..."
}`

    const resultText = await generateWithRetry(prompt)
    const parsed = parseJsonResponse<GeneratePostTypeResponse>(resultText)

    // Ensure placeholders is an array
    if (!Array.isArray(parsed.placeholders)) {
      parsed.placeholders = []
    }

    // For memo mode, force empty placeholders
    if (inputMode === 'memo') {
      parsed.placeholders = []
    }

    // Validate placeholder structure for fields mode
    if (inputMode === 'fields') {
      parsed.placeholders = parsed.placeholders.map((p) => ({
        name: String(p.name || ''),
        label: String(p.label || ''),
        description: String(p.description || ''),
        required: Boolean(p.required),
        inputType: p.inputType === 'textarea' ? 'textarea' : 'text',
      }))
    }

    // Validate required response fields
    if (!parsed.typePrompt || !parsed.templateStructure || !parsed.samplePost) {
      return NextResponse.json(
        { error: 'AI generated incomplete response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      typePrompt: parsed.typePrompt,
      templateStructure: parsed.templateStructure,
      placeholders: parsed.placeholders,
      samplePost: parsed.samplePost,
    })
  } catch (err) {
    console.error('Post type generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate post type' },
      { status: 500 }
    )
  }
}
