import type { InstagramPostData, InstagramProfileData, CsvParseResult } from '@/types/analysis'

const MAX_POSTS = 200
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Bright Data CSV/JSON ファイルをパースして内部データ構造に変換する
 */
export async function parseBrightDataFile(file: File): Promise<CsvParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    return { profile: null, posts: [], errors: ['ファイルサイズが10MBを超えています'], warnings: [] }
  }

  const fileName = file.name.toLowerCase()
  if (fileName.endsWith('.json')) {
    return parseJsonFile(file)
  } else if (fileName.endsWith('.csv')) {
    return parseCsvFile(file)
  } else {
    return { profile: null, posts: [], errors: ['対応していないファイル形式です（CSV または JSON のみ）'], warnings: [] }
  }
}

/**
 * JSON形式のパース
 */
async function parseJsonFile(file: File): Promise<CsvParseResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const text = await file.text()
    const json = JSON.parse(text)

    // 配列またはオブジェクトの posts プロパティを取得
    const rawItems = Array.isArray(json) ? json : (json.posts || json.data || [json])
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { profile: null, posts: [], errors: ['JSONファイルに投稿データが見つかりません'], warnings: [] }
    }

    const posts: InstagramPostData[] = []
    for (const item of rawItems) {
      const mapped = mapRawObject(item)
      const post = objectToPostData(mapped)
      if (post) posts.push(post)
    }

    if (posts.length === 0) {
      errors.push('有効な投稿データが見つかりませんでした')
      return { profile: null, posts: [], errors, warnings }
    }

    // プロフィール情報の抽出（JSONの場合、トップレベルにある可能性）
    const profile = extractProfileFromJson(json, posts)

    // 投稿数制限
    const { posts: limitedPosts, warning } = limitPosts(posts)
    if (warning) warnings.push(warning)

    return { profile, posts: limitedPosts, errors, warnings }
  } catch {
    return { profile: null, posts: [], errors: ['JSONファイルのパースに失敗しました'], warnings: [] }
  }
}

/**
 * CSV形式のパース（文字コード自動判定付き）
 */
async function parseCsvFile(file: File): Promise<CsvParseResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const buffer = await file.arrayBuffer()
    const encoding = detectEncoding(buffer)
    const decoder = new TextDecoder(encoding)
    const text = decoder.decode(buffer)

    const rows = parseCsvContent(text)
    if (rows.length < 2) {
      return { profile: null, posts: [], errors: ['CSVファイルにデータが不足しています（ヘッダー + 1行以上必要）'], warnings: [] }
    }

    const headers = rows[0]
    const mappedHeaders = headers.map(h => mapFieldName(h.trim()))

    const posts: InstagramPostData[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue

      const obj: Record<string, string> = {}
      for (let j = 0; j < mappedHeaders.length; j++) {
        const key = mappedHeaders[j]
        if (key && j < row.length) {
          obj[key] = row[j]
        }
      }

      const post = objectToPostData(obj)
      if (post) posts.push(post)
    }

    if (posts.length === 0) {
      errors.push('有効な投稿データが見つかりませんでした')
      return { profile: null, posts: [], errors, warnings }
    }

    // 投稿数制限
    const { posts: limitedPosts, warning } = limitPosts(posts)
    if (warning) warnings.push(warning)

    return { profile: null, posts: limitedPosts, errors, warnings }
  } catch {
    return { profile: null, posts: [], errors: ['CSVファイルのパースに失敗しました'], warnings: [] }
  }
}

/**
 * 文字コード判定（UTF-8 / Shift-JIS）
 * BOM やバイトパターンで判定
 */
