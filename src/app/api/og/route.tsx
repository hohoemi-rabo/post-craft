import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const BG_COLORS = [
  '#1E293B', // ダークネイビー
  '#334155', // グレー
  '#F5F5F5', // ライトグレー
  '#10B981', // グリーン
  '#3B82F6', // ブルー
  '#EC4899', // ピンク
  '#8B5CF6', // パープル
  '#F59E0B', // オレンジ
  '#EF4444', // レッド
  '#06B6D4', // シアン
  '#000000', // ブラック
  '#FFFFFF', // ホワイト
] as const

/**
 * 16進数カラーコードの明るさを計算（0-255）
 * 明るさ > 128 なら明るい色、<= 128 なら暗い色
 */
function getBrightness(hexColor: string): number {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // 人間の知覚に基づく明るさ計算式
  return (r * 299 + g * 587 + b * 114) / 1000
}

/**
 * Instagram投稿用の画像を生成するAPI
 * @param request - タイトルとbgColorIndexをクエリパラメータで受け取る
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'タイトル'
    const bgColorIndex = parseInt(searchParams.get('bgColorIndex') || '0', 10)

    // 背景色の選択
    const bgColor = BG_COLORS[bgColorIndex % BG_COLORS.length]

    // テキスト色の自動選択（明るさに基づいて白/黒を選択）
    const brightness = getBrightness(bgColor)
    const textColor = brightness > 128 ? '#1F2937' : '#FFFFFF'

    // タイトルを適切な長さで改行
    const maxCharsPerLine = 20
    const lines: string[] = []
    let currentLine = ''

    for (const char of title) {
      currentLine += char
      if (currentLine.length >= maxCharsPerLine) {
        lines.push(currentLine)
        currentLine = ''
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }

    // 最大4行まで表示
    const displayLines = lines.slice(0, 4)
    if (lines.length > 4) {
      displayLines[3] = displayLines[3].slice(0, -3) + '...'
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            color: textColor,
            padding: '80px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: 56,
              fontWeight: 'bold',
              lineHeight: 1.4,
            }}
          >
            {displayLines.map((line, index) => (
              <div key={index} style={{ marginBottom: index < displayLines.length - 1 ? 20 : 0 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    )
  } catch (error) {
    console.error('Image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
