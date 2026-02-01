'use client'

import { useState } from 'react'

interface FacebookLoginButtonProps {
  onLoginSuccess: (accessToken: string) => void
  onLoginError: (error: string) => void
  disabled?: boolean
}

export function FacebookLoginButton({
  onLoginSuccess,
  onLoginError,
  disabled,
}: FacebookLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    if (!window.FB) {
      onLoginError('Facebook SDKの読み込みに失敗しました。ページを再読み込みしてください。')
      return
    }

    setIsLoading(true)

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          onLoginSuccess(response.authResponse.accessToken)
        } else {
          onLoginError('Facebookログインがキャンセルされました')
        }
        setIsLoading(false)
      },
      {
        scope:
          'instagram_basic,instagram_content_publish,pages_show_list',
      }
    )
  }

  return (
    <button
      onClick={handleLogin}
      disabled={disabled || isLoading}
      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )}
      <span>{isLoading ? 'ログイン中...' : 'Facebookでログイン'}</span>
    </button>
  )
}