function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)

  // UTF-8 BOM チェック
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'utf-8'
  }

  // UTF-16 BOM チェック
  if (bytes.length >= 2) {
    if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le'
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be'
  }

  // Shift-JIS 判定: 0x80-0x9F, 0xE0-0xEF の先行バイトが含まれるか
  let shiftJisScore = 0
  let utf8Score = 0

  for (let i = 0; i < Math.min(bytes.length, 4096); i++) {
    const b = bytes[i]

    // Shift-JIS 2バイト文字の先行バイト
    if ((b >= 0x81 && b <= 0x9F) || (b >= 0xE0 && b <= 0xEF)) {
      if (i + 1 < bytes.length) {
        const next = bytes[i + 1]
        if ((next >= 0x40 && next <= 0x7E) || (next >= 0x80 && next <= 0xFC)) {
          shiftJisScore++
          i++ // 次のバイトをスキップ
          continue
        }
      }
    }

    // UTF-8 マルチバイトシーケンス
    if (b >= 0xC2 && b <= 0xDF) {
      if (i + 1 < bytes.length && bytes[i + 1] >= 0x80 && bytes[i + 1] <= 0xBF) {
        utf8Score++
        i++
        continue
      }
    }
    if (b >= 0xE0 && b <= 0xEF) {
      if (i + 2 < bytes.length && bytes[i + 1] >= 0x80 && bytes[i + 1] <= 0xBF && bytes[i + 2] >= 0x80 && bytes[i + 2] <= 0xBF) {
        utf8Score++
        i += 2
        continue
      }
    }
  }

  if (shiftJisScore > utf8Score && shiftJisScore > 0) {
    return 'shift-jis'
  }

  return 'utf-8'
}

/**
 * RFC4180 準拠の CSV パーサー（ダブルクオート対応）
 */
function parseCsvContent(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // エスケープされたダブルクオート
          currentField += '"'
          i += 2
        } else {
          // クオート終了
          inQuotes = false
          i++
        }
      } else {
        currentField += char
        i++
      }
    } else {
      if (char === '"' && currentField.length === 0) {
        // クオート開始
        inQuotes = true
        i++
      } else if (char === ',') {
        currentRow.push(currentField)
        currentField = ''
        i++
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentField)
        currentField = ''
        if (currentRow.some(f => f.trim() !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
        // \r\n の場合は次もスキップ
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i += 2
        } else {
          i++
        }
      } else {
        currentField += char
        i++
      }
    }
  }

  // 最後のフィールド・行
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField)
    if (currentRow.some(f => f.trim() !== '')) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * Bright Data のフィールド名を内部フィールドにマッピング
 */
function mapFieldName(fieldName: string): string | null {
  const normalized = fieldName.toLowerCase().replace(/[_\s-]/g, '')

  const mapping: Record<string, string> = {
    // Post ID
    'postid': 'post_id',
    'id': 'post_id',
    'inputurl': 'post_id',
    'url': 'post_id',

    // Caption
    'caption': 'caption',
    'text': 'caption',
    'description': 'caption',

    // Likes
    'likescount': 'likes_count',
    'likes': 'likes_count',

    // Comments
    'commentscount': 'comments_count',
    'comments': 'comments_count',

    // Posted at
    'postedat': 'posted_at',
    'timestamp': 'posted_at',
    'date': 'posted_at',
    'createdat': 'posted_at',

    // Post type
    'posttype': 'post_type',
    'type': 'post_type',
    'mediatype': 'post_type',

    // Hashtags
    'hashtags': 'hashtags',
    'tags': 'hashtags',

    // Image URL
    'imageurl': 'image_url',
    'mediaurl': 'image_url',
    'thumbnail': 'image_url',
    'image': 'image_url',
    'displayurl': 'image_url',

    // Profile fields
    'username': 'username',
    'displayname': 'display_name',
    'fullname': 'display_name',
    'bio': 'bio',
    'biography': 'bio',
    'followerscount': 'followers_count',
    'followers': 'followers_count',
    'followingcount': 'following_count',
    'following': 'following_count',
    'postscount': 'posts_count',

    // Engagement
    'engagementrate': 'engagement_rate',
    'engagement': 'engagement_rate',
  }

  return mapping[normalized] || null
}

