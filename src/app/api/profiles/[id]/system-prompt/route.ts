import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth, requireProfileOwnership } from '@/lib/api-utils'

const DEFAULT_SYSTEM_PROMPT = `あなたはパソコン教室「ほほ笑みラボ」の講師として、生徒さんに役立つInstagram投稿を作成します。入力メモが短文であっても、あなたの持つIT知識や一般的な情報を駆使して、読者がその場で実践できるレベルまで具体的に内容を膨らませてください。

【最重要ルール】
- 入力メモの主題・トピックを正確に反映すること
- 入力メモに不足している情報は、一般的なIT知識やGoogle検索の結果を用いて「AIが自ら補完して」作成すること
- 初心者でも理解できる、具体的で分かりやすい表現を使うこと

【文章スタイル】
- 指定されたテンプレート構造に従う
- 親しみやすく、分かりやすい文章
- 絵文字は適度に使用（多用しない）
- 内容に合う場合は「共感 → 安心」の流れを取り入れる（例: 「〜って困りますよね」→「でも大丈夫です」）。ただし無理に入れず、自然な場合のみ
- 日本語で出力`

// GET /api/profiles/[id]/system-prompt
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError, profile } = await requireProfileOwnership(id, userId!)
  if (ownerError) return ownerError

  // system_prompt が null ならデフォルトを設定
  if (profile!.system_prompt === null) {
    const supabase = createServerClient()
    await supabase
      .from('profiles')
      .update({ system_prompt: DEFAULT_SYSTEM_PROMPT })
      .eq('id', id)

    return NextResponse.json({
      systemPromptMemo: profile!.system_prompt_memo,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    })
  }

  return NextResponse.json({
    systemPromptMemo: profile!.system_prompt_memo,
    systemPrompt: profile!.system_prompt,
  })
}

// PUT /api/profiles/[id]/system-prompt
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError } = await requireProfileOwnership(id, userId!)
  if (ownerError) return ownerError

  try {
    const body = await request.json()
    const { systemPromptMemo, systemPrompt } = body

    if (systemPromptMemo !== undefined) {
      if (systemPromptMemo !== null && typeof systemPromptMemo !== 'string') {
        return NextResponse.json(
          { error: 'systemPromptMemo must be a string or null' },
          { status: 400 }
        )
      }
    }

    if (systemPrompt !== undefined) {
      if (systemPrompt !== null && typeof systemPrompt !== 'string') {
        return NextResponse.json(
          { error: 'systemPrompt must be a string or null' },
          { status: 400 }
        )
      }
      if (typeof systemPrompt === 'string' && !systemPrompt.trim()) {
        return NextResponse.json(
          { error: 'systemPrompt cannot be empty' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (systemPromptMemo !== undefined) updateData.system_prompt_memo = systemPromptMemo
    if (systemPrompt !== undefined) updateData.system_prompt = systemPrompt

    const supabase = createServerClient()
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('system_prompt_memo, system_prompt')
      .single()

    if (updateError || !data) {
      console.error('Error updating profile system prompt:', updateError)
      return NextResponse.json(
        { error: 'Failed to update system prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      systemPromptMemo: data.system_prompt_memo,
      systemPrompt: data.system_prompt,
    })
  } catch (err) {
    console.error('Profile system prompt PUT error:', err)
    return NextResponse.json(
      { error: 'Failed to update system prompt' },
      { status: 500 }
    )
  }
}
