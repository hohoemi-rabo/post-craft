// Post Types
export type PostType = 'solution' | 'promotion' | 'tips' | 'showcase' | 'useful' | 'howto'

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

// Image Styles
export type ImageStyle = 'manga_male' | 'manga_female' | 'pixel_art' | 'illustration'

export interface ImageStyleConfig {
  id: ImageStyle
  name: string
  description: string
  hasCharacter: boolean
}

// Aspect Ratio
export type AspectRatio = '1:1' | '9:16'

export interface AspectRatioConfig {
  id: AspectRatio
  name: string
  width: number
  height: number
  use: string
}
