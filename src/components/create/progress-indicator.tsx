'use client'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  postType?: string | null
}

// 6 steps: normal with image (type → content → image settings → catchphrase → generating → result)
const STEP_LABELS_WITH_IMAGE = ['タイプ選択', '内容入力', '画像設定', 'キャッチコピー', '生成', '完成']

// 5 steps: skip image (type → content → image settings → generating → result)
const STEP_LABELS_SKIP_IMAGE = ['タイプ選択', '内容入力', '画像設定', '生成', '完成']

// 4 steps: image_read (type → image+memo → generating → result)
const STEP_LABELS_IMAGE_READ = ['タイプ選択', '画像+メモ', '生成', '完成']

function getStepLabels(totalSteps: number, postType?: string | null): string[] {
  if (postType === 'image_read') return STEP_LABELS_IMAGE_READ
  if (totalSteps === 6) return STEP_LABELS_WITH_IMAGE
  if (totalSteps === 5) return STEP_LABELS_SKIP_IMAGE
  return STEP_LABELS_WITH_IMAGE
}

export function ProgressIndicator({ currentStep, totalSteps, postType }: ProgressIndicatorProps) {
  const stepLabels = getStepLabels(totalSteps, postType)

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
                {stepLabels[index] ?? ''}
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
