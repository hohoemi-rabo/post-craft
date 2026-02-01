// Facebook SDK types
declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string
        cookie?: boolean
        xfbml?: boolean
        version: string
      }) => void
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: { scope: string }
      ) => void
      getLoginStatus: (
        callback: (response: FacebookLoginResponse) => void
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

// Facebook Login
export interface FacebookAuthResponse {
  accessToken: string
  expiresIn: number
  userID: string
}

export interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse: FacebookAuthResponse | null
}

// Instagram Account
export interface InstagramAccount {
  igAccountId: string
  igUsername: string
  igProfilePictureUrl: string
  pageName: string
  pageId: string
  pageAccessToken: string
}

// API responses
export interface InstagramAccountsResponse {
  accounts: InstagramAccount[]
}

export interface InstagramPublishResponse {
  success: true
  mediaId: string
}

export interface InstagramErrorResponse {
  error: string
  details?: string
}

// Container status
export type ContainerStatusCode = 'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED' | 'PUBLISHED'

export interface ContainerStatus {
  statusCode: ContainerStatusCode
  errorMessage?: string
}

// Publish page state (standalone /publish page)
export type PublishStep =
  | 'idle'
  | 'logging_in'
  | 'selecting_account'
  | 'composing'
  | 'publishing'
  | 'completed'
  | 'error'

// Publish modal state (dashboard integration)
export type PublishModalStep =
  | 'login'
  | 'logging_in'
  | 'select_account'
  | 'confirm'
  | 'publishing'
  | 'success'
  | 'error'
