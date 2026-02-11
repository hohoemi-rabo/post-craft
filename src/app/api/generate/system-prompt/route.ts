import { NextResponse } from 'next/server'
import { generateWithRetry } from '@/lib/gemini'
import { requireAuth } from '@/lib/api-utils'

export async function POST(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const { memo } = body

    if (!memo || typeof memo !== 'string' || !memo.trim()) {
      return NextResponse.json(
        { error: 'memo is required' },
        { status: 400 }
      )
    }

    const prompt = `あなたはSNS投稿生成AIの設定アシスタントです。

ユーザーが入力したメモ書きから、Instagram投稿を生成するAIへのシステムプロンプトを作成してください。

【ユーザーのメモ書き】
${memo.trim()}

【生成するシステムプロンプトの要件】
- 投稿者の立場・キャラクターを明確に
- 文章のトーン・スタイルを指定
- ターゲット読者への配慮事項
- 全体的な投稿のルール

【必ず含めるルール】
以下の3つのルールは「【最重要ルール】」セクションとして、生成するシステムプロンプトに必ず含めてください：
- 入力メモの主題・トピックを正確に反映すること
- 入力メモに不足している情報は、一般的なIT知識やGoogle検索の結果を用いて「AIが自ら補完して」作成すること
- 初心者でも理解できる、具体的で分かりやすい表現を使うこと

【出力形式】
システムプロンプトのテキストのみを出力してください。`

    const systemPrompt = await generateWithRetry(prompt)

    return NextResponse.json({ systemPrompt: systemPrompt.trim() })
  } catch (err) {
    console.error('System prompt generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate system prompt' },
      { status: 500 }
    )
  }
}
