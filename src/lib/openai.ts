import OpenAI from 'openai'

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// システムプロンプト
const SYSTEM_PROMPT = `あなたはInstagram投稿用のコンテンツを生成する専門家です。
ブログ記事の内容から、Instagram投稿に最適なキャプションとハッシュタグを生成してください。

## 出力仕様

1. **caption（キャプション）**
   - 100〜150文字の要約文
   - ビジネス寄りのトーン
   - 絵文字は使用しない
   - 改行なし
   - 記事の核心的な価値を簡潔に伝える

2. **hashtags（ハッシュタグ）**
   - 合計10個
   - 8個：記事の内容に関連するハッシュタグ
   - 2個：汎用的なハッシュタグ（例：#ブログ更新 #新着記事）
   - 日本語中心（必要に応じて英語も可）
   - #マークは含めない

## 出力形式

必ずJSON形式で出力してください：
{
  "caption": "キャプション文",
  "hashtags": ["ハッシュタグ1", "ハッシュタグ2", "ハッシュタグ3", ...]
}`

export interface GeneratedContent {
  caption: string
  hashtags: string[]
}

export interface GenerateOptions {
  maxRetries?: number
  timeout?: number
}

/**
 * ブログ記事からInstagram投稿コンテンツを生成
 * @param content - ブログ記事の本文
 * @param title - ブログ記事のタイトル（オプション）
 * @param options - 生成オプション
 * @returns 生成されたキャプションとハッシュタグ
 */
export async function generatePostContent(
  content: string,
  title?: string,
  options: GenerateOptions = {}
): Promise<GeneratedContent> {
  const { maxRetries = 3, timeout = 30000 } = options

  // コンテンツの長さを制限（トークン削減のため）
  const maxContentLength = 8000
  const truncatedContent =
    content.length > maxContentLength
      ? content.substring(0, maxContentLength) + '...'
      : content

  // ユーザーメッセージの構築
  let userMessage = ''
  if (title) {
    userMessage += `# タイトル\n${title}\n\n`
  }
  userMessage += `# 本文\n${truncatedContent}`

  let lastError: Error | null = null

  // リトライロジック
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // タイムアウト制御
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
        },
        {
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      // レスポンスのパース
      const responseContent = response.choices[0]?.message?.content

      if (!responseContent) {
        throw new Error('OpenAI APIからのレスポンスが空です')
      }

      const result = JSON.parse(responseContent) as GeneratedContent

      // バリデーション
      if (!result.caption || !Array.isArray(result.hashtags)) {
        throw new Error('生成されたコンテンツの形式が不正です')
      }

      if (result.hashtags.length !== 10) {
        console.warn(
          `ハッシュタグの数が10個ではありません: ${result.hashtags.length}個`
        )
      }

      return result
    } catch (error: unknown) {
      lastError = error as Error

      // タイムアウトエラー
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`試行 ${attempt}/${maxRetries}: タイムアウトしました`)
      }
      // その他のエラー
      else {
        console.error(
          `試行 ${attempt}/${maxRetries}: エラーが発生しました`,
          error
        )
      }

      // 最後の試行でなければ、少し待ってからリトライ
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // 指数バックオフ（最大5秒）
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  // すべての試行が失敗した場合
  throw new Error(
    `OpenAI APIの呼び出しに失敗しました（${maxRetries}回試行）: ${lastError?.message || '不明なエラー'}`
  )
}

/**
 * APIキーが設定されているかチェック
 */
export function hasApiKey(): boolean {
  return !!process.env.OPENAI_API_KEY
}
