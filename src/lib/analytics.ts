/**
 * Google Analytics イベント追跡
 */

// グローバルなgtag関数の型定義
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void
  }
}

/**
 * カスタムイベントを送信
 * @param eventName イベント名
 * @param params イベントパラメータ
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, unknown>
) => {
  // クライアントサイドかつgtagが存在する場合のみ実行
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)

    // 開発環境ではコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, params)
    }
  }
}

/**
 * 投稿生成開始イベント
 */
export const trackGenerateStart = (source: 'url' | 'manual') => {
  trackEvent('generate_post', {
    source,
    timestamp: new Date().toISOString(),
  })
}

/**
 * 投稿生成成功イベント
 */
export const trackGenerateSuccess = (params: {
  source: 'url' | 'manual'
  contentLength: number
  hashtagCount: number
  processingTime?: number
}) => {
  trackEvent('generation_success', params)
}

/**
 * 投稿生成エラーイベント
 */
export const trackGenerateError = (params: {
  source: 'url' | 'manual'
  errorMessage: string
  errorCode?: string
}) => {
  trackEvent('generation_error', params)
}

/**
 * 画像ダウンロードイベント
 */
export const trackImageDownload = (bgColorIndex: number) => {
  trackEvent('download_image', {
    bg_color_index: bgColorIndex,
  })
}

/**
 * キャプション・ハッシュタグコピーイベント
 */
export const trackCopyCaption = (params: {
  captionLength: number
  hashtagCount: number
  hasCustomHashtags: boolean
}) => {
  trackEvent('copy_caption', params)
}

/**
 * Instagram起動イベント
 */
export const trackOpenInstagram = (platform: 'mobile' | 'desktop') => {
  trackEvent('open_instagram', {
    platform,
  })
}

/**
 * 投稿準備フロー完了イベント
 */
export const trackPostAssistComplete = () => {
  trackEvent('post_assist_complete', {
    timestamp: new Date().toISOString(),
  })
}

/**
 * ハッシュタグ追加イベント
 */
export const trackAddHashtag = (isCustom: boolean) => {
  trackEvent('add_hashtag', {
    is_custom: isCustom,
  })
}

/**
 * 画像背景色変更イベント
 */
export const trackChangeBgColor = (colorIndex: number) => {
  trackEvent('change_bg_color', {
    color_index: colorIndex,
  })
}
