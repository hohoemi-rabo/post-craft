import { createServerClient } from '@/lib/supabase'
import { toPostIdea } from '@/types/idea'
import type { PostIdeaRow } from '@/types/idea'
import { IdeaCard } from './idea-card'

interface IdeasListProps {
  userId: string
  profileId?: string
}

export async function IdeasList({ userId, profileId }: IdeasListProps) {
  const supabase = createServerClient()

  let query = supabase
    .from('post_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (profileId) {
    query = query.eq('profile_id', profileId)
  }

  const { data, error } = await query

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-400 text-sm">アイデアの取得に失敗しました</p>
      </div>
    )
  }

  const ideas = (data as PostIdeaRow[] || []).map(toPostIdea)

  if (ideas.length === 0) {
    return (
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
        <p className="text-slate-400 text-lg mb-2">まだアイデアがありません</p>
        <p className="text-slate-500 text-sm">
          「新しいアイデアを生成」から投稿ネタを提案してもらいましょう
        </p>
      </div>
    )
  }

  // Group: unused first, then used
  const unusedIdeas = ideas.filter((i) => !i.isUsed)
  const usedIdeas = ideas.filter((i) => i.isUsed)

  return (
    <div className="space-y-4">
      {unusedIdeas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
      {usedIdeas.length > 0 && unusedIdeas.length > 0 && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500">使用済み ({usedIdeas.length})</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      )}
      {usedIdeas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  )
}
