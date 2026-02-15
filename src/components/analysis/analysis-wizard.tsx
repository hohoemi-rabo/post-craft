'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SourceSelector } from './source-selector'
import { DataInputForm } from './data-input-form'
import { AnalysisProgress } from './analysis-progress'
import type { AnalysisSourceType } from '@/types/analysis'

type WizardStep = 1 | 2 | 3

export interface AnalysisConfig {
  sourceTypes: AnalysisSourceType[]
  instagram?: {
    accountName: string
    file: File | null
    analysisId: string | null
  }
  blog?: {
    blogUrl: string
    blogName: string
    analysisId: string | null
  }
}

const STEP_LABELS = ['ソース選択', 'データ入力', '分析実行'] as const

export function AnalysisWizard() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(1)
  const [config, setConfig] = useState<AnalysisConfig>({
    sourceTypes: [],
  })

  const handleSourceSelect = (sourceTypes: AnalysisSourceType[]) => {
    setConfig(prev => ({ ...prev, sourceTypes }))
    setStep(2)
  }

  const handleDataSubmit = (updatedConfig: AnalysisConfig) => {
    setConfig(updatedConfig)
    setStep(3)
  }

  const handleAnalysisComplete = (analysisId: string) => {
    router.push(`/analysis/${analysisId}`)
  }

  return (
    <div>
      {/* ヘッダー */}
      <h1 className="text-2xl font-bold text-white mb-2">新規分析</h1>
      <p className="text-white/60 text-sm mb-8">
        競合アカウントやブログを分析して、投稿戦略を最適化します
      </p>

      {/* ステッププログレス */}
      <div className="flex items-center justify-center mb-10">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1
          const isCompleted = s < step
          const isCurrent = s === step

          return (
            <div key={s} className="flex items-center">
              {/* ステップサークル + ラベル */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white/10 text-white/40'
                  }`}
                >
                  {isCompleted ? '✓' : s}
                </div>
                <span
                  className={`text-xs mt-2 hidden sm:block transition-colors ${
                    isCurrent ? 'text-white font-medium' : 'text-white/40'
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* コネクタライン */}
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-px mx-2 sm:mx-3 transition-colors duration-300 ${
                    s < step ? 'bg-green-500/60' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ステップコンテンツ */}
      {step === 1 && <SourceSelector onSelect={handleSourceSelect} />}
      {step === 2 && (
        <DataInputForm
          config={config}
          onSubmit={handleDataSubmit}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <AnalysisProgress
          config={config}
          onComplete={handleAnalysisComplete}
        />
      )}
    </div>
  )
}
