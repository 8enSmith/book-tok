/**
 * Extracts dominant colors from an image using Canvas API
 * @param src - The image source URL
 * @returns Promise that resolves to an array of colors in rgba format
 */
export function extractColorsFromImage(src: string): Promise<string[]> {
  return new Promise(resolve => {
    // Create a new image to avoid CORS issues
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = src

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve(['rgba(0,0,0,0.8)', 'rgba(40,40,40,0.8)'])
          return
        }

        // Set canvas size
        canvas.width = img.width
        canvas.height = img.height

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Sample from top and bottom of the image
        const topColor = sampleRegion(ctx, 0, 0, canvas.width, canvas.height / 3)
        const bottomColor = sampleRegion(
          ctx,
          0,
          (canvas.height * 2) / 3,
          canvas.width,
          canvas.height / 3,
        )

        resolve([topColor, bottomColor])
      } catch (error) {
        console.error('Color extraction error:', error)
        resolve(['rgba(0,0,0,0.8)', 'rgba(40,40,40,0.8)'])
      }
    }

    img.onerror = () => {
      console.error('Failed to load image for color extraction')
      resolve(['rgba(0,0,0,0.8)', 'rgba(40,40,40,0.8)'])
    }
  })
}

/**
 * Samples a region of the canvas to get average color
 */
function sampleRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  // Sample fewer pixels for performance
  const sampleSize = 10
  const sampleWidth = Math.max(1, Math.floor(width / sampleSize))
  const sampleHeight = Math.max(1, Math.floor(height / sampleSize))

  let r = 0,
    g = 0,
    b = 0,
    count = 0

  for (let i = 0; i < sampleSize; i++) {
    for (let j = 0; j < sampleSize; j++) {
      const pixelX = Math.floor(x + i * sampleWidth)
      const pixelY = Math.floor(y + j * sampleHeight)

      if (pixelX < x + width && pixelY < y + height) {
        const data = ctx.getImageData(pixelX, pixelY, 1, 1).data
        r += data[0]
        g += data[1]
        b += data[2]
        count++
      }
    }
  }

  if (count > 0) {
    r = Math.floor(r / count)
    g = Math.floor(g / count)
    b = Math.floor(b / count)
    return `rgba(${r},${g},${b},0.8)`
  }

  return 'rgba(0,0,0,0.8)'
}
