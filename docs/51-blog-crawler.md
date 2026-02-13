# チケット #51: ブログクローラー実装

> Phase 4A | 優先度: 高 | 依存: #49

## 概要

ブログのトップページ URL を入力として、記事を一括取得するクローラーを実装する。3段階のフォールバック戦略（sitemap.xml → RSS フィード → リンク巡回）で記事 URL を収集し、既存の `/api/extract` ロジック（JSDOM + Readability）を再利用して記事本文を抽出する。バックグラウンド処理として最大300秒のタイムアウトで動作する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/blog-crawler.ts` | 新規作成（ブログクローラー） |
| `src/app/api/analysis/blog-crawl/route.ts` | 新規作成（ブログクロールAPI） |
| `src/types/analysis.ts` | 確認（BlogPostData, BlogAnalysisInput は #50 で作成済み） |

## 変更内容

### 1. ブログクローラー (`src/lib/blog-crawler.ts`)

```typescript
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import type { BlogPostData } from '@/types/analysis'

const MAX_ARTICLES = 100
const FETCH_TIMEOUT = 15000 // 個別記事取得: 15秒
const TOTAL_TIMEOUT = 300000 // 全体: 300秒（5分）

interface CrawlResult {
  posts: BlogPostData[]
  totalFound: number
  errors: string[]
  strategy: 'sitemap' | 'rss' | 'link-crawl'
}

interface CrawlProgress {
  phase: 'discovering' | 'extracting'
  current: number
  total: number
}

type ProgressCallback = (progress: CrawlProgress) => void

/**
 * ブログ記事を一括取得する
 * 3段階のフォールバック: sitemap.xml → RSS → リンク巡回
 */
export async function crawlBlog(
  blogUrl: string,
  onProgress?: ProgressCallback
): Promise<CrawlResult> {
  const startTime = Date.now()
  const errors: string[] = []

  // URL を正規化
  const baseUrl = normalizeUrl(blogUrl)

  // Strategy 1: sitemap.xml
  let articleUrls = await trySitemapStrategy(baseUrl)
  let strategy: CrawlResult['strategy'] = 'sitemap'

  // Strategy 2: RSS フィード（フォールバック）
  if (articleUrls.length === 0) {
    articleUrls = await tryRssStrategy(baseUrl)
    strategy = 'rss'
  }

  // Strategy 3: リンク巡回（最終フォールバック）
  if (articleUrls.length === 0) {
    articleUrls = await tryLinkCrawlStrategy(baseUrl)
    strategy = 'link-crawl'
  }

  if (articleUrls.length === 0) {
    return { posts: [], totalFound: 0, errors: ['記事URLを発見できませんでした'], strategy }
  }

  const totalFound = articleUrls.length
  // 上限制限
  const targetUrls = articleUrls.slice(0, MAX_ARTICLES)

  // 記事本文を抽出（並列処理、同時接続数制限）
  const posts = await extractArticles(targetUrls, startTime, onProgress)

  return { posts, totalFound, errors, strategy }
}
```

#### Strategy 1: sitemap.xml パース

```typescript
/**
 * sitemap.xml から記事URLを取得
 * - /sitemap.xml を探索
 * - sitemap index の場合は子サイトマップも再帰取得
 * - 記事ページのURLをフィルタリング（カテゴリ・タグページ等を除外）
 */
