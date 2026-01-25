'use client'

interface GenerationStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete' | 'error'
  error?: string
}

interface StepGeneratingProps {
  steps: GenerationStep[]
  progress: number
}

export function StepGenerating({ steps, progress }: StepGeneratingProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full" />
          <div
            className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin"
            style={{
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🔄</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">生成中...</h2>
        <p className="text-slate-400 text-sm">
          投稿素材を生成しています。しばらくお待ちください。
        </p>
      </div>

      {/* Steps list */}
      <div className="max-w-sm mx-auto space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              {step.status === 'complete' && (
                <span className="text-green-500">✅</span>
              )}
              {step.status === 'loading' && (
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              )}
              {step.status === 'pending' && (
                <span className="text-slate-500">⏳</span>
              )}
              {step.status === 'error' && (
                <span className="text-red-500">❌</span>
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm ${
                  step.status === 'complete'
                    ? 'text-white'
                    : step.status === 'loading'
                    ? 'text-blue-400'
                    : step.status === 'error'
                    ? 'text-red-400'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </p>
              {step.error && (
                <p className="text-xs text-red-400 mt-1">{step.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-slate-400 mt-2">{progress}%</p>
      </div>

      <p className="text-center text-xs text-slate-500">
        ※ 画像生成には最大60秒かかる場合があります
      </p>
    </div>
  )
}
