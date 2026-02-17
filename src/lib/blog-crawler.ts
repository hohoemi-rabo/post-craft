import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import type { BlogPostData } from '@/types/analysis'

const MAX_ARTICLES = 100
const FETCH_TIMEOUT = 15000 // 個別取得: 15秒
const TOTAL_TIMEOUT = 300000 // 全体: 300秒（5分）
const CONCURRENCY = 5

export interface CrawlResult {
  posts: BlogPostData[]
  totalFound: number
  errors: string[]
  strategy: 'sitemap' | 'rss' | 'link-crawl'
}

export interface SitemapDiscoveryResult {
  found: boolean
  sitemapUrl?: string
  articleCount?: number
  strategy: 'sitemap.xml' | 'robots.txt' | 'not_found'
}

interface CrawlOptions {
  sitemapUrl?: string
}

interface CrawlProgress {
  phase: 'discovering' | 'extracting'
  current: number
  total: number
}

type ProgressCallback = (progress: CrawlProgress) => void

/**
 * ドメインからサイトマップを探索する（軽量版: 記事本文は取得しない）
 * 自動探索: 既知パス（5種）→ robots.txt の Sitemap ディレクティブ
 * 手動検証: options.sitemapUrl を直接フェッチして妥当性を確認
 */
export async function discoverSitemap(
  url: string,
  options?: { sitemapUrl?: string }
): Promise<SitemapDiscoveryResult> {
  const baseUrl = normalizeUrl(url)

  // 手動検証モード: 指定されたサイトマップURLを直接検証
  if (options?.sitemapUrl) {
    try {
      const response = await fetchWithTimeout(options.sitemapUrl, FETCH_TIMEOUT)
      if (response.ok) {
        const xml = await response.text()
        if (xml.includes('<urlset') || xml.includes('<sitemapindex')) {
          const urls = await parseSitemapXml(xml, baseUrl)
          if (urls.length > 0) {
            return {
              found: true,
              sitemapUrl: options.sitemapUrl,
              articleCount: urls.length,
              strategy: 'sitemap.xml',
            }
          }
        }
      }
    } catch {
      // 取得失敗
    }
    return { found: false, strategy: 'not_found' }
  }

  // 自動探索モード
  const sitemapPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-posts.xml',
    '/post-sitemap.xml',
    '/wp-sitemap.xml',
  ]

  // Strategy 1: 既知のサイトマップパスを試す
  for (const path of sitemapPaths) {
    try {
      const sitemapUrl = `${baseUrl}${path}`
      const response = await fetchWithTimeout(sitemapUrl, FETCH_TIMEOUT)
      if (!response.ok) continue

      const xml = await response.text()
      if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) continue

      const urls = await parseSitemapXml(xml, baseUrl)
      if (urls.length > 0) {
        return {
          found: true,
          sitemapUrl,
          articleCount: urls.length,
          strategy: 'sitemap.xml',
        }
      }
    } catch {
      continue
    }
  }

  // Strategy 2: robots.txt の Sitemap ディレクティブ
  try {
    const robotsUrl = `${baseUrl}/robots.txt`
    const response = await fetchWithTimeout(robotsUrl, FETCH_TIMEOUT)
    if (response.ok) {
      const text = await response.text()
      const sitemapUrls = text.split('\n')
        .filter(line => /^sitemap:/i.test(line.trim()))
        .map(line => line.replace(/^sitemap:\s*/i, '').trim())

      for (const sitemapUrl of sitemapUrls) {
        try {
          const res = await fetchWithTimeout(sitemapUrl, FETCH_TIMEOUT)
          if (!res.ok) continue
          const xml = await res.text()
          if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) continue
          const urls = await parseSitemapXml(xml, baseUrl)
          if (urls.length > 0) {
            return {
              found: true,
              sitemapUrl,
              articleCount: urls.length,
              strategy: 'robots.txt',
            }
          }
        } catch {
          continue
        }
      }
    }
  } catch {
    // robots.txt 取得失敗
  }

  return { found: false, strategy: 'not_found' }
}

/**
 * ブログ記事を一括取得する
 * 3段階のフォールバック: sitemap.xml → RSS → リンク巡回
 */
