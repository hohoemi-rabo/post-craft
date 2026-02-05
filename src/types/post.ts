// Post Types
export type PostType = 'solution' | 'promotion' | 'tips' | 'showcase' | 'useful' | 'howto' | 'image_read'

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
