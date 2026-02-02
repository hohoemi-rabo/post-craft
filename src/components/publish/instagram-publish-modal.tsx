'use client'

import { useCallback, useEffect, useState } from 'react'
import { useInstagram } from '@/components/providers/instagram-provider'
import { AccountSelector } from '@/components/publish/account-selector'
import { PublishPreview } from '@/components/publish/publish-preview'
import type { PublishModalStep } from '@/types/instagram'

interface InstagramPublishModalProps {
  isOpen: boolean
  onClose: () => void
  caption: string
  imageUrl: string
  postId?: string
  onPublishSuccess?: () => void
}

export function InstagramPublishModal({
  isOpen,
  onClose,
  caption,
  imageUrl,
  postId,
  onPublishSuccess,
}: InstagramPublishModalProps) {
  const {
    sdkLoaded,
    isLoggedIn,
    isLoggingIn,
    accounts,
    selectedAccount,
    error: contextError,
    login,
    selectAccount,
    clearError,
  } = useInstagram()

  const [step, setStep] = useState<PublishModalStep>('login')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [mediaId, setMediaId] = useState<string | null>(null)

  // Determine initial step based on context state
  useEffect(() => {
    if (!isOpen) return

    if (isLoggingIn) {
      setStep('logging_in')
    } else if (!isLoggedIn) {
      setStep('login')
    } else if (!selectedAccount && accounts.length > 1) {
      setStep('select_account')
    } else if (selectedAccount) {
      setStep('confirm')
    }
  }, [isOpen, isLoggedIn, isLoggingIn, selectedAccount, accounts.length])

  // Handle context error
  useEffect(() => {
    if (contextError) {
      setPublishError(contextError)
      setStep('error')
    }
  }, [contextError])

  const handlePublish = useCallback(
    async (editedCaption: string) => {
      if (!selectedAccount) return

      setStep('publishing')
      setPublishError(null)

      try {
        const response = await fetch('/api/instagram/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            caption: editedCaption,
            igAccountId: selectedAccount.igAccountId,
            accessToken: selectedAccount.pageAccessToken,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '投稿に失敗しました')
        }

        setMediaId(data.mediaId)
        setStep('success')

        // Update publish status in database
        if (postId) {
          try {
            await fetch(`/api/posts/${postId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instagram_published: true,
                instagram_media_id: data.mediaId,
              }),
            })
            onPublishSuccess?.()
          } catch {
            // Status update failure is non-critical
            console.error('Failed to update publish status')
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '投稿に失敗しました'
        setPublishError(message)
        setStep('error')
      }
    },
    [selectedAccount, imageUrl, postId, onPublishSuccess]
  )

  const handleRetry = useCallback(() => {
    setPublishError(null)
    clearError()
    if (isLoggedIn && selectedAccount) {
      setStep('confirm')
    } else {
      setStep('login')
    }
  }, [isLoggedIn, selectedAccount, clearError])

  const handleClose = useCallback(() => {
    setPublishError(null)
    setMediaId(null)
    onClose()
  }, [onClose])

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'publishing') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, step, handleClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'publishing') {
          handleClose()
        }
      }}
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Instagramに投稿</h2>
          {step !== 'publishing' && (
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              aria-label="閉じる"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Step: login */}
        {step === 'login' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm text-center">
              Instagramに投稿するにはFacebookでログインしてください
            </p>
            <button
              onClick={login}
              disabled={!sdkLoaded}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebookでログイン</span>
            </button>
            {!sdkLoaded && (
              <p className="text-slate-500 text-xs text-center">
                Facebook SDKを読み込み中...
              </p>
            )}
          </div>
        )}

        {/* Step: logging_in */}
        {step === 'logging_in' && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">アカウント情報を取得中...</p>
          </div>
        )}

        {/* Step: select_account */}
        {step === 'select_account' && (
          <AccountSelector
            accounts={accounts}
            onSelect={(account) => {
              selectAccount(account)
              setStep('confirm')
            }}
          />
        )}

        {/* Step: confirm */}
        {step === 'confirm' && selectedAccount && (
          <PublishPreview
            account={selectedAccount}
            imageUrl={imageUrl}
            caption={caption}
            onPublish={handlePublish}
            onBack={() => {
              if (accounts.length > 1) {
                setStep('select_account')
              } else {
                handleClose()
              }
            }}
            isPublishing={false}
          />
        )}

        {/* Step: publishing */}
        {step === 'publishing' && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Instagramに投稿中...</p>
            <p className="text-slate-500 text-sm mt-2">
              しばらくお待ちください
            </p>
          </div>
        )}

        {/* Step: success */}
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">投稿完了!</h3>
              <p className="text-slate-400 text-sm">
                Instagramへの投稿が完了しました
              </p>
              {mediaId && (
                <p className="text-slate-500 text-xs mt-1">
                  Media ID: {mediaId}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-colors text-center"
              >
                Instagramで確認する
              </a>
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* Step: error */}
        {step === 'error' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">😥</div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                エラーが発生しました
              </h3>
              <p className="text-red-400 text-sm break-all">
                {publishError || '不明なエラーが発生しました'}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
              >
                やり直す
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 text-slate-500 hover:text-slate-400 transition-colors text-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
