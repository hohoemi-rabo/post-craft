import { ERROR_MESSAGES } from './error-messages'

/**
 * URLの形式をチェック
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false
  }

  try {
    const urlObj = new URL(url)
    // http または https のみ許可
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * URLバリデーションエラーメッセージを取得
 */
export function getUrlValidationError(url: string): string | null {
  if (!url || url.trim() === '') {
    return ERROR_MESSAGES.URL_REQUIRED
  }

  if (!isValidUrl(url)) {
    return ERROR_MESSAGES.INVALID_URL
  }

  return null
}
