import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import { ERROR_MESSAGES } from '@/lib/error-messages'
import { requireAuth } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.URL_REQUIRED },
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
        { error: ERROR_MESSAGES.SCRAPING_FAILED },
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
          { error: ERROR_MESSAGES.API_TIMEOUT },
          { status: 408 }
        )
      }

      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.NETWORK_ERROR },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SCRAPING_FAILED },
      { status: 500 }
    )
  }
}
