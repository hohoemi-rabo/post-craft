import { NextResponse } from 'next/server'
import {
  exchangeForLongLivedToken,
  getInstagramAccounts,
} from '@/lib/instagram'
import { requireAuth } from '@/lib/api-utils'

export async function POST(request: Request) {
  const { error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      )
    }

    // Exchange for long-lived token
    console.log('Exchanging token...')
    const longLivedToken = await exchangeForLongLivedToken(accessToken)
    console.log('Token exchanged successfully')

    // Get Instagram Business Accounts
    console.log('Fetching Instagram accounts...')
    const accounts = await getInstagramAccounts(longLivedToken)
    console.log('Found accounts:', accounts.length)

    if (accounts.length === 0) {
      return NextResponse.json(
        {
          error:
            'Instagram Business Accountが見つかりません。FacebookページにInstagramビジネスアカウントが紐づけられているか確認してください。',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Instagram accounts error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to get accounts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
