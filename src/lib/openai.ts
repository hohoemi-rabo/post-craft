import OpenAI from 'openai'

// OpenAI client for image generation
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Model for realistic image generation
// dall-e-3: 認証不要、高品質なリアル画像生成
export const OPENAI_IMAGE_MODEL = 'dall-e-3'
