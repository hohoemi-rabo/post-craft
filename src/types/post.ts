// Post Types
export type PostType = 'solution' | 'promotion' | 'tips' | 'showcase' | 'useful' | 'howto' | 'image_read'

// Built-in post type slugs for backward compatibility check
export const BUILTIN_POST_TYPES: readonly string[] = ['solution', 'promotion', 'tips', 'showcase', 'useful', 'howto', 'image_read'] as const

export function isBuiltinPostType(slug: string): slug is PostType {
  return (BUILTIN_POST_TYPES as readonly string[]).includes(slug)
}

export interface PostTypeConfig {
  id: PostType
  name: string
  icon: string
  description: string
  target: string
  charRange: { min: number; max: number }
  requiredFields: string[]
  optionalFields: string[]
  hashtagTrend: string[]
}

export interface TemplateData {
  [key: string]: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// Note: ImageStyle and AspectRatio types are defined in @/lib/image-styles.ts
