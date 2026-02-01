'use client'

import Script from 'next/script'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import type { InstagramAccount, PublishStep } from '@/types/instagram'
import { FacebookLoginButton } from '@/components/publish/facebook-login-button'
import { AccountSelector } from '@/components/publish/account-selector'
import { PublishForm } from '@/components/publish/publish-form'
import { PublishResult } from '@/components/publish/publish-result'

export default function PublishPage() {
  const [step, setStep] = useState<PublishStep>('idle')
  const [accounts, setAccounts] = useState<InstagramAccount[]>([])
  const [selectedAccount, setSelectedAccount] =
    useState<InstagramAccount | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mediaId, setMediaId] = useState<string | null>(null)
  const [sdkLoaded, setSdkLoaded] = useState(false)

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID

  const handleFBSDKLoad = useCallback(() => {
    if (window.FB && appId) {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v21.0',
      })
      setSdkLoaded(true)
    }
  }, [appId])

  const handleLoginSuccess = useCallback(async (accessToken: string) => {
    setStep('logging_in')
    setError(null)

    try {
      const response = await fetch('/api/instagram/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アカウント情報の取得に失敗しました')
      }

      setAccounts(data.accounts)

      // Auto-select if only one account
      if (data.accounts.length === 1) {
        setSelectedAccount(data.accounts[0])
        setStep('composing')
      } else {
        setStep('selecting_account')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(message)
      setStep('error')
    }
  }, [])

  const handleLoginError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setStep('error')
  }, [])

  const handleAccountSelect = useCallback((account: InstagramAccount) => {
    setSelectedAccount(account)
    setStep('composing')
  }, [])

  const handlePublish = useCallback(
    async (image: File, caption: string) => {
      if (!selectedAccount) return

      setStep('publishing')
      setError(null)

      try {
        const formData = new FormData()
        formData.append('image', image)
        formData.append('caption', caption)
        formData.append('igAccountId', selectedAccount.igAccountId)
        formData.append('accessToken', selectedAccount.pageAccessToken)

        const response = await fetch('/api/instagram/publish', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '投稿に失敗しました')
        }

        setMediaId(data.mediaId)
        setStep('completed')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '投稿に失敗しました'
        setError(message)
        setStep('error')
      }
    },
    [selectedAccount]
  )

  const handleNewPost = useCallback(() => {
    setStep(selectedAccount ? 'composing' : 'idle')
    setError(null)
    setMediaId(null)
  }, [selectedAccount])

  const handleReset = useCallback(() => {
    setStep('idle')
    setAccounts([])
    setSelectedAccount(null)
    setError(null)
    setMediaId(null)
  }, [])

  return (
    <>
      <Script
        src="https://connect.facebook.net/ja_JP/sdk.js"
        strategy="afterInteractive"
        onLoad={handleFBSDKLoad}
      />

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Instagram 投稿
              </h1>
              <p className="text-slate-400 text-sm">
                写真とキャプションを入力して投稿
              </p>
            </div>

            {/* Step: idle - Facebook Login */}
            {step === 'idle' && (
              <div className="space-y-4">
                <FacebookLoginButton
                  onLoginSuccess={handleLoginSuccess}
                  onLoginError={handleLoginError}
                  disabled={!sdkLoaded}
                />
                {!sdkLoaded && (
                  <p className="text-slate-500 text-xs text-center">
                    Facebook SDKを読み込み中...
                  </p>
                )}
              </div>
            )}

            {/* Step: logging_in - Loading */}
            {step === 'logging_in' && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">
                  アカウント情報を取得中...
                </p>
              </div>
            )}

            {/* Step: selecting_account */}
            {step === 'selecting_account' && (
              <AccountSelector
                accounts={accounts}
                onSelect={handleAccountSelect}
              />
            )}

            {/* Step: composing - Post Form */}
            {step === 'composing' && selectedAccount && (
              <PublishForm
                account={selectedAccount}
                onPublish={handlePublish}
                isPublishing={false}
              />
            )}

            {/* Step: publishing - Loading */}
            {step === 'publishing' && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">
                  Instagramに投稿中...
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  しばらくお待ちください
                </p>
              </div>
            )}

            {/* Step: completed */}
            {step === 'completed' && (
              <PublishResult
                success={true}
                mediaId={mediaId || undefined}
                onNewPost={handleNewPost}
              />
            )}

            {/* Step: error */}
            {step === 'error' && (
              <PublishResult
                success={false}
                errorMessage={error || undefined}
                onNewPost={handleReset}
              />
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-400 text-sm transition-colors"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