/**
 * 生のオブジェクトのキーをマッピングされたフィールド名に変換
 */
function mapRawObject(raw: Record<string, unknown>): Record<string, string> {
  const mapped: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const mappedKey = mapFieldName(key)
    if (mappedKey && value !== null && value !== undefined) {
      mapped[mappedKey] = String(value)
    }
  }
  return mapped
}

/**
 * マッピング済みオブジェクトからInstagramPostDataに変換
 */
function objectToPostData(obj: Record<string, string>): InstagramPostData | null {
  const postId = obj['post_id']
  const caption = obj['caption'] || ''

  // post_id または caption のどちらかは必須
  if (!postId && !caption) return null

  const hashtags = obj['hashtags']
    ? parseHashtagField(obj['hashtags'])
    : extractHashtags(caption)

  const postType = normalizePostType(obj['post_type'])

  return {
    post_id: postId || `generated_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    post_type: postType,
    caption,
    hashtags,
    likes_count: parseInt(obj['likes_count'] || '0', 10) || 0,
    comments_count: parseInt(obj['comments_count'] || '0', 10) || 0,
    posted_at: obj['posted_at'] || new Date().toISOString(),
    engagement_rate: obj['engagement_rate'] ? parseFloat(obj['engagement_rate']) : undefined,
    image_url: obj['image_url'] || undefined,
  }
}

/**
 * ハッシュタグフィールドをパース（カンマ区切り、JSON配列、スペース区切り対応）
 */
function parseHashtagField(value: string): string[] {
  const trimmed = value.trim()

  // JSON 配列形式
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed)
      if (Array.isArray(arr)) return arr.map((t: string) => String(t).replace(/^#/, ''))
    } catch {
      // JSON パースに失敗した場合はフォールバック
    }
  }

  // カンマ区切り or スペース区切り
  return trimmed
    .split(/[,\s]+/)
    .map(t => t.trim().replace(/^#/, ''))
    .filter(t => t.length > 0)
}

/**
 * キャプションからハッシュタグを抽出
 */
function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]+/g)
  if (!matches) return []
  return matches.map(tag => tag.replace(/^#/, ''))
}

/**
 * 投稿タイプを正規化
 */
function normalizePostType(value?: string): 'image' | 'carousel' | 'video' | 'reel' {
  if (!value) return 'image'
  const normalized = value.toLowerCase().trim()
  if (normalized.includes('carousel') || normalized.includes('sidecar')) return 'carousel'
  if (normalized.includes('reel')) return 'reel'
  if (normalized.includes('video')) return 'video'
  return 'image'
}

/**
 * JSON からプロフィール情報を抽出
 */
function extractProfileFromJson(
  json: Record<string, unknown>,
  posts: InstagramPostData[]
): InstagramProfileData | null {
  if (Array.isArray(json)) return null

  const mapped = mapRawObject(json as Record<string, unknown>)
  const username = mapped['username']
  if (!username) return null

  return {
    username,
    display_name: mapped['display_name'] || username,
    bio: mapped['bio'] || '',
    followers_count: parseInt(mapped['followers_count'] || '0', 10) || 0,
    following_count: parseInt(mapped['following_count'] || '0', 10) || 0,
    posts_count: parseInt(mapped['posts_count'] || '0', 10) || posts.length,
    posts,
  }
}

/**
 * 投稿数の制限チェック
 */
function limitPosts(posts: InstagramPostData[]): {
  posts: InstagramPostData[]
  warning: string | null
} {
  if (posts.length <= MAX_POSTS) {
    return { posts, warning: null }
  }
  return {
    posts: posts.slice(0, MAX_POSTS),
    warning: `投稿数が${MAX_POSTS}件を超えています（${posts.length}件）。先頭${MAX_POSTS}件のみ使用します。`,
  }
}
