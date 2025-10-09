import { NextRequest, NextResponse } from 'next/server'
import { generatePostContent, hasApiKey } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    // APIキーの存在確認
    if (!hasApiKey()) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { content, title } = body

    // バリデーション
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'コンテンツが指定されていません' },
        { status: 400 }
      )
    }

    if (content.trim().length < 100) {
      return NextResponse.json(
        { error: 'コンテンツが短すぎます（最低100文字必要です）' },
        { status: 400 }
      )
    }

    // OpenAI APIでキャプション・ハッシュタグを生成
    const result = await generatePostContent(content, title)

    // レスポンス
    return NextResponse.json({
      caption: result.caption,
      hashtags: result.hashtags,
      success: true,
    })
  } catch (error: unknown) {
    console.error('Generate API error:', error)

    if (error instanceof Error) {
      // OpenAI APIのエラー
      if (error.message.includes('OpenAI API')) {
        return NextResponse.json(
          {
            error:
              'AI生成に失敗しました。しばらく待ってから再度お試しください。',
          },
          { status: 503 }
        )
      }

      // タイムアウトエラー
      if (error.message.includes('タイムアウト')) {
        return NextResponse.json(
          { error: '処理がタイムアウトしました。もう一度お試しください。' },
          { status: 408 }
        )
      }

      // APIキーエラー
      if (
        error.message.includes('API key') ||
        error.message.includes('authentication')
      ) {
        return NextResponse.json(
          { error: 'APIキーの認証に失敗しました' },
          { status: 401 }
        )
      }

      // レート制限エラー
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API利用制限に達しました。しばらく待ってからお試しください。' },
          { status: 429 }
        )
      }
    }

    // その他のエラー
    return NextResponse.json(
      { error: 'コンテンツの生成に失敗しました。もう一度お試しください。' },
      { status: 500 }
    )
  }
}
