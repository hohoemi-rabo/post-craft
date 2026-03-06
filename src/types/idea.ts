export interface PostIdea {
  id: string
  profileId: string
  title: string
  description: string
  isUsed: boolean
  aiInstructions: string | null
  createdAt: string
  updatedAt: string
}

export interface PostIdeaRow {
  id: string
  user_id: string
  profile_id: string
  title: string
  description: string
  is_used: boolean
  ai_instructions: string | null
  created_at: string
  updated_at: string
}

export function toPostIdea(row: PostIdeaRow): PostIdea {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    description: row.description,
    isUsed: row.is_used,
    aiInstructions: row.ai_instructions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
