import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-utils'

// Default system prompt (same as SYSTEM_PROMPT in caption/route.ts)
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

// GET /api/settings/system-prompt
export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const { data, error: fetchError } = await supabase
      .from('user_settings')
      .select('system_prompt_memo, system_prompt')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching system prompt:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch system prompt' },
        { status: 500 }
      )
    }

    // No record yet: upsert with default
    if (!data) {
      const { data: upserted, error: upsertError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          system_prompt: DEFAULT_SYSTEM_PROMPT,
        }, { onConflict: 'user_id' })
        .select('system_prompt_memo, system_prompt')
        .single()

      if (upsertError || !upserted) {
        console.error('Error upserting default system prompt:', upsertError)
        return NextResponse.json(
          { error: 'Failed to initialize system prompt' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        systemPromptMemo: upserted.system_prompt_memo,
        systemPrompt: upserted.system_prompt,
      })
    }

    // Record exists but system_prompt is null: set default
    if (data.system_prompt === null) {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ system_prompt: DEFAULT_SYSTEM_PROMPT })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error setting default system prompt:', updateError)
      }

      return NextResponse.json({
        systemPromptMemo: data.system_prompt_memo,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
      })
    }

    return NextResponse.json({
      systemPromptMemo: data.system_prompt_memo,
      systemPrompt: data.system_prompt,
    })
  } catch (err) {
    console.error('System prompt GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch system prompt' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/system-prompt
export async function PUT(request: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { systemPromptMemo, systemPrompt } = body

    // Validate provided fields
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

    const upsertData: {
      user_id: string
      system_prompt_memo?: string | null
      system_prompt?: string | null
    } = { user_id: userId }

    if (systemPromptMemo !== undefined) {
      upsertData.system_prompt_memo = systemPromptMemo
    }
    if (systemPrompt !== undefined) {
      upsertData.system_prompt = systemPrompt
    }

    const { data, error: upsertError } = await supabase
      .from('user_settings')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select('system_prompt_memo, system_prompt')
      .single()

    if (upsertError || !data) {
      console.error('Error updating system prompt:', upsertError)
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
    console.error('System prompt PUT error:', err)
    return NextResponse.json(
      { error: 'Failed to update system prompt' },
      { status: 500 }
    )
  }
}
