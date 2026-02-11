import Link from 'next/link'
import { SystemPromptEditor } from '@/components/settings/system-prompt-editor'

export default function SystemPromptPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/settings" className="hover:text-white transition-colors">
          設定
        </Link>
        <span>/</span>
        <span className="text-white">システムプロンプト</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          システムプロンプト設定
        </h1>
        <p className="text-slate-400">
          全ての投稿タイプに共通で適用されるAIへの指示を設定します。
        </p>
      </div>

      {/* Editor */}
      <SystemPromptEditor />
    </div>
  )
}