export async function crawlBlog(
  blogUrl: string,
  onProgress?: ProgressCallback,
  options?: CrawlOptions
): Promise<CrawlResult> {
  const startTime = Date.now()
  const errors: string[] = []

  const baseUrl = normalizeUrl(blogUrl)

  onProgress?.({ phase: 'discovering', current: 0, total: 0 })

  let articleUrls: string[] = []
  let strategy: CrawlResult['strategy'] = 'sitemap'

  // 事前発見済みサイトマップがあれば最初に試す
  if (options?.sitemapUrl) {
    try {
      const response = await fetchWithTimeout(options.sitemapUrl, FETCH_TIMEOUT)
      if (response.ok) {
        const xml = await response.text()
        articleUrls = await parseSitemapXml(xml, baseUrl)
      }
    } catch {
      // 取得失敗 → 通常フォールバックへ
    }
  }

  // Strategy 1: sitemap.xml
  if (articleUrls.length === 0) {
    articleUrls = await trySitemapStrategy(baseUrl)
    strategy = 'sitemap'
  }

  // Strategy 2: RSS フィード
  if (articleUrls.length === 0) {
    articleUrls = await tryRssStrategy(baseUrl)
    strategy = 'rss'
  }

  // Strategy 3: リンク巡回
  if (articleUrls.length === 0) {
    articleUrls = await tryLinkCrawlStrategy(baseUrl)
    strategy = 'link-crawl'
  }

  if (articleUrls.length === 0) {
    return { posts: [], totalFound: 0, errors: ['記事URLを発見できませんでした'], strategy }
  }

  const totalFound = articleUrls.length
  const targetUrls = articleUrls.slice(0, MAX_ARTICLES)

  const posts = await extractArticles(targetUrls, startTime, onProgress)

  if (posts.length === 0) {
    errors.push('記事の本文抽出に全て失敗しました')
  }

  return { posts, totalFound, errors, strategy }
}

// ─── Strategy 1: sitemap.xml ───

async function trySitemapStrategy(baseUrl: string): Promise<string[]> {
  const sitemapPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-posts.xml',
    '/post-sitemap.xml',
    '/wp-sitemap.xml',
  ]

  for (const path of sitemapPaths) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${path}`, FETCH_TIMEOUT)
      if (!response.ok) continue

      const xml = await response.text()
      if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) continue

      const urls = await parseSitemapXml(xml, baseUrl)
      if (urls.length > 0) return urls
    } catch {
      continue
    }
  }

  return []
}

/**
 * sitemap XML をパース（sitemap index の場合は再帰取得）
 */
async function parseSitemapXml(xml: string, baseUrl: string, depth = 0): Promise<string[]> {
  if (depth > 2) return [] // 無限再帰防止

  const urls: string[] = []

  // sitemap index の場合: 子サイトマップを再帰取得
  if (xml.includes('<sitemapindex')) {
    const locMatches = xml.match(/<loc>\s*(.*?)\s*<\/loc>/g) || []
    for (const match of locMatches) {
      const loc = match.replace(/<\/?loc>/g, '').trim()
      // 投稿系のサイトマップのみ取得（カテゴリ・タグ等をスキップ）
      if (loc.includes('category') || loc.includes('tag') || loc.includes('author')) continue

      try {
        const response = await fetchWithTimeout(loc, FETCH_TIMEOUT)
        if (!response.ok) continue
        const childXml = await response.text()
        const childUrls = await parseSitemapXml(childXml, baseUrl, depth + 1)
        urls.push(...childUrls)
      } catch {
        continue
      }
    }
    return urls
  }

  // 通常の urlset
  const locMatches = xml.match(/<loc>\s*(.*?)\s*<\/loc>/g) || []
  for (const match of locMatches) {
    const loc = match.replace(/<\/?loc>/g, '').trim()
    if (isArticleUrl(loc, baseUrl)) {
      urls.push(loc)
    }
  }

  return urls
}

// ─── Strategy 2: RSS フィード ───

async function tryRssStrategy(baseUrl: string): Promise<string[]> {
  const feedPaths = [
    '/feed',
    '/rss',
    '/atom.xml',
    '/feed.xml',
    '/rss.xml',
    '/index.xml',
    '/feed/atom',
    '/feeds/posts/default',
  ]

  // 1. 直接パスを試す
  for (const path of feedPaths) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${path}`, FETCH_TIMEOUT)
      if (!response.ok) continue

      const contentType = response.headers.get('content-type') || ''
      const text = await response.text()

      if (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom') ||
          text.includes('<rss') || text.includes('<feed') || text.includes('<channel')) {
        const urls = parseRssFeed(text)
        if (urls.length > 0) return urls
      }
    } catch {
      continue
    }
  }

  // 2. HTML の <link> 要素からフィード URL を検出
  try {
    const feedUrl = await discoverFeedFromHtml(baseUrl)
    if (feedUrl) {
      const response = await fetchWithTimeout(feedUrl, FETCH_TIMEOUT)
      if (response.ok) {
        const text = await response.text()
        const urls = parseRssFeed(text)
        if (urls.length > 0) return urls
      }
    }
  } catch {
    // ignore
  }

  return []
}

