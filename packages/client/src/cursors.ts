import { canvas, ctx, translateX, translateY } from './canvas'
import { ws } from './ws'
import { Cursors } from 'liveboard-shared'

class Cursor {
  ctx: CanvasRenderingContext2D
  el: HTMLImageElement
  px: number | null = null
  py: number | null = null
  pcx: number | null = null
  pcy: number | null = null
  isDrawing: boolean = false

  constructor(ctx: CanvasRenderingContext2D, el: HTMLImageElement) {
    this.el = el
    this.ctx = ctx
  }

  onmousedown(x: number, y: number) {
    this.isDrawing = true
    this.px = x
    this.py = y
    this.ctx.beginPath()
  }

  onmousemove(x: number, y: number) {
    if (!this.isDrawing) return

    if (this.px === null || this.py === null) {
      console.warn('Invalid state: px/py is null')
      return
    }
    // TODO: smooth initial stroke
    if (this.pcx === null || this.pcy === null) {
      ctx.beginPath()
      ctx.moveTo(this.px, this.py)
      ctx.lineTo(x, y)
      ctx.stroke()
      this.pcx = x
      this.pcy = y
    } else {
      this.ctx.beginPath()
      this.ctx.moveTo(this.pcx, this.pcy)
      const cx = (this.px + x) / 2
      const cy = (this.py + y) / 2
      this.ctx.quadraticCurveTo(this.px, this.py, cx, cy)
      this.ctx.stroke()
      this.pcx = cx
      this.pcy = cy
    }
    this.px = x
    this.py = y
  }

  onmouseup() {
    this.pcx = this.pcy = null
    this.isDrawing = false
  }
}

const cursorsEl = document.getElementById('cursors') as HTMLDivElement
const clientCursorEl = document.getElementById(
  'client-cursor'
) as HTMLImageElement
const cursor = new Cursor(ctx, clientCursorEl)
const cursorsMap = new Map<string, Cursor>()
let isTouch = false

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return
  // if (isTouch) {
  //   const clientCursorEl = document.getElementById(
  //     'client-cursor'
  //   ) as HTMLImageElement
  //   clientCursorEl.style.display = 'block'
  //   isTouch = false
  // }

  onmousedown(e.clientX, e.clientY)
})

canvas.addEventListener('mouseenter', () => {
  canvas.style.cursor = 'none'
  clientCursorEl.style.display = 'block'
})

canvas.addEventListener('mousemove', e => {
  clientCursorEl.style.left = `${e.clientX}px`
  clientCursorEl.style.top = `${e.clientY}px`

  onmousemove(e.clientX, e.clientY)
})

canvas.addEventListener('mouseup', e => {
  onmouseup(e.clientX, e.clientY)
})

canvas.addEventListener('mouseleave', e => {
  clientCursorEl.style.display = 'none'
  canvas.style.cursor = 'default'

  onmouseup(e.clientX, e.clientY)
})

// TODO: fix touch coordinates

canvas.addEventListener(
  'touchstart',
  e => {
    if (!isTouch) {
      document.getElementById('client-cursor')!.style.display = 'none'
      isTouch = true
    }

    onmousedown(e.touches[0].clientX, e.touches[0].clientY)
  },
  { passive: true }
)

canvas.addEventListener(
  'touchmove',
  e => {
    onmousemove(e.touches[0].clientX, e.touches[0].clientY)
  },
  { passive: true }
)

canvas.addEventListener('touchend', e => {
  onmouseup(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
})

// TODO: add click support

function onmousedown(clientX: number, clientY: number) {
  const x = clientX - canvas.width / 2 - translateX
  const y = clientY - canvas.height / 2 - translateY

  cursor.onmousedown(x, y)
}

function onmousemove(clientX: number, clientY: number) {
  const x = clientX - canvas.width / 2 - translateX
  const y = clientY - canvas.height / 2 - translateY

  cursor.onmousemove(x, y)

  // if (
  //   cursor.px !== null &&
  //   cursor.py !== null &&
  //   (Math.abs(cursor.px - x) >= config.granularity ||
  //   Math.abs(cursor.py - y) >= config.granularity) &&
  //   ws.readyState === WebSocket.OPEN
  // )
  if (ws.readyState === WebSocket.OPEN)
    Cursors.send(ws, Cursors.cursorMessage('client', x, y, cursor.isDrawing))
}

function onmouseup(clientX: number, clientY: number) {
  const x = clientX - canvas.width / 2 - translateX
  const y = clientY - canvas.height / 2 - translateY

  cursor.onmouseup()

  if (ws.readyState === WebSocket.OPEN)
    Cursors.send(ws, Cursors.cursorMessage('client', x, y, cursor.isDrawing))
}

ws.addEventListener('message', e => {
  const message = JSON.parse(e.data)

  if (!Cursors.isCursorMessage(message)) return

  let cursor: typeof cursorsMap extends Map<infer _, infer V> ? V : never
  if (!cursorsMap.has(message.id)) {
    const cursorEl = document.createElement('img')
    cursorEl.src = '/cursor.svg'
    cursorEl.className = 'cursor'
    cursorsEl.appendChild(cursorEl)
    cursor = new Cursor(ctx, cursorEl)
    cursorsMap.set(message.id, cursor)
  } else cursor = cursorsMap.get(message.id)!

  cursor.el.style.left = `${message.x + canvas.width / 2 + translateX}px`
  cursor.el.style.top = `${message.y + canvas.height / 2 + translateY}px`

  cursor.onmousemove(message.x, message.y)
  if (cursor.isDrawing && !message.isDrawing) cursor.onmouseup()

  cursor.px = message.x
  cursor.py = message.y
  cursor.isDrawing = message.isDrawing
})
