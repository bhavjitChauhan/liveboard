import { Cursors, Chat, isMessageBase } from 'liveboard-shared'
import config from './config'
import { randomUUIDv7 } from 'bun'

const users = new Set<string>()

type WebSocketData = { id: string; username?: string }

const server = Bun.serve<WebSocketData>({
  async fetch(req, server) {
    // TODO: implement IP blacklist

    const success = server.upgrade(req, {
      data: { id: randomUUIDv7() },
    })
    if (success) return

    return new Response('Hello world!')
  },
  websocket: {
    open(ws) {
      console.log(`[ws] open ${ws.remoteAddress} ${ws.data.id}`)

      ws.subscribe(Cursors.TOPIC)
      ws.subscribe(Chat.TOPIC)
      Chat.send(ws, Chat.usersMessage(users))
    },
    message(ws, raw) {
      if (typeof raw !== 'string') {
        console.warn('Received non-string message:', raw)
        return
      }

      let message: unknown
      try {
        message = JSON.parse(raw)
      } catch (err) {
        console.error('Failed to parse message:', raw)
        return
      }

      if (!isMessageBase(message)) {
        console.warn('Received invalid message:', message)
        return
      }

      switch (message.type) {
        case 'cursor':
          if (!Cursors.isCursorMessage(message)) {
            console.warn('Received invalid cursor message:', message)
            return
          }

          Cursors.publish(
            ws,
            Cursors.cursorMessage(
              ws.data.id,
              message.x,
              message.y,
              message.isDrawing
            )
          )
          break
        case 'username':
          if (!Chat.isUsernameMessage(message)) {
            console.warn('Received invalid username message:', message)
            return
          }
          if (config.usernameBlacklist.includes(message.username)) {
            console.warn('Received reserved username:', message.username)
            return
          }
          if (message.username.length > config.maxUsernameLength) {
            console.warn('Received too long username:', message.username)
            return
          }
          if (users.has(message.username)) {
            console.warn('Received taken username:', message.username)
            return
          }

          ws.data.username = message.username
          users.add(message.username)
          Chat.send(ws, Chat.confirmMessage(users, message.username))
          Chat.publish(
            ws,
            Chat.presenceMessage(users, message.username, 'join')
          )
          console.log(`${message.username} joined`)

          break
        case 'chat':
          if (!ws.data) {
            console.warn('Received chat message without data')
            return
          }
          const { username } = ws.data as { username?: string }
          if (!username) {
            console.warn('Received chat message without username')
            return
          }
          if (!Chat.isChatMessage(message)) {
            console.warn('Received invalid chat message:', message)
            return
          }
          if (message.message.length > config.maxMessageLength) {
            console.warn('Received too long chat message:', message.message)
            return
          }

          // ws.publish(Chat.TOPIC, JSON.stringify(Chat.chat(username, data.message)))
          Chat.publish(server, Chat.chatMessage(username, message.message))
          console.log(`<${username}> ${message.message}`)
          break
        default:
          console.warn('Received unknown message type:', message)
      }
    },
    close(ws) {
      console.log(`[ws] close ${ws.remoteAddress} ${ws.data.id}`)

      ws.unsubscribe(Cursors.TOPIC)
      ws.unsubscribe(Chat.TOPIC)

      if (!ws.data) {
        console.warn('Websocket closed without data')
        return
      }
      const { username } = ws.data as { username?: string }
      if (!username) return

      users.delete(username)
      Chat.publish(ws, Chat.presenceMessage(users, username, 'leave'))
      console.log(`${username} left`)
    },
  },
})

console.log(`Listening on ${server.hostname}:${server.port}`)
