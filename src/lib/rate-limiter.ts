import Cookies from 'js-cookie'

const COOKIE_NAME = 'post_generation_count'
const COOKIE_DATE = 'post_generation_date'
const MAX_DAILY_USES = 5

/**
 * 本日の残り使用回数を取得
 */
export function getRemainingUses(): number {
  const today = new Date().toDateString()
  const savedDate = Cookies.get(COOKIE_DATE)

  // 日付が変わった場合はリセット
  if (savedDate !== today) {
    Cookies.set(COOKIE_DATE, today, { expires: 1 })
    Cookies.set(COOKIE_NAME, '0', { expires: 1 })
    return MAX_DAILY_USES
  }

  const count = parseInt(Cookies.get(COOKIE_NAME) || '0', 10)
  return Math.max(0, MAX_DAILY_USES - count)
}

/**
 * 使用回数をインクリメント
 * @returns 制限内であればtrue、制限超過であればfalse
 */
export function incrementUsage(): boolean {
  const remaining = getRemainingUses()

  if (remaining <= 0) {
    return false // 制限超過
  }

  const count = parseInt(Cookies.get(COOKIE_NAME) || '0', 10)
  Cookies.set(COOKIE_NAME, String(count + 1), { expires: 1 })
  return true
}

/**
 * 生成可能かどうかをチェック
 */
export function canGenerate(): boolean {
  // 開発環境での制限解除
  if (process.env.NEXT_PUBLIC_DISABLE_RATE_LIMIT === 'true') {
    return true
  }

  return getRemainingUses() > 0
}

/**
 * 最大使用回数を取得
 */
export function getMaxDailyUses(): number {
  return MAX_DAILY_USES
}
