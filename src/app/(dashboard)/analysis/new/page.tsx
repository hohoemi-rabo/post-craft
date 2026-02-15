import type { Metadata } from 'next'
import { AnalysisWizard } from '@/components/analysis/analysis-wizard'

export const metadata: Metadata = {
  title: '新規分析 | Post Craft',
}

export default function NewAnalysisPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AnalysisWizard />
    </div>
  )
}
