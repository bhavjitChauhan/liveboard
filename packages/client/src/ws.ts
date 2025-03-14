export const ws = new WebSocket(import.meta.env.VITE_SERVER_URL)

ws.addEventListener('open', () => {
  console.log('[ws]', 'Connected!')
})
ws.addEventListener('close', () => {
  console.log('[ws]', 'Disconnected!')
})
ws.addEventListener('error', err => {
  console.error('[ws]', err)
})
