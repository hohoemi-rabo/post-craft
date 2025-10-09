import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URLが指定されていません' },
        { status: 400 }
      )
    }

    // URLからHTMLを取得（タイムアウト30秒）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InstagramPostGenerator/1.0)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        { error: `記事の取得に失敗しました (${response.status})` },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Readabilityでコンテンツをパース
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article || !article.textContent) {
      return NextResponse.json(
        { error: '記事の本文を抽出できませんでした' },
        { status: 400 }
      )
    }

    // レスポンス
    return NextResponse.json({
      title: article.title || '',
      content: article.textContent,
      excerpt: article.excerpt || '',
      success: true,
    })
  } catch (error: unknown) {
    console.error('Extract error:', error)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: '処理がタイムアウトしました。もう一度お試しください。' },
          { status: 408 }
        )
      }

      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'URLへのアクセスに失敗しました。URLを確認してください。' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: '記事の抽出に失敗しました。URLを確認するか、記事を直接入力してください。' },
      { status: 500 }
    )
  }
}