/**
 * RSS/Atom XML をパースして記事 URL リストを返す
 */
function parseRssFeed(xml: string): string[] {
  const urls: string[] = []

  // RSS 2.0: <item><link>URL</link></item>
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || []
  for (const item of itemMatches) {
    const linkMatch = item.match(/<link>\s*(.*?)\s*<\/link>/)
    if (linkMatch?.[1]) {
      const url = linkMatch[1].trim()
      if (url.startsWith('http')) urls.push(url)
    }
  }

  // Atom: <entry><link href="URL"/></entry>
  if (urls.length === 0) {
    const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g) || []
    for (const entry of entryMatches) {
      const linkMatch = entry.match(/<link[^>]+href=["']([^"']+)["']/)
      if (linkMatch?.[1]) {
        const url = linkMatch[1].trim()
        if (url.startsWith('http')) urls.push(url)
      }
    }
  }

  return urls
}

/**
 * HTML の <link rel="alternate"> からフィード URL を検出
 */
async function discoverFeedFromHtml(baseUrl: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(baseUrl, FETCH_TIMEOUT)
    if (!response.ok) return null

    const html = await response.text()
    const dom = new JSDOM(html, { url: baseUrl })
    const doc = dom.window.document

    const feedLink = doc.querySelector(
      'link[rel="alternate"][type="application/rss+xml"], ' +
      'link[rel="alternate"][type="application/atom+xml"]'
    )

    if (feedLink) {
      const href = feedLink.getAttribute('href')
      if (href) {
        return href.startsWith('http') ? href : new URL(href, baseUrl).href
      }
    }

    return null
  } catch {
    return null
  }
}

// ─── Strategy 3: リンク巡回 ───

async function tryLinkCrawlStrategy(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(baseUrl, FETCH_TIMEOUT)
    if (!response.ok) return []

    const html = await response.text()
    const dom = new JSDOM(html, { url: baseUrl })
    const doc = dom.window.document

    const anchors = doc.querySelectorAll('a[href]')
    const urls = new Set<string>()

    anchors.forEach((a: Element) => {
      const href = a.getAttribute('href')
      if (!href) return

      try {
        const absoluteUrl = new URL(href, baseUrl).href
        if (isArticleUrl(absoluteUrl, baseUrl)) {
          urls.add(absoluteUrl)
        }
      } catch {
        // 無効な URL はスキップ
      }
    })

    return Array.from(urls)
  } catch {
    return []
  }
}

// ─── 記事本文抽出 ───

async function extractArticles(
  urls: string[],
  startTime: number,
  onProgress?: ProgressCallback
): Promise<BlogPostData[]> {
  const results: BlogPostData[] = []

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
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

async function extractSingleArticle(url: string): Promise<BlogPostData | null> {
  try {
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT)
    if (!response.ok) return null

    const html = await response.text()
    const dom = new JSDOM(html, { url })
    const doc = dom.window.document
    const reader = new Readability(doc)
    const article = reader.parse()

    if (!article?.textContent) return null

    const content = article.textContent.trim()

    return {
      url,
      title: article.title || '',
      content,
      published_at: extractPublishedDate(dom.window.document),
      categories: extractCategories(dom.window.document),
      tags: extractTags(dom.window.document),
      word_count: content.length,
    }
  } catch {
    return null
  }
}

// ─── ユーティリティ ───

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PostCraft/1.0)',
      },
      redirect: 'follow',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim()

  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }

  // 末尾スラッシュを除去
  normalized = normalized.replace(/\/+$/, '')

  // パス部分を除去してベース URL を返す
  try {
    const parsed = new URL(normalized)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return normalized
  }
}

/**
 * URL が記事ページかどうかを判定
 */
function isArticleUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url)
    const base = new URL(baseUrl)

    // 同一ドメインのみ
    if (parsed.host !== base.host) return false

    const path = parsed.pathname.toLowerCase()

    // トップページを除外
    if (path === '/' || path === '') return false

    // 除外パターン
    const excludePatterns = [
      /^\/category\//,
      /^\/tag\//,
      /^\/author\//,
      /^\/page\/\d+/,
      /^\/wp-admin/,
      /^\/wp-content/,
      /^\/wp-includes/,
      /^\/wp-login/,
      /^\/wp-json/,
      /^\/feed/,
      /^\/rss/,
      /^\/sitemap/,
      /^\/admin/,
      /^\/login/,
      /^\/search/,
      /^\/archive/,
      /^\/contact/,
      /^\/about\/?$/,
      /^\/privacy/,
      /^\/terms/,
      /^\/legal/,
      /\.(xml|json|css|js|png|jpg|jpeg|gif|svg|pdf|zip)$/,
      /^\/#/,
    ]

    if (excludePatterns.some(pattern => pattern.test(path))) return false

    // 含有パターン（これらにマッチすると記事の可能性が高い）
    const articlePatterns = [
      /\/\d{4}\/\d{2}\//, // /2024/01/
      /\/\d{4}\/\d{2}\/\d{2}\//, // /2024/01/15/
      /\/blog\//,
      /\/post\//,
      /\/posts\//,
      /\/article\//,
      /\/articles\//,
      /\/entry\//,
      /\/entries\//,
      /\/news\//,
      /\/p\//,
    ]

    if (articlePatterns.some(pattern => pattern.test(path))) return true

    // パスの深さが2以上ならば記事の可能性あり
    const segments = path.split('/').filter(s => s.length > 0)
    if (segments.length >= 1) return true

    return false
  } catch {
    return false
  }
}

function extractPublishedDate(document: Document): string | undefined {
  // meta タグから探索
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[property="og:article:published_time"]',
    'meta[name="date"]',
    'meta[name="pubdate"]',
    'meta[name="publish_date"]',
    'meta[name="DC.date"]',
    'meta[itemprop="datePublished"]',
  ]

  for (const selector of dateSelectors) {
    const meta = document.querySelector(selector)
    const content = meta?.getAttribute('content')
    if (content) {
      const date = new Date(content)
      if (!isNaN(date.getTime())) return date.toISOString()
    }
  }

  // time 要素から探索
  const timeElements = document.querySelectorAll('time[datetime]')
  for (const el of timeElements) {
    const datetime = el.getAttribute('datetime')
    if (datetime) {
      const date = new Date(datetime)
      if (!isNaN(date.getTime())) return date.toISOString()
    }
  }

  // JSON-LD から探索
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent || '')
      const dateStr = json.datePublished || json.dateCreated
      if (dateStr) {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) return date.toISOString()
      }
    } catch {
      continue
    }
  }

  return undefined
}

function extractCategories(document: Document): string[] | undefined {
  const categories: string[] = []

  // meta タグ
  const meta = document.querySelector('meta[property="article:section"]')
  if (meta?.getAttribute('content')) {
    categories.push(meta.getAttribute('content')!)
  }

  // rel="category tag" リンク
  const categoryLinks = document.querySelectorAll('a[rel*="category"]')
  categoryLinks.forEach(a => {
    const text = a.textContent?.trim()
    if (text && !categories.includes(text)) categories.push(text)
  })

  return categories.length > 0 ? categories : undefined
}

function extractTags(document: Document): string[] | undefined {
  const tags: string[] = []

  // meta タグ
  const metaTags = document.querySelectorAll('meta[property="article:tag"]')
  metaTags.forEach(meta => {
    const content = meta.getAttribute('content')
    if (content) tags.push(content)
  })

  // keywords meta
  if (tags.length === 0) {
    const keywords = document.querySelector('meta[name="keywords"]')
    const content = keywords?.getAttribute('content')
    if (content) {
      content.split(',').forEach(tag => {
        const trimmed = tag.trim()
        if (trimmed) tags.push(trimmed)
      })
    }
  }

  // rel="tag" リンク
  if (tags.length === 0) {
    const tagLinks = document.querySelectorAll('a[rel="tag"]')
    tagLinks.forEach(a => {
      const text = a.textContent?.trim()
      if (text && !tags.includes(text)) tags.push(text)
    })
  }

  return tags.length > 0 ? tags : undefined
}
