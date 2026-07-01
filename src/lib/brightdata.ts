import { mapRawItemsToInstagramData } from '@/lib/csv-parser'
import type { InstagramPostData, InstagramProfileData } from '@/types/analysis'

/**
 * Bright Data Web Scraper API 連携（Instagram 投稿データのリアルタイム取得）。
 *
 * CSV/JSON アップロード（Phase 1）の代替となる「入口」。取得後のデータは
 * mapRawItemsToInstagramData() で共通の内部データ構造に変換するため、
 * 以降の分析パイプライン（analysis-executor 等）はアップロード経路と完全に共通。
 *
 * Bright Data はジョブ型（非同期）API:
 *   1. trigger でジョブ投入 → snapshot_id を受領
 *   2. progress をポーリングして ready を待つ
 *   3. snapshot からデータ（JSON配列）を取得
 *
 * 環境変数:
 *   - BRIGHT_DATA_API_TOKEN            … Authorization: Bearer トークン（サーバーのみ）
 *   - BRIGHT_DATA_INSTAGRAM_DATASET_ID … Instagram Posts データセットID（例: gd_xxxx）
 */

const API_BASE = 'https://api.brightdata.com/datasets/v3'

/** 1回のジョブで取得する投稿数の上限（課金・タイムアウト対策） */
const MAX_NUM_OF_POSTS = 200
const DEFAULT_NUM_OF_POSTS = 30

/** ポーリング設定（合計 = POLL_INTERVAL_MS × MAX_POLLS ≈ 4.5分。route の maxDuration=300 以内） */
const POLL_INTERVAL_MS = 6000
const MAX_POLLS = 45

export class BrightDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BrightDataError'
  }
}

/** Bright Data 連携に必要な環境変数が揃っているか */
export function isBrightDataConfigured(): boolean {
  return Boolean(
    process.env.BRIGHT_DATA_API_TOKEN && process.env.BRIGHT_DATA_INSTAGRAM_DATASET_ID
  )
}

function getConfig(): { token: string; datasetId: string } {
  const token = process.env.BRIGHT_DATA_API_TOKEN
  const datasetId = process.env.BRIGHT_DATA_INSTAGRAM_DATASET_ID
  if (!token || !datasetId) {
    throw new BrightDataError('Bright Data の環境変数が設定されていません')
  }
  return { token, datasetId }
}

function normalizeUsername(accountName: string): string {
  return accountName.trim().replace(/^@/, '').replace(/\/+$/, '')
}

/** ジョブを投入して snapshot_id を得る */
async function triggerCollection(
  username: string,
  numOfPosts: number,
  token: string,
  datasetId: string
): Promise<string> {
  const url = new URL(`${API_BASE}/trigger`)
  url.searchParams.set('dataset_id', datasetId)
  url.searchParams.set('include_errors', 'true')
  // プロフィールURLから最新投稿を発見して収集するモード
  url.searchParams.set('type', 'discover_new')
  url.searchParams.set('discover_by', 'url')

  const body = [
    {
      url: `https://www.instagram.com/${username}/`,
      num_of_posts: numOfPosts,
    },
  ]

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new BrightDataError(
      `ジョブの投入に失敗しました (HTTP ${res.status})${text ? `: ${text.slice(0, 200)}` : ''}`
    )
  }

  const data = (await res.json()) as { snapshot_id?: string }
  if (!data.snapshot_id) {
    throw new BrightDataError('snapshot_id が返却されませんでした')
  }
  return data.snapshot_id
}

/** ジョブの進捗を確認する（running / ready / failed） */
async function checkProgress(snapshotId: string, token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/progress/${snapshotId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new BrightDataError(`進捗確認に失敗しました (HTTP ${res.status})`)
  }
  const data = (await res.json()) as { status?: string }
  return data.status || 'unknown'
}

/** 完了済みジョブのデータ（JSON配列）を取得する */
async function downloadSnapshot(
  snapshotId: string,
  token: string
): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${API_BASE}/snapshot/${snapshotId}?format=json`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new BrightDataError(`データ取得に失敗しました (HTTP ${res.status})`)
  }
  const data = await res.json()
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  // まれにオブジェクトでラップされて返るケースへのフォールバック
  if (data && Array.isArray(data.data)) return data.data as Record<string, unknown>[]
  throw new BrightDataError('想定外のレスポンス形式です')
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Instagram アカウントの投稿を Bright Data 経由で取得し、内部データ構造に変換して返す。
 *
 * @throws BrightDataError 設定不備・API失敗・タイムアウト時
 */
export async function fetchInstagramPostsViaBrightData(
  accountName: string,
  options?: { numOfPosts?: number }
): Promise<{ profile: InstagramProfileData | null; posts: InstagramPostData[]; warnings: string[] }> {
  const { token, datasetId } = getConfig()
  const username = normalizeUsername(accountName)
  if (!username) {
    throw new BrightDataError('アカウント名が空です')
  }

  const numOfPosts = Math.min(
    Math.max(options?.numOfPosts ?? DEFAULT_NUM_OF_POSTS, 1),
    MAX_NUM_OF_POSTS
  )

  // 1. ジョブ投入
  const snapshotId = await triggerCollection(username, numOfPosts, token, datasetId)

  // 2. 完了までポーリング
  let ready = false
  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL_MS)
    const status = await checkProgress(snapshotId, token)
    if (status === 'ready') {
      ready = true
      break
    }
    if (status === 'failed') {
      throw new BrightDataError('Bright Data のジョブが失敗しました')
    }
    // running / building / collecting 等は継続
  }

  if (!ready) {
    throw new BrightDataError(
      'データ取得がタイムアウトしました。取得件数を減らすか、時間をおいて再試行してください'
    )
  }

  // 3. データ取得 → 内部構造へ変換
  const rawItems = await downloadSnapshot(snapshotId, token)
  if (rawItems.length === 0) {
    throw new BrightDataError('投稿データを取得できませんでした（アカウント名を確認してください）')
  }

  // 先頭レコードにプロフィール系フィールド（followers 等）が含まれるため profile 抽出に利用
  const { profile, posts, warnings } = mapRawItemsToInstagramData(rawItems, rawItems[0])

  if (posts.length === 0) {
    throw new BrightDataError('有効な投稿データが見つかりませんでした')
  }

  return { profile, posts, warnings }
}
