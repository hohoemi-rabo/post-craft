import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { GenerationPreview } from '@/components/analysis/generation-preview'
import type { GeneratedProfile, GeneratedPostType } from '@/types/analysis'

export const metadata: Metadata = {
  title: 'テンプレート生成 | Post Craft',
}

interface GeneratePageProps {
  params: Promise<{ id: string }>
}

export default async function GeneratePage({ params }: GeneratePageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id: analysisId } = await params
  const supabase = createServerClient()

  const { data: analysis, error: analysisError } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', session.user.id)
    .single()

  if (analysisError || !analysis) {
    redirect('/analysis')
  }

  // 既存の generated_configs を取得（生成済みの場合）
  const { data: existingConfig } = await supabase
    .from('generated_configs')
    .select('*')
    .eq('analysis_id', analysisId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const serializedConfig = existingConfig
    ? {
        id: existingConfig.id,
        status: existingConfig.status,
        generated_profile_id: existingConfig.generated_profile_id,
        generation_config: existingConfig.generation_config as unknown as {
          profile: GeneratedProfile
          postTypes: GeneratedPostType[]
        } | null,
      }
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          テンプレート生成
        </h1>
        <p className="text-white/60">
          {analysis.source_display_name || analysis.source_identifier} の分析結果から
          プロフィールと投稿タイプを自動生成します
        </p>
      </div>

      <GenerationPreview
        analysisId={analysisId}
        existingConfig={serializedConfig}
        sourceDisplayName={analysis.source_display_name || analysis.source_identifier}
      />
    </div>
  )
}
