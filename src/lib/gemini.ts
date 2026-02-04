import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_AI_API_KEY

if (!apiKey) {
  console.warn('GOOGLE_AI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(apiKey || '')

// Text generation model (main)
export const geminiFlash = genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
})

// Lightweight text generation model (for short tasks like catchphrase)
export const geminiFlashLite = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
})

// Image generation model (text-only)
export const geminiImageGen = genAI.getGenerativeModel({
  model: 'gemini-3-pro-image-preview',
})

// Image generation model (multimodal - with reference image)
// Using the same model as text-only, but with image input
export const geminiImageGenMultimodal = genAI.getGenerativeModel({
  model: 'gemini-3-pro-image-preview',
})

// Generate content with retry logic
export async function generateWithRetry(
  prompt: string,
  maxRetries = 3,
  timeout = 30000
): Promise<string> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const result = await geminiFlash.generateContent(prompt)
      clearTimeout(timeoutId)

      const response = result.response
      const text = response.text()

      return text
    } catch (error) {
      lastError = error as Error
      console.error(`Gemini API attempt ${i + 1} failed:`, error)

      // Don't retry on abort
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timed out')
      }

      // Exponential backoff
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)))
      }
    }
  }

  throw lastError || new Error('Failed to generate content')
}

// Parse JSON from AI response
export function parseJsonResponse<T>(text: string): T {
  // Remove markdown code blocks if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  cleaned = cleaned.trim()

  return JSON.parse(cleaned) as T
}
