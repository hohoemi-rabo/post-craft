import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { CharactersClient } from '@/components/characters/characters-client'
import type { Character } from '@/types/supabase'

export default async function CharactersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const supabase = createServerClient()

  const { data } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const characters: Character[] = data || []

  return <CharactersClient initialCharacters={characters} />
}
