import { useState, useCallback } from 'react'
import type { GenerationStep } from '@/types/create-flow'

/**
 * 生成ステップの状態管理フック
 *
 * 投稿作成時の進捗状態（ステップリスト、進捗率）を管理する
 */
export function useGenerationSteps() {
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)

  /**
   * ステップのステータスを更新
   */
  const updateStepStatus = useCallback(
    (id: string, status: GenerationStep['status'], error?: string) => {
      setGenerationSteps((prev) =>
        prev.map((step) =>
          step.id === id ? { ...step, status, error } : step
        )
      )
    },
    []
  )

  /**
   * 新しいステップリストで初期化
   */
  const initSteps = useCallback((steps: GenerationStep[]) => {
    setGenerationSteps(steps)
    setGenerationProgress(0)
  }, [])

  /**
   * 全てリセット
   */
  const resetSteps = useCallback(() => {
    setGenerationSteps([])
    setGenerationProgress(0)
  }, [])

  return {
    generationSteps,
    generationProgress,
    setGenerationProgress,
    updateStepStatus,
    initSteps,
    resetSteps,
  }
}
