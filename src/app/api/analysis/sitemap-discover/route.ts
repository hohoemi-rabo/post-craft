import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { discoverSitemap } from '@/lib/blog-crawler'

export async function POST(request: Request) {
  const { error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { url, sitemapUrl } = body

    if (!url) {
      return NextResponse.json({ error: 'URLが必要です' }, { status: 400 })
    }

    const result = await discoverSitemap(url, sitemapUrl ? { sitemapUrl } : undefined)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Sitemap discovery error:', error)
    return NextResponse.json(
      { error: 'サイトマップの探索に失敗しました' },
      { status: 500 }
    )
  }
}
