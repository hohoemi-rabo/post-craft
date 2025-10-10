export const ERROR_MESSAGES = {
  // URL関連
  INVALID_URL: '有効なURLを入力してください',
  URL_REQUIRED: 'URLを入力してください',

  // スクレイピング関連
  SCRAPING_FAILED:
    '記事の取得に失敗しました。URLを確認するか、記事を直接入力してください',
  CONTENT_TOO_SHORT: '記事本文が短すぎます（最低100文字必要です）',
  CONTENT_REQUIRED: '記事本文を入力してください',

  // API関連
  API_TIMEOUT: '処理に時間がかかっています。もう一度お試しください',
  API_FAILED: '生成に失敗しました。しばらく待ってからお試しください',
  GENERATION_FAILED: 'コンテンツの生成に失敗しました',

  // レート制限
  RATE_LIMIT_EXCEEDED: '本日の生成回数を使い切りました。明日また5回ご利用いただけます。',

  // ネットワーク関連
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
  TIMEOUT_ERROR: 'タイムアウトしました。もう一度お試しください',

  // 一般エラー
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
  SESSION_ERROR: 'セッションが切れました。もう一度やり直してください',
  DATA_NOT_FOUND: 'コンテンツが見つかりません。もう一度やり直してください。',

  // 画像関連
  IMAGE_GENERATION_FAILED: '画像の生成に失敗しました',
  IMAGE_DOWNLOAD_FAILED: '画像のダウンロードに失敗しました',

  // クリップボード関連
  COPY_FAILED: 'コピーに失敗しました',
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES

export function getErrorMessage(key: ErrorMessageKey, fallback?: string): string {
  return ERROR_MESSAGES[key] || fallback || ERROR_MESSAGES.UNKNOWN_ERROR
}
