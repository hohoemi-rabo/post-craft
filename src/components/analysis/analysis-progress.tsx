'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AnalysisConfig } from './analysis-wizard'

interface AnalysisProgressProps {
  config: AnalysisConfig
  onComplete: (analysisId: string) => void
}

interface ProgressStep {
  label: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  detail?: string
}

export function AnalysisProgress({ config, onComplete }: AnalysisProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const abortRef = useRef(false)
  const hasStartedRef = useRef(false)

  const hasInstagram = config.sourceTypes.includes('instagram')
  const hasBlog = config.sourceTypes.includes('blog')

  const updateStep = useCallback((index: number, update: Partial<ProgressStep>) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...update } : s))
  }, [])

  const startAnalysis = useCallback(async () => {
    // 進捗ステップを初期化
    const igIsApi = config.instagram?.dataSource === 'api'
    const initialSteps: ProgressStep[] = []
    if (hasInstagram) {
      initialSteps.push({ label: '分析レコードを作成中...', status: 'pending' })
      initialSteps.push({
        label: igIsApi ? 'Instagram データを取得中...' : 'ファイルをアップロード中...',
        status: 'pending',
      })
    }
    if (hasBlog) {
      if (!hasInstagram) {
        initialSteps.push({ label: '分析レコードを作成中...', status: 'pending' })
      }
      initialSteps.push({ label: 'ブログ記事を取得中...', status: 'pending' })
    }
    initialSteps.push({ label: 'AI分析を待機中...', status: 'pending' })
    setSteps(initialSteps)

    let stepIndex = 0
    let igAnalysisId: string | null = null
    let blogAnalysisId: string | null = null

    try {
      // ─── Instagram フロー ───
      if (hasInstagram && config.instagram) {
        // 1. 分析レコード作成
        updateStep(stepIndex, { status: 'in-progress' })
        const createRes = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: 'instagram',
            sourceIdentifier: config.instagram.accountName,
            sourceDisplayName: `@${config.instagram.accountName}`,
            dataSource: igIsApi ? 'api' : 'upload',
          }),
        })

        if (!createRes.ok) {
          throw new Error('Instagram 分析レコードの作成に失敗しました')
        }

        const createData = await createRes.json()
        igAnalysisId = createData.id
        // igAnalysisId will be used as finalId
        updateStep(stepIndex, { status: 'completed', label: '分析レコードを作成しました' })
        stepIndex++

        if (abortRef.current) return

        // 2. データ取得（API直接取得 or ファイルアップロード）
        if (igIsApi) {
          updateStep(stepIndex, {
            status: 'in-progress',
            label: 'Instagram データを取得中...（数分かかる場合があります）',
          })

          const fetchRes = await fetch('/api/analysis/fetch-instagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysisId: igAnalysisId,
              accountName: config.instagram.accountName,
              numOfPosts: config.instagram.numOfPosts,
            }),
          })

          if (!fetchRes.ok) {
            const fetchData = await fetchRes.json()
            throw new Error(fetchData.error || 'Instagram データの取得に失敗しました')
          }

          const fetchData = await fetchRes.json()
          updateStep(stepIndex, {
            status: 'completed',
            label: 'Instagram データを取得しました',
            detail: `${fetchData.postCount}件の投稿を取得`,
          })
          stepIndex++
        } else {
          updateStep(stepIndex, { status: 'in-progress' })
          const formData = new FormData()
          formData.append('file', config.instagram.file!)
          formData.append('analysisId', igAnalysisId!)

          const uploadRes = await fetch('/api/analysis/upload', {
            method: 'POST',
            body: formData,
          })

          if (!uploadRes.ok) {
            const uploadData = await uploadRes.json()
            throw new Error(uploadData.error || 'ファイルのアップロードに失敗しました')
          }

          const uploadData = await uploadRes.json()
          updateStep(stepIndex, {
            status: 'completed',
            label: 'ファイルをアップロードしました',
            detail: `${uploadData.postCount}件の投稿を検出`,
          })
          stepIndex++
        }
      }

      if (abortRef.current) return

      // ─── ブログ フロー ───
      if (hasBlog && config.blog) {
        // 1. 分析レコード作成（Instagram フローがなかった場合のみ）
        if (!hasInstagram) {
          updateStep(stepIndex, { status: 'in-progress' })
          const createRes = await fetch('/api/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceType: 'blog',
              sourceIdentifier: config.blog.blogUrl,
              sourceDisplayName: config.blog.blogName || config.blog.blogUrl,
              dataSource: 'crawl',
            }),
          })

          if (!createRes.ok) {
            throw new Error('ブログ分析レコードの作成に失敗しました')
          }

          const createData = await createRes.json()
          blogAnalysisId = createData.id
          // blogAnalysisId will be used as finalId
          updateStep(stepIndex, { status: 'completed', label: '分析レコードを作成しました' })
          stepIndex++
        } else {
          // Instagram と合わせる場合、ブログも別レコード
          const createRes = await fetch('/api/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceType: 'blog',
              sourceIdentifier: config.blog.blogUrl,
              sourceDisplayName: config.blog.blogName || config.blog.blogUrl,
              dataSource: 'crawl',
            }),
          })

          if (!createRes.ok) {
            throw new Error('ブログ分析レコードの作成に失敗しました')
          }

          const createData = await createRes.json()
          blogAnalysisId = createData.id
        }

        if (abortRef.current) return

        // 2. ブログクロール
        updateStep(stepIndex, { status: 'in-progress', label: 'ブログ記事を取得中...（数分かかる場合があります）' })

        const crawlRes = await fetch('/api/analysis/blog-crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blogUrl: config.blog.blogUrl,
            blogName: config.blog.blogName,
            sitemapUrl: config.blog.sitemapUrl,
            analysisId: blogAnalysisId,
          }),
        })

        if (!crawlRes.ok) {
          const crawlData = await crawlRes.json()
          throw new Error(crawlData.error || 'ブログのクロールに失敗しました')
        }

        const crawlData = await crawlRes.json()
        updateStep(stepIndex, {
          status: 'completed',
          label: 'ブログ記事を取得しました',
          detail: `${crawlData.postCount}件の記事を取得（${crawlData.strategy}）`,
        })
        stepIndex++
      }

      if (abortRef.current) return

      // ─── AI 分析ポーリング ───
      const analysisIdsToTrack = [igAnalysisId, blogAnalysisId].filter(Boolean) as string[]

      updateStep(stepIndex, { status: 'in-progress', label: 'AIが分析しています...' })

      const pollAnalysis = async (): Promise<void> => {
        const maxPolls = 90 // 最大3分（2秒 × 90 = 180秒）
        let pollCount = 0

        while (pollCount < maxPolls && !abortRef.current) {
          await new Promise(r => setTimeout(r, 2000))
          pollCount++
          if (abortRef.current) return

          const statuses = await Promise.all(
            analysisIdsToTrack.map(async (id) => {
              const res = await fetch(`/api/analysis/${id}/status`)
              if (!res.ok) throw new Error('ステータスの取得に失敗しました')
              return res.json()
            })
          )

          const allCompleted = statuses.every((s: { status: string }) => s.status === 'completed')
          const failed = statuses.find((s: { status: string }) => s.status === 'failed') as { error_message?: string } | undefined

          if (failed) {
            throw new Error(failed.error_message || 'AI分析に失敗しました')
          }

          if (allCompleted) {
            updateStep(stepIndex, { status: 'completed', label: 'AI分析が完了しました' })
            return
          }

          // analyzing 中は経過表示を更新
          const elapsed = pollCount * 2
          updateStep(stepIndex, {
            status: 'in-progress',
            label: 'AIが分析しています...',
            detail: `経過時間: ${elapsed}秒`,
          })
        }

        if (!abortRef.current) {
          throw new Error('分析がタイムアウトしました')
        }
      }

      await pollAnalysis()

      // 完了 → 遷移
      setIsCompleted(true)
      const finalId = igAnalysisId || blogAnalysisId
      if (finalId && !abortRef.current) {
        setTimeout(() => {
          if (!abortRef.current) onComplete(finalId)
        }, 1500)
      }
    } catch (err) {
      if (abortRef.current) return
      const message = err instanceof Error ? err.message : '分析処理に失敗しました'
      setError(message)
      // 現在進行中のステップをエラーに
      setSteps(prev =>
        prev.map(s => s.status === 'in-progress' ? { ...s, status: 'error' } : s)
      )
    }
  }, [config, hasInstagram, hasBlog, updateStep, onComplete])

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    abortRef.current = false
    startAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-10">
        {error ? (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white">エラーが発生しました</h2>
          </>
        ) : isCompleted ? (
          <>
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-white">分析が完了しました</h2>
            <p className="text-sm text-green-400 mt-1">結果ページへ遷移します...</p>
          </>
        ) : (
          <>
            <div className="relative inline-block mb-4">
              <div className="text-4xl">📊</div>
              <div className="absolute inset-0 animate-ping opacity-20 text-4xl">📊</div>
            </div>
            <h2 className="text-xl font-bold text-white">分析を実行しています</h2>
            <p className="text-sm text-white/50 mt-1">しばらくお待ちください...</p>
          </>
        )}
      </div>

      {/* 進捗ステップ */}
      <div className="space-y-3">
        {steps.map((progressStep, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
              progressStep.status === 'in-progress' ? 'bg-white/5' : ''
            }`}
          >
            {/* ステータスアイコン */}
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-0.5 ${
              progressStep.status === 'completed' ? 'bg-green-500 text-white' :
              progressStep.status === 'in-progress' ? 'bg-blue-500 text-white animate-pulse' :
              progressStep.status === 'error' ? 'bg-red-500 text-white' :
              'bg-white/10 text-white/30'
            }`}>
              {progressStep.status === 'completed' ? '✓' :
               progressStep.status === 'in-progress' ? '⋯' :
               progressStep.status === 'error' ? '!' :
               '○'}
            </div>

            {/* ラベル + 詳細 */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                progressStep.status === 'completed' ? 'text-white/80' :
                progressStep.status === 'in-progress' ? 'text-white' :
                progressStep.status === 'error' ? 'text-red-400' :
                'text-white/30'
              }`}>
                {progressStep.label}
              </p>
              {progressStep.detail && (
                <p className="text-xs text-white/40 mt-0.5">{progressStep.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mt-8 p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer text-sm min-h-[44px]"
          >
            やり直す
          </button>
        </div>
      )}
    </div>
  )
}