async function trySitemapStrategy(baseUrl: string): Promise<string[]> {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap-posts.xml`,
    `${baseUrl}/post-sitemap.xml`,
  ]

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetchWithTimeout(sitemapUrl, FETCH_TIMEOUT)
      if (!response.ok) continue

      const xml = await response.text()
      const urls = parseSitemapXml(xml, baseUrl)

      if (urls.length > 0) return urls
    } catch {
      continue
    }
  }

  return []
}

/**
 * sitemap XML をパースしてURLリストを返す
 * sitemap index の場合は再帰的に子サイトマップを取得
 */
function parseSitemapXml(xml: string, baseUrl: string): string[] { ... }
```

#### Strategy 2: RSS フィードパース

```typescript
/**
 * RSS/Atom フィードから記事URLを取得
 * - /feed, /rss, /atom.xml 等の一般的なパスを探索
 * - HTML内の <link rel="alternate" type="application/rss+xml"> も検出
 */
async function tryRssStrategy(baseUrl: string): Promise<string[]> {
  // 一般的な RSS フィードパス
  const feedPaths = [
    '/feed', '/rss', '/atom.xml', '/feed.xml',
    '/rss.xml', '/index.xml', '/feed/atom',
  ]

  // 1. 直接パスを試す
  for (const path of feedPaths) { ... }

  // 2. HTML内のlink要素から検出
  const feedUrl = await discoverFeedFromHtml(baseUrl)
  if (feedUrl) { ... }

  return []
}

/**
 * RSS/Atom XML をパースして記事URLリストを返す
 */
function parseRssFeed(xml: string): string[] { ... }
```

#### Strategy 3: リンク巡回

```typescript
/**
 * トップページのリンクを巡回して記事URLを収集
 * - トップページの <a> タグからURLを収集
 * - 記事ページと思われるURLをフィルタリング
 * - 1階層のみ巡回（深い巡回はしない）
 */
async function tryLinkCrawlStrategy(baseUrl: string): Promise<string[]> { ... }

/**
 * URLが記事ページかどうかを判定
 * - 除外パターン: /category/, /tag/, /author/, /page/, /wp-admin/ 等
 * - 含有パターン: 年月日を含むパス、/blog/, /post/, /article/ 等
 */
function isArticleUrl(url: string, baseUrl: string): boolean { ... }
```

#### 記事本文抽出

```typescript
/**
 * 記事URLリストから本文を抽出
 * 既存の /api/extract と同じロジック（JSDOM + Readability）を使用
 * 同時接続数を制限して並列処理
 */
async function extractArticles(
  urls: string[],
  startTime: number,
  onProgress?: ProgressCallback
): Promise<BlogPostData[]> {
  const CONCURRENCY = 5 // 同時接続数
  const results: BlogPostData[] = []

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    // 全体タイムアウトチェック
    if (Date.now() - startTime > TOTAL_TIMEOUT) break

    const batch = urls.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.allSettled(
      batch.map(url => extractSingleArticle(url))
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value)
      }
    }

    onProgress?.({
      phase: 'extracting',
      current: Math.min(i + CONCURRENCY, urls.length),
      total: urls.length,
    })
  }

  return results
}

/**
 * 単一記事の本文抽出（JSDOM + Readability）
 */
async function extractSingleArticle(url: string): Promise<BlogPostData | null> {
  try {
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT)
    if (!response.ok) return null

    const html = await response.text()
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article?.textContent) return null

    return {
      url,
      title: article.title || '',
      content: article.textContent.trim(),
      published_at: extractPublishedDate(dom.window.document),
      categories: extractCategories(dom.window.document),
      tags: extractTags(dom.window.document),
      word_count: article.textContent.trim().length,
    }
  } catch {
    return null
  }
}
```

#### ユーティリティ

```typescript
/**
 * タイムアウト付きfetch
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PostCraft/1.0)',
      },
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * URLの正規化（末尾スラッシュ除去、プロトコル追加等）
 */
function normalizeUrl(url: string): string { ... }

/**
 * HTML から公開日を抽出（meta タグ、time 要素等）
 */
function extractPublishedDate(document: Document): string | undefined { ... }

/**
 * HTML からカテゴリを抽出
 */
function extractCategories(document: Document): string[] | undefined { ... }

/**
 * HTML からタグを抽出
 */
function extractTags(document: Document): string[] | undefined { ... }
```

### 2. ブログクロールAPI (`src/app/api/analysis/blog-crawl/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnalysisOwnership } from '@/lib/api-utils'
import { createServerClient } from '@/lib/supabase'
import { crawlBlog } from '@/lib/blog-crawler'

// バックグラウンド処理: 最大300秒
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  try {
    const { blogUrl, blogName, analysisId } = await request.json()

    // バリデーション
    if (!blogUrl) {
      return NextResponse.json({ error: 'ブログURLが必要です' }, { status: 400 })
    }
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId が必要です' }, { status: 400 })
    }

    // 所有権チェック
    const { error: ownerError } = await requireAnalysisOwnership(analysisId, userId)
    if (ownerError) return ownerError

    // ステータスを 'analyzing' に更新
    const supabase = createServerClient()
    await supabase
      .from('competitor_analyses')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', analysisId)

    // ブログクロール実行
    const result = await crawlBlog(blogUrl)

    if (result.posts.length === 0) {
      // 記事が取得できなかった場合
      await supabase
        .from('competitor_analyses')
        .update({
          status: 'failed',
          error_message: result.errors.join(', ') || '記事を取得できませんでした',
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId)

      return NextResponse.json({
        error: '記事を取得できませんでした',
        details: result.errors,
      }, { status: 400 })
    }

    // raw_data を保存
    const rawData = {
      blog_url: blogUrl,
      blog_name: blogName || '',
      posts: result.posts,
      strategy: result.strategy,
      totalFound: result.totalFound,
    }

    await supabase
      .from('competitor_analyses')
      .update({
        raw_data: rawData,
        post_count: result.posts.length,
        status: 'pending', // データ取得完了、AI分析待ち
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    return NextResponse.json({
      success: true,
      postCount: result.posts.length,
      totalFound: result.totalFound,
      strategy: result.strategy,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Blog crawl error:', error)

    // エラー時にステータスを更新
    try {
      const { analysisId } = await request.clone().json()
      if (analysisId) {
        const supabase = createServerClient()
        await supabase
          .from('competitor_analyses')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'クロール処理に失敗しました',
            updated_at: new Date().toISOString(),
          })
          .eq('id', analysisId)
      }
    } catch { /* ignore */ }

    return NextResponse.json({ error: 'ブログのクロールに失敗しました' }, { status: 500 })
  }
}
```

## 受入条件

- sitemap.xml が存在するブログで記事URLが正しく収集される
- sitemap.xml がない場合、RSS フィードにフォールバックして記事URLが収集される
- RSS もない場合、リンク巡回で記事URLが収集される
- 記事本文が Readability で正しく抽出される（既存 `/api/extract` と同等の品質）
- 100件を超える記事が見つかった場合、先頭100件のみ取得される
- 全体タイムアウト（300秒）で処理が打ち切られる
- 個別記事取得のタイムアウト（15秒）が機能する
- 同時接続数が5に制限されている
- POST `/api/analysis/blog-crawl` でブログクロール後に `competitor_analyses` の `raw_data`, `post_count`, `status` が更新される
- クロール失敗時にステータスが `failed` に更新され、`error_message` が記録される
- 認証・所有権チェックが正しく機能する
- `npm run build` が成功する

## TODO

- [ ] `src/lib/blog-crawler.ts` を作成
- [ ] sitemap.xml パース戦略の実装（sitemap index の再帰取得含む）
- [ ] RSS/Atom フィードパース戦略の実装
- [ ] リンク巡回戦略の実装（記事URLフィルタリング）
- [ ] 記事本文抽出の実装（JSDOM + Readability、既存ロジック再利用）
- [ ] 同時接続数制限付き並列処理の実装
- [ ] 公開日・カテゴリ・タグの抽出ロジック
- [ ] URL正規化、タイムアウト付きfetchの実装
- [ ] `src/app/api/analysis/blog-crawl/route.ts` を作成
- [ ] バリデーション（URL、analysisId）
- [ ] ステータス遷移の管理（analyzing → pending / failed）
- [ ] エラーハンドリング（タイムアウト、ネットワークエラー、パースエラー）
- [ ] `npm run build` 成功を確認
