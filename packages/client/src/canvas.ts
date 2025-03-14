export const canvas = document.getElementsByTagName(
  'canvas'
)[0] as HTMLCanvasElement
export const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

export let translateX = 0
export let translateY = 0

addEventListener('resize', () => {
  if (window.innerWidth > canvas.width || window.innerHeight > canvas.height) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)

    canvas.width = Math.max(canvas.width, window.innerWidth)
    canvas.height = Math.max(canvas.height, window.innerHeight)

    ctx.putImageData(
      img,
      canvas.width / 2 - img.width / 2,
      canvas.height / 2 - img.height / 2
    )
  }

  if (window.innerWidth < canvas.width || window.innerHeight < canvas.height) {
    translateX = (window.innerWidth - canvas.width) / 2
    translateY = (window.innerHeight - canvas.height) / 2
    canvas.style.translate = `${translateX}px ${translateY}px`
  }

  ctx.resetTransform()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
})

dispatchEvent(new Event('resize'))
