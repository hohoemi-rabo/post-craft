/**
 * Canvas APIを使って画像上部にキャッチコピーテキストを合成するユーティリティ
 * image_read フローでユーザーの写真にテキストを重ねるために使用
 */

const FONT_FAMILY = '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif'
const MAX_WIDTH_RATIO = 0.85
const BAND_OPACITY = 0.7
const MAX_BAND_HEIGHT_RATIO = 0.3

export function getOutputDimensions(aspectRatio: '1:1' | '4:5' | '16:9'): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1': return { width: 1080, height: 1080 }
    case '4:5': return { width: 1080, height: 1350 }
    case '16:9': return { width: 1080, height: 608 }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function splitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const measured = ctx.measureText(text)
  if (measured.width <= maxWidth) return [text]

  const mid = Math.ceil(text.length / 2)
  return [text.slice(0, mid), text.slice(mid)]
}

function calculateFontSize(canvasWidth: number, textLength: number): number {
  const baseFontSize = canvasWidth / 12
  const minFontSize = canvasWidth / 20

  if (textLength <= 12) return baseFontSize
  const scaled = baseFontSize * (12 / textLength)
  return Math.max(scaled, minFontSize)
}

/**
 * 画像上部にキャッチコピーテキストを合成する
 */
export async function compositeTextOnImage(
  imageSource: string,
  catchphrase: string,
  canvasWidth: number,
  canvasHeight: number,
): Promise<Blob> {
  const img = await loadImage(imageSource)

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')!

  // Draw the original image
  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

  // Calculate font size and prepare text
  const fontSize = calculateFontSize(canvasWidth, catchphrase.length)
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxTextWidth = canvasWidth * MAX_WIDTH_RATIO
  const lines = splitText(ctx, catchphrase, maxTextWidth)

  // Calculate band dimensions
  const lineHeight = fontSize * 1.5
  const padding = fontSize * 0.8
  let bandHeight = lineHeight * lines.length + padding * 2
  const maxBandHeight = canvasHeight * MAX_BAND_HEIGHT_RATIO
  bandHeight = Math.min(bandHeight, maxBandHeight)

  // Draw semi-transparent dark band at top
  ctx.fillStyle = `rgba(0, 0, 0, ${BAND_OPACITY})`
  ctx.fillRect(0, 0, canvasWidth, bandHeight)

  // Draw text with strong drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 3
  ctx.fillStyle = '#FFFFFF'

  const centerX = canvasWidth / 2
  const totalTextHeight = lineHeight * lines.length
  const startY = (bandHeight - totalTextHeight) / 2 + lineHeight / 2

  lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * lineHeight)
  })

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob from canvas'))
      },
      'image/jpeg',
      0.92
    )
  })
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeType })
}
