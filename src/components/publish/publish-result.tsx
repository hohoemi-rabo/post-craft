'use client'

interface PublishResultProps {
  success: boolean
  mediaId?: string
  errorMessage?: string
  onNewPost: () => void
}

export function PublishResult({
  success,
  mediaId,
  errorMessage,
  onNewPost,
}: PublishResultProps) {
  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">投稿完了!</h2>
          <p className="text-slate-400">
            Instagramへの投稿が完了しました
          </p>
          {mediaId && (
            <p className="text-slate-500 text-sm mt-2">
              Media ID: {mediaId}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all duration-200 text-center"
          >
            Instagramで確認する
          </a>
          <button
            onClick={onNewPost}
            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium rounded-xl transition-all duration-200"
          >
            新しい投稿を作成
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">😥</div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          エラーが発生しました
        </h2>
        <p className="text-red-400 text-sm break-all">
          {errorMessage || '不明なエラーが発生しました'}
        </p>
      </div>

      <button
        onClick={onNewPost}
        className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium rounded-xl transition-all duration-200"
      >
        やり直す
      </button>
    </div>
  )
}
