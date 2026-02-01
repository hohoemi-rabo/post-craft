import type { InstagramAccount, ContainerStatus } from '@/types/instagram'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

/**
 * Exchange a short-lived token for a long-lived token (60 days)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<string> {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error('Facebook App ID or Secret is not configured')
  }

  const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', shortLivedToken)

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'Failed to exchange token')
  }

  return data.access_token
}

/**
 * Get Instagram Business Accounts linked to the user's Facebook Pages
 */
export async function getInstagramAccounts(
  longLivedToken: string
): Promise<InstagramAccount[]> {
  const url = new URL(`${GRAPH_API_BASE}/me/accounts`)
  url.searchParams.set(
    'fields',
    'id,name,access_token,instagram_business_account{id,username,profile_picture_url}'
  )
  url.searchParams.set('access_token', longLivedToken)

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'Failed to get accounts')
  }

  // Debug: Show raw pages data
  console.log('Facebook Pages response:', JSON.stringify(data, null, 2))

  const accounts: InstagramAccount[] = []

  for (const page of data.data || []) {
    console.log(`Page: ${page.name} (${page.id}), IG Account:`, page.instagram_business_account || 'none')
    if (page.instagram_business_account) {
      accounts.push({
        igAccountId: page.instagram_business_account.id,
        igUsername: page.instagram_business_account.username || '',
        igProfilePictureUrl:
          page.instagram_business_account.profile_picture_url || '',
        pageName: page.name,
        pageId: page.id,
        pageAccessToken: page.access_token,
      })
    }
  }

  return accounts
}

/**
 * Create a media container for Instagram Content Publishing
 */
export async function createMediaContainer(
  igAccountId: string,
  imageUrl: string,
  caption: string,
  accessToken: string
): Promise<string> {
  const url = `${GRAPH_API_BASE}/${igAccountId}/media`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'Failed to create media container')
  }

  return data.id
}

/**
 * Check the status of a media container
 */
export async function checkContainerStatus(
  containerId: string,
  accessToken: string
): Promise<ContainerStatus> {
  const url = new URL(`${GRAPH_API_BASE}/${containerId}`)
  url.searchParams.set('fields', 'status_code,status')
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'Failed to check container status')
  }

  return {
    statusCode: data.status_code,
    errorMessage: data.status,
  }
}

/**
 * Publish a media container to Instagram
 */
export async function publishMedia(
  igAccountId: string,
  containerId: string,
  accessToken: string
): Promise<string> {
  const url = `${GRAPH_API_BASE}/${igAccountId}/media_publish`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'Failed to publish media')
  }

  return data.id
}

/**
 * Wait for a container to be ready, then publish
 * Polls every 2 seconds, max 30 seconds
 */
export async function waitAndPublish(
  igAccountId: string,
  containerId: string,
  accessToken: string
): Promise<string> {
  const maxAttempts = 15
  const intervalMs = 2000

  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkContainerStatus(containerId, accessToken)

    if (status.statusCode === 'FINISHED') {
      return publishMedia(igAccountId, containerId, accessToken)
    }

    if (status.statusCode === 'ERROR' || status.statusCode === 'EXPIRED') {
      throw new Error(
        status.errorMessage || `Container failed with status: ${status.statusCode}`
      )
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Timed out waiting for media container to be ready')
}
