import { ERROR_MESSAGES } from './error-messages'

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface FetchOptions extends RequestInit {
  timeout?: number
  maxRetries?: number
}

/**
 * タイムアウト付きfetch
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError(ERROR_MESSAGES.TIMEOUT_ERROR, 408, true)
      }
      if (error.message.includes('fetch')) {
        throw new APIError(ERROR_MESSAGES.NETWORK_ERROR, undefined, true)
      }
    }

    throw error
  }
}

/**
 * リトライ付きfetch
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { maxRetries = 3, ...fetchOptions } = options
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions)

      // HTTPエラーステータスのハンドリング
      if (!response.ok) {
        const isRetryable = response.status >= 500 || response.status === 429

        // レスポンスボディからエラーメッセージを取得
        let errorMessage = ERROR_MESSAGES.API_FAILED
        try {
          const data = await response.json()
          if (data.error) {
            errorMessage = data.error
          }
        } catch {
          // JSONパースエラーは無視
        }

        throw new APIError(errorMessage, response.status, isRetryable)
      }

      return response
    } catch (error) {
      lastError = error as Error

      // リトライ可能かチェック
      const isRetryable =
        error instanceof APIError ? error.retryable : false

      // 最後の試行またはリトライ不可の場合は即座にエラーを投げる
      if (attempt === maxRetries - 1 || !isRetryable) {
        throw lastError
      }

      // Exponential backoff: 1秒、2秒、4秒...
      const backoffMs = 1000 * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, backoffMs))
    }
  }

  throw lastError!
}

/**
 * POST リクエスト
 */
export async function apiPost<T = unknown>(
  url: string,
  data: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  })

  const result = await response.json()
  return result as T
}

/**
 * GET リクエスト
 */
export async function apiGet<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    method: 'GET',
    ...options,
  })

  const result = await response.json()
  return result as T
}
