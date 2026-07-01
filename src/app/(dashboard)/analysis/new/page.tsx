import type { Metadata } from 'next'
import { AnalysisWizard } from '@/components/analysis/analysis-wizard'
import { isBrightDataConfigured } from '@/lib/brightdata'

export const metadata: Metadata = {
  title: '新規分析 | Post Craft',
}

export default function NewAnalysisPage() {
  const brightDataEnabled = isBrightDataConfigured()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AnalysisWizard brightDataEnabled={brightDataEnabled} />
    </div>
  )
}
