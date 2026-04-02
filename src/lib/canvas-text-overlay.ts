/**
 * Canvas APIを使って画像上部にキャッチコピーテキストを合成するユーティリティ
 * image_read フローでユーザーの写真にテキストを重ねるために使用
 */

const FONT_FAMILY = '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif'
const MAX_WIDTH_RATIO = 0.85
const MAX_BAND_HEIGHT_RATIO = 0.35

export function getOutputDimensions(aspectRatio: '1:1' | '4:5' | '16:9'): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1': return { width: 1080, height: 1080 }
    case '4:5': return { width: 1080, height: 1350 }
    case '16:9': return { width: 1080, height: 608 }
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  // 外部URLはfetchでblobに変換してからCanvas描画（CORS問題を回避）
  let imageSrc = src
  if (!src.startsWith('blob:') && !src.startsWith('data:')) {
    const res = await fetch(src)
    const blob = await res.blob()
    imageSrc = URL.createObjectURL(blob)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
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
  const baseFontSize = canvasWidth / 10
  const minFontSize = canvasWidth / 18

  if (textLength <= 10) return baseFontSize
  const scaled = baseFontSize * (10 / textLength)
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
  ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxTextWidth = canvasWidth * MAX_WIDTH_RATIO
  const lines = splitText(ctx, catchphrase, maxTextWidth)

  // Calculate band dimensions
  const lineHeight = fontSize * 1.6
  const padding = fontSize * 1.0
  let bandHeight = lineHeight * lines.length + padding * 2
  const maxBandHeight = canvasHeight * MAX_BAND_HEIGHT_RATIO
  bandHeight = Math.min(bandHeight, maxBandHeight)

  // Draw gradient band at top (pop style: dark with subtle blue accent)
  const gradient = ctx.createLinearGradient(0, 0, 0, bandHeight)
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.85)')
  gradient.addColorStop(0.7, 'rgba(30, 41, 59, 0.8)')
  gradient.addColorStop(1, 'rgba(30, 41, 59, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth, bandHeight)

  const centerX = canvasWidth / 2
  const totalTextHeight = lineHeight * lines.length
  const startY = (bandHeight - totalTextHeight) / 2 + lineHeight / 2
  const strokeWidth = Math.max(fontSize / 12, 3)

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight

    // Text stroke (outline) for pop effect
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.lineWidth = strokeWidth
    ctx.lineJoin = 'round'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4
    ctx.strokeText(line, centerX, y)

    // Fill text (white)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(line, centerX, y)
  })

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
