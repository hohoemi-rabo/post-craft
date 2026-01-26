'use client'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

// 6 steps: with image generation (includes catchphrase step)
const STEP_LABELS_WITH_IMAGE = ['タイプ選択', '内容入力', '画像設定', 'キャッチコピー', '生成', '完成']

// 5 steps: skip image generation
const STEP_LABELS_SKIP_IMAGE = ['タイプ選択', '内容入力', '画像設定', '生成', '完成']

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const stepLabels = totalSteps === 6 ? STEP_LABELS_WITH_IMAGE : STEP_LABELS_SKIP_IMAGE
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <div key={stepNumber} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-slate-500'
                }`}
              >
                {isComplete ? '✓' : stepNumber}
              </div>
              <span
                className={`text-xs mt-1 hidden sm:block ${
                  isCurrent ? 'text-blue-400' : isComplete ? 'text-green-400' : 'text-slate-500'
                }`}
              >
                {stepLabels[index]}
              </span>
            </div>

            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 ${
                  stepNumber < currentStep ? 'bg-green-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
