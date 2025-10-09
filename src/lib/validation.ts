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
    return 'URLを入力してください'
  }

  if (!isValidUrl(url)) {
    return '有効なURLを入力してください（例: https://example.com/blog/post）'
  }

  return null
}
