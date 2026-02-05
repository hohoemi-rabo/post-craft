import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAuth } from '@/lib/api-utils'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

const analyzePrompt = `この画像のキャラクター/人物の特徴を分析してください。

以下の項目を抽出してJSON形式で出力してください：
{
  "age": "年代（例: 30-40代）",
  "gender": "性別",
  "hair": "髪型・髪色",
  "clothing": "服装",
  "expression": "表情・雰囲気",
  "style": "イラストスタイル（例: アニメ風、似顔絵風など）",
  "other": ["その他の特徴1", "その他の特徴2"],
  "description": "画像生成プロンプトに使える特徴を1-2文で要約"
}

日本語で出力してください。JSONのみ出力し、余計な説明は不要です。`

export async function POST(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Call Gemini Vision API
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' })

    const result = await model.generateContent([
      analyzePrompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64,
        },
      },
    ])

    const response = result.response
    let text = response.text().trim()

    // Clean markdown code blocks
    if (text.startsWith('```json')) {
      text = text.slice(7)
    } else if (text.startsWith('```')) {
      text = text.slice(3)
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()

    const analysis = JSON.parse(text)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Image analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
