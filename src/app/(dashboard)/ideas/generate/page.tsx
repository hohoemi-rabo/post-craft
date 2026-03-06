import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { IdeasGenerateForm } from '@/components/ideas/ideas-generate-form'

export default async function IdeasGeneratePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">投稿アイデアを生成</h1>
      <p className="text-slate-400">
        選択したプロフィールの投稿履歴をAIが分析し、新しい投稿アイデアを5件提案します。
      </p>
      <IdeasGenerateForm />
    </div>
  )
}
