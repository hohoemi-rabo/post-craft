'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { InstagramAccount } from '@/types/instagram'

interface InstagramContextType {
  sdkLoaded: boolean
  isLoggedIn: boolean
  isLoggingIn: boolean
  accounts: InstagramAccount[]
  selectedAccount: InstagramAccount | null
  error: string | null
  login: () => void
  logout: () => void
  selectAccount: (account: InstagramAccount) => void
  clearError: () => void
}

const InstagramContext = createContext<InstagramContextType | null>(null)

export function useInstagram() {
  const context = useContext(InstagramContext)
  if (!context) {
    throw new Error('useInstagram must be used within InstagramPublishProvider')
  }
  return context
}

export function InstagramPublishProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [accounts, setAccounts] = useState<InstagramAccount[]>([])
  const [selectedAccount, setSelectedAccount] =
    useState<InstagramAccount | null>(null)
  const [error, setError] = useState<string | null>(null)

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID

  useEffect(() => {
    if (!appId) return

    const initFB = () => {
      if (window.FB) {
        window.FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version: 'v21.0',
        })
        setSdkLoaded(true)
      }
    }

    if (window.FB) {
      initFB()
    } else {
      window.fbAsyncInit = initFB
    }
  }, [appId])

  const fetchAccounts = useCallback(async (accessToken: string) => {
    const response = await fetch('/api/instagram/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'アカウント情報の取得に失敗しました')
    }

    return data.accounts as InstagramAccount[]
  }, [])

  const login = useCallback(() => {
    if (!window.FB) {
      setError(
        'Facebook SDKの読み込みに失敗しました。ページを再読み込みしてください。'
      )
      return
    }

    setIsLoggingIn(true)
    setError(null)

    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          try {
            const fetchedAccounts = await fetchAccounts(
              response.authResponse.accessToken
            )
            setAccounts(fetchedAccounts)
            setIsLoggedIn(true)

            if (fetchedAccounts.length === 1) {
              setSelectedAccount(fetchedAccounts[0])
            }
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'アカウント情報の取得に失敗しました'
            setError(message)
          }
        } else {
          setError('Facebookログインがキャンセルされました')
        }
        setIsLoggingIn(false)
      },
      {
        scope: 'instagram_basic,instagram_content_publish,pages_show_list',
      }
    )
  }, [fetchAccounts])

  const logout = useCallback(() => {
    setIsLoggedIn(false)
    setAccounts([])
    setSelectedAccount(null)
    setError(null)
  }, [])

  const selectAccount = useCallback((account: InstagramAccount) => {
    setSelectedAccount(account)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <InstagramContext.Provider
      value={{
        sdkLoaded,
        isLoggedIn,
        isLoggingIn,
        accounts,
        selectedAccount,
        error,
        login,
        logout,
        selectAccount,
        clearError,
      }}
    >
      {children}
    </InstagramContext.Provider>
  )
}
